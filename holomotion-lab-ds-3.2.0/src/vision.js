import { ADAPTIVE_LEVELS, MEDIAPIPE, QUALITY_PROFILES, TRACKING_PROFILES } from "./config.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ema = (current, next, weight = 0.18) => current ? current * (1 - weight) + next * weight : next;

function smoothLandmarks(previous = [], current = [], baseFactor = 0.58) {
  if (!current.length) return [];
  if (!previous.length || previous.length !== current.length) return current.map((point) => ({ ...point }));
  return current.map((point, index) => {
    const before = previous[index];
    const movement = Math.hypot(point.x - before.x, point.y - before.y);
    const factor = clamp(baseFactor - movement * 3.2, 0.12, baseFactor);
    return {
      x: before.x * factor + point.x * (1 - factor),
      y: before.y * factor + point.y * (1 - factor),
      z: (before.z || 0) * factor + (point.z || 0) * (1 - factor),
      visibility: point.visibility ?? before.visibility ?? 1,
      presence: point.presence ?? before.presence ?? 1
    };
  });
}

function plainLandmarks(list = []) {
  return list.map((point) => ({
    x: Number(point.x) || 0,
    y: Number(point.y) || 0,
    z: Number(point.z) || 0,
    visibility: point.visibility == null ? 1 : Number(point.visibility),
    presence: point.presence == null ? 1 : Number(point.presence)
  }));
}

export class VisionEngine {
  constructor(video, {
    quality = "balanced",
    mode = "sandbox",
    onResults = () => {},
    onStatus = () => {},
    onStats = () => {}
  } = {}) {
    this.video = video;
    this.quality = QUALITY_PROFILES[quality] ? quality : "balanced";
    this.mode = TRACKING_PROFILES[mode] ? mode : "sandbox";
    this.onResults = onResults;
    this.onStatus = onStatus;
    this.onStats = onStats;
    this.stream = null;
    this.running = false;
    this.busy = false;
    this.initialized = false;
    this.worker = null;
    this.backend = "worker";
    this.mainApi = null;
    this.mainFileset = null;
    this.mainTasks = { hand: null, pose: null, face: null };
    this.mainDelegate = "CPU";
    this.facePromise = null;
    this.peoplePromise = null;
    this.maxPeople = 1;
    this.requestId = 0;
    this.pendingTask = null;
    this.lastVideoTime = -1;
    this.lastRun = { hand: 0, pose: 0, face: 0 };
    this.previous = { hands: new Map(), poses: [], faces: [] };
    this.latest = {
      hands: [],
      worldHands: [],
      handedness: [],
      poses: [],
      worldPoses: [],
      faces: [],
      blendshapes: [],
      faceMatrices: [],
      timestamp: 0
    };
    this.processingCanvas = document.createElement("canvas");
    this.processingContext = this.processingCanvas.getContext("2d", { alpha: false, desynchronized: true });
    this.stats = {
      backend: "--",
      accelerator: "--",
      renderFps: 60,
      recognitionHz: 0,
      taskHz: { hand: 0, pose: 0, face: 0 },
      taskMs: { hand: 0, pose: 0, face: 0 },
      roundTripMs: 0,
      inputWidth: 0,
      inputHeight: 0,
      adaptiveLevel: 0,
      droppedFrames: 0
    };
    this.counters = { total: 0, hand: 0, pose: 0, face: 0 };
    this.statsWindowAt = performance.now();
    this.lowFpsWindows = 0;
    this.goodWindows = 0;
    this.loopBound = this.loop.bind(this);
  }

  get profile() {
    return QUALITY_PROFILES[this.quality];
  }

  get adaptive() {
    return ADAPTIVE_LEVELS[this.stats.adaptiveLevel] || ADAPTIVE_LEVELS[0];
  }

  async initialize(progress = () => {}) {
    if (this.initialized) return;
    const canUseWorker = typeof Worker !== "undefined" && typeof createImageBitmap === "function" && typeof OffscreenCanvas !== "undefined";
    if (canUseWorker) {
      try {
        await this.initializeWorker(progress);
        this.initialized = true;
        return;
      } catch (error) {
        console.warn("Worker de visão indisponível; usando processamento principal.", error);
        this.worker?.terminate?.();
        this.worker = null;
      }
    }
    await this.initializeMainThread(progress);
    this.initialized = true;
  }

