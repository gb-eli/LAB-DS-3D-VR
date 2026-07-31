const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const EXPLORER_ACTIVITY_MODES = Object.freeze({
  free: { id: 'free', label: 'Exploração livre', icon: '◇', hint: 'Manipule a maquete sem etapas obrigatórias.' },
  guided: { id: 'guided', label: 'Visita guiada', icon: '◎', hint: 'Selecione as partes indicadas e acompanhe a explicação.' },
  challenge: { id: 'challenge', label: 'Desafio', icon: '⚡', hint: 'Localize as partes na ordem correta antes do tempo acabar.' },
  quiz: { id: 'quiz', label: 'Holo Quiz', icon: '?', hint: 'Responda às perguntas sobre a exposição.' }
});

const step = (partId, title, hint, fact, xp = 12) => ({ partId, title, hint, fact, xp });
const question = (prompt, options, answer, explanation) => ({ prompt, options, answer, explanation });

export const EXPLORER_ACTIVITIES = Object.freeze({
  'solar-system': {
    title: 'Orbit Master', icon: '☀', theme: 'Espaço', timeLimit: 110,
    steps: [
      step('sun', 'Localize o Sol', 'Selecione a estrela no centro do sistema.', 'O Sol concentra quase toda a massa do Sistema Solar.'),
      step('mercury', 'Encontre Mercúrio', 'Selecione o planeta mais próximo do Sol.', 'Mercúrio completa sua órbita em aproximadamente 88 dias terrestres.'),
      step('earth', 'Encontre a Terra', 'Selecione o terceiro planeta.', 'A Terra possui água líquida abundante e atmosfera rica em nitrogênio.'),
      step('mars', 'Encontre Marte', 'Selecione o planeta avermelhado.', 'A coloração de Marte está relacionada a óxidos de ferro em sua superfície.'),
      step('jupiter', 'Encontre Júpiter', 'Selecione o maior planeta.', 'Júpiter é um gigante gasoso com dezenas de luas.'),
      step('saturn', 'Encontre Saturno', 'Selecione o planeta com anéis.', 'Os anéis são formados principalmente por gelo e fragmentos rochosos.'),
      step('neptune', 'Encontre Netuno', 'Selecione o planeta mais distante da maquete.', 'Netuno apresenta ventos extremamente rápidos.')
    ],
    quiz: [
      question('Qual planeta é o terceiro a partir do Sol?', ['Marte', 'Terra', 'Vênus', 'Júpiter'], 1, 'A Terra ocupa a terceira órbita.'),
      question('Qual objeto está no centro das órbitas?', ['Lua', 'Sol', 'Terra', 'Saturno'], 1, 'Os planetas orbitam o Sol.'),
      question('Qual planeta é reconhecido pelos anéis mais visíveis?', ['Mercúrio', 'Marte', 'Saturno', 'Netuno'], 2, 'Saturno possui um amplo sistema de anéis.')
    ]
  },
  'earth-moon': {
    title: 'Terra, Lua e Eclipses', icon: '◉', theme: 'Espaço', timeLimit: 90,
    steps: [
      step('earth', 'Selecione a Terra', 'Toque no globo principal.', 'A rotação terrestre está relacionada à alternância entre dia e noite.'),
      step('atmosphere', 'Localize a atmosfera', 'Selecione a camada externa do planeta.', 'A atmosfera ajuda a regular a temperatura e filtra parte da radiação solar.'),
      step('equator', 'Encontre o Equador', 'Selecione o anel que divide os hemisférios.', 'O Equador é uma linha imaginária que divide os hemisférios Norte e Sul.'),
      step('moon', 'Selecione a Lua', 'Toque no satélite que orbita a Terra.', 'As fases da Lua dependem das posições relativas entre Sol, Terra e Lua.')
    ],
    quiz: [
      question('O que causa as fases da Lua?', ['A sombra permanente da Terra', 'A iluminação observada conforme as posições relativas', 'Mudanças no tamanho da Lua', 'Nuvens espaciais'], 1, 'As fases correspondem à porção iluminada que observamos.'),
      question('Qual movimento terrestre está relacionado ao dia e à noite?', ['Translação', 'Rotação', 'Precessão', 'Eclipse'], 1, 'A rotação ocorre em torno do próprio eixo.')
    ]
  },
  motherboard: {
    title: 'Hardware Repair', icon: '▦', theme: 'Hardware', timeLimit: 100,
    steps: [
      step('cpu', 'Localize o processador', 'Selecione o componente central de processamento.', 'A CPU executa instruções e coordena operações do sistema.'),
      step('ram', 'Localize a memória RAM', 'Selecione um dos módulos de memória.', 'A RAM mantém temporariamente dados utilizados pelos programas.'),
      step('storage', 'Localize o armazenamento', 'Selecione a unidade de armazenamento.', 'SSDs armazenam dados mesmo quando o computador é desligado.'),
      step('pcie', 'Localize o slot de expansão', 'Selecione o slot PCI Express.', 'Slots PCIe permitem instalar placas de vídeo, rede e outros dispositivos.'),
      step('cooler', 'Localize a refrigeração', 'Selecione o cooler do processador.', 'O sistema de refrigeração ajuda a controlar a temperatura do processador.')
    ],
    quiz: [
      question('Qual componente guarda dados temporariamente durante a execução?', ['SSD', 'RAM', 'Fonte', 'Gabinete'], 1, 'A memória RAM é volátil e usada durante a execução.'),
      question('Em qual slot uma placa de vídeo costuma ser instalada?', ['DIMM', 'PCI Express', 'SATA', 'USB'], 1, 'Placas de vídeo usam normalmente um slot PCI Express.')
    ]
  },
  drone: {
    title: 'Drone Balance', icon: '✣', theme: 'Robótica', timeLimit: 90,
    steps: [
      step('drone-body', 'Localize o controlador central', 'Selecione o corpo do drone.', 'O controlador combina dados dos sensores para estabilizar o voo.'),
      step('drone-camera', 'Localize a câmera', 'Selecione o módulo frontal.', 'A câmera pode registrar imagens e auxiliar em navegação.'),
      step('motor-1', 'Encontre um motor', 'Selecione um dos quatro motores.', 'A velocidade relativa dos motores controla direção e altitude.'),
      step('rotor-1', 'Encontre uma hélice', 'Selecione uma hélice.', 'Hélices vizinhas geralmente giram em sentidos alternados para equilibrar o torque.'),
      step('battery', 'Localize a bateria', 'Selecione o módulo de energia.', 'A bateria fornece energia aos motores, sensores e controlador.')
    ],
    quiz: [
      question('Por que hélices vizinhas podem girar em sentidos diferentes?', ['Para economizar câmera', 'Para equilibrar o torque', 'Para reduzir o tamanho', 'Para desligar o GPS'], 1, 'A contrarrotação ajuda a equilibrar o torque do conjunto.'),
      question('Qual componente fornece energia ao drone?', ['Bateria', 'Câmera', 'Hélice', 'GPS'], 0, 'A bateria alimenta os componentes elétricos.')
    ]
  },
  robot: {
    title: 'Robot Trainer', icon: '⚙', theme: 'Robótica', timeLimit: 100,
    steps: [
      step('robot-head', 'Localize os sensores', 'Selecione a cabeça do robô.', 'Sensores podem fornecer visão, distância, orientação e outras informações.'),
      step('robot-core', 'Localize o controlador', 'Selecione o núcleo central.', 'O controlador processa sinais e envia comandos aos atuadores.'),
      step('robot-arm', 'Localize um braço', 'Selecione um membro superior.', 'Motores e atuadores transformam comandos em movimento.'),
      step('robot-leg', 'Localize uma perna', 'Selecione um membro inferior.', 'Equilíbrio e locomoção exigem coordenação entre sensores e atuadores.')
    ],
    quiz: [
      question('O que transforma comandos em movimento?', ['Atuadores', 'Tela', 'Memória USB', 'Carcaça'], 0, 'Atuadores realizam movimentos físicos.'),
      question('Qual parte processa sinais e coordena ações?', ['Núcleo controlador', 'Pé', 'Parafuso', 'Pintura'], 0, 'O controlador coordena os subsistemas.')
    ]
  },
  volcano: {
    title: 'Volcano Lab', icon: '▲', theme: 'Terra', timeLimit: 90,
    steps: [
      step('volcano-shell', 'Observe o cone vulcânico', 'Selecione a estrutura externa.', 'O edifício vulcânico é formado pelo acúmulo de materiais emitidos em erupções.'),
      step('magma-chamber', 'Localize a câmara magmática', 'Selecione o reservatório inferior.', 'A câmara armazena magma abaixo da superfície.'),
      step('magma-conduit', 'Localize o conduto', 'Selecione o caminho de subida do magma.', 'O conduto conecta regiões profundas à cratera.'),
      step('crater', 'Localize a cratera', 'Selecione a abertura superior.', 'A cratera é uma das regiões de saída de materiais vulcânicos.')
    ],
    quiz: [
      question('Onde o magma pode ficar armazenado?', ['Atmosfera', 'Câmara magmática', 'Oceano', 'Nuvem'], 1, 'A câmara magmática é um reservatório subterrâneo.'),
      question('Qual estrutura conduz o magma em direção à superfície?', ['Conduto', 'Equador', 'Órbita', 'Slot PCIe'], 0, 'O conduto é a passagem do magma.')
    ],
    simulation: { pressure: 45, temperature: 55, viscosity: 45 }
  },
  cave: {
    title: 'Crystal Hunt', icon: '⌂', theme: 'Geociências', timeLimit: 85,
    steps: [
      step('cave-entry', 'Localize a entrada', 'Selecione o início da caverna.', 'Entradas conectam o ambiente externo às galerias subterrâneas.'),
      step('cave-gallery', 'Localize a galeria', 'Selecione o corredor interno.', 'Galerias podem ser esculpidas pela água ao longo de grandes períodos.'),
      step('crystal-1', 'Encontre um cristal', 'Selecione uma formação luminosa.', 'Cristais se formam quando minerais se organizam em estruturas regulares.'),
      step('stalactite', 'Localize uma estalactite', 'Selecione a formação que desce do teto.', 'Estalactites se desenvolvem a partir do teto da caverna.')
    ],
    quiz: [
      question('De onde cresce uma estalactite?', ['Do teto', 'Do centro da Terra', 'Da tela', 'Da órbita'], 0, 'Estalactites crescem a partir do teto.'),
      question('O que pode ajudar a formar galerias?', ['Ação prolongada da água', 'Movimento de planetas', 'Memória RAM', 'Ondas de rádio'], 0, 'A dissolução e erosão por água participam de muitos processos de formação.')
    ]
  },
  'world-map': {
    title: 'Geo Routes', icon: '⌖', theme: 'Geografia', timeLimit: 90,
    steps: [
      step('americas', 'Localize as Américas', 'Selecione a região ocidental do mapa.', 'As Américas reúnem países dos hemisférios Norte e Sul.'),
      step('africa', 'Localize a África', 'Selecione a região central inferior.', 'A África é atravessada pela Linha do Equador.'),
      step('europe', 'Localize a Europa', 'Selecione a região ao norte da África.', 'Europa e Ásia formam uma grande massa continental contínua.'),
      step('asia', 'Localize a Ásia', 'Selecione a maior região continental.', 'A Ásia é o maior continente em área e população.'),
      step('oceania', 'Localize a Oceania', 'Selecione a região insular ao sudeste.', 'A Oceania inclui a Austrália e numerosas ilhas do Pacífico.')
    ],
    quiz: [
      question('Qual continente é o maior em área?', ['Europa', 'Ásia', 'Oceania', 'Antártida'], 1, 'A Ásia é o maior continente.'),
      question('Qual continente é atravessado pelo Equador?', ['África', 'Europa', 'Antártida', 'Nenhum'], 0, 'A Linha do Equador atravessa a África.')
    ]
  },
  landmarks: {
    title: 'Monument Puzzle', icon: '♜', theme: 'Patrimônio', timeLimit: 85,
    steps: [
      step('tower', 'Localize a torre metálica', 'Selecione a estrutura alta e triangulada.', 'Estruturas trianguladas distribuem esforços e aumentam a estabilidade.'),
      step('pyramid', 'Localize a pirâmide', 'Selecione a forma de base quadrada.', 'Pirâmides são estruturas monumentais presentes em diferentes culturas.'),
      step('arch', 'Localize o arco', 'Selecione a estrutura curva.', 'Arcos distribuem cargas para os apoios laterais.')
    ],
    quiz: [
      question('Qual forma estrutural ajuda a distribuir forças em torres?', ['Triângulo', 'Círculo vazio', 'Linha isolada', 'Ponto'], 0, 'Triângulos são amplamente usados em estruturas treliçadas.'),
      question('Para onde o arco transfere parte das cargas?', ['Apoios laterais', 'Nuvens', 'Órbitas', 'Tela'], 0, 'As cargas são transferidas para os apoios.')
    ]
  }
});

