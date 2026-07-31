export const EXPLORER_CATEGORIES = Object.freeze([
  { id: "space", label: "Espaço", icon: "◌" },
  { id: "technology", label: "Tecnologia", icon: "⌘" },
  { id: "earth", label: "Terra", icon: "◇" },
  { id: "heritage", label: "Lugares", icon: "△" }
]);

export const EXPLORER_EXHIBITS = Object.freeze([
  {
    id: "solar-system",
    category: "space",
    title: "Sistema Solar",
    shortTitle: "Sistema Solar",
    icon: "☀",
    color: "#fbbf24",
    summary: "Modelo orbital compacto com Sol, oito planetas e trajetórias animadas.",
    objective: "Gire o sistema, aproxime com duas mãos e observe as diferentes órbitas.",
    facts: ["Oito planetas", "Órbitas proporcionais simplificadas", "Animação orbital independente"],
    hotspots: ["Sol", "Planetas rochosos", "Gigantes gasosos", "Órbitas"]
  },
  {
    id: "earth-moon",
    category: "space",
    title: "Terra e Lua",
    shortTitle: "Terra e Lua",
    icon: "◉",
    color: "#22d3ee",
    summary: "Globo holográfico com atmosfera, eixo inclinado e órbita lunar.",
    objective: "Use pinça para mover, duas mãos para ampliar e rotação do punho para inspecionar.",
    facts: ["Atmosfera em camadas", "Rotação terrestre", "Órbita lunar animada"],
    hotspots: ["Atmosfera", "Equador", "Eixo", "Lua"]
  },
  {
    id: "motherboard",
    category: "technology",
    title: "Placa-mãe",
    shortTitle: "Hardware",
    icon: "▦",
    color: "#34d399",
    summary: "Placa-mãe procedural com processador, memória, slots e sistema de refrigeração.",
    objective: "Ative a vista explodida para separar os componentes e examine cada conjunto.",
    facts: ["Processador e soquete", "Módulos de memória", "Slots de expansão", "Conectores e refrigeração"],
    hotspots: ["CPU", "RAM", "PCIe", "Chipset", "Cooler"]
  },
  {
    id: "drone",
    category: "technology",
    title: "Drone Educacional",
    shortTitle: "Drone",
    icon: "✣",
    color: "#60a5fa",
    summary: "Quadricóptero holográfico com braços, motores, hélices e câmera frontal.",
    objective: "Gire o drone, amplie os motores e ative a vista explodida para compreender sua estrutura.",
    facts: ["Quatro motores", "Hélices contrarrotativas", "Controlador central", "Câmera estabilizada"],
    hotspots: ["Motor", "Hélice", "Controlador", "Bateria", "Câmera"]
  },
  {
    id: "robot",
    category: "technology",
    title: "Robô Articulado",
    shortTitle: "Robótica",
    icon: "⚙",
    color: "#a78bfa",
    summary: "Robô humanoide simplificado com articulações, sensores e núcleo de energia.",
    objective: "Explore as articulações e use a vista explodida para separar os módulos do robô.",
    facts: ["Articulações modulares", "Sensores de cabeça", "Atuadores nos membros", "Núcleo central"],
    hotspots: ["Sensores", "Ombro", "Cotovelo", "Quadril", "Núcleo"]
  },
  {
    id: "volcano",
    category: "earth",
    title: "Vulcão em Corte",
    shortTitle: "Vulcão",
    icon: "▲",
    color: "#fb7185",
    summary: "Corte didático de um vulcão com câmara magmática, conduto e emissão de partículas.",
    objective: "Gire o corte e observe a trajetória simulada do magma até a cratera.",
    facts: ["Câmara magmática", "Conduto principal", "Cratera", "Camadas geológicas"],
    hotspots: ["Magma", "Conduto", "Cratera", "Cinzas"]
  },
  {
    id: "cave",
    category: "earth",
    title: "Caverna Cristalina",
    shortTitle: "Caverna",
    icon: "⌂",
    color: "#c084fc",
    summary: "Ambiente subterrâneo compacto com rochas, cristais e percurso iluminado.",
    objective: "Aproxime a maquete, gire o túnel e identifique as formações internas.",
    facts: ["Galerias subterrâneas", "Estalactites", "Estalagmites", "Cristais minerais"],
    hotspots: ["Entrada", "Galeria", "Cristais", "Formações"]
  },
  {
    id: "world-map",
    category: "earth",
    title: "Mapa Holográfico",
    shortTitle: "Mapa",
    icon: "⌖",
    color: "#2dd4bf",
    summary: "Mapa-múndi tecnológico com grade, marcadores e conexões entre regiões.",
    objective: "Gire o painel, amplie regiões e alterne os marcadores educacionais.",
    facts: ["Grade geográfica", "Marcadores regionais", "Rotas simuladas", "Leitura espacial"],
    hotspots: ["Américas", "Europa", "África", "Ásia", "Oceania"]
  },
  {
    id: "landmarks",
    category: "heritage",
    title: "Monumentos do Mundo",
    shortTitle: "Monumentos",
    icon: "♜",
    color: "#f59e0b",
    summary: "Coleção procedural inspirada em torre metálica, pirâmide e arco histórico.",
    objective: "Gire a coleção e use a vista explodida para comparar formas e estruturas.",
    facts: ["Estruturas trianguladas", "Formas monumentais", "Comparação de escala", "Patrimônio e engenharia"],
    hotspots: ["Torre", "Pirâmide", "Arco", "Estrutura"]
  }
]);

export function getExplorerExhibit(id) {
  return EXPLORER_EXHIBITS.find((item) => item.id === id) || EXPLORER_EXHIBITS[0];
}

export function getExplorerCategory(id) {
  return EXPLORER_CATEGORIES.find((item) => item.id === id) || EXPLORER_CATEGORIES[0];
}

export function getExplorerIndex(id) {
  const index = EXPLORER_EXHIBITS.findIndex((item) => item.id === id);
  return index < 0 ? 0 : index;
}

export function getAdjacentExplorerExhibit(id, direction = 1) {
  const index = getExplorerIndex(id);
  return EXPLORER_EXHIBITS[(index + direction + EXPLORER_EXHIBITS.length) % EXPLORER_EXHIBITS.length];
}
