import { VERSION_CATALOG } from "./versioning.js";

export const APP_VERSION = VERSION_CATALOG.app.version;

export const MEDIAPIPE = {
  moduleUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm",
  wasmPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  poseModel: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  handModel: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  faceModel: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  objectModel: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite"
};

export const QUALITY_PROFILES = {
  economy: {
    label: "Economia de energia",
    camera: { width: 640, height: 360, frameRate: 20 },
    processing: { width: 320, height: 180 },
    intervals: { hand: 72, pose: 138, face: 150 },
    pixelRatio: 0.72,
    particles: 55,
    renderFps: 30
  },
  low: {
    label: "Econômica (legado)",
    camera: { width: 640, height: 360, frameRate: 24 },
    processing: { width: 384, height: 216 },
    intervals: { hand: 58, pose: 120, face: 118 },
    pixelRatio: 0.86,
    particles: 80,
    renderFps: 34
  },
  performance: {
    label: "Desempenho máximo",
    camera: { width: 960, height: 540, frameRate: 30 },
    processing: { width: 448, height: 252 },
    intervals: { hand: 40, pose: 72, face: 92 },
    pixelRatio: 0.88,
    particles: 80,
    renderFps: 60
  },
  balanced: {
    label: "Equilibrado",
    camera: { width: 960, height: 540, frameRate: 30 },
    processing: { width: 512, height: 288 },
    intervals: { hand: 40, pose: 78, face: 82 },
    pixelRatio: 1.08,
    particles: 150,
    renderFps: 50
  },
  quality: {
    label: "Qualidade gráfica",
    camera: { width: 1280, height: 720, frameRate: 30 },
    processing: { width: 512, height: 288 },
    intervals: { hand: 44, pose: 82, face: 88 },
    pixelRatio: 1.42,
    particles: 330,
    renderFps: 45
  },
  precision: {
    label: "Precisão dos sensores",
    camera: { width: 1280, height: 720, frameRate: 30 },
    processing: { width: 704, height: 396 },
    intervals: { hand: 28, pose: 54, face: 58 },
    pixelRatio: 1.0,
    particles: 105,
    renderFps: 45
  },
  high: {
    label: "Precisão (legado)",
    camera: { width: 1280, height: 720, frameRate: 30 },
    processing: { width: 640, height: 360 },
    intervals: { hand: 32, pose: 56, face: 60 },
    pixelRatio: 1.28,
    particles: 250,
    renderFps: 60
  },
  turbo: {
    label: "DS Turbo",
    camera: { width: 1280, height: 720, frameRate: 60 },
    processing: { width: 768, height: 432 },
    intervals: { hand: 26, pose: 38, face: 48 },
    pixelRatio: 1.55,
    particles: 430,
    renderFps: 60
  },
  ultra: {
    label: "DS Ultra",
    camera: { width: 1920, height: 1080, frameRate: 60 },
    processing: { width: 896, height: 504 },
    intervals: { hand: 22, pose: 32, face: 40 },
    pixelRatio: 1.75,
    particles: 620,
    renderFps: 120
  }
};

export const ADAPTIVE_LEVELS = [
  { resolutionScale: 1, intervalScale: 1, label: "NORMAL" },
  { resolutionScale: 0.84, intervalScale: 1.25, label: "OTIMIZADO" },
  { resolutionScale: 0.7, intervalScale: 1.62, label: "ECONÔMICO" }
];