export function getExplorerActivity(exhibitId) {
  return EXPLORER_ACTIVITIES[exhibitId] || EXPLORER_ACTIVITIES['solar-system'];
}

export class ExplorerAdvanced {
  constructor({ callbacks = {} } = {}) {
    this.callbacks = callbacks;
    this.exhibitId = 'solar-system';
    this.activityMode = 'free';
    this.activity = getExplorerActivity(this.exhibitId);
    this.index = 0;
    this.score = 0;
    this.combo = 0;
    this.completed = 0;
    this.startedAt = 0;
    this.deadline = 0;
    this.quizIndex = 0;
    this.quizAnswered = false;
    this.lastGestureAt = 0;
    this.lastProgressAt = 0;
    this.finished = false;
    this.active = false;
    this.simulation = { ...(this.activity.simulation || {}) };
  }

  start({ exhibitId = this.exhibitId, activityMode = this.activityMode } = {}) {
    this.active = true;
    this.setExhibit(exhibitId, { reset: false });
    this.setActivityMode(activityMode, { reset: false });
    this.reset();
    return this.snapshot();
  }

  stop() { this.active = false; }
  dispose() { this.stop(); }

  setExhibit(exhibitId, { reset = true } = {}) {
    this.exhibitId = EXPLORER_ACTIVITIES[exhibitId] ? exhibitId : 'solar-system';
    this.activity = getExplorerActivity(this.exhibitId);
    this.simulation = { ...(this.activity.simulation || {}) };
    if (reset) this.reset();
    return this.snapshot();
  }

