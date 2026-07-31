import { ADAPTIVE_LEVELS, MODES } from "./config.js";
import { VERSION_CATALOG, TECHNOLOGY_CATALOG, RELEASE_HISTORY, PROJECT_CREDITS, getVersionEntry, getModeVersion, compactVersion, fullVersion } from "./versioning.js";
import { LocalStore } from "./storage.js";
import { HoloAudio } from "./audio.js";
import { VisionEngine } from "./vision.js";
import { GestureEngine, mirrorLandmarks, mirrorWorldLandmarks } from "./gesture-engine.js";
import { GestureInteractionRouter } from "./interaction-router.js";
import { VisionRenderer } from "./vision-renderer.js";
import { DrawEngine } from "./draw-engine.js";
import { ShapeGame } from "./shape-game.js";
import { PoseGame } from "./pose-game.js";
import { GestureGame } from "./gesture-game.js";
import { assessGestureChallenge } from "./gesture-catalog.js";
import { analyzeFace } from "./face-engine.js";
import { BodyMotionAnalyzer } from "./body-actions.js";
import { AcademyGame } from "./academy-game.js";
import { SequenceGame } from "./sequence-game.js";
import { AuraGame } from "./aura-game.js";
import { BodyChallengeGame } from "./body-challenge-game.js";
import { DanceGame } from "./dance-game.js";
import { StretchGame } from "./stretch-game.js";
import { SaberGame } from "./saber-game.js";
import { LibrasGame } from "./libras-game.js";
import { EXPLORER_EXHIBITS, getExplorerExhibit, getExplorerCategory, getExplorerIndex, getAdjacentExplorerExhibit } from "./explorer-catalog.js";
import { ModuleLoader, LAZY_MODULES } from "./module-loader.js";
import { ProgressionSystem } from "./progression.js";
import { PerformanceManager, PERFORMANCE_PROFILES, USAGE_MODES } from "./performance-manager.js";
import { AdaptiveGestureCalibrator, SensorStabilityMonitor } from "./sensor-calibration.js";
import { AccessibilityManager, ACCESSIBILITY_PRESETS } from "./accessibility-manager.js";
import { HardwareManager, bytesToText } from "./hardware-manager.js";
import { BenchmarkEngine } from "./benchmark-engine.js";

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
  xpChip: $("#xpChip"),
  xpValue: $("#xpValue"),
  profileBadge: $("#profileBadge"),
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
  performanceProfile: $("#performanceProfileSelect"),
  usageMode: $("#usageModeSelect"),
  welcomePerformance: $("#welcomePerformanceSelect"),
  welcomeUsage: $("#welcomeUsageSelect"),
  deviceRecommendation: $("#deviceRecommendation"),
  performanceStatus: $("#performanceStatus"),
  moduleStatus: $("#moduleStatus"),
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
  explorerPanel: $("#explorerPanel"),
  explorerIcon: $("#explorerIcon"),
  explorerCategory: $("#explorerCategory"),
  explorerTitle: $("#explorerTitle"),
  explorerSummary: $("#explorerSummary"),
  explorerState: $("#explorerState"),
  explorerCounter: $("#explorerCounter"),
  explorerFacts: $("#explorerFacts"),
  explorerActivityPanel: $("#explorerActivityPanel"),
  explorerActivityIcon: $("#explorerActivityIcon"),
  explorerActivityModeLabel: $("#explorerActivityModeLabel"),
  explorerActivityTitle: $("#explorerActivityTitle"),
  explorerActivityHint: $("#explorerActivityHint"),
  explorerActivityProgress: $("#explorerActivityProgress"),
  explorerActivityScore: $("#explorerActivityScore"),
  explorerActivitySteps: $("#explorerActivitySteps"),
  explorerQuizOptions: $("#explorerQuizOptions"),
  explorerSimulationControls: $("#explorerSimulationControls"),
  explorerOfflineStatus: $("#explorerOfflineStatus"),
  assemblyCanvas: $("#assemblyCanvas"),
  assemblyPanel: $("#assemblyPanel"),
  assemblyIcon: $("#assemblyIcon"),
  assemblyModeLabel: $("#assemblyModeLabel"),
  assemblyTitle: $("#assemblyTitle"),
  assemblyHint: $("#assemblyHint"),
  assemblyProgress: $("#assemblyProgress"),
  assemblyScore: $("#assemblyScore"),
  assemblyPieceList: $("#assemblyPieceList"),
  assemblyTutorialTitle: $("#assemblyTutorialTitle"),
  assemblyTutorialText: $("#assemblyTutorialText"),
  assemblyTutorialFill: $("#assemblyTutorialFill"),
  assemblyTutorialCounter: $("#assemblyTutorialCounter"),
  assemblyDepthZone: $("#assemblyDepthZone"),
  assemblyDepthValue: $("#assemblyDepthValue"),
  assemblyDepthCalibration: $("#assemblyDepthCalibration"),
  depthPanel: $("#depthPanel"),
  depthRound: $("#depthRound"),
  depthTarget: $("#depthTarget"),
  depthHint: $("#depthHint"),
  depthValue: $("#depthValue"),
  depthClock: $("#depthClock"),
  depthSensorStatus: $("#depthSensorStatus"),
  accessibilityStatus: $("#accessibilityStatus"),
  accessibilityAnnouncer: $("#accessibilityAnnouncer"),
  calibrationStatus: $("#calibrationStatus"),
  calibrationDetail: $("#calibrationDetail"),
  sensorStabilityStatus: $("#sensorStabilityStatus"),
  sensorCalibrationStatus: $("#sensorCalibrationStatus"),
  gestureChallenge: $("#gestureChallenge"),
  gestureChallengeIcon: $("#gestureChallengeIcon"),
  gestureChallengeName: $("#gestureChallengeName"),
  gestureChallengeHint: $("#gestureChallengeHint"),
  gestureProgress: $("#gestureProgress"),
  gestureDetected: $("#gestureDetected"),
  gestureConfidence: $("#gestureConfidence"),
  gestureFormScore: $("#gestureFormScore"),
  gestureStability: $("#gestureStability"),
  gestureChecklistMini: $("#gestureChecklistMini"),
  gestureTelemetryDetected: $("#gestureTelemetryDetected"),
  gestureTelemetryOrientation: $("#gestureTelemetryOrientation"),
  gestureTelemetryCurvature: $("#gestureTelemetryCurvature"),
  gestureTelemetryAlternative: $("#gestureTelemetryAlternative"),
  gestureTelemetryFill: $("#gestureTelemetryFill"),
  academyPanel: $("#academyPanel"),
  academyIcon: $("#academyIcon"),
  academyCategory: $("#academyCategory"),
  academyName: $("#academyName"),
  academyHint: $("#academyHint"),
  academyProgress: $("#academyProgress"),
  academyStepCount: $("#academyStepCount"),
  sequencePanel: $("#sequencePanel"),
  sequenceRound: $("#sequenceRound"),
  sequenceChips: $("#sequenceChips"),
  sequenceHint: $("#sequenceHint"),
  sequenceProgress: $("#sequenceProgress"),
  auraPanel: $("#auraPanel"),
  auraLevel: $("#auraLevel"),
  auraEnergy: $("#auraEnergy"),
  auraMeterFill: $("#auraMeterFill"),
  bodyChallengePanel: $("#bodyChallengePanel"),
  bodyChallengeIcon: $("#bodyChallengeIcon"),
  bodyChallengeRound: $("#bodyChallengeRound"),
  bodyChallengeName: $("#bodyChallengeName"),
  bodyChallengeHint: $("#bodyChallengeHint"),
  bodyChallengeProgress: $("#bodyChallengeProgress"),
  bodyChallengeClock: $("#bodyChallengeClock"),
  dancePanel: $("#dancePanel"),
  danceBpm: $("#danceBpm"),
  danceChips: $("#danceChips"),
  danceHint: $("#danceHint"),
  danceProgress: $("#danceProgress"),
  danceStep: $("#danceStep"),
  stretchPanel: $("#stretchPanel"),
  stretchIcon: $("#stretchIcon"),
  stretchName: $("#stretchName"),
  stretchHint: $("#stretchHint"),
  stretchProgress: $("#stretchProgress"),
  stretchStep: $("#stretchStep"),
  saberPanel: $("#saberPanel"),
  saberStatus: $("#saberStatus"),
  saberCombo: $("#saberCombo"),
  librasPanel: $("#librasPanel"),
  librasLetter: $("#librasLetter"),
  librasName: $("#librasName"),
  librasHint: $("#librasHint"),
  librasSequence: $("#librasSequence"),
  librasProgress: $("#librasProgress"),
  librasScore: $("#librasScore"),
  librasAccuracy: $("#librasAccuracy"),
  librasFeedback: $("#librasFeedback"),
  librasMastery: $("#librasMastery"),
  librasFingerGuide: $("#librasFingerGuide"),
  librasStreak: $("#librasStreak"),
  librasAttempts: $("#librasAttempts"),
  librasHits: $("#librasHits"),
  checklistPanel: $("#checklistPanel"),
  checklistIcon: $("#checklistIcon"),
  checklistStep: $("#checklistStep"),
  checklistName: $("#checklistName"),
  checklistHint: $("#checklistHint"),
  checklistItems: $("#checklistItems"),
  checklistProgress: $("#checklistProgress"),
  checklistScore: $("#checklistScore"),
  simonPanel: $("#simonPanel"),
  simonRound: $("#simonRound"),
  simonChips: $("#simonChips"),
  simonHint: $("#simonHint"),
  simonProgress: $("#simonProgress"),
  simonScore: $("#simonScore"),
  reflexPanel: $("#reflexPanel"),
  reflexIcon: $("#reflexIcon"),
  reflexName: $("#reflexName"),
  reflexHint: $("#reflexHint"),
  reflexClock: $("#reflexClock"),
  reflexResponse: $("#reflexResponse"),
  marathonPanel: $("#marathonPanel"),
  marathonIcon: $("#marathonIcon"),
  marathonCompleted: $("#marathonCompleted"),
  marathonName: $("#marathonName"),
  marathonHint: $("#marathonHint"),
  marathonEnergy: $("#marathonEnergy"),
  marathonEnergyFill: $("#marathonEnergyFill"),
  defenderPanel: $("#defenderPanel"),
  defenderStatus: $("#defenderStatus"),
  defenderClock: $("#defenderClock"),
  defenderTargets: $("#defenderTargets"),
  scannerPanel: $("#visionScannerPanel"),
  scannerIcon: $("#scannerIcon"),
  scannerActivity: $("#scannerActivity"),
  scannerMission: $("#scannerMission"),
  scannerHint: $("#scannerHint"),
  scannerPeople: $("#scannerPeople"),
  scannerObjects: $("#scannerObjects"),
  scannerProgress: $("#scannerProgress"),
  scannerSummary: $("#scannerSummary"),
  scannerRelations: $("#scannerRelations"),
  objectStatus: $("#objectStatus"),
  objectDetail: $("#objectDetail"),
  sceneStatus: $("#sceneStatus"),
  sceneDetail: $("#sceneDetail"),
  objectHz: $("#objectHz"),
  objectMs: $("#objectMs"),
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
  playerTwoScore: $("#playerTwoScore"),
  hardwareDialog: $("#hardwareDialog"),
  cameraDeviceSelect: $("#cameraDeviceSelect"),
  microphoneDeviceSelect: $("#microphoneDeviceSelect"),
  audioOutputDeviceSelect: $("#audioOutputDeviceSelect"),
  cameraResolutionSelect: $("#cameraResolutionSelect"),
  cameraFpsSelect: $("#cameraFpsSelect"),
  gpuRendererStatus: $("#gpuRendererStatus"),
  displayRefreshStatus: $("#displayRefreshStatus"),
  cpuCoreStatus: $("#cpuCoreStatus"),
  deviceMemoryStatus: $("#deviceMemoryStatus"),
  jsHeapStatus: $("#jsHeapStatus"),
  storageUsageStatus: $("#storageUsageStatus"),
  hardwareSensorList: $("#hardwareSensorList"),
  microphoneMeterBar: $("#microphoneMeterBar"),
  microphoneTestStatus: $("#microphoneTestStatus"),
  benchmarkProgressBar: $("#benchmarkProgressBar"),
  benchmarkStatusText: $("#benchmarkStatusText"),
  benchmarkScoreValue: $("#benchmarkScoreValue"),
  benchmarkResults: $("#benchmarkResults")
};

const store = new LocalStore();
const audio = new HoloAudio();
const state = {
  mode: MODES[store.get("lastMode")] ? store.get("lastMode") : "academy",
  quality: store.get("quality") || "balanced",
  performanceProfile: PERFORMANCE_PROFILES[store.get("performanceProfile")] ? store.get("performanceProfile") : "auto",
  usageMode: USAGE_MODES[store.get("usageMode")] ? store.get("usageMode") : "auto",
  mirror: Boolean(store.get("mirror")),
  skeleton: Boolean(store.get("skeleton")),
  gestureUi: Boolean(store.get("gestureUi")),
  dwellUi: Boolean(store.get("dwellUi")),
  sensitivity: Number(store.get("sensitivity") || 1),
  autoSensitivity: store.get("autoSensitivity") !== false,
  assemblyKit: ["computer", "drone", "robot", "solar", "network", "satellite", "rover", "circuit"].includes(store.get("assemblyKit")) ? store.get("assemblyKit") : "computer",
  assemblyMode: ["guided", "challenge", "free"].includes(store.get("assemblyMode")) ? store.get("assemblyMode") : "guided",
  assemblyDepthMode: ["off", "assist", "spatial"].includes(store.get("assemblyDepthMode")) ? store.get("assemblyDepthMode") : "assist",
  accessibilityPreset: ACCESSIBILITY_PRESETS[store.get("accessibilityPreset")] ? store.get("accessibilityPreset") : "standard",
  audioCues: store.get("audioCues") !== false,
  cameraDeviceId: String(store.get("cameraDeviceId") || ""),
  microphoneDeviceId: String(store.get("microphoneDeviceId") || ""),
  audioOutputDeviceId: String(store.get("audioOutputDeviceId") || ""),
  cameraResolution: String(store.get("cameraResolution") || "auto"),
  cameraFps: Number(store.get("cameraFps") || 0),
  hardwareBenchmark: store.get("hardwareBenchmark") || null,
  hardwareSnapshot: null,
  players: Number(store.get("players") || 1) === 2 ? 2 : 1,
  captureMode: store.get("captureMode") === "touch" ? "touch" : "close",
  bodyVisual: ["skeleton", "avatar", "hybrid"].includes(store.get("bodyVisual")) ? store.get("bodyVisual") : "hybrid",
  faceBaseline: store.get("faceBaseline") || null,
  librasMode: ["learn", "challenge", "sequence", "word"].includes(store.get("librasMode")) ? store.get("librasMode") : "learn",
  librasHand: ["auto", "left", "right"].includes(store.get("librasHand")) ? store.get("librasHand") : "auto",
  librasDifficulty: ["guided", "standard", "precision"].includes(store.get("librasDifficulty")) ? store.get("librasDifficulty") : "standard",
  librasWord: String(store.get("librasWord") || "LIBRAS"),
  librasMastery: store.get("librasMastery") || {},
  scannerActivity: ["scan", "object", "color", "shape", "classroom", "actions"].includes(store.get("scannerActivity")) ? store.get("scannerActivity") : "scan",
  scannerConfidence: Number(store.get("scannerConfidence") || 0.38),
  explorerId: getExplorerExhibit(store.get("explorerId")).id,
  explorerExploded: false,
  explorerAnimating: true,
  explorerCategory: "all",
  explorerActivityMode: ["free", "guided", "challenge", "quiz"].includes(store.get("explorerActivityMode")) ? store.get("explorerActivityMode") : "free",
  started: false,
  initialized: false,
  cameraOn: false,
  demo: false,
  pointerDown: false,
  demoPreviousGesture: "unknown",
  latestDisplay: { poses: [], hands: [], gestures: [], faces: [], timestamp: 0 },
  latestBody: { detected: false, actions: new Set(), events: new Set(), movement: 0, metrics: {} },
  latestFace: analyzeFace(),
  lastDetectionAt: 0,
  fpsFrames: 0,
  currentFps: 0,
  lastAutoSensitivityAt: 0,
  fpsLastAt: performance.now(),
  lastDynamicCommandAt: 0,
  stats: null,
  toastTimer: null,
  lastHardwareUiAt: 0,
  lastStorageRefreshAt: 0
};