export const TRACKING_PROFILES = {
  sandbox: { hand: 0.92, pose: 2.8, face: 0, tasks: ["hand", "pose"] },
  blocks: { hand: 0.72, pose: 0, face: 0, tasks: ["hand"] },
  explorer: { hand: 0.82, pose: 0, face: 0, tasks: ["hand"] },
  assembly: { hand: 0.58, pose: 0, face: 0, tasks: ["hand"] },
  depth: { hand: 0.54, pose: 0, face: 0, tasks: ["hand"] },
  catch: { hand: 0.88, pose: 1.3, face: 0, tasks: ["hand", "pose"] },
  draw: { hand: 0.78, pose: 0, face: 0, tasks: ["hand"] },
  pose: { hand: 0, pose: 0.78, face: 0, tasks: ["pose"] },
  gestures: { hand: 0.76, pose: 0, face: 0, tasks: ["hand"] },
  academy: { hand: 0.84, pose: 0.96, face: 0, tasks: ["hand", "pose"] },
  sequence: { hand: 0.88, pose: 1.0, face: 0, tasks: ["hand", "pose"] },
  aura: { hand: 1.18, pose: 0.72, face: 0, tasks: ["pose", "hand"] },
  body: { hand: 0, pose: 0.68, face: 0, tasks: ["pose"] },
  dance: { hand: 0, pose: 0.66, face: 0, tasks: ["pose"] },
  stretch: { hand: 0, pose: 0.72, face: 0, tasks: ["pose"] },
  saber: { hand: 1.35, pose: 0.62, face: 0, tasks: ["pose", "hand"] },
  libras: { hand: 0.58, pose: 0, face: 0, tasks: ["hand"] },
  face: { hand: 0, pose: 0, face: 0.72, tasks: ["face"] },
  checklist: { hand: 0.62, pose: 0.72, face: 1.1, tasks: ["hand", "pose", "face"] },
  simon: { hand: 0.78, pose: 0.84, face: 0, tasks: ["hand", "pose"] },
  reflex: { hand: 0.68, pose: 0.78, face: 0, tasks: ["hand", "pose"] },
  marathon: { hand: 0.78, pose: 0.82, face: 0, tasks: ["hand", "pose"] },
  defender: { hand: 0.62, pose: 0.86, face: 0, tasks: ["hand", "pose"] },
  scanner: { hand: 1.18, pose: 0.82, face: 0, tasks: ["pose", "hand"] }
};

export const POSE_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],[9,10],
  [11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[17,19],
  [12,14],[14,16],[16,18],[16,20],[16,22],[18,20],
  [11,23],[12,24],[23,24],[23,25],[25,27],[27,29],[29,31],[27,31],
  [24,26],[26,28],[28,30],[30,32],[28,32]
];

export const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],[0,17]
];

export const FACE_CONTOURS = {
  oval: [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10],
  leftEye: [33,160,158,133,153,144,33],
  rightEye: [362,385,387,263,373,380,362],
  lips: [61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,95,61]
};

