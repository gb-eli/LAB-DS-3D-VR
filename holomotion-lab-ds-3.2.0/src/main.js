import { ADAPTIVE_LEVELS, MODES } from "./config.js";
import { VERSION_CATALOG, TECHNOLOGY_CATALOG, RELEASE_HISTORY, PROJECT_CREDITS, getVersionEntry, getModeVersion, compactVersion, fullVersion } from "./versioning.js";
import { LocalStore } from "./storage.js";
import { HoloAudio } from "./audio.js";
import { VisionEngine } from "./vision.js";
import { GestureEngine, mirrorLandmarks, mirrorWorldLandmarks } from "./gesture-engine.js";
import { GestureInteractionRouter } from "./interaction-router.js";
import { VisionRenderer } from "./vision-renderer.js";
import { HoloScene } from "./three-scene.js";
import { DrawEngine } from "./draw-engine.js";
import { ShapeGame } from "./shape-game.js";
import { PoseGame } from "./pose-game.js";
import { GestureGame } from "./gesture-game.js";
import { analyzeFace } from "./face-engine.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;

const elements = {
  app: $("#app"),
  stage: $("#stage"),
  video: $("#cameraVideo"),
  welcome: $("#welcomePanel"),
  loading: $("#loadingPanel"),
  loadingMessage: $("#loadingMessage"),
  loadingProgress: $("#loadingProgress"),
  compatibility: $("#compatibilityText"),
  cameraStatus: $("#cameraStatus"),
  fps: $("#fpsBadge"),
  hudIcon: $("#hudIcon"),
  hudMode: $("#hudMode"),
  hudObjective: $("#hudObjective"),
  score: $("#scoreValue"),
  combo: $("#comboValue"),
  accuracy: $("#accuracyValue"),
  time: $("#timeValue"),
  cursor: $("#handCursor"),
  toast: $("#toast"),
  calibrationTip: $("#calibrationTip"),
  toolsDrawer: $("#toolsDrawer"),
  sensorsDrawer: $("#sensorsDrawer"),
  drawerBackdrop: $("#drawerBackdrop"),
  toolsButton: $("#toolsButton"),
  sensorsButton: $("#sensorsButton"),
  toolsTitle: $("#toolsTitle"),
  quality: $("#qualitySelect"),
  cameraButton: $("#cameraToggleButton"),
  mirrorButton: $("#mirrorToggleButton"),
  skeletonButton: $("#skeletonToggleButton"),
  gestureUiButton: $("#gestureUiButton"),
  dwellButton: $("#dwellToggleButton"),
  autoRotateButton: $("#autoRotateButton"),
  helpDialog: $("#helpDialog"),
  versionDialog: $("#versionDialog"),
  activeModuleVersion: $("#activeModuleVersion"),
  activeModuleSummary: $("#activeModuleSummary"),
  gestureChallenge: $("#gestureChallenge"),
  gestureChallengeName: $("#gestureChallengeName"),
  gestureChallengeHint: $("#gestureChallengeHint"),
  gestureProgress: $("#gestureProgress"),
  posePanel: $("#posePanel"),
  poseIcon: $("#poseIcon"),
  poseName: $("#poseName"),
  poseHint: $("#poseHint"),
  facePanel: $("#facePanel"),
  faceExpression: $("#faceExpression"),
  faceHint: $("#faceHint"),
  faceSmileBar: $("#faceSmileBar"),
  faceJawBar: $("#faceJawBar"),
  faceBlinkBar: $("#faceBlinkBar"),
  backendStatus: $("#backendStatus"),
  acceleratorStatus: $("#acceleratorStatus"),
  processingStatus: $("#processingStatus"),
  adaptiveStatus: $("#adaptiveStatus"),
  handOneGesture: $("#handOneGesture"),
  handTwoGesture: $("#handTwoGesture"),
  handOneDetail: $("#handOneDetail"),
  handTwoDetail: $("#handTwoDetail"),
  peopleStatus: $("#peopleStatus"),
  bodyStatus: $("#bodyStatus"),
  faceStatus: $("#faceStatus"),
  faceDetail: $("#faceDetail"),
  handHz: $("#handHz"),
  poseHz: $("#poseHz"),
  faceHz: $("#faceHz"),
  recognitionHz: $("#recognitionHz"),
  handMs: $("#handMs"),
  poseMs: $("#poseMs"),
  faceMs: $("#faceMs"),
  roundTripMs: $("#roundTripMs"),
  playerOneScore: $("#playerOneScore"),
  playerTwoScore: $("#playerTwoScore")
};

const store = new LocalStore();
const audio = new HoloAudio();
const state = {
  mode: MODES[store.get("lastMode")] ? store.get("lastMode") : "sandbox",
  quality: store.get("quality"),
  mirror: Boolean(store.get("mirror")),
  skeleton: Boolean(store.get("skeleton")),
  gestureUi: Boolean(store.get("gestureUi")),
  dwellUi: Boolean(store.get("dwellUi")),
  sensitivity: Number(store.get("sensitivity") || 1),
  players: Number(store.get("players") || 1) === 2 ? 2 : 1,
  captureMode: store.get("captureMode") === "touch" ? "touch" : "close",
  started: false,
  initialized: false,
  cameraOn: false,
  demo: false,
  pointerDown: false,
  demoPreviousGesture: "unknown",
  latestDisplay: { poses: [], hands: [], gestures: [], faces: [], timestamp: 0 },
  latestFace: analyzeFace(),
  lastDetectionAt: 0,
  fpsFrames: 0,
  fpsLastAt: performance.now(),
  lastDynamicCommandAt: 0,
  stats: null,
  toastTimer: null
};

