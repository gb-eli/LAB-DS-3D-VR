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
  explorerPanel: $("#explorerPanel"),
  explorerIcon: $("#explorerIcon"),
  explorerCategory: $("#explorerCategory"),
  explorerTitle: $("#explorerTitle"),
  explorerSummary: $("#explorerSummary"),
  explorerState: $("#explorerState"),
  explorerCounter: $("#explorerCounter"),
  explorerFacts: $("#explorerFacts"),
  gestureChallenge: $("#gestureChallenge"),
  gestureChallengeName: $("#gestureChallengeName"),
  gestureChallengeHint: $("#gestureChallengeHint"),
  gestureProgress: $("#gestureProgress"),
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
  mode: MODES[store.get("lastMode")] ? store.get("lastMode") : "academy",
  quality: store.get("quality"),
  mirror: Boolean(store.get("mirror")),
  skeleton: Boolean(store.get("skeleton")),
  gestureUi: Boolean(store.get("gestureUi")),
  dwellUi: Boolean(store.get("dwellUi")),
  sensitivity: Number(store.get("sensitivity") || 1),
  players: Number(store.get("players") || 1) === 2 ? 2 : 1,
  captureMode: store.get("captureMode") === "touch" ? "touch" : "close",
  bodyVisual: ["skeleton", "avatar", "hybrid"].includes(store.get("bodyVisual")) ? store.get("bodyVisual") : "hybrid",
  faceBaseline: store.get("faceBaseline") || null,
  librasMode: ["learn", "challenge", "sequence", "word"].includes(store.get("librasMode")) ? store.get("librasMode") : "learn",
  librasHand: ["auto", "left", "right"].includes(store.get("librasHand")) ? store.get("librasHand") : "auto",
  librasDifficulty: ["guided", "standard", "precision"].includes(store.get("librasDifficulty")) ? store.get("librasDifficulty") : "standard",
  librasWord: String(store.get("librasWord") || "LIBRAS"),
  librasMastery: store.get("librasMastery") || {},
  explorerId: getExplorerExhibit(store.get("explorerId")).id,
  explorerExploded: false,
  explorerAnimating: true,
  explorerCategory: "all",
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

holoScene.setExplorerExhibit(state.explorerId);

function renderExplorerFacts(exhibit) {
  if (!elements.explorerFacts) return;
  const category = getExplorerCategory(exhibit.category);
  elements.explorerFacts.innerHTML = `
    <header><b>${exhibit.title}</b><span>${category.icon} ${category.label}</span></header>
    <div class="explorer-fact-grid">${exhibit.facts.map((fact) => `<span>${fact}</span>`).join("")}</div>
    <div class="explorer-hotspots">${exhibit.hotspots.map((hotspot) => `<i>${hotspot}</i>`).join("")}</div>`;
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
  onBeat: ({ move, index, total, progress, score, combo, bpm }) => {
    if (state.mode !== "dance") return;
    elements.danceBpm.textContent = `${bpm} BPM`;
    elements.danceProgress.textContent = `${Math.round(progress * 100)}%`;
    elements.danceStep.textContent = `${index + 1}/${total}`;
    elements.hudObjective.textContent = move.title;
    elements.score.textContent = score.toLocaleString("pt-BR");
    elements.combo.textContent = `${combo}×`;
    elements.accuracy.textContent = `${Math.round(progress * 100)}%`;
    renderDanceChips(danceGame.pattern, index);
  },
  onHit: ({ move, score }) => { audio.select(); store.set("bestDanceScore", Math.max(score, store.get("bestDanceScore") || 0)); showToast(`${move.title} no ritmo`); },
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
  return ["explorer", "sandbox", "catch", "draw", "gestures", "academy", "sequence", "aura", "saber", "libras"].includes(state.mode) && !(state.mode === "catch" && state.players === 2);
}

function modeNeedsPose() {
  return ["sandbox", "catch", "pose", "academy", "sequence", "aura", "body", "dance", "stretch", "saber"].includes(state.mode);
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
  bodyAnalyzer.reset();
  state.latestBody = { detected: false, actions: new Set(), events: new Set(), movement: 0, metrics: {} };
  visionRenderer.setPresentation(state.bodyVisual);
  holoScene.setMode(mode);
  if (mode === "explorer") selectExplorerExhibit(state.explorerId, false);
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
  if (mode === "explorer") { elements.time.textContent = "HOLOGRAMA"; updateExplorerUi(); }
  if (mode === "academy") elements.combo.textContent = "0/12";
  if (mode === "sequence") elements.time.textContent = "MEMÓRIA";
  if (mode === "aura") elements.time.textContent = "ENERGIA";
  if (mode === "body") elements.time.textContent = "45s";
  if (mode === "dance") elements.time.textContent = "RITMO";
  if (mode === "stretch") elements.time.textContent = "CALMA";
  if (mode === "saber") elements.time.textContent = "MISSÃO";
  if (mode === "libras") elements.time.textContent = "BETA";
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
  if (state.mode === "explorer") holoScene.setExplorerHandInteraction({ x, y, gesture: gestures[0], roll: gestures[0]?.orientation?.roll });
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
  shapeGame.setPlayers(state.players);
  shapeGame.setCaptureMode(state.captureMode);
  const color = store.get("cubeColor") || "#00e5ff";
  holoScene.setColor(color);
  holoScene.setObjectType(store.get("objectType") || "cube");
  holoScene.setExplorerExhibit(state.explorerId);
  holoScene.setExplorerAnimation(state.explorerAnimating);
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
    if (state.mode === "academy") academyGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "sequence") sequenceGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "aura") auraGame.update(state.latestDisplay, state.latestBody, now);
    if (state.mode === "body") bodyChallengeGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "dance") danceGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "stretch") stretchGame.update({ gestures: state.latestDisplay.gestures, body: state.latestBody }, now);
    if (state.mode === "saber") saberGame.update({ pose: state.latestDisplay.poses?.[0] || [], gestures: state.latestDisplay.gestures }, now);
    if (state.mode === "libras") librasGame.update({ gestures: state.latestDisplay.gestures }, now);
    if (state.latestBody.events?.size) state.latestBody = { ...state.latestBody, events: new Set() };
    const hasRequiredTracking = state.mode === "face"
      ? Boolean(state.latestDisplay.faces?.length)
      : ["pose", "academy", "sequence", "aura", "body", "dance", "stretch", "saber"].includes(state.mode) || (state.mode === "catch" && state.players === 2)
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
