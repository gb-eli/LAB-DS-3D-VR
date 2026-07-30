import { VERSION_CATALOG } from "./versioning.js";

export const APP_VERSION = VERSION_CATALOG.app.version;

export const MEDIAPIPE = {
  moduleUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm",
  wasmPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
  poseModel: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  handModel: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  faceModel: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
};

export const QUALITY_PROFILES = {
  low: {
    label: "Econômica",
    camera: { width: 640, height: 360, frameRate: 24 },
    processing: { width: 384, height: 216 },
    intervals: { hand: 58, pose: 120, face: 118 },
    pixelRatio: 0.9,
    particles: 90,
    renderFps: 30
  },
  balanced: {
    label: "Equilibrada",
    camera: { width: 960, height: 540, frameRate: 30 },
    processing: { width: 512, height: 288 },
    intervals: { hand: 40, pose: 78, face: 82 },
    pixelRatio: 1.1,
    particles: 170,
    renderFps: 45
  },
  high: {
    label: "Precisão",
    camera: { width: 1280, height: 720, frameRate: 30 },
    processing: { width: 640, height: 360 },
    intervals: { hand: 32, pose: 56, face: 60 },
    pixelRatio: 1.35,
    particles: 280,
    renderFps: 60
  }
};

export const ADAPTIVE_LEVELS = [
  { resolutionScale: 1, intervalScale: 1, label: "NORMAL" },
  { resolutionScale: 0.84, intervalScale: 1.25, label: "OTIMIZADO" },
  { resolutionScale: 0.7, intervalScale: 1.62, label: "ECONÔMICO" }
];

export const TRACKING_PROFILES = {
  sandbox: { hand: 0.92, pose: 2.8, face: 0, tasks: ["hand", "pose"] },
  catch: { hand: 0.88, pose: 1.3, face: 0, tasks: ["hand", "pose"] },
  draw: { hand: 0.78, pose: 0, face: 0, tasks: ["hand"] },
  pose: { hand: 0, pose: 0.78, face: 0, tasks: ["pose"] },
  gestures: { hand: 0.76, pose: 0, face: 0, tasks: ["hand"] },
  face: { hand: 0, pose: 0, face: 0.8, tasks: ["face"] }
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
  face: {
    label: "Face Reactor",
    short: "Rosto",
    icon: "◉",
    objective: "Use olhos, boca, sorriso e inclinação da cabeça para controlar o reator."
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