const gestureEngine = new GestureEngine({ sensitivity: state.sensitivity });
const visionRenderer = new VisionRenderer($("#visionCanvas"), { quality: state.quality });
const drawEngine = new DrawEngine($("#drawCanvas"));
const holoScene = new HoloScene($("#threeCanvas"), {
  quality: state.quality,
  onGrab: () => audio.grab(),
  onRelease: () => audio.release()
});

const shapeGame = new ShapeGame($("#gameCanvas"), {
  onObjective: (text) => { if (state.mode === "catch") elements.hudObjective.textContent = text; },
  onScore: ({ score, combo, accuracy, playerScores }) => {
    if (state.mode !== "catch") return;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.combo.textContent = `${combo}×`;
    elements.accuracy.textContent = `${accuracy}%`;
    elements.playerOneScore.textContent = (playerScores?.[0] || 0).toLocaleString("pt-BR");
    elements.playerTwoScore.textContent = (playerScores?.[1] || 0).toLocaleString("pt-BR");
    if (score > store.get("highScore")) store.set("highScore", score);
  },
  onHit: ({ combo, player }) => {
    audio.success();
    showToast(state.players === 2 ? `Jogador ${player + 1}: captura correta · combo ${combo}×` : `Captura correta · combo ${combo}×`);
  },
  onMiss: ({ reason }) => {
    audio.miss();
    if (reason === "wrong-shape") showToast("Forma incorreta");
  },
  onStatus: ({ timeLeft, level, finished }) => {
    if (state.mode !== "catch") return;
    elements.time.textContent = `${Math.ceil(timeLeft || 0)}s`;
    if (finished) showToast(`Missão concluída no nível ${level || 1}`);
  }
});

const poseGame = new PoseGame({
  onPose: (pose) => {
    elements.poseIcon.textContent = pose.icon;
    elements.poseName.textContent = pose.name;
    elements.poseHint.textContent = pose.hint;
    if (state.mode === "pose") elements.hudObjective.textContent = pose.hint;
  },
  onScore: ({ accuracy, hold }) => {
    if (state.mode !== "pose") return;
    elements.accuracy.textContent = `${accuracy}%`;
    elements.score.textContent = Math.round(accuracy * 10).toLocaleString("pt-BR");
    elements.combo.textContent = hold >= 1 ? "OK" : `${Math.round(hold * 100)}%`;
    if (accuracy > store.get("bestPose")) store.set("bestPose", accuracy);
  },
  onSuccess: ({ pose, accuracy }) => {
    audio.success();
    showToast(`${pose.name} concluída com ${accuracy}% de precisão`);
  }
});

const gestureGame = new GestureGame({
  onChallenge: (challenge) => {
    elements.gestureChallengeName.textContent = challenge.title;
    elements.gestureChallengeHint.textContent = challenge.hint;
    if (state.mode === "gestures") elements.hudObjective.textContent = challenge.hint;
  },
  onProgress: ({ progress, score }) => {
    if (state.mode !== "gestures") return;
    elements.gestureProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.accuracy.textContent = `${Math.round(progress * 100)}%`;
  },
  onSuccess: ({ challenge, score }) => {
    audio.success();
    elements.combo.textContent = `${Math.floor(score / 100)}×`;
    store.set("bestGestureScore", Math.max(score, store.get("bestGestureScore") || 0));
    showToast(`${challenge.title} reconhecido`);
  }
});

const interactionRouter = new GestureInteractionRouter(elements.stage, {
  enabled: state.gestureUi,
  dwellEnabled: state.dwellUi,
  onClick: () => { audio.select(); showToast("Comando gestual executado"); },
  onProgress: (progress) => {
    const ring = elements.cursor.querySelector("i");
    if (ring) ring.style.transform = `rotate(${progress * 360 - 45}deg)`;
  }
});