const hardwareManager = new HardwareManager({
  store,
  onUpdate: (snapshot) => {
    if (snapshot?.type === "sensors") renderHardwareSensors(snapshot.readings);
    else if (snapshot?.webgl || snapshot?.cores) {
      state.hardwareSnapshot = snapshot;
      renderHardwareSnapshot(snapshot);
    }
  },
  onDevices: (payload) => renderDeviceOptions(payload)
});
const benchmarkEngine = new BenchmarkEngine({
  hardwareManager,
  onProgress: (payload) => updateBenchmarkProgress(payload)
});

const accessibility = new AccessibilityManager({ store, announcer: elements.accessibilityAnnouncer });
accessibility.apply(state.accessibilityPreset, false);
audio.enabled = state.audioCues;

const gestureEngine = new GestureEngine({ sensitivity: state.sensitivity });
const gestureCalibrator = new AdaptiveGestureCalibrator();
const stabilityMonitor = new SensorStabilityMonitor();
const visionRenderer = new VisionRenderer($("#visionCanvas"), { quality: state.quality });
const drawEngine = new DrawEngine($("#drawCanvas"));
class NullHoloScene {
  constructor() { this.loaded = false; }
  setExplorerExhibit() {} setExplorerExploded() {} setExplorerAnimation() {} setMode() {} setQuality() {}
  setDynamicPixelRatioScale() {} setPerformanceLevel() {} setRenderTargetFps() {} setColor() {} setObjectType() {} setAutoRotate() {} reset() {}
  setExplorerHandInteraction() {} setHandInteraction() {} setFaceState() {} cancelInteraction() {}
  dispose() {} get isNull() { return true; }
}

let holoScene = new NullHoloScene();
let holoScenePromise = null;

async function ensureHoloScene() {
  if (!holoScene.isNull) return holoScene;
  if (!holoScenePromise) {
    setLoading(true, 18, "Carregando motor holográfico 3D sob demanda…");
    holoScenePromise = import("./three-scene.js").then(({ HoloScene }) => {
      const scene = new HoloScene($("#threeCanvas"), {
        quality: state.quality,
        onGrab: () => audio.grab(),
        onRelease: () => audio.release(),
        onExplorerSelect: (partId) => moduleLoader.get("explorer")?.selectPart?.(partId)
      });
      scene.loaded = true;
      scene.setExplorerExhibit(state.explorerId);
      scene.setExplorerAnimation(state.explorerAnimating);
      scene.setColor(store.get("cubeColor") || "#00e5ff");
      scene.setObjectType(store.get("objectType") || "cube");
      scene.setRenderTargetFps(performanceManager.targetFps);
      holoScene = scene;
      if (elements.moduleStatus) elements.moduleStatus.textContent = "MOTOR 3D ATIVO";
      return scene;
    }).finally(() => { setLoading(false); });
  }
  return holoScenePromise;
}

function renderExplorerFacts(exhibit) {
  if (!elements.explorerFacts) return;
  const category = getExplorerCategory(exhibit.category);
  elements.explorerFacts.innerHTML = `
    <header><b>${exhibit.title}</b><span>${category.icon} ${category.label}</span></header>
    <div class="explorer-fact-grid">${exhibit.facts.map((fact) => `<span>${fact}</span>`).join("")}</div>
    <div class="explorer-hotspots">${exhibit.hotspots.map((hotspot) => `<i>${hotspot}</i>`).join("")}</div>`;
}

function renderExplorerActivitySteps(activity, current = 0) {
  if (!elements.explorerActivitySteps) return;
  const steps = activity?.steps || [];
  elements.explorerActivitySteps.innerHTML = steps.map((item, index) => `<span class="${index < current ? "done" : index === current ? "current" : ""}"><i>${index < current ? "✓" : index + 1}</i><b>${escapeHtml(item.title)}</b><small>${index === current ? "AGORA" : index < current ? "OK" : ""}</small></span>`).join("");
}

function renderExplorerQuiz(question, answered = false) {
  if (!elements.explorerQuizOptions) return;
  elements.explorerQuizOptions.classList.toggle("hidden", !question);
  if (!question) { elements.explorerQuizOptions.innerHTML = ""; return; }
  elements.explorerQuizOptions.innerHTML = `<b>${escapeHtml(question.prompt)}</b>${question.options.map((option, index) => `<button type="button" data-explorer-answer="${index}" ${answered ? "disabled" : ""}>${String.fromCharCode(65 + index)} · ${escapeHtml(option)}</button>`).join("")}${answered ? `<button type="button" data-explorer-next-quiz="1">Próxima pergunta</button>` : ""}`;
  $$('[data-explorer-answer]', elements.explorerQuizOptions).forEach((button) => button.addEventListener("click", () => moduleLoader.get("explorer")?.answerQuiz?.(Number(button.dataset.explorerAnswer))));
  $('[data-explorer-next-quiz]', elements.explorerQuizOptions)?.addEventListener("click", () => moduleLoader.get("explorer")?.nextQuiz?.());
}

function updateExplorerUi(exhibit = getExplorerExhibit(state.explorerId)) {
  const category = getExplorerCategory(exhibit.category);
  const index = getExplorerIndex(exhibit.id);
  elements.explorerIcon.textContent = exhibit.icon;
  elements.explorerIcon.style.color = exhibit.color;
  elements.explorerCategory.textContent = `${category.label.toUpperCase()} · EXPOSIÇÃO ${index + 1}/${EXPLORER_EXHIBITS.length}`;
  elements.explorerTitle.textContent = exhibit.title;
  elements.explorerSummary.textContent = exhibit.summary;
  elements.explorerCounter.textContent = `${index + 1}/${EXPLORER_EXHIBITS.length}`;
  elements.explorerState.textContent = state.explorerExploded ? "EXPLODIDO" : state.explorerAnimating ? "ANIMADO" : "PAUSADO";
  elements.hudObjective.textContent = exhibit.objective;
  const select = $("#explorerExhibitSelect");
  if (select) select.value = exhibit.id;
  renderExplorerFacts(exhibit);
}

function selectExplorerExhibit(id, announce = true) {
  const exhibit = getExplorerExhibit(id);
  state.explorerId = exhibit.id;
  state.explorerExploded = false;
  store.set("explorerId", exhibit.id);
  holoScene.setExplorerExhibit(exhibit.id);
  holoScene.setExplorerExploded(false);
  $("#explodeExplorerButton")?.classList.remove("active");
  updateExplorerUi(exhibit);
  moduleLoader.get("explorer")?.setExhibit?.(exhibit.id);
  if (announce) {
    audio.select();
    showToast(`${exhibit.title} carregado`);
  }
}

function stepExplorer(direction) {
  const next = getAdjacentExplorerExhibit(state.explorerId, direction);
  selectExplorerExhibit(next.id);
}

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

function renderGestureAssessment(assessment = {}, gesture = null) {
  if (!elements.gestureDetected) return;
  elements.gestureDetected.textContent = assessment.detectedLabel || gesture?.label || "RASTREANDO";
  elements.gestureConfidence.textContent = `${assessment.confidence || Math.round((gesture?.confidence || 0) * 100)}%`;
  elements.gestureFormScore.textContent = `${assessment.geometry || 0}%`;
  elements.gestureStability.textContent = `${assessment.stability || 0}%`;
  elements.gestureChecklistMini.innerHTML = (assessment.checklist || []).slice(0, 7).map((item, index) => `<span class="${item.passed ? "ok" : index === 0 ? "wait" : ""}">${escapeHtml(item.label)}</span>`).join("");
  elements.gestureTelemetryDetected.textContent = assessment.detectedLabel || gesture?.label || "RASTREANDO";
  elements.gestureTelemetryOrientation.textContent = gesture?.orientation?.label || "--";
  elements.gestureTelemetryCurvature.textContent = gesture?.curvature?.label || "--";
  elements.gestureTelemetryAlternative.textContent = assessment.alternative ? `${assessment.alternative.replaceAll("_", " ")} ${assessment.alternativeScore}%` : "--";
  elements.gestureTelemetryFill.style.width = `${assessment.precision || 0}%`;
}

const gestureGame = new GestureGame({
  onChallenge: (challenge) => {
    elements.gestureChallengeIcon.textContent = challenge.icon;
    elements.gestureChallengeName.textContent = challenge.title;
    elements.gestureChallengeHint.textContent = challenge.hint;
    elements.gestureProgress.textContent = "0%";
    renderGestureAssessment(assessGestureChallenge(challenge, null), null);
    if (state.mode === "gestures") elements.hudObjective.textContent = challenge.hint;
  },
  onProgress: ({ progress, score, assessment, gesture }) => {
    if (state.mode !== "gestures") return;
    elements.gestureProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.accuracy.textContent = `${assessment?.precision || 0}%`;
    renderGestureAssessment(assessment, gesture);
  },
  onSuccess: ({ challenge, score, precision }) => {
    audio.success();
    elements.combo.textContent = `${Math.max(1, Math.round(score / 120))}×`;
    store.set("bestGestureScore", Math.max(score, store.get("bestGestureScore") || 0));
    showToast(`${challenge.icon} ${challenge.title} reconhecido com ${precision}%`);
  }
});

const bodyAnalyzer = new BodyMotionAnalyzer();

const academyGame = new AcademyGame({
  onStep: (step, index, total) => {
    elements.academyIcon.textContent = step.icon;
    elements.academyCategory.textContent = step.category;
    elements.academyName.textContent = step.title;
    elements.academyHint.textContent = step.hint;
    elements.academyStepCount.textContent = `${index + 1}/${total}`;
    if (state.mode === "academy") elements.hudObjective.textContent = step.hint;
  },
  onProgress: ({ progress, score, index, total }) => {
    if (state.mode !== "academy") return;
    elements.academyProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.combo.textContent = `${index}/${total}`;
    elements.accuracy.textContent = `${Math.round(progress * 100)}%`;
  },
  onSuccess: ({ step, score }) => {
    audio.success();
    store.set("bestAcademyScore", Math.max(score, store.get("bestAcademyScore") || 0));
    showToast(`${step.title} reconhecido`);
  },
  onComplete: ({ score }) => {
    audio.success();
    elements.academyProgress.textContent = "100%";
    elements.combo.textContent = "OK";
    showToast(`Academia concluída com ${score.toLocaleString("pt-BR")} pontos`);
  }
});

function renderSequenceChips(sequence = [], completed = 0, errorIndex = -1) {
  elements.sequenceChips.innerHTML = sequence.map((token, index) => `<span class="sequence-chip ${index < completed ? "done" : index === completed ? "current" : ""} ${index === errorIndex ? "error" : ""}"><i>${token.icon}</i><b>${escapeHtml(token.title)}</b></span>`).join("");
}

const sequenceGame = new SequenceGame({
  onSequence: ({ sequence, round, score }) => {
    elements.sequenceRound.textContent = `RODADA ${round}`;
    elements.sequenceProgress.textContent = `0/${sequence.length}`;
    elements.sequenceHint.textContent = "Repita os movimentos na ordem apresentada.";
    renderSequenceChips(sequence, 0);
    if (state.mode === "sequence") elements.hudObjective.textContent = `Memorize ${sequence.length} movimentos e repita na ordem.`;
    elements.score.textContent = score.toLocaleString("pt-BR");
  },
  onProgress: ({ index, total, score }) => {
    if (state.mode !== "sequence") return;
    elements.sequenceProgress.textContent = `${index}/${total}`;
    elements.accuracy.textContent = `${Math.round(index / Math.max(1, total) * 100)}%`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    renderSequenceChips(sequenceGame.sequence, index);
  },
  onRound: ({ round, score }) => {
    audio.success();
    elements.combo.textContent = `${round}×`;
    store.set("bestSequenceScore", Math.max(score, store.get("bestSequenceScore") || 0));
    showToast(`Rodada ${round} concluída`);
  },
  onFail: ({ expected, received, score }) => {
    audio.miss();
    elements.sequenceHint.textContent = `Esperado: ${expected.title}. Detectado: ${received.title}.`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    renderSequenceChips(sequenceGame.sequence, 0, 0);
    showToast("Sequência reiniciada");
  }
});

const auraGame = new AuraGame($("#auraCanvas"), {
  onScore: ({ energy, score, level }) => {
    if (state.mode !== "aura") return;
    elements.auraEnergy.textContent = `${energy}%`;
    elements.auraMeterFill.style.height = `${energy}%`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.accuracy.textContent = `${energy}%`;
    elements.combo.textContent = `N${level}`;
  },
  onLevel: ({ level }) => {
    const labels = ["INICIAL", "DESPERTAR", "ESTELAR", "NEBULOSA", "GALÁCTICO", "CÓSMICO"];
    elements.auraLevel.textContent = `NÍVEL ${level} · ${labels[level]}`;
    if (level > 0) {
      audio.success();
      showToast(`Aura ${labels[level]} ativada`);
    }
  }
});

