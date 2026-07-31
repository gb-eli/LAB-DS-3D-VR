let api = null;
let fileset = null;
let handLandmarker = null;
let poseLandmarker = null;
let faceLandmarker = null;
let delegate = "CPU";
let maxPeople = 1;
let processingCanvas = null;
let processingContext = null;
let config = null;
let facePromise = null;
let posePromise = null;

function plainLandmark(point) {
  return {
    x: Number(point.x) || 0,
    y: Number(point.y) || 0,
    z: Number(point.z) || 0,
    visibility: point.visibility == null ? 1 : Number(point.visibility),
    presence: point.presence == null ? 1 : Number(point.presence)
  };
}

function plainCategory(category) {
  if (!category) return null;
  return {
    score: Number(category.score) || 0,
    index: Number(category.index) || 0,
    categoryName: category.categoryName || category.displayName || "",
    displayName: category.displayName || category.categoryName || ""
  };
}

function plainLandmarkList(list = []) {
  return list.map(plainLandmark);
}

function post(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

async function createHand() {
  handLandmarker?.close?.();
  handLandmarker = await api.HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: config.handModel, delegate },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.52
  });
}

async function createPose() {
  if (posePromise) return posePromise;
  posePromise = (async () => {
    const previous = poseLandmarker;
    const next = await api.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: config.poseModel, delegate },
      runningMode: "VIDEO",
      numPoses: maxPeople,
      minPoseDetectionConfidence: maxPeople > 1 ? 0.46 : 0.5,
      minPosePresenceConfidence: 0.48,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false
    });
    poseLandmarker = next;
    previous?.close?.();
  })();
  try {
    await posePromise;
  } finally {
    posePromise = null;
  }
}

async function createFace() {
  if (faceLandmarker) return;
  if (facePromise) return facePromise;
  facePromise = (async () => {
    const options = (nextDelegate) => ({
      baseOptions: { modelAssetPath: config.faceModel, delegate: nextDelegate },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.52,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true
    });
    try {
      faceLandmarker = await api.FaceLandmarker.createFromOptions(fileset, options(delegate));
    } catch (error) {
      if (delegate !== "GPU") throw error;
      faceLandmarker = await api.FaceLandmarker.createFromOptions(fileset, options("CPU"));
    }
  })();
  try {
    await facePromise;
  } finally {
    facePromise = null;
  }
}

async function initialize(message) {
  config = message.config;
  post("progress", { progress: 8, message: "Carregando o motor de visão computacional…" });
  api = await import(config.moduleUrl);
  post("progress", { progress: 22, message: "Preparando WebAssembly…" });
  fileset = await api.FilesetResolver.forVisionTasks(config.wasmPath);

  const initializeWith = async (nextDelegate) => {
    delegate = nextDelegate;
    post("progress", { progress: 42, message: `Inicializando mãos (${nextDelegate})…` });
    await createHand();
    post("progress", { progress: 68, message: "Inicializando esqueleto corporal…" });
    await createPose();
  };

  try {
    await initializeWith("GPU");
  } catch (error) {
    handLandmarker?.close?.();
    poseLandmarker?.close?.();
    handLandmarker = null;
    poseLandmarker = null;
    post("progress", { progress: 48, message: "GPU indisponível. Ajustando para CPU…" });
    await initializeWith("CPU");
  }

  post("progress", { progress: 100, message: "Sensores prontos." });
  post("ready", { delegate });
}

function ensureCanvas(bitmap) {
  if (!processingCanvas || processingCanvas.width !== bitmap.width || processingCanvas.height !== bitmap.height) {
    processingCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    processingContext = processingCanvas.getContext("2d", { alpha: false, desynchronized: true });
  }
  processingContext.drawImage(bitmap, 0, 0, processingCanvas.width, processingCanvas.height);
  return processingCanvas;
}

function matrixToArray(matrix) {
  if (!matrix) return null;
  if (Array.isArray(matrix.data)) return matrix.data.map(Number);
  if (matrix.data && typeof matrix.data.length === "number") return Array.from(matrix.data, Number);
  return null;
}

async function process(message) {
  const { task, bitmap, timestamp, requestId } = message;
  const started = performance.now();
  try {
    const source = ensureCanvas(bitmap);
    let payload = {};
    if (task === "hand") {
      const result = handLandmarker.detectForVideo(source, timestamp);
      payload = {
        hands: (result.landmarks || []).map(plainLandmarkList),
        worldHands: (result.worldLandmarks || []).map(plainLandmarkList),
        handedness: (result.handedness || []).map((entries) => plainCategory(entries?.[0]))
      };
    } else if (task === "pose") {
      if (posePromise) await posePromise;
      if (!poseLandmarker) await createPose();
      const result = poseLandmarker.detectForVideo(source, timestamp);
      payload = {
        poses: (result.landmarks || []).map(plainLandmarkList),
        worldPoses: (result.worldLandmarks || []).map(plainLandmarkList)
      };
    } else if (task === "face") {
      await createFace();
      const result = faceLandmarker.detectForVideo(source, timestamp);
      payload = {
        faces: (result.faceLandmarks || []).map(plainLandmarkList),
        blendshapes: (result.faceBlendshapes || []).map((group) => (group.categories || []).map(plainCategory)),
        faceMatrices: (result.facialTransformationMatrixes || []).map(matrixToArray)
      };
    }
    post("result", {
      requestId,
      task,
      timestamp,
      duration: performance.now() - started,
      payload
    });
  } catch (error) {
    post("processing-error", {
      requestId,
      task,
      message: error?.message || String(error)
    });
  } finally {
    bitmap?.close?.();
  }
}

async function setPeople(count) {
  const next = count === 2 ? 2 : 1;
  if (next === maxPeople) {
    post("people-ready", { maxPeople });
    return;
  }
  maxPeople = next;
  await createPose();
  post("people-ready", { maxPeople });
}

function closeAll() {
  handLandmarker?.close?.();
  poseLandmarker?.close?.();
  faceLandmarker?.close?.();
  handLandmarker = null;
  poseLandmarker = null;
  faceLandmarker = null;
}

self.addEventListener("message", async (event) => {
  const message = event.data || {};
  try {
    if (message.type === "init") await initialize(message);
    else if (message.type === "process") await process(message);
    else if (message.type === "ensure-face") {
      await createFace();
      post("face-ready");
    } else if (message.type === "set-people") await setPeople(message.count);
    else if (message.type === "close") closeAll();
  } catch (error) {
    post("fatal-error", { message: error?.message || String(error), stack: error?.stack || "" });
  }
});