  initializeWorker(progress) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./vision.worker.js", import.meta.url), { type: "module" });
      this.worker = worker;
      this.backend = "worker";
      const timeout = setTimeout(() => reject(new Error("Tempo excedido ao iniciar o worker de visão.")), 25000);
      worker.addEventListener("message", (event) => {
        const message = event.data || {};
        if (message.type === "progress") progress(message.progress, message.message);
        else if (message.type === "ready") {
          clearTimeout(timeout);
          this.stats.backend = "WORKER";
          this.stats.accelerator = message.delegate || "--";
          this.onStatus({ accelerator: this.stats.accelerator, backend: this.stats.backend });
          resolve();
        } else this.handleWorkerMessage(message);
      });
      worker.addEventListener("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      }, { once: true });
      worker.postMessage({ type: "init", config: MEDIAPIPE });
    });
  }

  async initializeMainThread(progress) {
    this.backend = "main";
    progress(8, "Carregando o motor de visão computacional…");
    const api = await import(MEDIAPIPE.moduleUrl);
    this.mainApi = api;
    progress(25, "Preparando WebAssembly…");
    this.mainFileset = await api.FilesetResolver.forVisionTasks(MEDIAPIPE.wasmPath);
    const createWith = async (delegate) => {
      this.mainDelegate = delegate;
      progress(44, `Inicializando mãos (${delegate})…`);
      this.mainTasks.hand = await api.HandLandmarker.createFromOptions(this.mainFileset, {
        baseOptions: { modelAssetPath: MEDIAPIPE.handModel, delegate },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.52
      });
      progress(70, "Inicializando esqueleto corporal…");
      this.mainTasks.pose = await this.createMainPose(delegate, 1);
    };
    try {
      await createWith("GPU");
    } catch (error) {
      this.mainTasks.hand?.close?.();
      this.mainTasks.pose?.close?.();
      this.mainTasks.hand = null;
      this.mainTasks.pose = null;
      progress(50, "GPU indisponível. Ajustando para CPU…");
      await createWith("CPU");
      this.stats.adaptiveLevel = 1;
    }
    this.stats.backend = "PRINCIPAL";
    this.stats.accelerator = this.mainDelegate;
    progress(100, "Sensores prontos.");
    this.onStatus({ accelerator: this.stats.accelerator, backend: this.stats.backend });
  }

  createMainPose(delegate, count) {
    return this.mainApi.PoseLandmarker.createFromOptions(this.mainFileset, {
      baseOptions: { modelAssetPath: MEDIAPIPE.poseModel, delegate },
      runningMode: "VIDEO",
      numPoses: count,
      minPoseDetectionConfidence: count > 1 ? 0.46 : 0.5,
      minPosePresenceConfidence: 0.48,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false
    });
  }

  async ensureFace() {
    if (!this.initialized) return;
    if (this.backend === "worker") {
      if (!this.facePromise) {
        this.facePromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.facePromise = null;
            reject(new Error("Tempo excedido ao iniciar o sensor facial."));
          }, 18000);
          const listener = (event) => {
            const message = event.data || {};
            if (message.type === "face-ready") {
              clearTimeout(timeout);
              this.worker?.removeEventListener("message", listener);
              this.facePromise = null;
              this.onStatus({ faceReady: true });
              resolve();
            } else if (message.type === "fatal-error") {
              clearTimeout(timeout);
              this.worker?.removeEventListener("message", listener);
              this.facePromise = null;
              reject(new Error(message.message || "Falha no sensor facial."));
            }
          };
          this.worker?.addEventListener("message", listener);
          this.worker?.postMessage({ type: "ensure-face" });
        });
      }
      return this.facePromise;
    }
    if (this.mainTasks.face) return;
    if (!this.facePromise) {
      this.facePromise = (async () => {
        const options = (nextDelegate) => ({
          baseOptions: { modelAssetPath: MEDIAPIPE.faceModel, delegate },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.52,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true
        });
        try {
          this.mainTasks.face = await this.mainApi.FaceLandmarker.createFromOptions(this.mainFileset, options(this.mainDelegate));
        } catch (error) {
          if (this.mainDelegate !== "GPU") throw error;
          this.mainTasks.face = await this.mainApi.FaceLandmarker.createFromOptions(this.mainFileset, options("CPU"));
        }
        this.onStatus({ faceReady: true });
      })();
    }
    try {
      await this.facePromise;
    } finally {
      this.facePromise = null;
    }
  }

  async setMaxPeople(count) {
    const next = count === 2 ? 2 : 1;
    if (next === this.maxPeople) return this.peoplePromise || undefined;
    if (this.peoplePromise) {
      try { await this.peoplePromise; } catch { /* a próxima configuração tentará novamente */ }
    }
    this.maxPeople = next;
    this.latest.poses = [];
    this.previous.poses = [];
    if (this.backend === "worker") {
      this.onStatus({ peopleChanging: true, maxPeople: next });
      this.peoplePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.peoplePromise = null;
          reject(new Error("Tempo excedido ao reconfigurar o rastreamento corporal."));
        }, 18000);
        const listener = (event) => {
          const message = event.data || {};
          if (message.type === "people-ready" && message.maxPeople === next) {
            clearTimeout(timeout);
            this.worker?.removeEventListener("message", listener);
            this.peoplePromise = null;
            this.onStatus({ peopleReady: true, maxPeople: next });
            resolve();
          } else if (message.type === "fatal-error") {
            clearTimeout(timeout);
            this.worker?.removeEventListener("message", listener);
            this.peoplePromise = null;
            reject(new Error(message.message || "Falha ao reconfigurar o rastreamento corporal."));
          }
        };
        this.worker?.addEventListener("message", listener);
        this.worker?.postMessage({ type: "set-people", count: next });
      });
      return this.peoplePromise;
    }
    this.peoplePromise = (async () => {
      const previous = this.mainTasks.pose;
      const nextPose = await this.createMainPose(this.mainDelegate, next);
      this.mainTasks.pose = nextPose;
      previous?.close?.();
      this.onStatus({ peopleReady: true, maxPeople: next });
    })();
    try {
      await this.peoplePromise;
    } finally {
      this.peoplePromise = null;
    }
  }

  async startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador não oferece acesso compatível à câmera.");
    this.stopCamera();
    const profile = this.profile;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: profile.camera.width },
        height: { ideal: profile.camera.height },
        frameRate: { ideal: profile.camera.frameRate, max: 30 }
      }
    });
    const track = this.stream.getVideoTracks()[0];
    if (track) track.contentHint = "motion";
    this.video.srcObject = this.stream;
    await this.video.play();
    if (this.video.readyState < 2) await new Promise((resolve) => this.video.addEventListener("loadeddata", resolve, { once: true }));
    this.running = true;
    this.busy = false;
    this.lastVideoTime = -1;
    this.lastRun = { hand: 0, pose: 0, face: 0 };
    this.onStatus({ camera: "on", settings: track?.getSettings?.() });
    this.scheduleLoop();
  }

  stopCamera() {
    this.running = false;
    this.busy = false;
    if (this.stream) this.stream.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.onStatus({ camera: "off" });
  }

  setMode(mode) {
    if (TRACKING_PROFILES[mode]) this.mode = mode;
    if (mode === "face") this.ensureFace().catch((error) => this.onStatus({ processingError: error }));
  }

  setQuality(quality) {
    if (!QUALITY_PROFILES[quality]) return;
    this.quality = quality;
    this.stats.adaptiveLevel = 0;
    this.lowFpsWindows = 0;
    this.goodWindows = 0;
  }

  reportRenderFps(fps) {
    this.stats.renderFps = fps;
    const maxInference = Math.max(...Object.values(this.stats.taskMs));
    const target = this.profile.renderFps;
    const slow = fps < Math.min(25, target * 0.58) || maxInference > 95;
    const healthy = fps > target * 0.82 && maxInference < 62;
    this.lowFpsWindows = slow ? this.lowFpsWindows + 1 : Math.max(0, this.lowFpsWindows - 1);
    this.goodWindows = healthy ? this.goodWindows + 1 : 0;
    if (this.lowFpsWindows >= 3 && this.stats.adaptiveLevel < 2) {
      this.stats.adaptiveLevel += 1;
      this.lowFpsWindows = 0;
      this.goodWindows = 0;
      this.onStatus({ adaptiveLevel: this.stats.adaptiveLevel });
    } else if (this.goodWindows >= 10 && this.stats.adaptiveLevel > 0) {
      this.stats.adaptiveLevel -= 1;
      this.lowFpsWindows = 0;
      this.goodWindows = 0;
      this.onStatus({ adaptiveLevel: this.stats.adaptiveLevel });
    }
  }

  scheduleLoop() {
    if (!this.running) return;
    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) this.video.requestVideoFrameCallback(this.loopBound);
    else requestAnimationFrame(this.loopBound);
  }

  loop() {
    if (!this.running) return;
    if (!this.busy) this.processNextFrame().catch((error) => {
      this.busy = false;
      this.onStatus({ processingError: error });
    });
    else this.stats.droppedFrames += 1;
    this.scheduleLoop();
  }

  chooseTask(now) {
    const tracking = TRACKING_PROFILES[this.mode];
    if (!tracking) return null;
    const candidates = [];
    for (const task of tracking.tasks) {
      if (task === "hand" && this.maxPeople > 1) continue;
      const multiplier = tracking[task] || 0;
      if (!multiplier) continue;
      const interval = this.profile.intervals[task] * multiplier * this.adaptive.intervalScale;
      const age = now - this.lastRun[task];
      if (age >= interval) candidates.push({ task, urgency: age / interval });
    }
    candidates.sort((a, b) => b.urgency - a.urgency);
    return candidates[0]?.task || null;
  }

  async captureFrame() {
    const scale = this.adaptive.resolutionScale;
    const width = Math.max(256, Math.round(this.profile.processing.width * scale));
    const height = Math.max(144, Math.round(this.profile.processing.height * scale));
    this.stats.inputWidth = width;
    this.stats.inputHeight = height;
    try {
      return await createImageBitmap(this.video, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: "low"
      });
    } catch {
      if (this.processingCanvas.width !== width || this.processingCanvas.height !== height) {
        this.processingCanvas.width = width;
        this.processingCanvas.height = height;
      }
      this.processingContext.drawImage(this.video, 0, 0, width, height);
      return createImageBitmap(this.processingCanvas);
    }
  }

  async processNextFrame() {
    if (this.video.readyState < 2 || this.video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = this.video.currentTime;
    const now = performance.now();
    const task = this.chooseTask(now);
    if (!task) return;
    if (task === "face") await this.ensureFace();
    this.busy = true;
    this.pendingTask = task;
    this.lastRun[task] = now;
    const requestId = ++this.requestId;
    const captureStarted = performance.now();
    const bitmap = await this.captureFrame();
    const captureMs = performance.now() - captureStarted;
    if (this.backend === "worker") {
      this.worker.postMessage({ type: "process", task, bitmap, timestamp: now, requestId }, [bitmap]);
      this.pendingSentAt = performance.now();
      this.pendingCaptureMs = captureMs;
    } else {
      try {
        const result = this.processMainTask(task, bitmap, now);
        this.applyResult(task, result, now, result.duration, captureMs + result.duration);
      } finally {
        bitmap.close?.();
        this.busy = false;
      }
    }
  }

  processMainTask(task, bitmap, timestamp) {
    const started = performance.now();
    if (this.processingCanvas.width !== bitmap.width || this.processingCanvas.height !== bitmap.height) {
      this.processingCanvas.width = bitmap.width;
      this.processingCanvas.height = bitmap.height;
    }
    this.processingContext.drawImage(bitmap, 0, 0);
    const source = this.processingCanvas;
    let payload = {};
    if (task === "hand") {
      const result = this.mainTasks.hand.detectForVideo(source, timestamp);
      payload = {
        hands: (result.landmarks || []).map(plainLandmarks),
        worldHands: (result.worldLandmarks || []).map(plainLandmarks),
        handedness: (result.handedness || []).map((entries) => {
          const item = entries?.[0];
          return item ? { categoryName: item.categoryName || item.displayName || "", displayName: item.displayName || item.categoryName || "", score: item.score || 0 } : null;
        })
      };
    } else if (task === "pose") {
      const result = this.mainTasks.pose.detectForVideo(source, timestamp);
      payload = {
        poses: (result.landmarks || []).map(plainLandmarks),
        worldPoses: (result.worldLandmarks || []).map(plainLandmarks)
      };
    } else if (task === "face") {
      const result = this.mainTasks.face.detectForVideo(source, timestamp);
      payload = {
        faces: (result.faceLandmarks || []).map(plainLandmarks),
        blendshapes: (result.faceBlendshapes || []).map((group) => (group.categories || []).map((item) => ({ categoryName: item.categoryName, score: item.score }))),
        faceMatrices: []
      };
    }
    return { ...payload, duration: performance.now() - started };
  }

  handleWorkerMessage(message) {
    if (message.type === "result") {
      if (message.requestId !== this.requestId) return;
      const roundTrip = performance.now() - (this.pendingSentAt || performance.now());
      this.applyResult(message.task, message.payload || {}, message.timestamp, message.duration || 0, roundTrip + (this.pendingCaptureMs || 0));
      this.busy = false;
    } else if (message.type === "processing-error") {
      this.busy = false;
      this.onStatus({ processingError: new Error(message.message), task: message.task });
    } else if (message.type === "fatal-error") {
      this.busy = false;
      this.onStatus({ processingError: new Error(message.message), fatal: true });
    } else if (message.type === "face-ready") this.onStatus({ faceReady: true });
    else if (message.type === "people-ready") this.onStatus({ peopleReady: true, maxPeople: message.maxPeople });
  }

  applyResult(task, payload, timestamp, duration, roundTrip) {
    if (task === "hand") {
      const nextHands = [];
      (payload.hands || []).forEach((hand, index) => {
        const key = payload.handedness?.[index]?.categoryName || `hand-${index}`;
        const smoothed = smoothLandmarks(this.previous.hands.get(key), hand, 0.56);
        this.previous.hands.set(key, smoothed);
        nextHands.push(smoothed);
      });
      this.latest.hands = nextHands;
      this.latest.worldHands = payload.worldHands || [];
      this.latest.handedness = payload.handedness || [];
    } else if (task === "pose") {
      const poses = payload.poses || [];
      this.latest.poses = poses.map((pose, index) => smoothLandmarks(this.previous.poses[index], pose, 0.64));
      this.previous.poses = this.latest.poses;
      this.latest.worldPoses = payload.worldPoses || [];
    } else if (task === "face") {
      const faces = payload.faces || [];
      this.latest.faces = faces.map((face, index) => smoothLandmarks(this.previous.faces[index], face, 0.48));
      this.previous.faces = this.latest.faces;
      this.latest.blendshapes = payload.blendshapes || [];
      this.latest.faceMatrices = payload.faceMatrices || [];
    }
    this.latest.timestamp = timestamp;
    this.stats.taskMs[task] = ema(this.stats.taskMs[task], duration);
    this.stats.roundTripMs = ema(this.stats.roundTripMs, roundTrip);
    this.counters.total += 1;
    this.counters[task] += 1;
    this.updateStatsWindow();
    this.onResults({ ...this.latest, task });
  }

  updateStatsWindow() {
    const now = performance.now();
    const elapsed = now - this.statsWindowAt;
    if (elapsed < 1000) return;
    const factor = 1000 / elapsed;
    this.stats.recognitionHz = Math.round(this.counters.total * factor);
    this.stats.taskHz = {
      hand: Number((this.counters.hand * factor).toFixed(1)),
      pose: Number((this.counters.pose * factor).toFixed(1)),
      face: Number((this.counters.face * factor).toFixed(1))
    };
    this.counters = { total: 0, hand: 0, pose: 0, face: 0 };
    this.statsWindowAt = now;
    this.onStats({ ...this.stats, taskHz: { ...this.stats.taskHz }, taskMs: { ...this.stats.taskMs } });
  }

  close() {
    this.stopCamera();
    if (this.worker) {
      this.worker.postMessage({ type: "close" });
      this.worker.terminate();
      this.worker = null;
    }
    Object.values(this.mainTasks).forEach((task) => task?.close?.());
    this.mainTasks = { hand: null, pose: null, face: null };
  }
}