export const MODES = {
  blocks: {
    label: "Holo Blocks",
    short: "Blocos",
    icon: "▦",
    objective: "Construa cenários com terra, água, lava, gelo, cristal e outros blocos; combine materiais para descobrir reações."
  },
  explorer: {
    label: "Holo Explorer",
    short: "Explorar",
    icon: "⬡",
    objective: "Explore, selecione componentes, siga atividades guiadas, complete desafios e responda ao Holo Quiz."
  },
  assembly: {
    label: "Holo Assembly",
    short: "Montagem",
    icon: "⌘",
    objective: "Pegue as peças com pinça ou clique e encaixe-as nos pontos holográficos corretos."
  },
  depth: {
    label: "Depth Trainer",
    short: "Profundidade",
    icon: "◉",
    objective: "Aproxime e afaste a mão para acertar as zonas LONGE, MÉDIO e PERTO."
  },
  sandbox: {
    label: "Holo Sandbox",
    short: "3D",
    icon: "◈",
    objective: "Faça pinça sobre o objeto para segurá-lo; use duas mãos para ampliar ou reduzir."
  },
  catch: {
    label: "Shape Catch",
    short: "Formas",
    icon: "✦",
    objective: "Feche a mão ou faça pinça sobre a forma indicada para coletá-la."
  },
  draw: {
    label: "Holo Draw",
    short: "Desenho",
    icon: "⌁",
    objective: "Faça pinça para desenhar; feche a mão para apagar."
  },
  pose: {
    label: "Pose Mirror",
    short: "Poses",
    icon: "⌯",
    objective: "Imite a pose holográfica e mantenha a posição."
  },
  gestures: {
    label: "Gesture Lab",
    short: "Gestos",
    icon: "☝",
    objective: "Execute o gesto solicitado e mantenha-o até a confirmação."
  },
  academy: {
    label: "Academia de Movimentos",
    short: "Treino",
    icon: "◎",
    objective: "Complete a calibração guiada de mãos, corpo e movimentos."
  },
  sequence: {
    label: "Sequência Corporal",
    short: "Sequência",
    icon: "⌘",
    objective: "Memorize e reproduza a sequência de gestos e movimentos na ordem correta."
  },
  aura: {
    label: "Aura Cósmica",
    short: "Aura",
    icon: "✺",
    objective: "Movimente o corpo e as mãos para carregar sua aura holográfica."
  },
  body: {
    label: "Body Challenge",
    short: "Corpo",
    icon: "◆",
    objective: "Execute rapidamente os comandos corporais antes que o tempo acabe."
  },
  dance: {
    label: "Dance Mirror",
    short: "Dança",
    icon: "♫",
    objective: "Acompanhe a sequência rítmica e mantenha os movimentos no tempo."
  },
  stretch: {
    label: "Alongamento Interativo",
    short: "Alongar",
    icon: "↟",
    objective: "Repita as posições com calma e mantenha cada alongamento pelo tempo indicado."
  },
  saber: {
    label: "Sabre de Energia",
    short: "Sabre",
    icon: "╱",
    objective: "Movimente os braços para cortar os alvos energéticos que descem pela tela."
  },
  libras: {
    label: "Libras Lab Beta",
    short: "Libras",
    icon: "☞",
    objective: "Treine o alfabeto manual, sequências e palavras com feedback detalhado da mão."
  },
  checklist: {
    label: "Motion Checklist",
    short: "Checklist",
    icon: "✓",
    objective: "Siga o tutorial, complete cada requisito e valide os movimentos etapa por etapa."
  },
  simon: {
    label: "Simon Motion",
    short: "Simon",
    icon: "◫",
    objective: "Memorize a sequência crescente e repita cada movimento na ordem correta."
  },
  reflex: {
    label: "Reflex Challenge",
    short: "Reflexo",
    icon: "⚡",
    objective: "Execute o comando mostrado o mais rápido possível para aumentar o combo."
  },
  marathon: {
    label: "Gesture Marathon",
    short: "Maratona",
    icon: "∞",
    objective: "Complete movimentos consecutivos, preserve sua energia e alcance o maior combo."
  },
  defender: {
    label: "Holo Defender",
    short: "Defender",
    icon: "◉",
    objective: "Abra as palmas para criar escudos e feche as mãos para disparar energia."
  },
  scanner: {
    label: "Vision Scanner",
    short: "Scanner",
    icon: "⌗",
    objective: "Reconheça objetos, pessoas, cores, formas e ações no ambiente usando a câmera."
  },
  face: {
    label: "Face Reactor",
    short: "Rosto",
    icon: "◉",
    objective: "Use olhos, boca, sorriso e movimentos da cabeça para controlar o reator."
  }
};

export const GESTURE_LABELS = {
  open: "MÃO ABERTA",
  fist: "MÃO FECHADA",
  pinch: "PINÇA",
  point: "APONTANDO",
  peace: "VITÓRIA",
  thumbs_up: "POSITIVO",
  thumbs_down: "NEGATIVO",
  ok: "OK",
  unknown: "RASTREANDO"
};

export const ORIENTATION_LABELS = {
  vertical_up: "EM PÉ",
  vertical_down: "INVERTIDA",
  horizontal_left: "DEITADA À ESQUERDA",
  horizontal_right: "DEITADA À DIREITA",
  diagonal: "DIAGONAL"
};

export const CURVATURE_LABELS = {
  flat: "ABERTA/PLANA",
  curved: "DOBRADA",
  folded: "FECHADA"
};

export const PLAYER_COLORS = ["#00e5ff", "#ff4fd8"];