  setActivityMode(mode, { reset = true } = {}) {
    this.activityMode = EXPLORER_ACTIVITY_MODES[mode] ? mode : 'free';
    if (reset) this.reset();
    return this.snapshot();
  }

  reset() {
    this.index = 0;
    this.quizIndex = 0;
    this.quizAnswered = false;
    this.score = 0;
    this.combo = 0;
    this.completed = 0;
    this.startedAt = performance.now();
    this.finished = false;
    this.lastProgressAt = 0;
    this.deadline = this.startedAt + (this.activity.timeLimit || 90) * 1000;
    this.callbacks.onSceneCommand?.({ type: 'reset', exhibitId: this.exhibitId });
    this.emitState();
    return this.snapshot();
  }

  get currentStep() { return this.activity.steps[this.index] || null; }
  get currentQuestion() { return this.activity.quiz[this.quizIndex] || null; }

  selectPart(partId) {
    if (!this.active || this.finished || !partId) return false;
    this.callbacks.onPart?.({ partId, expected: this.currentStep?.partId || null });
    if (!['guided', 'challenge'].includes(this.activityMode)) return false;
    const expected = this.currentStep;
    if (!expected) return false;
    if (partId !== expected.partId) {
      this.combo = 0;
      this.score = Math.max(0, this.score - 20);
      this.callbacks.onMiss?.({ selected: partId, expected, score: this.score });
      this.emitProgress();
      return false;
    }
    this.completeStep(expected);
    return true;
  }

