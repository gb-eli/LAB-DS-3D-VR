export const VERSION_CATALOG = Object.freeze({
  app: { id: "app", name: "HoloMotion Lab DS", version: "3.2.0", type: "Aplicação", status: "estável", summary: "Plataforma holográfica com loja de experiências Web e aplicativos Android VR offline.", changes: ["Nova aba Aplicativos VR com filtros por plataforma e finalidade.", "APK Android VR 360 disponível diretamente pelo GitHub Pages.", "Separação clara entre ferramentas Web, experiências offline e aplicativos planejados."] },
  interface: { id: "interface", name: "Interface holográfica", version: "3.2.0", type: "Sistema", status: "estável", summary: "HUD responsivo, painéis recolhíveis e informações de versão com baixa interferência visual.", changes: ["Painel de versões acessível antes e durante a experiência.", "Badges ocultáveis em telas pequenas."] },
  vision: { id: "vision", name: "Vision Core", version: "3.0.2", type: "Sensor", status: "estável", summary: "Scheduler adaptativo para mãos, corpo e rosto com processamento local.", changes: ["Telemetria unificada.", "Troca segura entre perfis de rastreamento."] },
  hands: { id: "hands", name: "Hand Tracking", version: "2.4.1", type: "Sensor", status: "estável", summary: "Rastreamento de 21 pontos, orientação, pinça, mão aberta, fechada e movimentos dinâmicos.", changes: ["Estabilidade temporal refinada.", "Sensibilidade proporcional à palma."] },
  poseSensor: { id: "poseSensor", name: "Pose Tracking", version: "2.2.0", type: "Sensor", status: "estável", summary: "Esqueleto corporal com 33 pontos e suporte a uma ou duas pessoas.", changes: ["Alternância assíncrona entre participantes.", "Melhoria do diagnóstico corporal."] },
  faceSensor: { id: "faceSensor", name: "Face Tracking", version: "1.2.0", type: "Sensor", status: "experimental", summary: "Reconhecimento facial sob demanda com landmarks, expressões e inclinação da cabeça.", changes: ["Carregamento somente no modo facial.", "Indicadores de boca, sorriso e olhos."] },
  sandbox: { id: "sandbox", name: "Holo Sandbox", version: "2.1.0", type: "Laboratório", status: "estável", summary: "Manipulação de objetos 3D por pinça, punho, rotação e duas mãos.", changes: ["Objetos adicionais.", "Controles bimanual e rotação por punho."] },
  catch: { id: "catch", name: "Shape Catch", version: "2.2.1", type: "Laboratório", status: "estável", summary: "Jogo de coleta corporal com formas, combos e modo para duas pessoas.", changes: ["Coleta por punho ou pinça.", "Pontuação separada e colisões corrigidas."] },
  draw: { id: "draw", name: "Holo Draw", version: "1.4.0", type: "Laboratório", status: "estável", summary: "Desenho no ar com pinça, borracha por punho e exportação em PNG.", changes: ["Suavização do traço.", "Comandos laterais e exportação."] },
  pose: { id: "pose", name: "Pose Mirror", version: "1.3.0", type: "Laboratório", status: "estável", summary: "Comparação de poses por ângulos corporais e sustentação temporal.", changes: ["Sequência de poses.", "Precisão por articulação."] },
  gestures: { id: "gestures", name: "Gesture Lab", version: "1.2.0", type: "Laboratório", status: "estável", summary: "Treinamento guiado de gestos estáticos, orientação e movimentos rápidos.", changes: ["Treino de orientação da mão.", "Progresso por estabilidade."] },
  face: { id: "face", name: "Face Reactor", version: "1.1.0", type: "Laboratório", status: "experimental", summary: "Reator holográfico controlado por sorriso, boca, piscadas e inclinação.", changes: ["Rastreamento facial isolado para preservar FPS.", "Comandos de expressão."] },
  appStore: { id: "appStore", name: "Aplicativos VR", version: "1.0.0", type: "Sistema", status: "estável", summary: "Catálogo leve de ferramentas Web e aplicativos Android offline com download local.", changes: ["Filtros por plataforma, offline, hologramas, sensores e jogos.", "Detalhes técnicos, versão, requisitos e integridade dos APKs.", "Aplicativos planejados identificados sem disponibilizar downloads inexistentes."] },
  pwa: { id: "pwa", name: "PWA e cache", version: "3.2.0", type: "Sistema", status: "estável", summary: "Instalação, cache versionado e atualização segura no GitHub Pages.", changes: ["Cache separado para a versão 3.2.0.", "Catálogo de aplicativos incluído no app shell sem pré-carregar APKs."] }
});