const vision = new VisionEngine(elements.video, {
  quality: state.quality,
  mode: state.mode,
  onResults: handleVisionResults,
  onStatus: handleVisionStatus,
  onStats: handleVisionStats
});

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  state.toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function versionCard(entry) {
  const changes = (entry.changes || []).slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<article class="version-card" data-status="${escapeHtml(entry.status)}"><div class="version-card-heading"><div><small>${escapeHtml(entry.type)}</small><h3>${escapeHtml(entry.name)}</h3></div><span>${fullVersion(entry.version)}</span></div><p>${escapeHtml(entry.summary)}</p>${changes ? `<ul>${changes}</ul>` : ""}<em>${escapeHtml(entry.status)}</em></article>`;
}
function selectVersionTab(tabName = "overview") {
  $$("[data-version-tab]").forEach((button) => { const active = button.dataset.versionTab === tabName; button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active)); });
  $$("[data-version-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.versionPanel === tabName));
}
function openVersionDialog(tabName = "overview") { selectVersionTab(tabName); if (!elements.versionDialog.open) elements.versionDialog.showModal(); }

function renderVersionUi() {
  const app = VERSION_CATALOG.app;
  document.documentElement.dataset.appVersion = app.version;
  document.title = `${app.name} ${app.version.split(".").slice(0, 2).join(".")}`;
  $("#appVersionLabel").textContent = app.version;
  $("#welcomeVersionLabel").textContent = app.version;
  $("#versionDialogBadge").textContent = fullVersion(app.version);
  $("#versionDialogSummary").textContent = app.summary;
  $("#welcomeReleaseSummary").textContent = `Atualizado em ${RELEASE_HISTORY[0].date.split("-").reverse().join("/")} · ${RELEASE_HISTORY[0].title}`;
  $$('[data-component-version]').forEach((element) => { const entry = getVersionEntry(element.dataset.componentVersion); if (entry) { element.textContent = compactVersion(entry.version); element.title = `${entry.name} ${fullVersion(entry.version)} — ${entry.summary}`; } });
  $$('[data-mode-version]').forEach((element) => { const entry = getModeVersion(element.dataset.modeVersion); if (entry) { element.textContent = compactVersion(entry.version); element.title = `${entry.name} ${fullVersion(entry.version)}`; } });
  $$('[data-sensor-version]').forEach((element) => { const entry = getVersionEntry(element.dataset.sensorVersion); if (entry) { element.textContent = compactVersion(entry.version); element.title = `${entry.name} ${fullVersion(entry.version)}`; } });
  const latest = RELEASE_HISTORY[0];
  $("#versionOverview").innerHTML = `<article class="release-hero"><div><small>VERSÃO ATUAL</small><h3>${escapeHtml(app.name)} ${fullVersion(app.version)}</h3><p>${escapeHtml(app.summary)}</p></div><span>${escapeHtml(latest.date.split("-").reverse().join("/"))}</span></article><div class="quick-change-grid">${app.changes.map((item) => `<span><i>✓</i>${escapeHtml(item)}</span>`).join("")}</div><button class="inline-version-link" type="button" data-open-version-section="modules">Ver versões de todos os módulos</button>`;
  $("#versionModules").innerHTML = Object.values(VERSION_CATALOG).map(versionCard).join("");
  $("#versionTechnologies").innerHTML = TECHNOLOGY_CATALOG.map((item) => `<article><div><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.version)}</span></div><p>${escapeHtml(item.role)}</p><small>${escapeHtml(item.license)}</small></article>`).join("");
  $("#versionHistory").innerHTML = RELEASE_HISTORY.map((release) => `<article><header><div><small>${escapeHtml(release.date.split("-").reverse().join("/"))}</small><h3>${escapeHtml(release.title)}</h3></div><span>v${escapeHtml(release.version)}</span></header><ul>${release.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`).join("");
  $("#versionCredits").innerHTML = `<article class="credits-hero"><span>◈</span><div><h3>${escapeHtml(PROJECT_CREDITS.project)}</h3><p>${escapeHtml(PROJECT_CREDITS.purpose)}</p></div></article><dl><div><dt>Direção</dt><dd>${escapeHtml(PROJECT_CREDITS.direction)}</dd></div><div><dt>Desenvolvimento</dt><dd>${escapeHtml(PROJECT_CREDITS.engineering)}</dd></div><div><dt>Privacidade</dt><dd>${escapeHtml(PROJECT_CREDITS.privacy)}</dd></div><div><dt>Licenças</dt><dd>${escapeHtml(PROJECT_CREDITS.licenses)}</dd></div></dl>`;
  updateActiveModuleVersion(state.mode);
}
function updateActiveModuleVersion(mode) { const entry = getModeVersion(mode); if (!entry) return; elements.activeModuleVersion.textContent = fullVersion(entry.version); elements.activeModuleVersion.title = `${entry.name} ${fullVersion(entry.version)}`; elements.activeModuleSummary.textContent = entry.summary; }

function setLoading(visible, progress = 0, message = "") {
  elements.loading.classList.toggle("panel-visible", visible);
  elements.loading.setAttribute("aria-hidden", String(!visible));
  elements.loadingProgress.style.width = `${clamp(progress, 0, 100)}%`;
  if (message) elements.loadingMessage.textContent = message;
}

function compatibilityCheck() {
  const checks = {
    câmera: Boolean(navigator.mediaDevices?.getUserMedia),
    WebGL: (() => {
      try { return Boolean(document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl")); }
      catch { return false; }
    })(),
    armazenamento: typeof localStorage !== "undefined"
  };
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (!missing.length) {
    elements.compatibility.textContent = "✓ Navegador compatível com câmera, WebGL e processamento local.";
    elements.compatibility.style.color = "#a7f3d0";
  } else {
    elements.compatibility.textContent = `Recursos indisponíveis: ${missing.join(", ")}. O modo demonstração ainda pode funcionar.`;
    elements.compatibility.style.color = "#fecdd3";
  }
}

async function initializeVision() {
  if (state.initialized) return;
  setLoading(true, 4, "Preparando o motor gráfico…");
  await vision.initialize((progress, message) => setLoading(true, progress, message));
  state.initialized = true;
}

async function startWithCamera() {
  audio.ensure();
  elements.welcome.classList.remove("panel-visible");
  setLoading(true, 2, "Solicitando acesso à câmera…");
  try {
    await initializeVision();
    if (state.mode === "face") await vision.ensureFace();
    await vision.setMaxPeople(state.mode === "catch" ? state.players : 1);
    setLoading(true, 96, "Abrindo a câmera…");
    await vision.startCamera();
    state.demo = false;
    state.cameraOn = true;
    completeStart();
    showToast("Câmera ativa. Mostre uma das mãos para iniciar a calibração.");
  } catch (error) {
    console.error(error);
    setLoading(false);
    elements.welcome.classList.add("panel-visible");
    const denied = ["NotAllowedError", "PermissionDeniedError"].includes(error?.name);
    elements.compatibility.textContent = denied
      ? "A câmera foi bloqueada. Autorize a câmera no navegador ou use o modo demonstração."
      : `Não foi possível iniciar: ${error?.message || "erro desconhecido"}`;
    elements.compatibility.style.color = "#fecdd3";
    updateCameraStatus("error", denied ? "Câmera bloqueada" : "Falha na câmera");
  }
}

function startDemo() {
  audio.ensure();
  state.demo = true;
  state.cameraOn = false;
  elements.welcome.classList.remove("panel-visible");
  completeStart();
  showToast("Modo demonstração: pressione para fechar a mão e arraste para movimentar.");
}

function completeStart() {
  setLoading(false);
  state.started = true;
  elements.app.classList.add("started");
  elements.app.classList.toggle("camera-off", !state.cameraOn);
  store.increment("sessions");
  switchMode(state.mode, false);
}

function updateCameraStatus(status, text) {
  elements.cameraStatus.dataset.state = status;
  elements.cameraStatus.querySelector("span").textContent = text;
  elements.cameraStatus.setAttribute("aria-label", text);
  elements.cameraStatus.title = text;
  elements.cameraButton.classList.toggle("active", status === "on");
}

function handleVisionStatus(status) {
  if (status.camera === "on") {
    state.cameraOn = true;
    elements.app.classList.remove("camera-off");
    updateCameraStatus("on", "Câmera ativa");
  }
  if (status.camera === "off") {
    state.cameraOn = false;
    elements.app.classList.add("camera-off");
    updateCameraStatus("off", "Câmera desligada");
  }
  if (status.accelerator) elements.acceleratorStatus.textContent = status.accelerator;
  if (status.backend) elements.backendStatus.textContent = status.backend;
  if (Number.isInteger(status.adaptiveLevel)) {
    elements.adaptiveStatus.textContent = ADAPTIVE_LEVELS[status.adaptiveLevel]?.label || "AUTO";
    holoScene.setDynamicPixelRatioScale(status.adaptiveLevel === 2 ? 0.7 : status.adaptiveLevel === 1 ? 0.84 : 1);
  }
  if (status.peopleChanging) showToast("Reconfigurando o rastreamento para duas pessoas…");
  if (status.peopleReady) showToast(`Rastreamento preparado para ${status.maxPeople} ${status.maxPeople === 1 ? "pessoa" : "pessoas"}.`);
  if (status.processingError) {
    console.error(status.processingError);
    updateCameraStatus("error", "Ajustando sensores");
  }
}

function handleVisionStats(stats) {
  state.stats = stats;
  elements.backendStatus.textContent = stats.backend || "--";
  elements.acceleratorStatus.textContent = stats.accelerator || "--";
  elements.processingStatus.textContent = `${stats.inputWidth || 0}×${stats.inputHeight || 0}`;
  elements.adaptiveStatus.textContent = ADAPTIVE_LEVELS[stats.adaptiveLevel]?.label || "AUTO";
  elements.handHz.textContent = `${stats.taskHz?.hand || 0} Hz`;
  elements.poseHz.textContent = `${stats.taskHz?.pose || 0} Hz`;
  elements.faceHz.textContent = `${stats.taskHz?.face || 0} Hz`;
  elements.recognitionHz.textContent = `${stats.recognitionHz || 0} Hz`;
  elements.handMs.textContent = `${Math.round(stats.taskMs?.hand || 0)} ms`;
  elements.poseMs.textContent = `${Math.round(stats.taskMs?.pose || 0)} ms`;
  elements.faceMs.textContent = `${Math.round(stats.taskMs?.face || 0)} ms`;
  elements.roundTripMs.textContent = `${Math.round(stats.roundTripMs || 0)} ms`;
}

function handCenter(hand) {
  const ids = [0, 5, 9, 13, 17];
  const points = ids.map((id) => hand?.[id]).filter(Boolean);
  if (!points.length) return null;
  return points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
}

function modeNeedsHands() {
  return ["sandbox", "catch", "draw", "gestures"].includes(state.mode) && !(state.mode === "catch" && state.players === 2);
}

function modeNeedsPose() {
  return ["sandbox", "catch", "pose"].includes(state.mode);
}

function handleVisionResults(raw) {
  const hands = modeNeedsHands() ? (raw.hands || []).map((hand) => mirrorLandmarks(hand, state.mirror)) : [];
  const worldHands = modeNeedsHands() ? (raw.worldHands || []).map((hand) => mirrorWorldLandmarks(hand, state.mirror)) : [];
  const poses = modeNeedsPose() ? (raw.poses || []).map((pose) => mirrorLandmarks(pose, state.mirror)) : [];
  const faces = state.mode === "face" ? (raw.faces || []).map((face) => mirrorLandmarks(face, state.mirror)) : [];
  const gestures = gestureEngine.update(hands, raw.handedness || [], raw.timestamp || performance.now(), worldHands);
  const display = { poses, hands, gestures, faces, timestamp: raw.timestamp || performance.now() };
  state.latestDisplay = display;
  state.lastDetectionAt = performance.now();
  visionRenderer.render(display);
  updateTelemetry(display, raw);

  if (state.mode === "face") {
    state.latestFace = analyzeFace(faces[0], raw.blendshapes?.[0]);
    updateFaceUi(state.latestFace);
    holoScene.updateFace(state.latestFace);
  }

  const hand = hands[0];
  const gesture = gestures[0];
  if (hand?.[8]) {
    const point = hand[8];
    updateCursor(point.x, point.y, gesture);
    const route = interactionRouter.update(point, gesture, raw.timestamp || performance.now());
    const centers = hands.map(handCenter).filter(Boolean);
    const twoHandDistance = centers.length > 1 ? distance(centers[0], centers[1]) : null;
    const roll = gesture?.orientation?.roll ?? null;
    if (state.mode === "sandbox") holoScene.setHandInteraction({ x: point.x, y: point.y, gesture, twoHandDistance, roll, consumed: route.consumed });
    if (state.mode === "draw") drawEngine.update(route.consumed ? null : hand, route.consumed ? null : gesture);
    handleDynamicGesture(gesture);
  } else {
    elements.cursor.classList.remove("visible");
    interactionRouter.clearHover();
    drawEngine.update(null, null);
    holoScene.cancelInteraction();
  }
}

function handleDynamicGesture(gesture) {
  const motion = gesture?.motion?.type;
  if (!motion || performance.now() - state.lastDynamicCommandAt < 620) return;
  state.lastDynamicCommandAt = performance.now();
  if (state.mode === "draw") {
    if (motion === "swipe_left") showToast(drawEngine.undo() ? "Último traço desfeito" : "Não há traços para desfazer");
    if (motion === "swipe_right") {
      const colors = ["#00e5ff", "#a855f7", "#22c55e", "#f97316", "#ff4fd8"];
      const current = $("#drawColor").value.toLowerCase();
      const next = colors[(colors.indexOf(current) + 1 + colors.length) % colors.length];
      $("#drawColor").value = next;
      drawEngine.setColor(next);
      showToast("Cor do desenho alterada");
    }
  }
  if (state.mode === "sandbox") {
    if (motion === "swipe_left" || motion === "swipe_right") {
      const types = ["cube", "sphere", "pyramid", "torus", "cylinder"];
      const select = $("#objectSelect");
      const direction = motion === "swipe_right" ? 1 : -1;
      const nextIndex = (types.indexOf(select.value) + direction + types.length) % types.length;
      select.value = types[nextIndex];
      holoScene.setObjectType(select.value);
      store.set("objectType", select.value);
      showToast(`Objeto alterado para ${select.options[select.selectedIndex].text}`);
    }
  }
}

function updateCursor(x, y, gesture) {
  const rect = elements.stage.getBoundingClientRect();
  elements.cursor.style.left = `${x * rect.width}px`;
  elements.cursor.style.top = `${y * rect.height}px`;
  elements.cursor.dataset.gesture = gesture?.type || "unknown";
  elements.cursor.classList.add("visible");
}

function updateTelemetry(display, raw) {
  const gestures = display.gestures || [];
  const updateHand = (gesture, titleElement, detailElement) => {
    titleElement.textContent = gesture?.label || "não detectada";
    detailElement.textContent = gesture
      ? `${gesture.orientation?.label || "--"} · ${gesture.curvature?.label || "--"} · ${gesture.palmFacing?.label || "--"}${gesture.motion ? ` · ${gesture.motion.type.replaceAll("_", " ")}` : ""}`
      : "--";
  };
  updateHand(gestures[0], elements.handOneGesture, elements.handOneDetail);
  updateHand(gestures[1], elements.handTwoGesture, elements.handTwoDetail);
  elements.peopleStatus.textContent = String(display.poses?.length || 0);
  const visiblePoints = (display.poses?.[0] || []).filter((point) => (point.visibility ?? 1) > 0.42).length;
  elements.bodyStatus.textContent = visiblePoints ? `${visiblePoints}/33 pontos visíveis` : "corpo não detectado";
  const faceDetected = Boolean(display.faces?.[0]?.length);
  elements.faceStatus.textContent = faceDetected ? `${display.faces[0].length} pontos` : "não detectado";
  elements.faceDetail.textContent = faceDetected ? state.latestFace.expression : "--";
  if (raw.task === "face") elements.faceDetail.textContent = analyzeFace(display.faces?.[0], raw.blendshapes?.[0]).expression;
}

function updateFaceUi(metrics) {
  elements.faceExpression.textContent = metrics.detected ? `${metrics.expression} · cabeça ${metrics.headTilt}` : "Aguardando rosto";
  elements.faceHint.textContent = metrics.detected ? "Boca amplia · sorriso muda a cor · piscar cria energia" : "Centralize o rosto e use iluminação frontal.";
  elements.faceSmileBar.style.height = `${8 + metrics.smile * 88}%`;
  elements.faceJawBar.style.height = `${8 + metrics.jawOpen * 88}%`;
  elements.faceBlinkBar.style.height = `${8 + Math.max(metrics.blinkLeft, metrics.blinkRight) * 88}%`;
  elements.faceStatus.textContent = metrics.detected ? metrics.expression : "não detectado";
  elements.faceDetail.textContent = metrics.detected ? `Cabeça ${metrics.headTilt}` : "--";
}

function resetHud() {
  elements.score.textContent = "0";
  elements.combo.textContent = "0×";
  elements.accuracy.textContent = "--";
  elements.time.textContent = "--";
}

async function switchMode(mode, announce = true) {
  if (!MODES[mode]) mode = "sandbox";
  state.mode = mode;
  store.set("lastMode", mode);
  elements.app.dataset.mode = mode;
  elements.hudIcon.textContent = MODES[mode].icon;
  elements.hudMode.textContent = MODES[mode].label;
  elements.hudObjective.textContent = MODES[mode].objective;
  elements.toolsTitle.textContent = MODES[mode].label;
  updateActiveModuleVersion(mode);
  $$(".mode-button").forEach((button) => button.classList.toggle("active", button.dataset.modeTarget === mode));
  $$("[data-tools-mode]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.toolsMode !== mode));
  elements.posePanel.classList.toggle("hidden", mode !== "pose");
  elements.gestureChallenge.classList.toggle("hidden", mode !== "gestures");
  elements.facePanel.classList.toggle("hidden", mode !== "face");
  resetHud();

  shapeGame.setActive(mode === "catch");
  drawEngine.setActive(mode === "draw");
  poseGame.setActive(mode === "pose");
  if (mode === "gestures") gestureGame.start(); else gestureGame.stop();
  holoScene.setMode(mode);
  vision.setMode(mode);
  if (state.initialized) {
    if (mode === "face") await vision.ensureFace();
    await vision.setMaxPeople(mode === "catch" ? state.players : 1);
  }
  if (mode === "catch") {
    shapeGame.setPlayers(state.players);
    shapeGame.setCaptureMode(state.captureMode);
  }
  if (mode === "face") updateFaceUi(analyzeFace());
  if (announce) {
    audio.select();
    showToast(`${MODES[mode].label} ativado`);
  }
}

function openDrawer(id) {
  const target = document.getElementById(id);
  const other = id === "toolsDrawer" ? elements.sensorsDrawer : elements.toolsDrawer;
  other.classList.remove("open");
  other.setAttribute("aria-hidden", "true");
  target.classList.add("open");
  target.setAttribute("aria-hidden", "false");
  elements.drawerBackdrop.classList.add("visible");
  elements.toolsButton.setAttribute("aria-expanded", String(id === "toolsDrawer"));
  elements.sensorsButton.setAttribute("aria-expanded", String(id === "sensorsDrawer"));
}

function closeDrawers() {
  [elements.toolsDrawer, elements.sensorsDrawer].forEach((drawer) => {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  });
  elements.drawerBackdrop.classList.remove("visible");
  elements.toolsButton.setAttribute("aria-expanded", "false");
  elements.sensorsButton.setAttribute("aria-expanded", "false");
}

async function toggleCamera() {
  if (state.cameraOn) {
    vision.stopCamera();
    showToast("Câmera desligada");
    return;
  }
  try {
    if (!state.initialized) await initializeVision();
    if (state.mode === "face") await vision.ensureFace();
    await vision.startCamera();
    state.demo = false;
    showToast("Câmera ativada");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível ativar a câmera.");
  }
}

function createDemoHand(x, y, closed) {
  const spread = closed ? 0.018 : 0.05;
  const hand = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
  hand[0] = { x, y: y + 0.08, z: 0 };
  const fingers = [[5,6,7,8,-0.045],[9,10,11,12,-0.015],[13,14,15,16,0.02],[17,18,19,20,0.055]];
  fingers.forEach(([mcp,pip,dip,tip,dx]) => {
    hand[mcp] = { x: x + dx, y, z: 0 };
    hand[pip] = { x: x + dx, y: y - spread, z: 0 };
    hand[dip] = { x: x + dx, y: y - spread * 1.7, z: 0 };
    hand[tip] = { x: x + dx, y: y - spread * 2.5, z: 0 };
  });
  hand[1] = { x: x - 0.05, y: y + 0.025, z: 0 };
  hand[2] = { x: x - 0.07, y: y + 0.005, z: 0 };
  hand[3] = { x: x - 0.085, y: y - spread * 0.3, z: 0 };
  hand[4] = { x: x - (closed ? 0.025 : 0.105), y: y - spread * 0.6, z: 0 };
  if (closed) [8,12,16,20].forEach((id, index) => { hand[id] = { x: x + (index - 1.5) * 0.018, y: y + 0.015, z: 0 }; });
  return hand;
}

function pointerToDemoResult(event) {
  const rect = elements.stage.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  if (state.mode === "face") {
    const metrics = {
      detected: true,
      jawOpen: state.pointerDown ? 0.85 : 0.1,
      smile: x,
      blinkLeft: state.pointerDown ? 0.7 : 0,
      blinkRight: state.pointerDown ? 0.7 : 0,
      browUp: Math.max(0, 1 - y),
      headRoll: (x - 0.5) * 0.8,
      headTilt: x > 0.58 ? "inclinada à direita" : x < 0.42 ? "inclinada à esquerda" : "centralizada",
      expression: state.pointerDown ? "boca aberta" : x > 0.65 ? "sorrindo" : "neutra"
    };
    state.latestFace = metrics;
    updateFaceUi(metrics);
    holoScene.updateFace(metrics);
    return;
  }
  const hand = createDemoHand(x, y, state.pointerDown);
  const demoTime = performance.now();
  let gestures = gestureEngine.update([hand], [{ categoryName: "Demo", score: 1 }], demoTime, [[]]);
  if (state.pointerDown && gestures[0]?.type === "unknown") {
    gestures = gestureEngine.update([hand], [{ categoryName: "Demo", score: 1 }], demoTime + 1, [[]]);
  }
  const display = { poses: [], hands: [hand], gestures, faces: [], timestamp: performance.now() };
  state.latestDisplay = display;
  visionRenderer.render(display);
  updateCursor(x, y, gestures[0]);
  updateTelemetry(display, { task: "hand" });
  if (state.mode === "sandbox") holoScene.setHandInteraction({ x, y, gesture: gestures[0], roll: gestures[0]?.orientation?.roll });
  if (state.mode === "draw") drawEngine.update(hand, { ...gestures[0], type: state.pointerDown ? "pinch" : "open" });
}

function applySavedSettings() {
  elements.quality.value = state.quality;
  elements.app.classList.toggle("mirror", state.mirror);
  elements.app.classList.add("camera-off");
  elements.mirrorButton.classList.toggle("active", state.mirror);
  elements.skeletonButton.classList.toggle("active", state.skeleton);
  elements.gestureUiButton.classList.toggle("active", state.gestureUi);
  elements.dwellButton.classList.toggle("active", state.dwellUi);
  visionRenderer.setEnabled(state.skeleton);
  interactionRouter.setEnabled(state.gestureUi);
  interactionRouter.setDwellEnabled(state.dwellUi);
  gestureEngine.setSensitivity(state.sensitivity);
  $("#sensitivityRange").value = String(state.sensitivity);
  $("#sensitivityValue").textContent = `${Math.round(state.sensitivity * 100)}%`;
  $("#playersSelect").value = String(state.players);
  $("#captureModeSelect").value = state.captureMode;
  shapeGame.setPlayers(state.players);
  shapeGame.setCaptureMode(state.captureMode);
  const color = store.get("cubeColor") || "#00e5ff";
  holoScene.setColor(color);
  holoScene.setObjectType(store.get("objectType") || "cube");
  $("#objectSelect").value = store.get("objectType") || "cube";
  $$(".swatch").forEach((button) => button.classList.toggle("active", button.dataset.color === color));
  switchMode(state.mode, false);
}

async function launchRequestedMode(mode) {
  if (!MODES[mode]) return;
  await switchMode(mode, false);
  if (state.started) {
    audio.select();
    showToast(`${MODES[mode].label} aberto pela central de aplicativos`);
    return;
  }
  $("#startCameraButton").textContent = `Ativar câmera e abrir ${MODES[mode].label}`;
  elements.compatibility.textContent = `${MODES[mode].label} selecionado. Ative a câmera ou use o modo demonstração.`;
  elements.compatibility.style.color = "#a7f3d0";
}

function bindEvents() {
  window.addEventListener("holomotion:launch-mode", (event) => launchRequestedMode(event.detail?.mode));
  window.addEventListener("holomotion:toast", (event) => { if (event.detail?.message) showToast(event.detail.message); });
  $("#startCameraButton").addEventListener("click", startWithCamera);
  $("#demoButton").addEventListener("click", startDemo);
  elements.cameraButton.addEventListener("click", toggleCamera);
  $$(".mode-button").forEach((button) => button.addEventListener("click", () => switchMode(button.dataset.modeTarget)));
  elements.toolsButton.addEventListener("click", () => elements.toolsDrawer.classList.contains("open") ? closeDrawers() : openDrawer("toolsDrawer"));
  elements.sensorsButton.addEventListener("click", () => elements.sensorsDrawer.classList.contains("open") ? closeDrawers() : openDrawer("sensorsDrawer"));
  $$("[data-close-drawer]").forEach((button) => button.addEventListener("click", closeDrawers));
  elements.drawerBackdrop.addEventListener("click", closeDrawers);

  elements.mirrorButton.addEventListener("click", () => {
    state.mirror = !state.mirror;
    store.set("mirror", state.mirror);
    elements.app.classList.toggle("mirror", state.mirror);
    elements.mirrorButton.classList.toggle("active", state.mirror);
    gestureEngine.reset();
    showToast(state.mirror ? "Imagem espelhada" : "Espelhamento desativado");
  });

  elements.skeletonButton.addEventListener("click", () => {
    state.skeleton = !state.skeleton;
    store.set("skeleton", state.skeleton);
    elements.skeletonButton.classList.toggle("active", state.skeleton);
    visionRenderer.setEnabled(state.skeleton);
  });

  elements.gestureUiButton.addEventListener("click", () => {
    state.gestureUi = !state.gestureUi;
    store.set("gestureUi", state.gestureUi);
    elements.gestureUiButton.classList.toggle("active", state.gestureUi);
    interactionRouter.setEnabled(state.gestureUi);
    showToast(state.gestureUi ? "Cliques por gesto ativados" : "Cliques por gesto desativados");
  });

  elements.dwellButton.addEventListener("click", () => {
    state.dwellUi = !state.dwellUi;
    store.set("dwellUi", state.dwellUi);
    elements.dwellButton.classList.toggle("active", state.dwellUi);
    interactionRouter.setDwellEnabled(state.dwellUi);
    showToast(state.dwellUi ? "Clique por permanência ativado" : "Clique por permanência desativado");
  });

  elements.quality.addEventListener("change", async () => {
    state.quality = elements.quality.value;
    store.set("quality", state.quality);
    vision.setQuality(state.quality);
    holoScene.setQuality(state.quality);
    visionRenderer.setQuality(state.quality);
    showToast("Perfil de qualidade atualizado");
    if (state.cameraOn) {
      try { await vision.startCamera(); }
      catch (error) { console.error(error); }
    }
  });

  $("#sensitivityRange").addEventListener("input", (event) => {
    state.sensitivity = Number(event.target.value);
    gestureEngine.setSensitivity(state.sensitivity);
    store.set("sensitivity", state.sensitivity);
    $("#sensitivityValue").textContent = `${Math.round(state.sensitivity * 100)}%`;
  });

  $$(".swatch").forEach((button) => button.addEventListener("click", () => {
    $$(".swatch").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    holoScene.setColor(button.dataset.color);
    store.set("cubeColor", button.dataset.color);
    audio.select();
  }));

  $("#objectSelect").addEventListener("change", (event) => {
    holoScene.setObjectType(event.target.value);
    store.set("objectType", event.target.value);
    audio.select();
  });
  $("#resetObjectButton").addEventListener("click", () => { holoScene.reset(); audio.select(); });
  elements.autoRotateButton.addEventListener("click", () => {
    const enabled = !elements.autoRotateButton.classList.contains("active");
    elements.autoRotateButton.classList.toggle("active", enabled);
    holoScene.setAutoRotate(enabled);
  });

  $("#playersSelect").addEventListener("change", async (event) => {
    state.players = Number(event.target.value) === 2 ? 2 : 1;
    store.set("players", state.players);
    shapeGame.setPlayers(state.players);
    if (state.initialized) await vision.setMaxPeople(state.players);
    showToast(state.players === 2 ? "Arena para duas pessoas ativada" : "Modo individual ativado");
  });
  $("#captureModeSelect").addEventListener("change", (event) => {
    state.captureMode = event.target.value === "touch" ? "touch" : "close";
    store.set("captureMode", state.captureMode);
    shapeGame.setCaptureMode(state.captureMode);
    shapeGame.start();
  });
  $("#restartGameButton").addEventListener("click", () => { shapeGame.start(); audio.select(); });

  $("#drawColor").addEventListener("input", (event) => drawEngine.setColor(event.target.value));
  $("#drawSize").addEventListener("input", (event) => drawEngine.setSize(event.target.value));
  $("#undoDrawButton").addEventListener("click", () => showToast(drawEngine.undo() ? "Último traço desfeito" : "Não há traços para desfazer"));
  $("#clearDrawButton").addEventListener("click", () => { drawEngine.clear(); audio.select(); });
  $("#saveDrawButton").addEventListener("click", () => { drawEngine.exportPng(); showToast("Desenho exportado"); });
  $("#nextPoseButton").addEventListener("click", () => poseGame.next());
  $("#restartPoseButton").addEventListener("click", () => { poseGame.setActive(false); poseGame.setActive(true); showToast("Sequência de poses reiniciada"); });
  $("#restartGesturesButton").addEventListener("click", () => { gestureGame.start(); showToast("Treinamento de gestos reiniciado"); });

  $("#fullscreenButton").addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { showToast("Tela cheia não disponível neste navegador."); }
  });
  $("#helpButton").addEventListener("click", () => elements.helpDialog.showModal());
  $("#closeHelpButton").addEventListener("click", () => elements.helpDialog.close());
  [$("#versionButton"), $("#welcomeVersionButton"), $("#versionDetailsButton")].forEach((button) => button.addEventListener("click", () => openVersionDialog("overview")));
  $("#closeVersionButton").addEventListener("click", () => elements.versionDialog.close());
  $$("[data-version-tab]").forEach((button) => button.addEventListener("click", () => selectVersionTab(button.dataset.versionTab)));
  elements.versionDialog.addEventListener("click", (event) => { const sectionLink = event.target.closest("[data-open-version-section]"); if (sectionLink) selectVersionTab(sectionLink.dataset.openVersionSection); });

  elements.stage.addEventListener("pointerdown", (event) => {
    if (!state.started || !state.demo || event.target.closest("button,input,select,.drawer")) return;
    state.pointerDown = true;
    elements.stage.setPointerCapture?.(event.pointerId);
    pointerToDemoResult(event);
  });
  elements.stage.addEventListener("pointermove", (event) => {
    if (!state.started || !state.demo || event.target.closest("button,input,select,.drawer")) return;
    pointerToDemoResult(event);
  });
  const pointerEnd = (event) => {
    if (!state.demo) return;
    state.pointerDown = false;
    pointerToDemoResult(event);
    drawEngine.update(null, null);
    holoScene.cancelInteraction();
  };
  elements.stage.addEventListener("pointerup", pointerEnd);
  elements.stage.addEventListener("pointercancel", pointerEnd);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.cameraOn) {
      vision.stopCamera();
      showToast("Câmera pausada porque a página ficou oculta.");
    }
  });
  window.addEventListener("beforeunload", () => {
    vision.close();
    holoScene.dispose();
  });
}

function renderLoop(now) {
  state.fpsFrames += 1;
  if (now - state.fpsLastAt >= 1000) {
    const fps = Math.round(state.fpsFrames * 1000 / (now - state.fpsLastAt));
    elements.fps.textContent = `FPS ${fps}`;
    vision.reportRenderFps(fps);
    state.fpsFrames = 0;
    state.fpsLastAt = now;
  }

  if (state.started) {
    if (state.mode === "catch") shapeGame.update(state.latestDisplay, now);
    if (state.mode === "pose") poseGame.update(state.latestDisplay.poses?.[0], now);
    if (state.mode === "gestures") gestureGame.update(state.latestDisplay.gestures, now);
    const hasRequiredTracking = state.mode === "face"
      ? Boolean(state.latestDisplay.faces?.length)
      : state.mode === "pose" || (state.mode === "catch" && state.players === 2)
        ? Boolean(state.latestDisplay.poses?.length)
        : Boolean(state.latestDisplay.hands?.length || state.latestDisplay.poses?.length);
    const stale = now - state.lastDetectionAt > 2200;
    elements.calibrationTip.classList.toggle("hidden", state.demo || !state.cameraOn || hasRequiredTracking || !stale);
  }
  requestAnimationFrame(renderLoop);
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); }
  catch (error) { console.warn("Service Worker não registrado.", error); }
}

renderVersionUi();
applySavedSettings();
const initialParams = new URLSearchParams(window.location.search);
if (initialParams.get("about") === "1") queueMicrotask(() => openVersionDialog("overview"));
compatibilityCheck();
bindEvents();
document.documentElement.dataset.holoReady = "true";
registerServiceWorker();
requestAnimationFrame(renderLoop);