  completeStep(stepInfo = this.currentStep) {
    if (!stepInfo) return false;
    this.completed += 1;
    this.combo += 1;
    const speedBonus = this.activityMode === 'challenge' ? Math.max(0, Math.round((this.deadline - performance.now()) / 6000)) : 0;
    const points = 100 + this.combo * 15 + speedBonus;
    this.score += points;
    this.callbacks.onSuccess?.({ step: stepInfo, points, score: this.score, combo: this.combo, xp: stepInfo.xp || 12 });
    this.index += 1;
    if (this.index >= this.activity.steps.length) this.finish();
    else {
      this.callbacks.onSceneCommand?.({ type: 'focus', partId: this.currentStep.partId });
      this.emitState();
    }
    return true;
  }

  validateCurrent() {
    if (this.activityMode === 'free') return false;
    if (this.activityMode === 'quiz') return false;
    return this.completeStep();
  }

  answerQuiz(answerIndex) {
    if (this.activityMode !== 'quiz' || this.quizAnswered) return false;
    const current = this.currentQuestion;
    if (!current) return false;
    this.quizAnswered = true;
    const correct = Number(answerIndex) === current.answer;
    if (correct) {
      this.combo += 1;
      this.score += 150 + this.combo * 20;
    } else {
      this.combo = 0;
      this.score = Math.max(0, this.score - 25);
    }
    this.callbacks.onQuizAnswer?.({ correct, question: current, answerIndex, score: this.score, combo: this.combo });
    this.emitProgress();
    return correct;
  }

  nextQuiz() {
    if (this.activityMode !== 'quiz') return;
    if (!this.quizAnswered) return;
    this.quizIndex += 1;
    this.quizAnswered = false;
    if (this.quizIndex >= this.activity.quiz.length) this.finish();
    else this.emitState();
  }

  setSimulationValue(key, value) {
    if (!(key in this.simulation)) return;
    this.simulation[key] = clamp(Number(value) || 0, 0, 100);
    this.callbacks.onSceneCommand?.({ type: 'simulation', exhibitId: this.exhibitId, values: { ...this.simulation } });
    this.callbacks.onSimulation?.({ values: { ...this.simulation } });
  }