export const MODE_VERSION_KEYS = Object.freeze({ sandbox: "sandbox", catch: "catch", draw: "draw", pose: "pose", gestures: "gestures", face: "face" });
export const SENSOR_VERSION_KEYS = Object.freeze({ vision: "vision", hands: "hands", pose: "poseSensor", face: "faceSensor" });
export const TECHNOLOGY_CATALOG = Object.freeze([
  { name: "Three.js", version: "0.185.1", role: "Renderização WebGL e objetos 3D", license: "MIT" },
  { name: "MediaPipe Tasks Vision", version: "0.10.35", role: "Rastreamento de mãos, corpo e rosto", license: "Apache-2.0" },
  { name: "Web Workers", version: "API do navegador", role: "Processamento paralelo da visão", license: "Padrão Web" },
  { name: "IndexedDB / LocalStorage", version: "API do navegador", role: "Preferências e recordes locais", license: "Padrão Web" },
  { name: "Service Worker / Cache Storage", version: "API do navegador", role: "PWA, cache e atualização", license: "Padrão Web" }
]);
export const RELEASE_HISTORY = Object.freeze([
  { version: "3.2.0", date: "2026-07-30", title: "Loja de aplicativos VR e distribuição Android", items: ["Nova aba para experiências Web e aplicativos Android offline.", "APK Lab Virtual DS VR 360 v0.3.3 integrado com download, requisitos e checksum.", "Filtros por plataforma e categorias sem ocupar a área principal do laboratório."] },
  { version: "3.1.0", date: "2026-07-30", title: "Versionamento modular e informações da aplicação", items: ["Catálogo único para versões da aplicação, sensores, laboratórios e tecnologias.", "Badges discretos, painel de detalhes, créditos e resumos curtos de atualização.", "Melhor adaptação das informações técnicas para telas pequenas."] },
  { version: "3.0.0", date: "2026-07-29", title: "Reconstrução do motor e da experiência", items: ["Scheduler adaptativo para mãos, corpo e rosto.", "Gesture Lab, Face Reactor e Shape Catch para duas pessoas.", "Interface responsiva com HUD compacto e painéis recolhíveis."] },
  { version: "2.0.0", date: "2026-07-29", title: "Correções de rastreamento e desempenho", items: ["Alternância das tarefas de visão e classificação geométrica local.", "Correção do espelhamento e das colisões do Shape Catch.", "Perfis de qualidade e clique por gesto."] }
]);
export const PROJECT_CREDITS = Object.freeze({
  project: "HoloMotion Lab DS",
  purpose: "Laboratório educacional de visão computacional, movimento corporal e interação 3D executado integralmente no navegador.",
  direction: "Concepção pedagógica e direção do projeto: Gabriel.",
  engineering: "Arquitetura, interface, lógica de interação e documentação desenvolvidas para o projeto educacional ANALISES.",
  privacy: "A câmera é processada localmente. O projeto não grava nem envia vídeo, áudio, fotos ou localização.",
  licenses: "As dependências de terceiros mantêm suas respectivas licenças. Consulte os projetos oficiais antes de redistribuir versões modificadas."
});
export function getVersionEntry(key) { return VERSION_CATALOG[key] || null; }
export function getModeVersion(mode) { const key = MODE_VERSION_KEYS[mode]; return key ? getVersionEntry(key) : null; }
export function compactVersion(version) { const parts = String(version || "0.0.0").split("."); return `v${parts.slice(0, 2).join(".")}`; }
export function fullVersion(version) { return `v${version || "0.0.0"}`; }
export function entriesByType(type) { return Object.values(VERSION_CATALOG).filter((entry) => entry.type === type); }