function renderDanceChips(pattern = [], current = 0) {
  elements.danceChips.innerHTML = pattern.map((move, index) => `<span class="sequence-chip ${index < current ? "done" : index === current ? "current" : ""}"><i>${move.icon}</i><b>${escapeHtml(move.title)}</b></span>`).join("");
}

const bodyChallengeGame = new BodyChallengeGame({
  onCommand: ({ command, round }) => {
    elements.bodyChallengeIcon.textContent = command.icon;
    elements.bodyChallengeName.textContent = command.title;
    elements.bodyChallengeHint.textContent = command.hint;
    elements.bodyChallengeRound.textContent = `RODADA ${round}`;
    if (state.mode === "body") elements.hudObjective.textContent = command.hint;
  },
  onProgress: ({ progress, timeLeft, score, combo }) => {
    if (state.mode !== "body") return;
    elements.bodyChallengeProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.bodyChallengeClock.textContent = `${Math.ceil(timeLeft)}s`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.combo.textContent = `${combo}×`;
    elements.accuracy.textContent = `${Math.round(progress * 100)}%`;
    elements.time.textContent = `${Math.ceil(timeLeft)}s`;
  },
  onHit: ({ command, score, combo }) => {
    audio.success();
    store.set("bestBodyScore", Math.max(score, store.get("bestBodyScore") || 0));
    showToast(`${command.title} · combo ${combo}×`);
  },
  onMiss: ({ command }) => { audio.miss(); showToast(`Tempo esgotado: ${command.title}`); },
  onFinish: ({ score }) => { audio.success(); showToast(`Desafio concluído com ${score.toLocaleString("pt-BR")} pontos`); }
});

const danceGame = new DanceGame({
  onPattern: ({ pattern, bpm }) => {
    elements.danceBpm.textContent = `${bpm} BPM`;
    elements.danceHint.textContent = "Acompanhe o movimento destacado no ritmo.";
    renderDanceChips(pattern, 0);
  },
  onBeat: ({ move, index, total, progress, timingAccuracy, score, combo, bpm }) => {
    if (state.mode !== "dance") return;
    elements.danceBpm.textContent = `${bpm} BPM`;
    elements.danceProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.danceStep.textContent = `${index + 1}/${total}`;
    elements.hudObjective.textContent = move.title;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.combo.textContent = `${combo}×`;
    elements.accuracy.textContent = `${Math.round((timingAccuracy ?? progress) * 100)}%`;
    renderDanceChips(danceGame.pattern, index);
  },
  onHit: ({ move, score, precision }) => { audio.select(); store.set("bestDanceScore", Math.max(score, store.get("bestDanceScore") || 0)); showToast(`${move.icon} ${move.title} · ${precision}%`); },
  onMiss: ({ move }) => { audio.miss(); elements.danceHint.textContent = `Tente novamente: ${move.title}`; },
  onComplete: ({ score }) => { audio.success(); showToast(`Coreografia concluída com ${score.toLocaleString("pt-BR")} pontos`); }
});

const stretchGame = new StretchGame({
  onStep: (step, index, total) => {
    elements.stretchIcon.textContent = step.icon;
    elements.stretchName.textContent = step.title;
    elements.stretchHint.textContent = step.hint;
    elements.stretchStep.textContent = `${index + 1}/${total}`;
    if (state.mode === "stretch") elements.hudObjective.textContent = step.hint;
  },
  onProgress: ({ progress, remaining, index, total, score }) => {
    if (state.mode !== "stretch") return;
    elements.stretchProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.stretchStep.textContent = `${index + 1}/${total}`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.accuracy.textContent = `${Math.round(progress * 100)}%`;
    elements.time.textContent = `${remaining.toFixed(1)}s`;
  },
  onComplete: ({ score }) => { audio.success(); store.set("bestStretchScore", Math.max(score, store.get("bestStretchScore") || 0)); showToast("Rotina de alongamento concluída"); }
});

const saberGame = new SaberGame($("#saberCanvas"), {
  onScore: ({ score, combo }) => {
    if (state.mode !== "saber") return;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.combo.textContent = `${combo}×`;
    elements.saberCombo.textContent = `${combo}×`;
    elements.accuracy.textContent = combo ? "CORTE" : "--";
  },
  onHit: ({ combo, score }) => { audio.success(); elements.saberStatus.textContent = `Alvo cortado · ${score} pontos`; store.set("bestSaberScore", Math.max(score, store.get("bestSaberScore") || 0)); if (combo > 2) showToast(`Combo de sabre ${combo}×`); },
  onMiss: () => { audio.miss(); elements.saberStatus.textContent = "Alvo perdido · continue movimentando"; }
});

function renderLibrasSequence(sequence = [], current = 0) {
  elements.librasSequence.innerHTML = sequence.map((letter, index) => `<span class="${index < current ? "done" : index === current ? "current" : ""}">${escapeHtml(letter)}</span>`).join("");
}

function renderLibrasFingerGuide(evaluation = null) {
  const fingers = evaluation?.fingers || [];
  const components = evaluation?.components || [];
  const fingerHtml = fingers.length
    ? fingers.map((item) => `<span class="${item.ok ? "ok" : "warn"}"><b>${escapeHtml(item.finger)}</b><small>${escapeHtml(item.expected)} · ${escapeHtml(item.actual)}</small></span>`).join("")
    : `<span class="idle"><b>Aguardando mão</b><small>Mostre a mão inteira para analisar os dedos.</small></span>`;
  const componentHtml = components.length
    ? `<div class="libras-component-row">${components.map((item) => `<i class="${item.score >= .75 ? "ok" : item.score >= .45 ? "mid" : "low"}">${escapeHtml(item.label)} ${Math.round(item.score * 100)}%</i>`).join("")}</div>`
    : "";
  elements.librasFingerGuide.innerHTML = `<div class="libras-finger-grid">${fingerHtml}</div>${componentHtml}`;
}

function getLibrasOptions() {
  return {
    mode: $("#librasModeSelect")?.value || state.librasMode,
    handPreference: $("#librasHandSelect")?.value || state.librasHand,
    difficulty: $("#librasDifficultySelect")?.value || state.librasDifficulty,
    word: $("#librasWordInput")?.value || state.librasWord
  };
}

