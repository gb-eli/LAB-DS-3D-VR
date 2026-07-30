import { getVersionEntry } from "./versioning.js";

export const APP_STORE_FILTERS = Object.freeze([
  { id: "all", label: "Todos" },
  { id: "web", label: "Web" },
  { id: "android", label: "Android" },
  { id: "offline", label: "Offline" },
  { id: "hologram", label: "Hologramas" },
  { id: "sensors", label: "Sensores" },
  { id: "games", label: "Jogos" }
]);

export const APP_CATALOG = Object.freeze([
  {
    id: "holo-explorer-web",
    name: "Holo Explorer",
    shortName: "Biblioteca 3D",
    icon: "⬡",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "hologram",
    tags: ["hologram", "education", "web", "offline"],
    versionKey: "explorer",
    description: "Explore Sistema Solar, Terra e Lua, hardware, drone, robô, vulcão, caverna, mapa e monumentos em hologramas procedurais.",
    summary: "Nove exposições educacionais manipuladas pelas mãos.",
    requirements: ["Navegador moderno", "WebGL", "Câmera opcional"],
    action: { type: "mode", value: "explorer", label: "Abrir Holo Explorer" }
  },
  {
    id: "holo-sandbox-web",
    name: "Holo Sandbox",
    shortName: "Sandbox 3D",
    icon: "◈",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "hologram",
    tags: ["hologram", "sensors", "web"],
    versionKey: "sandbox",
    description: "Manipule cubos, esferas, pirâmides e hologramas com pinça, punho, rotação e duas mãos.",
    summary: "Objetos holográficos controlados pelas mãos.",
    requirements: ["Navegador moderno", "WebGL", "Câmera opcional"],
    action: { type: "mode", value: "sandbox", label: "Abrir laboratório" }
  },
  {
    id: "gesture-lab-web",
    name: "Gesture Lab",
    shortName: "Sensores de mão",
    icon: "☝",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "sensors",
    tags: ["sensors", "hologram", "web"],
    versionKey: "gestures",
    description: "Treine mão aberta, mão fechada, pinça, apontar, orientação e movimentos rápidos.",
    summary: "Treinamento dos gestos reconhecidos.",
    requirements: ["Câmera", "Boa iluminação", "Espaço para as mãos"],
    action: { type: "mode", value: "gestures", label: "Abrir sensores" }
  },
  {
    id: "shape-catch-web",
    name: "Shape Catch",
    shortName: "Jogo corporal",
    icon: "✦",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "games",
    tags: ["games", "sensors", "web"],
    versionKey: "catch",
    description: "Capture círculos, quadrados e triângulos com as mãos ou com o esqueleto corporal.",
    summary: "Minijogo corporal para uma ou duas pessoas.",
    requirements: ["Câmera", "Corpo enquadrado", "Espaço para movimentos"],
    action: { type: "mode", value: "catch", label: "Jogar na Web" }
  },
  {
    id: "holo-draw-web",
    name: "Holo Draw",
    shortName: "Desenho no ar",
    icon: "⌁",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "hologram",
    tags: ["hologram", "sensors", "web"],
    versionKey: "draw",
    description: "Desenhe com a ponta do dedo, apague com o punho e exporte o resultado em PNG.",
    summary: "Desenho holográfico pela ponta do dedo.",
    requirements: ["Câmera", "Uma mão visível", "Navegador com Canvas"],
    action: { type: "mode", value: "draw", label: "Abrir desenho" }
  },
  {
    id: "pose-mirror-web",
    name: "Pose Mirror",
    shortName: "Esqueleto corporal",
    icon: "⌯",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "sensors",
    tags: ["sensors", "games", "web"],
    versionKey: "pose",
    description: "Compare poses usando os ângulos do corpo e um esqueleto de 33 pontos.",
    summary: "Desafios de postura e coordenação corporal.",
    requirements: ["Câmera", "Corpo inteiro visível", "Distância recomendada de 2 m"],
    action: { type: "mode", value: "pose", label: "Abrir poses" }
  },
  {
    id: "academy-web",
    name: "Academia de Movimentos",
    shortName: "Treinamento corporal",
    icon: "◎",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "sensors",
    tags: ["sensors", "games", "web"],
    versionKey: "academy",
    description: "Aprenda como a plataforma reconhece mãos, corpo, pulo, palmas e movimentos em uma trilha guiada.",
    summary: "Calibração e treinamento progressivo dos sensores.",
    requirements: ["Câmera", "Corpo enquadrado", "Boa iluminação"],
    action: { type: "mode", value: "academy", label: "Iniciar treinamento" }
  },
  {
    id: "sequence-motion-web",
    name: "Sequência Corporal",
    shortName: "Memória de gestos",
    icon: "⌘",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "games",
    tags: ["games", "sensors", "web"],
    versionKey: "sequence",
    description: "Memorize e reproduza sequências crescentes de gestos das mãos e movimentos do corpo.",
    summary: "Jogo de memória corporal e coordenação.",
    requirements: ["Câmera", "Mãos e corpo visíveis", "Espaço para movimentos"],
    action: { type: "mode", value: "sequence", label: "Jogar sequência" }
  },
  {
    id: "aura-cosmica-web",
    name: "Aura Cósmica",
    shortName: "Energia corporal",
    icon: "✺",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "hologram",
    tags: ["games", "sensors", "hologram", "web"],
    versionKey: "aura",
    description: "Movimente braços, mãos e corpo para gerar partículas, ondas e níveis de energia ao redor do avatar.",
    summary: "Experiência galáctica controlada pelo movimento.",
    requirements: ["Câmera", "Corpo inteiro recomendado", "WebGL/Canvas"],
    action: { type: "mode", value: "aura", label: "Carregar aura" }
  },
  {
    id: "body-challenge-web",
    name: "Body Challenge",
    shortName: "Desafio corporal",
    icon: "◆",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "games",
    tags: ["games", "sensors", "web"],
    versionKey: "body",
    description: "Execute comandos de corpo inteiro contra o tempo usando braços, pernas, pulo, palmas e agachamento.",
    summary: "Jogo rápido de comandos corporais.",
    requirements: ["Câmera", "Corpo inteiro visível", "Espaço seguro para movimentos"],
    action: { type: "mode", value: "body", label: "Iniciar desafio" }
  },
  {
    id: "dance-mirror-web",
    name: "Dance Mirror",
    shortName: "Dança corporal",
    icon: "♫",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "games",
    tags: ["games", "sensors", "web"],
    versionKey: "dance",
    description: "Acompanhe sequências rítmicas de movimentos sem depender de músicas protegidas.",
    summary: "Coreografias curtas controladas pelo corpo.",
    requirements: ["Câmera", "Corpo inteiro visível", "Espaço para dançar"],
    action: { type: "mode", value: "dance", label: "Dançar" }
  },
  {
    id: "stretch-web",
    name: "Alongamento Interativo",
    shortName: "Alongamento",
    icon: "↟",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "games",
    tags: ["games", "sensors", "web"],
    versionKey: "stretch",
    description: "Rotina educativa e recreativa com posições de alongamento e equilíbrio.",
    summary: "Sequência corporal de baixa intensidade.",
    requirements: ["Câmera", "Espaço seguro", "Movimentos sem forçar"],
    action: { type: "mode", value: "stretch", label: "Iniciar rotina" }
  },
  {
    id: "energy-saber-web",
    name: "Sabre de Energia",
    shortName: "Sabre corporal",
    icon: "╱",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "hologram",
    tags: ["games", "sensors", "hologram", "web"],
    versionKey: "saber",
    description: "Use os antebraços como sabres holográficos e corte alvos energéticos.",
    summary: "Minijogo holográfico controlado pelos braços.",
    requirements: ["Câmera", "Braços visíveis", "Espaço para movimentar"],
    action: { type: "mode", value: "saber", label: "Ativar sabres" }
  },
  {
    id: "libras-lab-web",
    name: "Libras Lab Beta",
    shortName: "Alfabeto e soletração",
    icon: "☞",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "sensors",
    tags: ["sensors", "web", "education"],
    versionKey: "libras",
    description: "Treinador experimental A–Z com sequências, palavras e diagnóstico detalhado dos dedos.",
    summary: "Alfabeto manual, soletração e validação aproximada da mão.",
    requirements: ["Câmera", "Uma mão visível", "Boa iluminação", "Validação pedagógica recomendada"],
    action: { type: "mode", value: "libras", label: "Abrir Libras Beta" }
  },
  {
    id: "face-reactor-web",
    name: "Face Reactor",
    shortName: "Sensor facial",
    icon: "◉",
    platform: "web",
    delivery: "online",
    offlineCapable: true,
    availability: "available",
    category: "sensors",
    tags: ["sensors", "hologram", "web"],
    versionKey: "face",
    description: "Controle um reator holográfico com sorriso, boca, piscadas e inclinação da cabeça.",
    summary: "Expressões faciais controlam o holograma.",
    requirements: ["Câmera frontal", "Rosto iluminado", "Modo de precisão recomendado"],
    action: { type: "mode", value: "face", label: "Abrir sensor facial" }
  },
  {
    id: "labvirtualds-vr-android",
    name: "Lab Virtual DS VR 360",
    shortName: "VR 360 Offline",
    icon: "◉",
    platform: "android",
    delivery: "offline",
    offlineCapable: true,
    availability: "available",
    category: "vr",
    tags: ["android", "offline", "games", "vr"],
    version: "0.3.3",
    packageName: "br.com.labvirtualds.vr",
    file: "./downloads/LabVirtualDS-VR-v0.3.3.apk",
    fileName: "LabVirtualDS-VR-v0.3.3.apk",
    fileSize: 53807,
    sha256: "61024edb523a15130184dba23893ce4c1c111999e9c24e30eacdb4a1869af614",
    description: "Aplicativo Android para experiência VR 360, preparado para uso offline em celular e óculos VR simples.",
    summary: "Experiência VR 360 instalável e offline.",
    requirements: ["Android 8.0 ou superior", "Giroscópio recomendado", "Autorizar instalação do APK"],
    action: { type: "download", label: "Baixar APK" }
  },
  {
    id: "holomotion-android",
    name: "HoloMotion Android Offline",
    shortName: "Sensores offline",
    icon: "⌁",
    platform: "android",
    delivery: "offline",
    offlineCapable: true,
    availability: "planned",
    category: "sensors",
    tags: ["android", "offline", "sensors", "hologram"],
    version: "planejada",
    description: "Versão Android dedicada para sensores de mão, corpo e rosto sem depender do navegador.",
    summary: "Versão nativa dos sensores holográficos.",
    requirements: ["Android", "Câmera", "Acelerador gráfico"],
    action: { type: "planned", label: "Em planejamento" }
  },
  {
    id: "hardware-vr-android",
    name: "Hardware Lab VR",
    shortName: "Montagem em VR",
    icon: "⬡",
    platform: "android",
    delivery: "offline",
    offlineCapable: true,
    availability: "planned",
    category: "vr",
    tags: ["android", "offline", "vr", "hologram"],
    version: "planejada",
    description: "Laboratório futuro para explorar, desmontar e montar peças de computador em realidade virtual.",
    summary: "Peças de computador e montagem em VR.",
    requirements: ["Android", "Giroscópio", "Óculos VR opcional"],
    action: { type: "planned", label: "Em planejamento" }
  }
]);

export function resolveAppVersion(app) {
  if (app.versionKey) return getVersionEntry(app.versionKey)?.version || "0.0.0";
  return app.version || "0.0.0";
}

export function formatFileSize(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function filterApps({ filter = "all", query = "" } = {}) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase("pt-BR");
  return APP_CATALOG.filter((app) => {
    const filterMatch = filter === "all"
      || app.platform === filter
      || (filter === "offline" && app.offlineCapable)
      || app.delivery === filter
      || app.category === filter
      || app.tags.includes(filter);
    if (!filterMatch) return false;
    if (!normalizedQuery) return true;
    const haystack = [app.name, app.shortName, app.description, app.summary, ...app.tags].join(" ").toLocaleLowerCase("pt-BR");
    return haystack.includes(normalizedQuery);
  });
}

export function getAppById(id) {
  return APP_CATALOG.find((app) => app.id === id) || null;
}

export function countAvailableApps(platform) {
  return APP_CATALOG.filter((app) => app.availability === "available" && (!platform || app.platform === platform)).length;
}