  hint() {
    const text = this.activityMode === 'quiz' ? this.currentQuestion?.explanation : this.currentStep?.hint;
    if (text) this.callbacks.onHint?.({ text });
    return text || '';
  }

  update({ gestures = [] } = {}, now = performance.now()) {
    if (!this.active || this.finished) return;
    if (now - this.lastProgressAt > 250) { this.lastProgressAt = now; this.emitProgress(); }
    if (this.activityMode === 'challenge' && now >= this.deadline && this.index < this.activity.steps.length) {
      this.finish({ timeout: true });
      return;
    }
    const gesture = gestures[0];
    if (!gesture || now - this.lastGestureAt < 800) return;
    if (gesture.type === 'thumb_up' && ['guided', 'challenge'].includes(this.activityMode)) {
      this.lastGestureAt = now;
      this.validateCurrent();
    }
    if (gesture.type === 'open' && gesture.motion?.type === 'swipe_right') {
      this.lastGestureAt = now;
      this.callbacks.onSceneCommand?.({ type: 'next-exhibit' });
    }
  }

  finish({ timeout = false } = {}) {
    if (this.finished) return;
    this.finished = true;
    const total = this.activityMode === 'quiz' ? this.activity.quiz.length : this.activity.steps.length;
    const accuracy = total ? Math.round((this.completed || this.quizIndex + (this.quizAnswered ? 1 : 0)) / total * 100) : 100;
    this.callbacks.onComplete?.({ exhibitId: this.exhibitId, activity: this.activity, mode: this.activityMode, score: this.score, combo: this.combo, accuracy, timeout, xp: Math.max(40, Math.round(this.score / 10)) });
    this.emitState({ completed: true, timeout });
  }

  emitState(extra = {}) {
    const payload = this.snapshot();
    this.callbacks.onState?.({ ...payload, ...extra });
    if (this.activityMode === 'quiz') this.callbacks.onQuiz?.({ question: this.currentQuestion, index: this.quizIndex, total: this.activity.quiz.length, answered: this.quizAnswered });
    else if (this.currentStep) this.callbacks.onStep?.({ step: this.currentStep, index: this.index, total: this.activity.steps.length });
    this.emitProgress();
  }

  emitProgress() {
    const total = this.activityMode === 'quiz' ? this.activity.quiz.length : this.activity.steps.length;
    const current = this.activityMode === 'quiz' ? this.quizIndex : this.index;
    const remaining = Math.max(0, this.deadline - performance.now());
    this.callbacks.onProgress?.({ current, total, score: this.score, combo: this.combo, remaining, progress: total ? current / total : 0 });
  }

  async cacheOfflinePackage() {
    if (!("caches" in globalThis) || !("fetch" in globalThis)) {
      this.callbacks.onOffline?.({ state: "unsupported", progress: 0, message: "Cache offline indisponível neste navegador." });
      return false;
    }
    const localResources = [
      "./src/explorer-advanced.js", "./src/explorer-catalog.js", "./src/three-scene.js",
      "./src/config.js", "./assets/styles.css", "./index.html", "./manifest.webmanifest"
    ];
    const externalResources = ["https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js"];
    const moduleCache = await caches.open("holomotion-v4.4.3-modules");
    const externalCache = await caches.open("holomotion-v4.4.3-external");
    const all = [...localResources.map((url) => ({ url, cache: moduleCache })), ...externalResources.map((url) => ({ url, cache: externalCache }))];
    let completed = 0;
    this.callbacks.onOffline?.({ state: "loading", progress: 0, message: "Preparando Holo Explorer offline…" });
    for (const item of all) {
      const request = new Request(new URL(item.url, globalThis.location?.href || "http://localhost/").href, { mode: item.url.startsWith("http") ? "cors" : "same-origin" });
      const response = await fetch(request);
      if (!response.ok && response.type !== "opaque") throw new Error(`Falha ao armazenar ${item.url}`);
      await item.cache.put(request, response.clone());
      completed += 1;
      this.callbacks.onOffline?.({ state: "loading", progress: completed / all.length, message: `Armazenando ${completed}/${all.length}` });
    }
    this.callbacks.onOffline?.({ state: "ready", progress: 1, message: "Holo Explorer disponível offline após o primeiro uso." });
    return true;
  }

  snapshot() {
    return {
      exhibitId: this.exhibitId,
      activityMode: this.activityMode,
      activity: this.activity,
      currentStep: this.currentStep,
      currentQuestion: this.currentQuestion,
      index: this.index,
      quizIndex: this.quizIndex,
      score: this.score,
      combo: this.combo,
      completed: this.completed,
      simulation: { ...this.simulation },
      active: this.active,
      finished: this.finished
    };
  }
}