const librasGame = new LibrasGame({
  onLetter: (letter, mode) => {
    elements.librasLetter.textContent = letter.id;
    elements.librasName.textContent = `${letter.title} · ${letter.confidence === "guided" ? "guiada" : letter.confidence === "dynamic" ? "movimento" : "experimental"}`;
    elements.librasHint.textContent = letter.hint;
    elements.librasMastery.textContent = `MAESTRIA ${Number(state.librasMastery[letter.id] || 0)}`;
    if (!["sequence", "word"].includes(mode)) elements.librasSequence.innerHTML = "";
    renderLibrasFingerGuide();
    if (state.mode === "libras") elements.hudObjective.textContent = letter.hint;
  },
  onProgress: ({ progress, score, evaluation, accuracy, streak }) => {
    if (state.mode !== "libras") return;
    elements.librasProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.librasScore.textContent = `${score} PTS`;
    elements.librasAccuracy.textContent = `${accuracy}%`;
    elements.librasFeedback.textContent = evaluation?.feedback || "Aguardando a mão";
    elements.librasStreak.textContent = `${streak}×`;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.accuracy.textContent = evaluation ? `${Math.round(evaluation.score * 100)}%` : "--";
    renderLibrasFingerGuide(evaluation);
  },
  onSuccess: ({ letter, score, manual }) => {
    audio.success();
    state.librasMastery = { ...state.librasMastery, [letter.id]: Number(state.librasMastery[letter.id] || 0) + 1 };
    store.set("librasMastery", state.librasMastery);
    store.set("bestLibrasScore", Math.max(score, store.get("bestLibrasScore") || 0));
    showToast(`${letter.title} ${manual ? "confirmada pelo professor" : "validada experimentalmente"}`);
  },
  onSequence: ({ sequence, index, completed, mode }) => {
    renderLibrasSequence(sequence, index);
    if (completed) showToast(mode === "word" ? "Palavra concluída" : "Sequência concluída");
  },
  onStats: ({ streak, attempts, hits, accuracy }) => {
    elements.librasStreak.textContent = `${streak}×`;
    elements.librasAttempts.textContent = String(attempts);
    elements.librasHits.textContent = String(hits);
    elements.librasAccuracy.textContent = `${accuracy}%`;
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

const performanceManager = new PerformanceManager({
  profile: state.performanceProfile,
  usage: state.usageMode,
  onChange: ({ type, state: performanceState, capability }) => {
    if (type === "state" && elements.profileBadge) {
      elements.profileBadge.dataset.state = performanceState;
      elements.profileBadge.textContent = performanceState === "stable" ? "ESTÁVEL" : performanceState === "adjusting" ? "AJUSTANDO" : "REDUZIDO";
    }
    if (type === "recommendation" && elements.deviceRecommendation) {
      const profile = PERFORMANCE_PROFILES[capability.recommendation];
      elements.deviceRecommendation.textContent = `${profile.label} recomendado · ${capability.cores} núcleos · ${capability.memory} GB estimados`;
    }
  },
  onAdapt: ({ level, direction }) => {
    const scales = [1, .88, .76, .66, .56];
    holoScene.setDynamicPixelRatioScale(scales[level] || .66);
    holoScene.setPerformanceLevel?.(level);
    elements.adaptiveStatus.textContent = direction === "down" ? `OTIMIZANDO ${level}` : `RECUPERANDO ${level}`;
  }
});

const progression = new ProgressionSystem(store, {
  onChange: (payload) => updateProgressionUi(payload),
  onLevelUp: ({ level }) => {
    reactiveBurst("level");
    audio.success();
    showToast(`Nível ${level.level} alcançado · ${level.name}`);
  }
});

const moduleLoader = new ModuleLoader({
  onState: ({ id, state: moduleState }) => {
    if (elements.moduleStatus) elements.moduleStatus.textContent = moduleState === "active" ? `${id.toUpperCase()} ATIVO` : moduleState === "loading" ? "CARREGANDO" : `${moduleLoader.snapshot().filter((item) => item.loaded).length} CARREGADOS`;
  }
});

function reactiveBurst(type = "success") {
  elements.stage.dataset.reaction = type;
  elements.stage.classList.remove("reaction-active");
  void elements.stage.offsetWidth;
  elements.stage.classList.add("reaction-active");
  setTimeout(() => elements.stage.classList.remove("reaction-active"), 720);
}

function updateProgressionUi(payload = progression.snapshot()) {
  const snapshot = payload.level ? payload : progression.snapshot();
  if (elements.xpValue) elements.xpValue.textContent = `${snapshot.xp || 0} XP`;
  if (elements.xpChip) {
    elements.xpChip.querySelector("span").textContent = `N${snapshot.level?.level || 1}`;
    elements.xpChip.style.setProperty("--xp-progress", `${Math.round((snapshot.progress || 0) * 100)}%`);
    elements.xpChip.title = `${snapshot.level?.name || "Iniciante Digital"} · ${snapshot.xpToNext || 0} XP para o próximo nível`;
  }
}

function awardXp(amount, reason, module = state.mode) {
  const result = progression.award(amount, reason, { module });
  reactiveBurst("xp");
  showToast(`+${result.amount} XP · ${reason}`);
  return result;
}

function renderLazySequence(container, sequence = [], current = 0) {
  if (!container) return;
  container.innerHTML = sequence.map((move, index) => `<span class="sequence-chip ${index < current ? "done" : index === current ? "current" : ""}"><i>${move.icon}</i><b>${escapeHtml(move.title)}</b></span>`).join("");
}

function renderAssemblyPieces(snapshot) {
  if (!elements.assemblyPieceList || !snapshot) return;
  elements.assemblyPieceList.innerHTML = (snapshot.pieces || []).map((item) => {
    const current = snapshot.expected?.id === item.id;
    return `<span class="${item.placed ? "done" : current ? "current" : ""}" data-shape="${escapeHtml(item.shape || "circle")}"><i>${item.placed ? "✓" : escapeHtml(item.icon)}</i><b>${escapeHtml(item.label)}</b><em>${item.placed ? "ENCAIXADA" : current ? "AGORA" : "PENDENTE"}</em></span>`;
  }).join("");
}

function lazyCallbacks(mode) {
  if (mode === "explorer") return {
    onState: ({ activity, activityMode, currentStep, currentQuestion, index, quizIndex, score, simulation, completed }) => {
      const labels = { free: "EXPLORAÇÃO LIVRE", guided: "VISITA GUIADA", challenge: "DESAFIO", quiz: "HOLO QUIZ" };
      elements.explorerActivityPanel.classList.toggle("hidden", activityMode === "free" || state.mode !== "explorer");
      elements.explorerActivityIcon.textContent = activity.icon || "◎";
      elements.explorerActivityModeLabel.textContent = labels[activityMode] || "ATIVIDADE";
      elements.explorerActivityTitle.textContent = activity.title;
      elements.explorerActivityHint.textContent = activityMode === "quiz" ? currentQuestion?.prompt || "Quiz concluído" : currentStep?.hint || (completed ? "Atividade concluída" : "Explore a maquete livremente.");
      elements.explorerActivityScore.textContent = `${score || 0} PTS`;
      renderExplorerActivitySteps(activity, activityMode === "quiz" ? activity.steps.length : index);
      renderExplorerQuiz(activityMode === "quiz" ? currentQuestion : null, false);
      const controls = elements.explorerSimulationControls;
      controls?.classList.toggle("hidden", state.explorerId !== "volcano");
      if (simulation?.pressure != null) { $("#explorerPressure").value = simulation.pressure; $("#explorerPressureValue").textContent = `${simulation.pressure}%`; }
      if (simulation?.temperature != null) { $("#explorerTemperature").value = simulation.temperature; $("#explorerTemperatureValue").textContent = `${simulation.temperature}%`; }
      if (simulation?.viscosity != null) { $("#explorerViscosity").value = simulation.viscosity; $("#explorerViscosityValue").textContent = `${simulation.viscosity}%`; }
      if (activityMode === "quiz") elements.explorerActivityProgress.textContent = `${quizIndex + 1}/${activity.quiz.length}`;
    },
    onStep: ({ step, index, total }) => {
      elements.explorerActivityHint.textContent = step.hint;
      elements.explorerActivityProgress.textContent = `${index + 1}/${total}`;
      elements.hudObjective.textContent = step.title;
      renderExplorerActivitySteps(moduleLoader.get("explorer")?.activity, index);
      holoScene.setExplorerFocus?.(step.partId);
    },
    onProgress: ({ current, total, score, combo, remaining }) => {
      elements.explorerActivityProgress.textContent = `${Math.min(current + 1, total)}/${total}`;
      elements.explorerActivityScore.textContent = `${score} PTS`;
      elements.score.textContent = score.toLocaleString("pt-BR");
      elements.combo.textContent = `${combo}×`;
      if (state.explorerActivityMode === "challenge") elements.time.textContent = `${Math.ceil(remaining / 1000)}s`;
    },
    onSuccess: ({ step, xp }) => { audio.success(); awardXp(xp, step.title, "explorer"); reactiveBurst("explorer"); showToast(`${step.title} identificado`); },
    onMiss: ({ expected }) => { audio.miss(); showToast(`Procure: ${expected.title}`); },
    onHint: ({ text }) => showToast(text),
    onPart: ({ partId }) => holoScene.setExplorerFocus?.(partId),
    onQuiz: ({ question, index, total, answered }) => {
      elements.explorerActivityProgress.textContent = `${index + 1}/${total}`;
      elements.explorerActivityHint.textContent = question?.prompt || "Quiz concluído";
      renderExplorerQuiz(question, answered);
    },
    onQuizAnswer: ({ correct, question, answerIndex, score }) => {
      const buttons = $$('[data-explorer-answer]', elements.explorerQuizOptions);
      buttons.forEach((button, index) => button.classList.add(index === question.answer ? "correct" : index === answerIndex ? "wrong" : ""));
      buttons.forEach((button) => { button.disabled = true; });
      elements.explorerQuizOptions.insertAdjacentHTML("beforeend", `<p>${escapeHtml(question.explanation)}</p><button type="button" data-explorer-next-quiz="1">Próxima pergunta</button>`);
      $('[data-explorer-next-quiz]', elements.explorerQuizOptions)?.addEventListener("click", () => moduleLoader.get("explorer")?.nextQuiz?.());
      elements.explorerActivityScore.textContent = `${score} PTS`;
      correct ? audio.success() : audio.miss();
    },
    onSimulation: ({ values }) => {
      elements.explorerActivityHint.textContent = `Pressão ${values.pressure}% · temperatura ${values.temperature}% · viscosidade ${values.viscosity}%`;
    },
    onOffline: ({ state: offlineState, progress, message }) => {
      elements.explorerOfflineStatus.textContent = `${message}${offlineState === "loading" ? ` · ${Math.round(progress * 100)}%` : ""}`;
      $("#cacheExplorerPackageButton").classList.toggle("active", offlineState === "ready");
    },
    onSceneCommand: ({ type, partId, values }) => {
      if (type === "focus") holoScene.setExplorerFocus?.(partId);
      if (type === "reset") holoScene.resetExplorer?.();
      if (type === "simulation") holoScene.setExplorerSimulation?.(values);
      if (type === "next-exhibit") stepExplorer(1);
    },
    onComplete: ({ activity, score, xp, timeout }) => {
      progression.complete("explorer", score, xp);
      audio.success(); reactiveBurst("explorer");
      showToast(timeout ? `${activity.title}: tempo encerrado` : `${activity.title} concluído`);
    }
  };
  if (mode === "assembly") return {
    onState: (snapshot) => {
      elements.assemblyIcon.textContent = snapshot.kit.icon;
      elements.assemblyTitle.textContent = snapshot.kit.label;
      elements.assemblyModeLabel.textContent = snapshot.mode === "challenge" ? "DESAFIO DE MONTAGEM" : snapshot.mode === "free" ? "EXPLORAÇÃO LIVRE" : "MONTAGEM GUIADA";
      elements.assemblyHint.textContent = snapshot.expected ? `Encaixe: ${snapshot.expected.label}` : "Montagem concluída.";
      if (elements.assemblyDepthZone) elements.assemblyDepthZone.textContent = snapshot.depth?.zoneLabel || "MÉDIO";
      if (elements.assemblyDepthValue) elements.assemblyDepthValue.textContent = `${Math.round((snapshot.depth?.normalized ?? .5) * 100)}%`;
      if (elements.assemblyDepthCalibration) elements.assemblyDepthCalibration.textContent = snapshot.depth?.calibrated ? "CALIBRADA" : "AJUSTANDO";
      renderAssemblyPieces(snapshot);
    },
    onProgress: (snapshot) => {
      elements.assemblyProgress.textContent = `${snapshot.placed}/${snapshot.total}`;
      elements.assemblyScore.textContent = `${snapshot.score} PTS`;
      elements.score.textContent = snapshot.score.toLocaleString("pt-BR");
      elements.combo.textContent = `${snapshot.combo}×`;
      elements.accuracy.textContent = `${Math.round(snapshot.accuracy * 100)}%`;
      if (snapshot.mode === "challenge") elements.time.textContent = `${Math.ceil(snapshot.remaining / 1000)}s`;
      elements.assemblyHint.textContent = snapshot.expected ? `Próxima peça: ${snapshot.expected.label}` : "Montagem concluída.";
      renderAssemblyPieces(snapshot);
    },
    onGrab: ({ piece }) => { audio.grab(); elements.assemblyHint.textContent = `${piece.label} selecionada`; },
    onSuccess: ({ piece, gain }) => { audio.success(); reactiveBurst("assembly"); awardXp(12, `Encaixe: ${piece.label}`, "assembly"); showToast(`${piece.label} instalada · +${gain} pontos`); },
    onMiss: ({ expected, correctOrder, close2d, closeDepth }) => { audio.miss(); showToast(!correctOrder ? `A ordem guiada pede: ${expected?.label || "próxima peça"}` : !close2d ? "Aproxime a peça da zona de encaixe" : !closeDepth ? "Ajuste a profundidade: LONGE, MÉDIO ou PERTO" : "Tente novamente"); },
    onHint: ({ text }) => showToast(text),
    onDepth: (depth) => { if (elements.assemblyDepthZone) elements.assemblyDepthZone.textContent = depth.zoneLabel; if (elements.assemblyDepthValue) elements.assemblyDepthValue.textContent = `${Math.round(depth.normalized * 100)}%`; if (elements.assemblyDepthCalibration) elements.assemblyDepthCalibration.textContent = depth.calibrated ? "CALIBRADA" : "AJUSTANDO"; if (elements.depthSensorStatus) elements.depthSensorStatus.textContent = depth.zoneLabel; },
    onTutorial: ({ step, index, total, progress, active }) => { if (!step) return; elements.assemblyTutorialTitle.textContent = step.title; elements.assemblyTutorialText.textContent = step.instruction; elements.assemblyTutorialCounter.textContent = `${index + 1}/${total}`; elements.assemblyTutorialFill.style.width = `${Math.round(progress * 100)}%`; $("#assemblyTutorialToggle")?.classList.toggle("active", active); $("#assemblyTutorialToggle").textContent = active ? "Pausar" : "Continuar"; },
    onTutorialValidated: ({ step }) => { accessibility.announce(`${step.title} validado`); if (audio.enabled) audio.select(); },
    onTutorialComplete: () => { awardXp(60, "Tutorial de montagem", "assembly"); showToast("Tutorial de montagem concluído"); },
    onComplete: ({ score, xp, timeout }) => { progression.complete("assembly", score, xp); audio.success(); reactiveBurst("assembly"); showToast(timeout ? "Tempo encerrado" : "Montagem concluída"); }
  };
  if (mode === "depth") return {
    onStart: () => { elements.depthHint.textContent = "Aproxime ou afaste a mão até a zona indicada."; },
    onTarget: ({ target, round }) => { elements.depthRound.textContent = `RODADA ${round}`; elements.depthTarget.textContent = target.label; elements.depthTarget.style.color = target.color; elements.hudObjective.textContent = `Mantenha a mão em ${target.label}`; },
    onProgress: ({ depth, hold, remaining, score, combo }) => { elements.depthValue.textContent = depth.detected ? `${Math.round(depth.normalized * 100)}%` : "--"; elements.depthClock.textContent = `${Math.ceil(remaining / 1000)}s`; elements.score.textContent = score.toLocaleString("pt-BR"); elements.combo.textContent = `${combo}×`; elements.accuracy.textContent = `${Math.round(hold * 100)}%`; elements.depthHint.textContent = depth.detected ? `Zona atual: ${depth.zoneLabel} · ${depth.direction === "pull" ? "aproximando" : depth.direction === "push" ? "afastando" : "estável"}` : "Mostre a mão inteira."; elements.depthSensorStatus.textContent = depth.detected ? depth.zoneLabel : "SEM DADOS"; },
    onHit: ({ gain, target }) => { audio.success(); progression.award(10, `Profundidade ${target.label}`, { module: "depth" }); reactiveBurst("success"); showToast(`${target.label} validado · +${gain}`); },
    onComplete: ({ score, xp }) => { progression.complete("depth", score, xp); showToast("Treino de profundidade concluído"); }
  };
  if (mode === "checklist") return {
    onStep: (command, index, total) => { elements.checklistIcon.textContent = command.icon; elements.checklistName.textContent = command.title; elements.checklistHint.textContent = command.checks[0]?.hint || "Siga o checklist."; elements.checklistStep.textContent = `${index + 1}/${total}`; elements.hudObjective.textContent = command.title; },
    onProgress: ({ evaluation, holdProgress, score }) => { elements.checklistProgress.textContent = `${Math.round(holdProgress * 100)}%`; elements.checklistScore.textContent = `${score} PTS`; elements.accuracy.textContent = `${Math.round(evaluation.ratio * 100)}%`; elements.checklistHint.textContent = evaluation.hint; elements.checklistItems.innerHTML = evaluation.results.map((item) => `<span class="${item.ok ? "ok" : "pending"}"><i>${item.ok ? "✓" : "○"}</i>${escapeHtml(item.label)}</span>`).join(""); },
    onSuccess: ({ command, xp }) => { audio.success(); awardXp(xp, command.title, "checklist"); },
    onComplete: ({ score }) => { progression.complete("checklist", score, 120); showToast("Tutorial completo"); }
  };
  if (mode === "simon") return {
    onSequence: ({ sequence, round, score }) => { elements.simonRound.textContent = `RODADA ${round}`; elements.simonScore.textContent = `${score} PTS`; elements.simonHint.textContent = "Repita os movimentos na ordem."; renderLazySequence(elements.simonChips, sequence, 0); },
    onProgress: ({ index, total, score, expected }) => { elements.simonProgress.textContent = `${index}/${total}`; elements.simonScore.textContent = `${score} PTS`; elements.hudObjective.textContent = expected?.title || "Memorize"; renderLazySequence(elements.simonChips, moduleLoader.active?.sequence || [], index); },
    onRound: ({ round, xp }) => { audio.success(); awardXp(xp, `Rodada ${round}`, "simon"); }
  };
  if (mode === "reflex") return {
    onCommand: ({ command }) => { elements.reflexIcon.textContent = command.icon; elements.reflexName.textContent = command.title; elements.reflexHint.textContent = command.checks[0]?.hint || "Execute rapidamente"; elements.hudObjective.textContent = command.title; },
    onProgress: ({ remaining, responseMs, score, combo }) => { elements.reflexClock.textContent = `${Math.ceil(remaining / 1000)}s`; elements.reflexResponse.textContent = `${Math.round(responseMs)} ms`; elements.score.textContent = score.toLocaleString("pt-BR"); elements.combo.textContent = `${combo}×`; },
    onHit: ({ xp, responseMs }) => { audio.success(); awardXp(xp, `Reflexo ${Math.round(responseMs)} ms`, "reflex"); },
    onMiss: () => audio.miss(),
    onComplete: ({ score, xp }) => { progression.complete("reflex", score, xp); showToast("Reflex Challenge concluído"); }
  };
  if (mode === "marathon") return {
    onCommand: ({ command, completed }) => { elements.marathonIcon.textContent = command.icon; elements.marathonName.textContent = command.title; elements.marathonCompleted.textContent = `${completed} MOVIMENTOS`; elements.hudObjective.textContent = command.title; },
    onProgress: ({ energy, remaining, score, combo, completed, evaluation }) => { elements.marathonEnergy.textContent = `${Math.round(energy)}%`; elements.marathonEnergyFill.style.height = `${energy}%`; elements.marathonCompleted.textContent = `${completed} MOVIMENTOS`; elements.marathonHint.textContent = evaluation?.hint || "Mantenha o ritmo"; elements.time.textContent = `${Math.ceil(remaining / 1000)}s`; elements.score.textContent = score.toLocaleString("pt-BR"); elements.combo.textContent = `${combo}×`; },
    onHit: ({ xp }) => { audio.select(); progression.award(xp, "Movimento da maratona", { module: "marathon" }); reactiveBurst("success"); },
    onMiss: () => audio.miss(),
    onComplete: ({ score, xp }) => { progression.complete("marathon", score, xp); showToast("Maratona concluída"); }
  };
  if (mode === "defender") return {
    onStart: () => { elements.defenderStatus.textContent = "Defesa iniciada"; },
    onProgress: ({ score, combo, remaining, targets }) => { elements.score.textContent = score.toLocaleString("pt-BR"); elements.combo.textContent = `${combo}×`; elements.defenderClock.textContent = `${Math.ceil(remaining / 1000)}s`; elements.defenderTargets.textContent = `${targets} ALVOS`; },
    onHit: ({ type, xp }) => { audio.success(); elements.defenderStatus.textContent = type === "shield" ? "Ataque bloqueado" : type === "body" ? "Escudo corporal" : "Disparo de energia"; progression.award(xp, "Defesa holográfica", { module: "defender" }); reactiveBurst("shield"); },
    onMiss: () => { audio.miss(); elements.defenderStatus.textContent = "Ataque atravessou a defesa"; },
    onComplete: ({ score, xp }) => { progression.complete("defender", score, xp); showToast("Defesa concluída"); }
  };
  if (mode === "scanner") return {
    onLoading: ({ progress, message }) => setLoading(true, Math.max(18, progress), message),
    onStatus: ({ state: scannerState, message, backend, delegate }) => {
      if (elements.objectStatus) elements.objectStatus.textContent = scannerState === "ready" ? "ativo" : scannerState === "loading" ? "carregando" : scannerState === "paused" ? "pausado" : scannerState === "error" ? "erro" : "não carregado";
      if (elements.objectDetail) elements.objectDetail.textContent = [backend, delegate, message].filter(Boolean).join(" · ") || "--";
      if (scannerState === "ready") setLoading(false);
      if (scannerState === "error" && message) showToast(message);
    },
    onStats: ({ hz, duration, backend, delegate }) => {
      if (elements.objectHz) elements.objectHz.textContent = `${hz || 0} Hz`;
      if (elements.objectMs) elements.objectMs.textContent = `${Math.round(duration || 0)} ms`;
      if (elements.objectDetail) elements.objectDetail.textContent = `${backend || "--"} · ${delegate || "--"}`;
    },
    onActivity: ({ label, icon, hint }) => {
      elements.scannerIcon.textContent = icon;
      elements.scannerActivity.textContent = label.toUpperCase();
      elements.scannerMission.textContent = label;
      elements.scannerHint.textContent = hint;
      elements.hudObjective.textContent = hint;
    },
    onMission: (mission) => {
      elements.scannerIcon.textContent = mission.icon || "⌗";
      elements.scannerMission.textContent = mission.type === "color" ? `Mostre algo ${mission.label}` : mission.type === "object" ? `Encontre: ${mission.label}` : mission.type === "shape" ? `Mostre um ${mission.label}` : `Ação: ${mission.label}`;
      elements.scannerHint.textContent = "Mantenha o resultado estável até a validação.";
      elements.hudObjective.textContent = elements.scannerMission.textContent;
    },
    onProgress: ({ progress, score, completed }) => {
      elements.scannerProgress.textContent = `${Math.round(progress * 100)}%`;
      elements.score.textContent = score.toLocaleString("pt-BR");
      elements.combo.textContent = `${completed}×`;
      elements.accuracy.textContent = `${Math.round(progress * 100)}%`;
    },
    onComplete: ({ mission, xp, score }) => {
      audio.success(); awardXp(xp, mission.label, "scanner");
      progression.complete("scanner", score, 0); reactiveBurst("success");
      showToast(`${mission.label} reconhecido`);
    },
    onScene: ({ detections, summary, people, relations, actionLabels, shape, activityInfo }) => {
      elements.scannerPeople.textContent = String(people || 0);
      elements.scannerObjects.textContent = String(detections?.filter((item) => item.rawLabel !== "person").length || 0);
      elements.sceneStatus.textContent = `${detections?.length || 0} itens`;
      elements.sceneDetail.textContent = actionLabels?.slice(0, 2).join(" · ") || relations?.map((item) => `mão → ${item.label}`).slice(0, 2).join(" · ") || "nenhuma relação";
      elements.scannerSummary.innerHTML = summary?.length ? summary.slice(0, 12).map((item) => `<span>${item.count}× ${escapeHtml(item.label)}</span>`).join("") : `<span>${escapeHtml(activityInfo?.hint || "Aguardando objetos")}</span>`;
      const relationLabels = [...(relations || []).map((item) => `Segurando ${item.label}`), ...(actionLabels || [])];
      if (shape) relationLabels.unshift(`${shape.label} ${Math.round(shape.confidence * 100)}%`);
      elements.scannerRelations.innerHTML = relationLabels.slice(0, 8).map((label) => `<span>${escapeHtml(label)}</span>`).join("");
    }
  };
  return {};
}

async function activateLazyMode(mode) {
  if (!moduleLoader.has(mode)) return null;
  setLoading(true, 32, `Carregando ${LAZY_MODULES[mode].label} sob demanda…`);
  const context = { callbacks: lazyCallbacks(mode), canvas: mode === "defender" ? $("#saberCanvas") : mode === "assembly" ? elements.assemblyCanvas : mode === "depth" ? $("#gameCanvas") : null };
  if (mode === "assembly") Object.assign(context, { sensitivity: state.sensitivity, kitId: state.assemblyKit, mode: state.assemblyMode, depthMode: state.assemblyDepthMode });
  if (mode === "explorer") Object.assign(context, { exhibitId: state.explorerId, activityMode: state.explorerActivityMode });
  if (mode === "scanner") Object.assign(context, {
    video: elements.video,
    canvas: $("#objectCanvas"),
    mirror: state.mirror,
    quality: state.quality,
    demo: state.demo,
    activity: state.scannerActivity,
    confidence: state.scannerConfidence
  });
  try {
    const instance = await moduleLoader.activate(mode, context);
    if (mode !== "scanner") setLoading(false);
    return instance;
  } catch (error) {
    setLoading(false);
    console.error(error);
    showToast(`Falha ao carregar ${LAZY_MODULES[mode].label}`);
    return null;
  }
}

function selectedCameraOptions() {
  return { video: hardwareManager.cameraConstraints(vision.profile.camera) };
}

async function applyPerformanceConfiguration({ restartCamera = false, announce = false } = {}) {
  const quality = performanceManager.resolveQuality(state.mode);
  state.quality = quality;
  elements.quality.value = quality;
  vision.setQuality(quality);
  holoScene.setQuality(quality);
  holoScene.setPerformanceLevel?.(performanceManager.adaptiveLevel);
  holoScene.setRenderTargetFps?.(performanceManager.targetFps);
  visionRenderer.setQuality(quality);
  moduleLoader.get("scanner")?.setQuality?.(quality);
  moduleLoader.get("assembly")?.setSensitivity?.(state.sensitivity);
  const profile = PERFORMANCE_PROFILES[performanceManager.profileId];
  elements.profileBadge.textContent = performanceManager.profileId === "auto" ? "AUTO" : profile.label.toUpperCase().replace("DESEMPENHO MÁXIMO", "FPS");
  elements.performanceStatus.textContent = `${profile.label.toUpperCase()} · ${performanceManager.targetFps} FPS`;
  if (announce) showToast(`${profile.label} · ${performanceManager.usage.label}`);
  if (restartCamera && state.cameraOn) await vision.startCamera(selectedCameraOptions());
}

function populateDeviceSelect(select, items = [], fallback, selectedValue = "") {
  if (!select) return;
  const previous = selectedValue || select.value;
  select.innerHTML = `<option value="">${escapeHtml(fallback)}</option>${items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")}`;
  if ([...select.options].some((option) => option.value === previous)) select.value = previous;
}

function renderDeviceOptions(payload = hardwareManager.deviceOptions()) {
  const selected = payload.selected || hardwareManager.selected;
  populateDeviceSelect(elements.cameraDeviceSelect, payload.cameras, "Padrão do sistema", selected.cameraId);
  populateDeviceSelect(elements.microphoneDeviceSelect, payload.microphones, "Padrão do sistema", selected.microphoneId);
  populateDeviceSelect(elements.audioOutputDeviceSelect, payload.outputs, "Padrão do sistema", selected.audioOutputId);
  if (elements.cameraResolutionSelect) elements.cameraResolutionSelect.value = selected.cameraResolution || "auto";
  if (elements.cameraFpsSelect) elements.cameraFpsSelect.value = String(selected.cameraFps || 0);
  const permission = $("#devicePermissionStatus");
  if (permission) permission.textContent = `${payload.cameras?.length || 0} câmera(s) · ${payload.microphones?.length || 0} microfone(s) · ${payload.outputs?.length || 0} saída(s)`;
}

function renderHardwareSensors(readings = hardwareManager.sensorReadings) {
  if (!elements.hardwareSensorList) return;
  const sensors = hardwareManager.detectSensors();
  elements.hardwareSensorList.innerHTML = sensors.map((sensor) => {
    const reading = readings?.[sensor.id] || sensor.reading;
    const detail = reading ? Object.entries(reading).map(([key, value]) => `${key}: ${value}`).join(" · ") : sensor.api ? "API disponível; clique em testar" : "não exposto neste navegador";
    return `<article data-available="${sensor.api}"><i>${sensor.api ? "✓" : "○"}</i><div><b>${escapeHtml(sensor.label)}</b><span>${escapeHtml(detail)}</span></div></article>`;
  }).join("");
}

function renderHardwareSnapshot(snapshot = {}) {
  const memoryGb = snapshot.memory?.deviceMemoryGb;
  const heapUsed = snapshot.memory?.jsHeapUsed;
  const heapLimit = snapshot.memory?.jsHeapLimit;
  const gpu = snapshot.webgl?.renderer || "não disponível";
  const webGpu = snapshot.webgpu?.available ? "DISPONÍVEL" : "NÃO DISPONÍVEL";
  const recommendation = PERFORMANCE_PROFILES[snapshot.recommendation]?.label || snapshot.recommendation || "--";
  elements.gpuRendererStatus.textContent = gpu;
  elements.gpuRendererStatus.title = gpu;
  elements.displayRefreshStatus.textContent = `${snapshot.refreshRate || 60} Hz`;
  elements.cpuCoreStatus.textContent = `${snapshot.cores || 0} threads`;
  elements.deviceMemoryStatus.textContent = memoryGb ? `${memoryGb} GB estimados` : "não exposto";
  elements.jsHeapStatus.textContent = heapUsed ? `${bytesToText(heapUsed)} / ${bytesToText(heapLimit)}` : "não exposto";
  elements.storageUsageStatus.textContent = snapshot.storage ? `${snapshot.storage.usageText} / ${snapshot.storage.quotaText}` : "--";
  const setText = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
  setText("hardwareCpuValue", `${snapshot.cores || 0} threads`);
  setText("hardwareCpuDetail", `${snapshot.connection || "rede não informada"} · índice ${snapshot.score ?? "--"}`);
  setText("hardwareMemoryValue", memoryGb ? `${memoryGb} GB` : "não exposto");
  setText("hardwareMemoryDetail", heapUsed ? `Heap ${bytesToText(heapUsed)} de ${bytesToText(heapLimit)}` : "O navegador não informou o heap");
  setText("hardwareGpuValue", gpu);
  setText("hardwareGpuDetail", `${snapshot.webgl?.webgl2 ? "WebGL 2" : snapshot.webgl?.available ? "WebGL 1" : "sem WebGL"} · textura máx. ${snapshot.webgl?.maxTextureSize || 0}px`);
  setText("hardwareWebGpuValue", webGpu);
  setText("hardwareRefreshValue", `${snapshot.refreshRate || 60} Hz`);
  setText("hardwareRefreshDetail", `Meta atual ${performanceManager.targetFps} FPS`);
  setText("hardwareStorageValue", snapshot.storage?.usageText || "--");
  setText("hardwareStorageDetail", `Cota ${snapshot.storage?.quotaText || "não informada"} · ${snapshot.storage?.percent || 0}% usada`);
  setText("hardwareHeapValue", heapUsed ? `${bytesToText(heapUsed)} / ${bytesToText(heapLimit)}` : "não exposto");
  setText("hardwareRecommendationValue", recommendation);
  setText("hardwareRecommendationDetail", `Índice ${snapshot.score ?? "--"}/100 · WebGPU ${snapshot.webgpu?.available ? "sim" : "não"}`);
  const permission = $("#devicePermissionStatus");
  if (permission) permission.textContent = `Câmera ${snapshot.permissions?.camera || "?"} · microfone ${snapshot.permissions?.microphone || "?"}`;
  renderDeviceOptions(snapshot.devices || hardwareManager.deviceOptions());
  renderHardwareSensors();
}

function updateBenchmarkProgress(payload = {}) {
  if (elements.benchmarkProgressBar) elements.benchmarkProgressBar.style.width = `${payload.progress || 0}%`;
  if (elements.benchmarkStatusText) elements.benchmarkStatusText.textContent = payload.label || "Executando teste local…";
  if (!payload.result) return;
  const result = payload.result;
  state.hardwareBenchmark = result;
  performanceManager.applyHardwareSnapshot({ ...result.hardware, refreshRate: result.refreshRate, recommendation: result.profile });
  if (elements.benchmarkScoreValue) elements.benchmarkScoreValue.textContent = `${result.score}/100`;
  if (elements.benchmarkResults) elements.benchmarkResults.innerHTML = `<span>CPU ${result.cpu.score}</span><span>GRÁFICOS ${result.graphicsScore}</span><span>TELA ${result.refreshRate} Hz</span><span>MEMÓRIA ${result.memoryScore}</span>`;
  const applyButton = $("#applyBenchmarkProfileButton");
  const saveButton = $("#saveBenchmarkButton");
  if (applyButton) applyButton.disabled = false;
  if (saveButton) saveButton.disabled = false;
  renderHardwareSnapshot({ ...result.hardware, refreshRate: result.refreshRate, recommendation: result.profile });
}

async function runHardwareBenchmark() {
  if (benchmarkEngine.running) return;
  try {
    $("#runFullBenchmarkButton")?.setAttribute("disabled", "");
    if (!elements.hardwareDialog.open) elements.hardwareDialog.showModal();
    const result = await benchmarkEngine.run();
    showToast(`Benchmark ${result.score}/100 · ${PERFORMANCE_PROFILES[result.profile]?.label || result.profile}`);
  } catch (error) {
    console.error(error);
    if (elements.benchmarkStatusText) elements.benchmarkStatusText.textContent = `Falha no benchmark: ${error.message}`;
  } finally {
    $("#runFullBenchmarkButton")?.removeAttribute("disabled");
  }
}

async function openHardwareCenter() {
  if (!elements.hardwareDialog.open) elements.hardwareDialog.showModal();
  renderDeviceOptions();
  renderHardwareSensors();
  try {
    const snapshot = await hardwareManager.detectHardware({ refreshRate: state.hardwareBenchmark?.refreshRate || performanceManager.displayRefreshRate });
    performanceManager.applyHardwareSnapshot(snapshot);
  } catch (error) {
    console.warn("Diagnóstico de hardware incompleto.", error);
  }
}

async function applySelectedMediaDevices({ restartCamera = true } = {}) {
  const selected = hardwareManager.setSelected({
    cameraId: elements.cameraDeviceSelect?.value || "",
    microphoneId: elements.microphoneDeviceSelect?.value || "",
    audioOutputId: elements.audioOutputDeviceSelect?.value || "",
    cameraResolution: elements.cameraResolutionSelect?.value || "auto",
    cameraFps: Number(elements.cameraFpsSelect?.value || 0)
  });
  Object.assign(state, {
    cameraDeviceId: selected.cameraId,
    microphoneDeviceId: selected.microphoneId,
    audioOutputDeviceId: selected.audioOutputId,
    cameraResolution: selected.cameraResolution,
    cameraFps: selected.cameraFps
  });
  try {
    const output = await audio.setOutputDevice(selected.audioOutputId);
    if (selected.audioOutputId && !output.supported) showToast("Este navegador não permite escolher a saída do AudioContext.");
  } catch (error) {
    console.warn(error);
    showToast("Não foi possível aplicar a saída de áudio escolhida.");
  }
  if (restartCamera && state.cameraOn) {
    await vision.startCamera(selectedCameraOptions());
    showToast("Câmera reaberta com o dispositivo escolhido.");
  } else showToast("Dispositivos salvos para a próxima inicialização.");
}

function refreshRuntimeHardwareTelemetry(now = performance.now()) {
  if (now - state.lastHardwareUiAt < 1800) return;
  state.lastHardwareUiAt = now;
  const memory = performance.memory;
  if (memory) elements.jsHeapStatus.textContent = `${bytesToText(memory.usedJSHeapSize)} / ${bytesToText(memory.jsHeapSizeLimit)}`;
  elements.displayRefreshStatus.textContent = `${performanceManager.displayRefreshRate || 60} Hz`;
  elements.cpuCoreStatus.textContent = `${navigator.hardwareConcurrency || 0} threads`;
  elements.deviceMemoryStatus.textContent = navigator.deviceMemory ? `${navigator.deviceMemory} GB estimados` : "não exposto";
}

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
    await vision.startCamera(selectedCameraOptions());
    hardwareManager.refreshDevices().catch(() => {});
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
  performanceManager.detectCapability();
  updateProgressionUi();
  applyPerformanceConfiguration();
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
    const cameraLabel = status.label || "Câmera ativa";
    updateCameraStatus("on", "Câmera ativa");
    if (elements.cameraStatus) elements.cameraStatus.title = cameraLabel;
    const detail = status.settings ? `${status.settings.width || "?"}×${status.settings.height || "?"} · ${Math.round(status.settings.frameRate || 0)} FPS` : "Câmera ativa";
    elements.cameraStatus.title = `${status.label || "Câmera"} · ${detail}`;
    hardwareManager.refreshDevices().catch(() => {});
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
  return ["explorer", "assembly", "sandbox", "catch", "draw", "gestures", "academy", "sequence", "aura", "saber", "libras", "checklist", "simon", "reflex", "marathon", "defender", "scanner"].includes(state.mode) && !(state.mode === "catch" && state.players === 2);
}

function modeNeedsPose() {
  return ["sandbox", "catch", "pose", "academy", "sequence", "aura", "body", "dance", "stretch", "saber", "checklist", "simon", "reflex", "marathon", "defender", "scanner"].includes(state.mode);
}

function applyFaceBaseline(metrics) {
  if (!metrics?.detected || !state.faceBaseline) return metrics;
  const baseline = state.faceBaseline;
  const next = {
    ...metrics,
    headYaw: (metrics.headYaw || 0) - (baseline.headYaw || 0),
    headPitch: (metrics.headPitch || 0) - (baseline.headPitch || 0),
    headRoll: (metrics.headRoll || 0) - (baseline.headRoll || 0)
  };
  const yaw = next.headYaw * 180 / Math.PI;
  const pitch = next.headPitch * 180 / Math.PI;
  const roll = next.headRoll * 180 / Math.PI;
  next.headDirection = `${yaw > 9 ? "direita" : yaw < -9 ? "esquerda" : "centro"} · ${pitch > 8 ? "baixo" : pitch < -8 ? "cima" : "nível"}`;
  next.headTilt = roll > 7 ? "inclinada à direita" : roll < -7 ? "inclinada à esquerda" : "sem inclinação";
  next.yawDegrees = yaw;
  next.pitchDegrees = pitch;
  next.rollDegrees = roll;
  return next;
}

function handleVisionResults(raw) {
  const hands = modeNeedsHands() ? (raw.hands || []).map((hand) => mirrorLandmarks(hand, state.mirror)) : [];
  const worldHands = modeNeedsHands() ? (raw.worldHands || []).map((hand) => mirrorWorldLandmarks(hand, state.mirror)) : [];
  const poses = modeNeedsPose() ? (raw.poses || []).map((pose) => mirrorLandmarks(pose, state.mirror)) : [];
  const faces = state.mode === "face" ? (raw.faces || []).map((face) => mirrorLandmarks(face, state.mirror)) : [];
  const gestures = gestureEngine.update(hands, raw.handedness || [], raw.timestamp || performance.now(), worldHands);
  gestureCalibrator.observe(gestures[0]);
  const calibration = gestureCalibrator.recommendation(state.sensitivity);
  if (elements.calibrationStatus) {
    elements.calibrationStatus.textContent = calibration.ready ? `${calibration.label} · ${calibration.score}%` : "Coletando movimentos";
    elements.calibrationDetail.textContent = calibration.ready ? `Sugestão ${Math.round(calibration.sensitivity * 100)}% · tremor ${Math.round(calibration.metrics.jitter * 10000) / 100}%` : "Faça mão aberta, pinça e mão fechada algumas vezes.";
    elements.sensorCalibrationStatus.textContent = state.autoSensitivity ? "AUTOMÁTICA" : "MANUAL";
  }
  if (state.autoSensitivity && calibration.ready && performance.now() - state.lastAutoSensitivityAt > 1800 && Math.abs(calibration.sensitivity - state.sensitivity) > .025) {
    state.sensitivity = Number((state.sensitivity + (calibration.sensitivity - state.sensitivity) * .32).toFixed(2));
    gestureEngine.setSensitivity(state.sensitivity);
    moduleLoader.get("assembly")?.setSensitivity?.(state.sensitivity);
    store.set("sensitivity", state.sensitivity);
    $("#sensitivityRange").value = String(state.sensitivity);
    $("#sensitivityValue").textContent = `${Math.round(state.sensitivity * 100)}%`;
    state.lastAutoSensitivityAt = performance.now();
  }
  const display = { poses, hands, gestures, faces, timestamp: raw.timestamp || performance.now() };
  state.latestDisplay = display;
  if (raw.task === "pose" || (!state.latestBody.detected && poses.length)) {
    state.latestBody = bodyAnalyzer.update(poses[0], raw.timestamp || performance.now());
  }
  state.lastDetectionAt = performance.now();
  visionRenderer.render(display);
  updateTelemetry(display, raw);

  if (state.mode === "face") {
    state.latestFace = applyFaceBaseline(analyzeFace(faces[0], raw.blendshapes?.[0], raw.faceMatrices?.[0]));
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
    if (state.mode === "explorer") holoScene.setExplorerHandInteraction({ x: point.x, y: point.y, gesture, twoHandDistance, roll, consumed: route.consumed });
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
  if (state.mode === "explorer") {
    if (motion === "swipe_left") stepExplorer(-1);
    if (motion === "swipe_right") stepExplorer(1);
    if (motion === "push") {
      state.explorerExploded = !state.explorerExploded;
      holoScene.setExplorerExploded(state.explorerExploded);
      $("#explodeExplorerButton")?.classList.toggle("active", state.explorerExploded);
      updateExplorerUi();
      showToast(state.explorerExploded ? "Vista explodida ativada" : "Componentes reunidos");
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
  if (raw.task === "face") {
    const metrics = applyFaceBaseline(analyzeFace(display.faces?.[0], raw.blendshapes?.[0], raw.faceMatrices?.[0]));
    elements.faceDetail.textContent = `${metrics.expression} · ${metrics.headDirection}`;
  }
  const confidence = gestures.length ? gestures.reduce((sum, item) => sum + (item.confidence || 0), 0) / gestures.length : 0;
  if (gestures[0] && state.mode === "gestures") renderGestureAssessment(assessGestureChallenge(gestureGame.challenge, gestures[0]), gestures[0]);
  else if (gestures[0] && state.mode === "academy") {
    elements.gestureTelemetryDetected.textContent = gestures[0].label;
    elements.gestureTelemetryOrientation.textContent = gestures[0].orientation?.label || "--";
    elements.gestureTelemetryCurvature.textContent = gestures[0].curvature?.label || "--";
    elements.gestureTelemetryAlternative.textContent = gestures[0].alternatives?.[1] ? `${gestures[0].alternatives[1].type.replaceAll("_", " ")} ${Math.round(gestures[0].alternatives[1].score * 100)}%` : "--";
    elements.gestureTelemetryFill.style.width = `${Math.round((gestures[0].confidence || 0) * 100)}%`;
  }
  const calibration = gestureCalibrator.recommendation(state.sensitivity);
  const stability = stabilityMonitor.observe({ fps: state.currentFps, confidence, detected: Boolean(display.hands?.length || display.poses?.length), inferenceMs: raw.duration || raw.inferenceMs || 0, jitter: calibration.metrics.jitter });
  if (elements.sensorStabilityStatus) elements.sensorStabilityStatus.textContent = `${stability.label} ${stability.score}%`;
}

function updateFaceUi(metrics) {
  elements.faceExpression.textContent = metrics.detected ? `${metrics.expression} · ${metrics.headDirection}` : "Aguardando rosto";
  elements.faceHint.textContent = metrics.detected
    ? `Cabeça ${metrics.headTilt} · ${metrics.landmarkCount || 0} pontos · olhar aproximado ${Math.abs(metrics.gazeX || 0) > 0.22 ? (metrics.gazeX > 0 ? "direita" : "esquerda") : "central"}`
    : "Centralize o rosto, use iluminação frontal e calibre a posição neutra.";
  elements.faceSmileBar.style.height = `${8 + metrics.smile * 88}%`;
  elements.faceJawBar.style.height = `${8 + metrics.jawOpen * 88}%`;
  elements.faceBlinkBar.style.height = `${8 + Math.max(metrics.blinkLeft, metrics.blinkRight) * 88}%`;
  elements.faceStatus.textContent = metrics.detected ? `${metrics.expression} · ${metrics.landmarkCount || 0} pontos` : "não detectado";
  elements.faceDetail.textContent = metrics.detected
    ? `Yaw ${Math.round(metrics.yawDegrees || 0)}° · Pitch ${Math.round(metrics.pitchDegrees || 0)}° · Roll ${Math.round(metrics.rollDegrees || 0)}°`
    : "--";
}

function resetHud() {
  elements.score.textContent = "0";
  elements.combo.textContent = "0×";
  elements.accuracy.textContent = "--";
  elements.time.textContent = "--";
}

async function switchMode(mode, announce = true) {
  if (!MODES[mode]) mode = "sandbox";
  if (moduleLoader.activeId && moduleLoader.activeId !== mode) await moduleLoader.deactivate(moduleLoader.activeId, { dispose: performanceManager.profile.keepModules === 0 });
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
  elements.explorerPanel.classList.toggle("hidden", mode !== "explorer");
  elements.explorerActivityPanel.classList.toggle("hidden", mode !== "explorer" || state.explorerActivityMode === "free");
  elements.assemblyPanel.classList.toggle("hidden", mode !== "assembly");
  elements.assemblyCanvas.classList.toggle("active", mode === "assembly");
  elements.depthPanel.classList.toggle("hidden", mode !== "depth");
  elements.posePanel.classList.toggle("hidden", mode !== "pose");
  elements.gestureChallenge.classList.toggle("hidden", mode !== "gestures");
  elements.academyPanel.classList.toggle("hidden", mode !== "academy");
  elements.sequencePanel.classList.toggle("hidden", mode !== "sequence");
  elements.auraPanel.classList.toggle("hidden", mode !== "aura");
  elements.bodyChallengePanel.classList.toggle("hidden", mode !== "body");
  elements.dancePanel.classList.toggle("hidden", mode !== "dance");
  elements.stretchPanel.classList.toggle("hidden", mode !== "stretch");
  elements.saberPanel.classList.toggle("hidden", mode !== "saber");
  elements.librasPanel.classList.toggle("hidden", mode !== "libras");
  elements.facePanel.classList.toggle("hidden", mode !== "face");
  elements.checklistPanel.classList.toggle("hidden", mode !== "checklist");
  elements.simonPanel.classList.toggle("hidden", mode !== "simon");
  elements.reflexPanel.classList.toggle("hidden", mode !== "reflex");
  elements.marathonPanel.classList.toggle("hidden", mode !== "marathon");
  elements.defenderPanel.classList.toggle("hidden", mode !== "defender");
  elements.scannerPanel.classList.toggle("hidden", mode !== "scanner");
  resetHud();

  shapeGame.setActive(mode === "catch");
  drawEngine.setActive(mode === "draw");
  poseGame.setActive(mode === "pose");
  if (mode === "gestures") gestureGame.start(); else gestureGame.stop();
  if (mode === "academy") academyGame.start(); else academyGame.stop();
  if (mode === "sequence") sequenceGame.start({ demoOnly: state.demo }); else sequenceGame.stop();
  auraGame.setActive(mode === "aura");
  if (mode === "aura") auraGame.reset();
  if (mode === "body") bodyChallengeGame.start(); else bodyChallengeGame.stop();
  if (mode === "dance") danceGame.start(); else danceGame.stop();
  if (mode === "stretch") stretchGame.start(); else stretchGame.stop();
  saberGame.setActive(mode === "saber");
  if (mode === "libras") librasGame.start(getLibrasOptions()); else librasGame.stop();
  if (moduleLoader.has(mode) && state.started) await activateLazyMode(mode);
  if (mode === "assembly") moduleLoader.get("assembly")?.start?.({ kitId: state.assemblyKit, mode: state.assemblyMode, depthMode: state.assemblyDepthMode });
  if (mode === "depth") moduleLoader.get("depth")?.start?.();
  bodyAnalyzer.reset();
  state.latestBody = { detected: false, actions: new Set(), events: new Set(), movement: 0, metrics: {} };
  visionRenderer.setPresentation(state.bodyVisual);
  if (["explorer", "sandbox", "face"].includes(mode)) await ensureHoloScene();
  holoScene.setMode(mode);
  if (mode === "explorer") {
    selectExplorerExhibit(state.explorerId, false);
    moduleLoader.get("explorer")?.setActivityMode?.(state.explorerActivityMode);
  }
  vision.setMode(mode);
  await applyPerformanceConfiguration();
  if (state.initialized) {
    if (["face", "checklist"].includes(mode)) await vision.ensureFace();
    await vision.setMaxPeople(mode === "catch" ? state.players : mode === "scanner" ? 2 : 1);
  }
  if (mode === "catch") {
    shapeGame.setPlayers(state.players);
    shapeGame.setCaptureMode(state.captureMode);
  }
  if (mode === "face") updateFaceUi(analyzeFace());
  if (mode === "explorer") { elements.time.textContent = "HOLOGRAMA"; updateExplorerUi(); }
  if (mode === "assembly") elements.time.textContent = state.assemblyMode === "challenge" ? "105s" : "MONTAGEM";
  if (mode === "depth") elements.time.textContent = "60s";
  if (mode === "academy") elements.combo.textContent = "0/12";
  if (mode === "sequence") elements.time.textContent = "MEMÓRIA";
  if (mode === "aura") elements.time.textContent = "ENERGIA";
  if (mode === "body") elements.time.textContent = "45s";
  if (mode === "dance") elements.time.textContent = "RITMO";
  if (mode === "stretch") elements.time.textContent = "CALMA";
  if (mode === "saber") elements.time.textContent = "MISSÃO";
  if (mode === "libras") elements.time.textContent = "BETA";
  if (mode === "checklist") elements.time.textContent = "TUTORIAL";
  if (mode === "simon") elements.time.textContent = "MEMÓRIA";
  if (mode === "reflex") elements.time.textContent = "45s";
  if (mode === "marathon") elements.time.textContent = "90s";
  if (mode === "defender") elements.time.textContent = "60s";
  if (mode === "scanner") elements.time.textContent = "VISÃO";
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
    await vision.startCamera(selectedCameraOptions());
    hardwareManager.refreshDevices().catch(() => {});
    state.demo = false;
    if (state.mode === "scanner") {
      const scanner = moduleLoader.get("scanner");
      if (scanner) {
        await scanner.dispose?.();
        await scanner.start?.({
          video: elements.video,
          canvas: elements.objectCanvas,
          mirror: state.mirror,
          quality: state.quality,
          demo: false,
          activity: state.scannerActivity,
          confidence: state.scannerConfidence,
          callbacks: lazyCallbacks.scanner
        });
      }
    }
    showToast("Câmera ativada");
  } catch (error) {
    console.error(error);
    showToast("Não foi possível ativar a câmera.");
  }
}

function createDemoHand(x, y, closed, depthScale = 1) {
  const spread = (closed ? 0.018 : 0.05) * depthScale;
  const hand = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
  hand[0] = { x, y: y + 0.08 * depthScale, z: (0.5 - depthScale) * .12 };
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
      headYaw: (x - 0.5) * 0.9,
      headPitch: (y - 0.5) * 0.7,
      yawDegrees: (x - 0.5) * 52,
      pitchDegrees: (y - 0.5) * 42,
      rollDegrees: (x - 0.5) * 46,
      headDirection: `${x > 0.58 ? "direita" : x < 0.42 ? "esquerda" : "centro"} · ${y > 0.58 ? "baixo" : y < 0.42 ? "cima" : "nível"}`,
      headTilt: x > 0.58 ? "inclinada à direita" : x < 0.42 ? "inclinada à esquerda" : "sem inclinação",
      gazeX: (x - 0.5) * 2,
      gazeY: (y - 0.5) * 2,
      landmarkCount: 478,
      expression: state.pointerDown ? "boca aberta" : x > 0.65 ? "sorrindo" : "neutra"
    };
    state.latestFace = metrics;
    updateFaceUi(metrics);
    holoScene.updateFace(metrics);
    return;
  }
  const demoDepthScale = ["depth", "assembly"].includes(state.mode) ? .58 + x * 1.05 : 1;
  const hand = createDemoHand(x, y, state.pointerDown, demoDepthScale);
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
  if (state.mode === "explorer") holoScene.setExplorerHandInteraction({ x, y, gesture: gestures[0], roll: gestures[0]?.orientation?.roll });
  if (state.mode === "sandbox") holoScene.setHandInteraction({ x, y, gesture: gestures[0], roll: gestures[0]?.orientation?.roll });
  if (state.mode === "draw") drawEngine.update(hand, { ...gestures[0], type: state.pointerDown ? "pinch" : "open" });
}

function applySavedSettings() {
  elements.quality.value = state.quality;
  elements.performanceProfile.value = state.performanceProfile;
  elements.usageMode.value = state.usageMode;
  elements.welcomePerformance.value = state.performanceProfile;
  elements.welcomeUsage.value = state.usageMode;
  elements.app.classList.toggle("mirror", state.mirror);
  elements.app.classList.add("camera-off");
  elements.mirrorButton.classList.toggle("active", state.mirror);
  elements.skeletonButton.classList.toggle("active", state.skeleton);
  elements.gestureUiButton.classList.toggle("active", state.gestureUi);
  elements.dwellButton.classList.toggle("active", state.dwellUi);
  visionRenderer.setEnabled(state.skeleton);
  visionRenderer.setPresentation(state.bodyVisual);
  $("#bodyVisualSelect").value = state.bodyVisual;
  interactionRouter.setEnabled(state.gestureUi);
  interactionRouter.setDwellEnabled(state.dwellUi);
  gestureEngine.setSensitivity(state.sensitivity);
  $("#sensitivityRange").value = String(state.sensitivity);
  $("#sensitivityValue").textContent = `${Math.round(state.sensitivity * 100)}%`;
  $("#playersSelect").value = String(state.players);
  $("#captureModeSelect").value = state.captureMode;
  $("#librasModeSelect").value = state.librasMode;
  $("#librasHandSelect").value = state.librasHand;
  $("#librasDifficultySelect").value = state.librasDifficulty;
  $("#librasWordInput").value = state.librasWord;
  $("#librasWordControls").classList.toggle("hidden", state.librasMode !== "word");
  $("#explorerActivityMode").value = state.explorerActivityMode;
  $("#assemblyKitSelect").value = state.assemblyKit;
  $("#assemblyModeSelect").value = state.assemblyMode;
  $("#assemblyDepthSelect").value = state.assemblyDepthMode;
  $("#accessibilityPresetSelect").value = state.accessibilityPreset;
  $("#audioCuesButton")?.classList.toggle("active", state.audioCues);
  const activeAccessibility = accessibility.apply(state.accessibilityPreset, false);
  audio.enabled = state.audioCues;
  renderDeviceOptions(hardwareManager.deviceOptions());
  if (state.hardwareBenchmark) updateBenchmarkProgress({ progress: 100, label: "Benchmark salvo neste dispositivo.", result: state.hardwareBenchmark });
  elements.accessibilityStatus.textContent = (activeAccessibility.label || "Padrão").toUpperCase();
  $("#autoSensitivityButton")?.classList.toggle("active", state.autoSensitivity);
  elements.sensorCalibrationStatus.textContent = state.autoSensitivity ? "AUTOMÁTICA" : "MANUAL";
  $("#scannerActivitySelect").value = state.scannerActivity;
  $("#scannerConfidenceRange").value = String(state.scannerConfidence);
  $("#scannerConfidenceValue").textContent = `${Math.round(state.scannerConfidence * 100)}%`;
  shapeGame.setPlayers(state.players);
  shapeGame.setCaptureMode(state.captureMode);
  const color = store.get("cubeColor") || "#00e5ff";
  holoScene.setColor(color);
  holoScene.setObjectType(store.get("objectType") || "cube");
  holoScene.setExplorerExhibit(state.explorerId);
  holoScene.setExplorerAnimation(state.explorerAnimating);
  $("#objectSelect").value = store.get("objectType") || "cube";
  $$(".swatch").forEach((button) => button.classList.toggle("active", button.dataset.color === color));
  performanceManager.detectCapability();
  updateProgressionUi();
  applyPerformanceConfiguration();
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
  elements.sensorsButton.addEventListener("click", async () => {
    if (elements.sensorsDrawer.classList.contains("open")) closeDrawers();
    else {
      openDrawer("sensorsDrawer");
      hardwareManager.detectHardware({ refreshRate: performanceManager.displayRefreshRate }).then((snapshot) => performanceManager.applyHardwareSnapshot(snapshot)).catch(() => {});
    }
  });
  $$("[data-close-drawer]").forEach((button) => button.addEventListener("click", closeDrawers));
  elements.drawerBackdrop.addEventListener("click", closeDrawers);

  elements.mirrorButton.addEventListener("click", () => {
    state.mirror = !state.mirror;
    store.set("mirror", state.mirror);
    elements.app.classList.toggle("mirror", state.mirror);
    elements.mirrorButton.classList.toggle("active", state.mirror);
    gestureEngine.reset();
    moduleLoader.get("scanner")?.setMirror?.(state.mirror);
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
  $("#accessibilityPresetSelect")?.addEventListener("change", (event) => { state.accessibilityPreset = event.target.value; const preset = accessibility.apply(state.accessibilityPreset); elements.accessibilityStatus.textContent = preset.label.toUpperCase(); showToast(`Acessibilidade: ${preset.label}`); });
  $("#audioCuesButton")?.addEventListener("click", (event) => { state.audioCues = !state.audioCues; audio.enabled = state.audioCues; accessibility.setAudioCues(state.audioCues); event.currentTarget.classList.toggle("active", state.audioCues); showToast(state.audioCues ? "Sinais sonoros ativados" : "Sinais sonoros desativados"); });

  const updateProfile = async (profileId, usageId = performanceManager.usageId, restartCamera = true) => {
    state.performanceProfile = profileId;
    state.usageMode = usageId;
    store.set("performanceProfile", profileId);
    store.set("usageMode", usageId);
    performanceManager.setProfile(profileId);
    performanceManager.setUsage(usageId);
    [elements.performanceProfile, elements.welcomePerformance].forEach((select) => { if (select) select.value = profileId; });
    [elements.usageMode, elements.welcomeUsage].forEach((select) => { if (select) select.value = usageId; });
    await applyPerformanceConfiguration({ restartCamera, announce: true });
  };
  elements.performanceProfile.addEventListener("change", () => updateProfile(elements.performanceProfile.value));
  elements.usageMode.addEventListener("change", () => updateProfile(performanceManager.profileId, elements.usageMode.value, false));
  elements.welcomePerformance.addEventListener("change", () => updateProfile(elements.welcomePerformance.value, elements.welcomeUsage.value, false));
  elements.welcomeUsage.addEventListener("change", () => updateProfile(elements.welcomePerformance.value, elements.welcomeUsage.value, false));
  $("#benchmarkButton").addEventListener("click", runHardwareBenchmark);
  $("#runFullBenchmarkButton")?.addEventListener("click", runHardwareBenchmark);
  $("#hardwareCenterButton")?.addEventListener("click", openHardwareCenter);
  $("#hardwareDetailsButton")?.addEventListener("click", openHardwareCenter);
  $("#openHardwareFromSensorsButton")?.addEventListener("click", openHardwareCenter);
  $("#refreshHardwareButton")?.addEventListener("click", async () => {
    const snapshot = await hardwareManager.detectHardware({ refreshRate: performanceManager.displayRefreshRate });
    performanceManager.applyHardwareSnapshot(snapshot);
    showToast("Leitura de hardware atualizada.");
  });
  $("#grantDeviceAccessButton")?.addEventListener("click", async () => {
    try {
      await hardwareManager.requestDeviceAccess({ camera: true, microphone: true });
      const snapshot = await hardwareManager.detectHardware({ refreshRate: performanceManager.displayRefreshRate });
      renderHardwareSnapshot(snapshot);
      showToast("Dispositivos autorizados e identificados.");
    } catch (error) {
      console.error(error);
      showToast("A autorização foi recusada ou parcialmente bloqueada.");
    }
  });
  $("#refreshDevicesButton")?.addEventListener("click", () => hardwareManager.refreshDevices().then(() => showToast("Lista de dispositivos atualizada.")));
  $("#applyMediaDevicesButton")?.addEventListener("click", () => applySelectedMediaDevices({ restartCamera: true }).catch((error) => { console.error(error); showToast("Falha ao aplicar dispositivos."); }));
  $("#restartCameraWithDeviceButton")?.addEventListener("click", async () => {
    await applySelectedMediaDevices({ restartCamera: false });
    if (!state.initialized) await initializeVision();
    await vision.startCamera(selectedCameraOptions());
    state.cameraOn = true;
    showToast("Câmera selecionada está ativa.");
  });
  $("#testMicrophoneButton")?.addEventListener("click", async () => {
    elements.microphoneTestStatus.textContent = "Ouvindo por alguns segundos…";
    elements.microphoneMeterBar.style.width = "0%";
    try {
      const result = await hardwareManager.testMicrophone({ onLevel: (level) => { elements.microphoneMeterBar.style.width = `${Math.round(level * 100)}%`; } });
      elements.microphoneTestStatus.textContent = `Nível ${result.label} · pico ${Math.round(result.peak * 100)}%`;
    } catch (error) {
      elements.microphoneTestStatus.textContent = `Falha: ${error.message}`;
    }
  });
  $("#testAudioOutputButton")?.addEventListener("click", async () => {
    await applySelectedMediaDevices({ restartCamera: false });
    audio.success();
    showToast("Sinal de teste reproduzido.");
  });
  $("#testMotionSensorsButton")?.addEventListener("click", async () => {
    showToast("Mova ou incline o dispositivo durante o teste.");
    const readings = await hardwareManager.testSensorEvents({ duration: 1600 });
    renderHardwareSensors(readings);
    showToast(Object.keys(readings).length ? "Sensores físicos testados." : "Nenhuma leitura física recebida.");
  });
  $("#applyBenchmarkProfileButton")?.addEventListener("click", async () => {
    const recommendation = state.hardwareBenchmark?.profile;
    if (!recommendation) return;
    await updateProfile(recommendation, performanceManager.usageId, state.cameraOn);
    showToast(`${PERFORMANCE_PROFILES[recommendation]?.label || recommendation} aplicado.`);
  });
  $("#saveBenchmarkButton")?.addEventListener("click", () => {
    if (!state.hardwareBenchmark) return;
    store.set("hardwareBenchmark", state.hardwareBenchmark);
    showToast("Benchmark salvo localmente.");
  });
  $("#optimizeButton").addEventListener("click", async () => {
    performanceManager.adaptiveLevel = Math.min(4, performanceManager.adaptiveLevel + 1);
    holoScene.setDynamicPixelRatioScale([1,.88,.76,.66,.56][performanceManager.adaptiveLevel]);
    holoScene.setPerformanceLevel?.(performanceManager.adaptiveLevel);
    showToast("Qualidade ajustada para recuperar FPS");
  });
  $("#unloadModulesButton").addEventListener("click", async () => {
    const active = moduleLoader.activeId;
    for (const item of moduleLoader.snapshot()) if (item.loaded && item.id !== active) await moduleLoader.deactivate(item.id, { dispose: true });
    showToast("Módulos inativos removidos da memória");
  });


  $("#autoSensitivityButton")?.classList.toggle("active", state.autoSensitivity);
  $("#autoSensitivityButton")?.addEventListener("click", (event) => { state.autoSensitivity = !state.autoSensitivity; store.set("autoSensitivity", state.autoSensitivity); event.currentTarget.classList.toggle("active", state.autoSensitivity); elements.sensorCalibrationStatus.textContent = state.autoSensitivity ? "AUTOMÁTICA" : "MANUAL"; showToast(state.autoSensitivity ? "Sensibilidade automática ativada" : "Ajuste manual ativado"); });
  $("#applyCalibrationButton")?.addEventListener("click", () => { const result = gestureCalibrator.recommendation(state.sensitivity); if (!result.ready) return showToast("Faça mais movimentos para concluir a calibração"); state.sensitivity = result.sensitivity; gestureEngine.setSensitivity(state.sensitivity); moduleLoader.get("assembly")?.setSensitivity?.(state.sensitivity); store.set("sensitivity", state.sensitivity); $("#sensitivityRange").value = String(state.sensitivity); $("#sensitivityValue").textContent = `${Math.round(state.sensitivity * 100)}%`; showToast(`Sensibilidade ajustada para ${Math.round(state.sensitivity * 100)}%`); });
  $("#resetCalibrationButton")?.addEventListener("click", () => { gestureCalibrator.reset(); elements.calibrationStatus.textContent = "Aguardando amostras"; elements.calibrationDetail.textContent = "Abra e feche a mão algumas vezes."; showToast("Calibração reiniciada"); });

  $("#sensitivityRange").addEventListener("input", (event) => {
    state.sensitivity = Number(event.target.value);
    gestureEngine.setSensitivity(state.sensitivity);
    moduleLoader.get("assembly")?.setSensitivity?.(state.sensitivity);
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

  $("#assemblyKitSelect")?.addEventListener("change", async (event) => {
    state.assemblyKit = event.target.value; store.set("assemblyKit", state.assemblyKit);
    let game = moduleLoader.get("assembly"); if (!game) game = await activateLazyMode("assembly");
    game?.start?.({ kitId: state.assemblyKit, mode: state.assemblyMode, depthMode: state.assemblyDepthMode });
  });
  $("#assemblyModeSelect")?.addEventListener("change", (event) => { state.assemblyMode = event.target.value; store.set("assemblyMode", state.assemblyMode); moduleLoader.get("assembly")?.start?.({ kitId: state.assemblyKit, mode: state.assemblyMode, depthMode: state.assemblyDepthMode }); });
  $("#assemblyDepthSelect")?.addEventListener("change", (event) => { state.assemblyDepthMode = event.target.value; store.set("assemblyDepthMode", state.assemblyDepthMode); moduleLoader.get("assembly")?.setDepthMode?.(state.assemblyDepthMode); });
  $("#startAssemblyButton")?.addEventListener("click", async () => { let game = moduleLoader.get("assembly"); if (!game) game = await activateLazyMode("assembly"); game?.start?.({ kitId: state.assemblyKit, mode: state.assemblyMode, depthMode: state.assemblyDepthMode }); });
  $("#assemblyHintButton")?.addEventListener("click", () => moduleLoader.get("assembly")?.hint?.());
  $("#resetAssemblyButton")?.addEventListener("click", () => moduleLoader.get("assembly")?.reset?.());
  $("#assemblyTutorialToggle")?.addEventListener("click", () => moduleLoader.get("assembly")?.toggleTutorial?.());
  $("#assemblyTutorialPrevious")?.addEventListener("click", () => moduleLoader.get("assembly")?.previousTutorial?.());
  $("#assemblyTutorialRepeat")?.addEventListener("click", () => moduleLoader.get("assembly")?.repeatTutorial?.());
  $("#assemblyTutorialNext")?.addEventListener("click", () => moduleLoader.get("assembly")?.nextTutorial?.());
  $("#restartDepthButton")?.addEventListener("click", async () => { let game = moduleLoader.get("depth"); if (!game) game = await activateLazyMode("depth"); game?.start?.(); });

  $("#explorerExhibitSelect").addEventListener("change", (event) => selectExplorerExhibit(event.target.value));
  $("#previousExplorerButton").addEventListener("click", () => stepExplorer(-1));
  $("#nextExplorerButton").addEventListener("click", () => stepExplorer(1));
  $("#explodeExplorerButton").addEventListener("click", (event) => {
    state.explorerExploded = !state.explorerExploded;
    event.currentTarget.classList.toggle("active", state.explorerExploded);
    holoScene.setExplorerExploded(state.explorerExploded);
    updateExplorerUi();
    showToast(state.explorerExploded ? "Vista explodida ativada" : "Componentes reunidos");
  });
  $("#animateExplorerButton").addEventListener("click", (event) => {
    state.explorerAnimating = !state.explorerAnimating;
    event.currentTarget.classList.toggle("active", state.explorerAnimating);
    holoScene.setExplorerAnimation(state.explorerAnimating);
    updateExplorerUi();
    showToast(state.explorerAnimating ? "Animações retomadas" : "Animações pausadas");
  });
  $("#resetExplorerButton").addEventListener("click", () => {
    holoScene.resetExplorer();
    showToast("Exposição centralizada");
  });
  $("#explorerActivityMode").addEventListener("change", (event) => {
    state.explorerActivityMode = event.target.value;
    store.set("explorerActivityMode", state.explorerActivityMode);
    moduleLoader.get("explorer")?.setActivityMode?.(state.explorerActivityMode);
    elements.explorerActivityPanel.classList.toggle("hidden", state.explorerActivityMode === "free");
  });
  $("#startExplorerActivityButton").addEventListener("click", async () => {
    let lab = moduleLoader.get("explorer");
    if (!lab) lab = await activateLazyMode("explorer");
    lab?.start?.({ exhibitId: state.explorerId, activityMode: state.explorerActivityMode });
    showToast(state.explorerActivityMode === "free" ? "Exploração livre ativada" : "Atividade iniciada");
  });
  $("#validateExplorerStepButton").addEventListener("click", () => moduleLoader.get("explorer")?.validateCurrent?.());
  $("#hintExplorerButton").addEventListener("click", () => moduleLoader.get("explorer")?.hint?.());
  $("#resetExplorerActivityButton").addEventListener("click", () => moduleLoader.get("explorer")?.reset?.());
  $("#cacheExplorerPackageButton").addEventListener("click", async () => {
    let lab = moduleLoader.get("explorer");
    if (!lab) lab = await activateLazyMode("explorer");
    try { await lab?.cacheOfflinePackage?.(); }
    catch (error) { console.error(error); elements.explorerOfflineStatus.textContent = "Não foi possível concluir o pacote offline."; }
  });
  [["explorerPressure", "pressure"], ["explorerTemperature", "temperature"], ["explorerViscosity", "viscosity"]].forEach(([id, key]) => {
    $("#" + id).addEventListener("input", (event) => {
      $("#" + id + "Value").textContent = `${event.target.value}%`;
      moduleLoader.get("explorer")?.setSimulationValue?.(key, event.target.value);
    });
  });
  $$('[data-explorer-category]').forEach((button) => button.addEventListener("click", () => {
    state.explorerCategory = button.dataset.explorerCategory;
    $$('[data-explorer-category]').forEach((item) => item.classList.toggle("active", item === button));
    if (state.explorerCategory !== "all") {
      const first = EXPLORER_EXHIBITS.find((item) => item.category === state.explorerCategory);
      if (first) selectExplorerExhibit(first.id);
    }
  }));

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
  $("#restartAcademyButton").addEventListener("click", () => { academyGame.start(); showToast("Academia reiniciada"); });
  $("#restartSequenceButton").addEventListener("click", () => { sequenceGame.start({ demoOnly: state.demo }); showToast("Nova sequência iniciada"); });
  $("#resetAuraButton").addEventListener("click", () => { auraGame.reset(); showToast("Energia reiniciada"); });
  $("#restartBodyChallengeButton").addEventListener("click", () => { bodyChallengeGame.start(); showToast("Body Challenge reiniciado"); });
  $("#restartDanceButton").addEventListener("click", () => { danceGame.start(); showToast("Nova coreografia iniciada"); });
  $("#restartStretchButton").addEventListener("click", () => { stretchGame.start(); showToast("Rotina reiniciada"); });
  $("#restartSaberButton").addEventListener("click", () => { saberGame.reset(); showToast("Missão de sabre reiniciada"); });
  $("#restartLibrasButton").addEventListener("click", () => { librasGame.start(getLibrasOptions()); showToast("Libras Lab reiniciado"); });
  $("#librasModeSelect").addEventListener("change", (event) => {
    state.librasMode = event.target.value;
    store.set("librasMode", state.librasMode);
    $("#librasWordControls").classList.toggle("hidden", state.librasMode !== "word");
    librasGame.start(getLibrasOptions());
    showToast(state.librasMode === "word" ? "Soletração de palavra ativada" : state.librasMode === "sequence" ? "Sequência de letras ativada" : state.librasMode === "challenge" ? "Desafio aleatório ativado" : "Modo aprender ativado");
  });
  $("#librasHandSelect").addEventListener("change", (event) => {
    state.librasHand = event.target.value;
    store.set("librasHand", state.librasHand);
    librasGame.start(getLibrasOptions());
    showToast(state.librasHand === "auto" ? "Mão detectada automaticamente" : `Treino com a mão ${state.librasHand === "left" ? "esquerda" : "direita"}`);
  });
  $("#librasDifficultySelect").addEventListener("change", (event) => {
    state.librasDifficulty = event.target.value;
    store.set("librasDifficulty", state.librasDifficulty);
    librasGame.start(getLibrasOptions());
    showToast(`Precisão ${event.target.options[event.target.selectedIndex].text.toLowerCase()} ativada`);
  });
  $("#startLibrasWordButton").addEventListener("click", () => {
    state.librasWord = librasGame.setWord($("#librasWordInput").value);
    store.set("librasWord", state.librasWord);
    $("#librasWordInput").value = state.librasWord;
    librasGame.start({ ...getLibrasOptions(), mode: "word", word: state.librasWord });
    showToast(`Soletração de ${state.librasWord} iniciada`);
  });
  $("#previousLibrasButton").addEventListener("click", () => { librasGame.previousLetter(); audio.select(); });
  $("#nextLibrasButton").addEventListener("click", () => { librasGame.nextLetter(); audio.select(); });
  $("#manualLibrasButton").addEventListener("click", () => librasGame.manualConfirm());
  $("#bodyVisualSelect").addEventListener("change", (event) => {
    state.bodyVisual = event.target.value;
    store.set("bodyVisual", state.bodyVisual);
    visionRenderer.setPresentation(state.bodyVisual);
    showToast(state.bodyVisual === "hybrid" ? "Avatar e esqueleto ativados" : state.bodyVisual === "avatar" ? "Avatar holográfico ativado" : "Esqueleto ativado");
  });
  $("#calibrateFaceButton").addEventListener("click", () => {
    if (!state.latestFace?.detected) {
      showToast("Centralize o rosto antes de calibrar.");
      return;
    }
    state.faceBaseline = {
      headYaw: state.latestFace.headYaw || 0,
      headPitch: state.latestFace.headPitch || 0,
      headRoll: state.latestFace.headRoll || 0
    };
    store.set("faceBaseline", state.faceBaseline);
    showToast("Posição facial neutra calibrada");
  });

  $("#previousChecklistButton")?.addEventListener("click", () => moduleLoader.get("checklist")?.previous());
  $("#nextChecklistButton")?.addEventListener("click", () => moduleLoader.get("checklist")?.next());
  $("#restartChecklistButton")?.addEventListener("click", () => moduleLoader.get("checklist")?.reset());
  $("#restartSimonButton")?.addEventListener("click", () => moduleLoader.get("simon")?.reset());
  $("#restartReflexButton")?.addEventListener("click", () => moduleLoader.get("reflex")?.start());
  $("#restartMarathonButton")?.addEventListener("click", () => moduleLoader.get("marathon")?.start());
  $("#restartDefenderButton")?.addEventListener("click", () => moduleLoader.get("defender")?.start());
  $("#scannerActivitySelect")?.addEventListener("change", (event) => {
    state.scannerActivity = event.target.value; store.set("scannerActivity", state.scannerActivity);
    moduleLoader.get("scanner")?.setActivity?.(state.scannerActivity);
  });
  $("#scannerConfidenceRange")?.addEventListener("input", (event) => {
    state.scannerConfidence = Number(event.target.value); store.set("scannerConfidence", state.scannerConfidence);
    $("#scannerConfidenceValue").textContent = `${Math.round(state.scannerConfidence * 100)}%`;
    moduleLoader.get("scanner")?.setConfidence?.(state.scannerConfidence);
  });
  $("#scannerMissionButton")?.addEventListener("click", () => moduleLoader.get("scanner")?.newMission?.());
  $("#scannerPauseButton")?.addEventListener("click", (event) => {
    const paused = moduleLoader.get("scanner")?.togglePause?.();
    event.currentTarget.textContent = paused ? "Retomar scanner" : "Pausar scanner";
  });
  $("#scannerClearButton")?.addEventListener("click", () => {
    const scanner = moduleLoader.get("scanner"); scanner?.tracker?.reset?.();
    if (scanner) { scanner.detections = []; scanner.relations = []; scanner.shape = null; scanner.render?.(performance.now()); }
    showToast("Leitura do scanner limpa");
  });
  elements.xpChip?.addEventListener("click", () => {
    const data = progression.snapshot();
    showToast(`${data.level.name} · ${data.xp} XP · ${data.xpToNext} para o próximo nível`);
  });

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
    moduleLoader.disposeAll();
    hardwareManager.destroy();
  });
}

function renderLoop(now) {
  refreshRuntimeHardwareTelemetry(now);
  state.fpsFrames += 1;
  if (now - state.fpsLastAt >= 1000) {
    const fps = Math.round(state.fpsFrames * 1000 / (now - state.fpsLastAt));
    state.currentFps = fps;
    elements.fps.textContent = `FPS ${fps}`;
    vision.reportRenderFps(fps);
    performanceManager.sample(fps, now);
    state.fpsFrames = 0;
    state.fpsLastAt = now;
  }

  if (state.started) {
    if (state.mode === "catch") shapeGame.update(state.latestDisplay, now);
    if (state.mode === "pose") poseGame.update(state.latestDisplay.poses?.[0], now);
    if (state.mode === "gestures") gestureGame.update(state.latestDisplay.gestures, now);
    if (state.mode === "academy") academyGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "sequence") sequenceGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "aura") auraGame.update(state.latestDisplay, state.latestBody, now);
    if (state.mode === "body") bodyChallengeGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "dance") danceGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "stretch") stretchGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "saber") saberGame.update({ pose: state.latestDisplay.poses?.[0] || [], gestures: state.latestDisplay.gestures }, now);
    if (state.mode === "libras") librasGame.update({ gestures: state.latestDisplay.gestures }, now);
    if (["checklist", "simon", "reflex", "marathon"].includes(state.mode)) moduleLoader.active?.update?.({ gestures: state.latestDisplay.gestures, body: state.latestBody, face: state.latestFace }, now);
    if (state.mode === "defender") moduleLoader.active?.update?.(state.latestDisplay, state.latestBody, now);
    if (state.mode === "scanner") moduleLoader.active?.update?.({ hands: state.latestDisplay.hands, poses: state.latestDisplay.poses, gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "explorer") moduleLoader.get("explorer")?.update?.({ gestures: state.latestDisplay.gestures }, now);
    if (state.mode === "assembly") moduleLoader.get("assembly")?.update?.({ gestures: state.latestDisplay.gestures }, now);
    if (state.mode === "depth") moduleLoader.get("depth")?.update?.({ gestures: state.latestDisplay.gestures }, now);
    if (state.latestBody.events?.size) state.latestBody = { ...state.latestBody, events: new Set() };
    const hasRequiredTracking = state.mode === "face"
      ? Boolean(state.latestDisplay.faces?.length)
      : ["pose", "academy", "sequence", "aura", "body", "dance", "stretch", "saber", "checklist", "simon", "reflex", "marathon", "defender", "scanner"].includes(state.mode) || (state.mode === "catch" && state.players === 2)
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
