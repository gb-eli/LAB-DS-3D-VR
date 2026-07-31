import { HandDepthEstimator } from './depth-estimator.js';
import { TutorialDirector } from './tutorial-director.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
const depthDistance = (a, b) => Math.abs((a?.z ?? .5) - (b?.z ?? .5));

const piece = (id, label, icon, color, slot, start, fact, shape = 'circle') => ({
  id, label, icon, color,
  slot: { z: .5, ...slot },
  start: { z: .5, ...start },
  fact, shape
});

export const ASSEMBLY_KITS = Object.freeze({
  computer: {
    id: 'computer', label: 'Computador modular', icon: '▦', timeLimit: 105,
    objective: 'Instale as peças no gabinete holográfico.',
    pieces: [
      piece('cpu', 'Processador', 'CPU', '#22d3ee', { x: .43, y: .31, z: .35 }, { x: .12, y: .72, z: .7 }, 'A CPU executa instruções e coordena operações.', 'hex'),
      piece('ram', 'Memória RAM', 'RAM', '#34d399', { x: .61, y: .31, z: .55 }, { x: .30, y: .82, z: .35 }, 'A RAM mantém dados temporários durante a execução.', 'rect'),
      piece('ssd', 'SSD', 'SSD', '#fbbf24', { x: .43, y: .52, z: .72 }, { x: .49, y: .82, z: .2 }, 'O SSD armazena arquivos sem partes mecânicas móveis.', 'square'),
      piece('gpu', 'Placa de vídeo', 'GPU', '#a78bfa', { x: .61, y: .52, z: .45 }, { x: .68, y: .82, z: .75 }, 'A GPU acelera gráficos e cálculos paralelos.', 'rect'),
      piece('cooler', 'Refrigeração', 'FAN', '#fb7185', { x: .52, y: .18, z: .62 }, { x: .86, y: .72, z: .3 }, 'O cooler remove calor do processador.', 'circle')
    ]
  },
  drone: {
    id: 'drone', label: 'Drone educacional', icon: '✣', timeLimit: 95,
    objective: 'Monte o drone mantendo o equilíbrio entre os lados.',
    pieces: [
      piece('body', 'Controlador', 'CTRL', '#22d3ee', { x: .52, y: .38, z: .5 }, { x: .12, y: .78, z: .7 }, 'O controlador combina dados dos sensores.', 'hex'),
      piece('battery', 'Bateria', 'BAT', '#fbbf24', { x: .52, y: .54, z: .68 }, { x: .30, y: .82, z: .28 }, 'A bateria alimenta motores e sensores.', 'rect'),
      piece('motor-l', 'Motor esquerdo', 'M1', '#60a5fa', { x: .35, y: .30, z: .38 }, { x: .49, y: .82, z: .75 }, 'Motores ajustam altitude e direção.'),
      piece('motor-r', 'Motor direito', 'M2', '#60a5fa', { x: .69, y: .30, z: .62 }, { x: .68, y: .82, z: .22 }, 'Motores opostos ajudam a equilibrar o torque.'),
      piece('camera', 'Câmera', 'CAM', '#c084fc', { x: .52, y: .67, z: .82 }, { x: .86, y: .78, z: .45 }, 'A câmera registra imagens e auxilia navegação.', 'square')
    ]
  },
  robot: {
    id: 'robot', label: 'Robô articulado', icon: '⚙', timeLimit: 100,
    objective: 'Conecte sensores, núcleo e membros do robô.',
    pieces: [
      piece('head', 'Cabeça e sensores', 'HEAD', '#22d3ee', { x: .52, y: .18, z: .45 }, { x: .12, y: .76, z: .72 }, 'Sensores percebem o ambiente.', 'square'),
      piece('core', 'Núcleo controlador', 'CORE', '#a78bfa', { x: .52, y: .38, z: .65 }, { x: .30, y: .82, z: .3 }, 'O controlador processa sinais e decisões.', 'hex'),
      piece('arm-l', 'Braço esquerdo', 'ARM', '#34d399', { x: .34, y: .39, z: .34 }, { x: .49, y: .82, z: .82 }, 'Atuadores transformam energia em movimento.', 'rect'),
      piece('arm-r', 'Braço direito', 'ARM', '#34d399', { x: .70, y: .39, z: .75 }, { x: .68, y: .82, z: .18 }, 'Articulações permitem movimentos controlados.', 'rect'),
      piece('legs', 'Base e pernas', 'LEGS', '#fbbf24', { x: .52, y: .65, z: .55 }, { x: .86, y: .76, z: .5 }, 'A base mantém equilíbrio e locomoção.', 'rect')
    ]
  },
  solar: {
    id: 'solar', label: 'Sistema Terra–Lua', icon: '☀', timeLimit: 90,
    objective: 'Organize o sistema e posicione os corpos nas órbitas.',
    pieces: [
      piece('sun', 'Sol', '☀', '#fbbf24', { x: .38, y: .42, z: .48 }, { x: .13, y: .78, z: .75 }, 'O Sol fornece luz e energia ao sistema.'),
      piece('earth', 'Terra', '◉', '#22d3ee', { x: .58, y: .42, z: .62 }, { x: .36, y: .82, z: .28 }, 'A Terra orbita o Sol.'),
      piece('moon', 'Lua', '●', '#cbd5e1', { x: .70, y: .33, z: .78 }, { x: .60, y: .82, z: .45 }, 'A Lua orbita a Terra.'),
      piece('satellite', 'Satélite', '◇', '#a78bfa', { x: .70, y: .55, z: .32 }, { x: .84, y: .78, z: .68 }, 'Satélites artificiais podem observar e comunicar.', 'diamond')
    ]
  },
  network: {
    id: 'network', label: 'Rede de computadores', icon: '⌬', timeLimit: 110,
    objective: 'Monte a topologia e conecte os equipamentos na ordem correta.',
    pieces: [
      piece('router', 'Roteador', 'RTR', '#22d3ee', { x: .52, y: .25, z: .62 }, { x: .12, y: .78, z: .3 }, 'O roteador conecta redes diferentes e encaminha pacotes.', 'rect'),
      piece('switch', 'Switch', 'SW', '#34d399', { x: .52, y: .45, z: .45 }, { x: .30, y: .82, z: .76 }, 'O switch conecta equipamentos dentro da rede local.', 'rect'),
      piece('server', 'Servidor', 'SRV', '#a78bfa', { x: .35, y: .62, z: .72 }, { x: .49, y: .82, z: .25 }, 'O servidor fornece dados e serviços aos clientes.', 'square'),
      piece('client', 'Computador cliente', 'PC', '#60a5fa', { x: .69, y: .62, z: .35 }, { x: .68, y: .82, z: .7 }, 'O cliente utiliza os serviços da rede.', 'square'),
      piece('firewall', 'Firewall', 'FW', '#fb7185', { x: .52, y: .70, z: .82 }, { x: .86, y: .76, z: .48 }, 'O firewall filtra conexões conforme regras de segurança.', 'hex')
    ]
  },
  satellite: {
    id: 'satellite', label: 'Satélite orbital', icon: '◇', timeLimit: 105,
    objective: 'Monte os subsistemas do satélite e prepare-o para a órbita.',
    pieces: [
      piece('bus', 'Estrutura central', 'BUS', '#22d3ee', { x: .52, y: .43, z: .5 }, { x: .12, y: .78, z: .75 }, 'O barramento central integra energia, controle e comunicação.', 'square'),
      piece('solar-l', 'Painel solar esquerdo', 'SOL', '#60a5fa', { x: .31, y: .43, z: .35 }, { x: .30, y: .82, z: .2 }, 'Painéis solares convertem luz em eletricidade.', 'rect'),
      piece('solar-r', 'Painel solar direito', 'SOL', '#60a5fa', { x: .73, y: .43, z: .68 }, { x: .49, y: .82, z: .82 }, 'Os painéis precisam permanecer orientados para gerar energia.', 'rect'),
      piece('antenna', 'Antena', 'ANT', '#fbbf24', { x: .52, y: .20, z: .78 }, { x: .68, y: .82, z: .3 }, 'A antena envia e recebe sinais.', 'diamond'),
      piece('sensor', 'Sensor orbital', 'SNS', '#c084fc', { x: .52, y: .64, z: .42 }, { x: .86, y: .78, z: .65 }, 'Sensores observam a Terra ou o espaço.', 'circle')
    ]
  },
  rover: {
    id: 'rover', label: 'Rover explorador', icon: '▣', timeLimit: 115,
    objective: 'Monte o veículo robótico para explorar terrenos remotos.',
    pieces: [
      piece('chassis', 'Chassi', 'BASE', '#22d3ee', { x: .52, y: .48, z: .52 }, { x: .12, y: .78, z: .22 }, 'O chassi sustenta todos os subsistemas.', 'rect'),
      piece('wheels', 'Rodas', 'WHL', '#64748b', { x: .52, y: .66, z: .32 }, { x: .30, y: .82, z: .76 }, 'Rodas articuladas vencem irregularidades do terreno.', 'circle'),
      piece('mast', 'Mastro de câmeras', 'CAM', '#a78bfa', { x: .52, y: .23, z: .72 }, { x: .49, y: .82, z: .28 }, 'O mastro amplia o campo de visão.', 'rect'),
      piece('arm', 'Braço robótico', 'ARM', '#34d399', { x: .72, y: .48, z: .58 }, { x: .68, y: .82, z: .82 }, 'O braço coleta amostras e manipula ferramentas.', 'rect'),
      piece('power', 'Fonte de energia', 'PWR', '#fbbf24', { x: .33, y: .42, z: .45 }, { x: .86, y: .76, z: .42 }, 'A fonte mantém instrumentos e motores operando.', 'hex')
    ]
  },
  circuit: {
    id: 'circuit', label: 'Circuito eletrônico', icon: '⌁', timeLimit: 90,
    objective: 'Complete o circuito respeitando entrada, controle e saída.',
    pieces: [
      piece('source', 'Fonte', 'V+', '#fbbf24', { x: .30, y: .36, z: .32 }, { x: .12, y: .78, z: .75 }, 'A fonte fornece diferença de potencial.', 'circle'),
      piece('resistor', 'Resistor', 'R', '#fb7185', { x: .47, y: .36, z: .62 }, { x: .30, y: .82, z: .2 }, 'O resistor limita a corrente.', 'rect'),
      piece('sensor', 'Sensor', 'S', '#22d3ee', { x: .64, y: .36, z: .78 }, { x: .49, y: .82, z: .48 }, 'O sensor converte uma grandeza física em sinal.', 'diamond'),
      piece('controller', 'Controlador', 'µC', '#a78bfa', { x: .47, y: .58, z: .45 }, { x: .68, y: .82, z: .82 }, 'O microcontrolador processa o sinal.', 'square'),
      piece('led', 'LED', 'LED', '#34d399', { x: .64, y: .58, z: .68 }, { x: .86, y: .76, z: .3 }, 'O LED transforma energia elétrica em luz.', 'circle')
    ]
  }
});

export class AssemblyGame {
  constructor({ canvas = null, callbacks = {}, sensitivity = 1, depthMode = 'assist', tutorial = true } = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext?.('2d') || null;
    this.callbacks = callbacks;
    this.sensitivity = sensitivity;
    this.depthMode = ['off', 'assist', 'spatial'].includes(depthMode) ? depthMode : 'assist';
    this.depthEstimator = new HandDepthEstimator({ smoothing: .32 });
    this.depth = this.depthEstimator.snapshot(false);
    this.depthVisited = new Set();
    this.active = false;
    this.kitId = 'computer';
    this.mode = 'guided';
    this.pieces = [];
    this.grabbedId = null;
    this.hoveredId = null;
    this.score = 0;
    this.combo = 0;
    this.misses = 0;
    this.startedAt = 0;
    this.remaining = 0;
    this.completed = false;
    this.lastGestureActive = false;
    this.pointer = { x: .5, y: .5, z: .5 };
    this.dragOrigin = null;
    this.dragDistance = 0;
    this.resizeObserver = null;
    this.bound = false;
    this.tutorial = new TutorialDirector({ callbacks: {
      onStep: (snapshot) => this.callbacks.onTutorial?.(snapshot),
      onProgress: (snapshot) => this.callbacks.onTutorial?.(snapshot),
      onValidated: ({ step }) => this.callbacks.onTutorialValidated?.({ step }),
      onComplete: (snapshot) => this.callbacks.onTutorialComplete?.(snapshot)
    }});
    this.tutorialEnabled = tutorial;
    this.#bindCanvas();
  }

  get kit() { return ASSEMBLY_KITS[this.kitId] || ASSEMBLY_KITS.computer; }

  #bindCanvas() {
    if (!this.canvas || this.bound) return;
    this.bound = true;
    const point = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1), y: clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1), z: this.pointer.z };
    };
    this.canvas.addEventListener('pointerdown', (event) => { if (!this.active) return; this.canvas.setPointerCapture?.(event.pointerId); const p = point(event); this.pointerDown(p.x, p.y, p.z); });
    this.canvas.addEventListener('pointermove', (event) => { if (!this.active) return; const p = point(event); this.pointerMove(p.x, p.y, p.z); });
    this.canvas.addEventListener('pointerup', (event) => { if (!this.active) return; const p = point(event); this.pointerUp(p.x, p.y, p.z); });
    if (typeof ResizeObserver !== 'undefined') { this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(this.canvas.parentElement); }
  }

  start({ kitId = this.kitId, mode = this.mode, depthMode = this.depthMode } = {}) {
    this.active = true;
    this.kitId = ASSEMBLY_KITS[kitId] ? kitId : 'computer';
    this.mode = ['guided', 'challenge', 'free'].includes(mode) ? mode : 'guided';
    this.depthMode = ['off', 'assist', 'spatial'].includes(depthMode) ? depthMode : 'assist';
    this.score = 0; this.combo = 0; this.misses = 0; this.completed = false;
    this.startedAt = performance.now(); this.remaining = this.kit.timeLimit * 1000;
    this.depthEstimator.reset(); this.depthVisited.clear(); this.depth = this.depthEstimator.snapshot(false);
    this.pieces = this.kit.pieces.map((item, index) => ({ ...item, x: item.start.x, y: item.start.y, z: item.start.z, placed: false, locked: false, order: index }));
    this.grabbedId = null; this.hoveredId = null; this.dragOrigin = null; this.dragDistance = 0;
    if (this.tutorialEnabled && this.mode === 'guided') this.tutorial.start(); else this.tutorial.pause();
    this.resize(); this.callbacks.onState?.(this.snapshot()); this.render();
    return this.snapshot();
  }

  stop() { this.active = false; this.grabbedId = null; this.tutorial.pause(); this.canvas?.classList?.remove('active'); }
  setKit(kitId) { return this.start({ kitId, mode: this.mode, depthMode: this.depthMode }); }
  setMode(mode) { return this.start({ kitId: this.kitId, mode, depthMode: this.depthMode }); }
  setDepthMode(mode) { this.depthMode = ['off', 'assist', 'spatial'].includes(mode) ? mode : 'assist'; this.callbacks.onState?.(this.snapshot()); this.render(); }
  setSensitivity(value) { this.sensitivity = clamp(Number(value) || 1, .72, 1.4); }
  startTutorial() { this.tutorialEnabled = true; return this.tutorial.start(); }
  toggleTutorial() { this.tutorialEnabled = true; return this.tutorial.toggle(); }
  nextTutorial() { return this.tutorial.next(); }
  previousTutorial() { return this.tutorial.previous(); }
  repeatTutorial() { return this.tutorial.repeat(); }

  pointerDown(x, y, z = this.pointer.z) {
    if (!this.active || this.completed) return false;
    this.pointer = { x, y, z };
    const target = this.#nearestPiece(x, y, this.#grabRadius());
    if (!target) return false;
    this.grabbedId = target.id; this.hoveredId = target.id; this.dragOrigin = { x, y }; this.dragDistance = 0;
    this.callbacks.onGrab?.({ piece: target, depth: this.depth, ...this.snapshot() }); this.render(); return true;
  }

  pointerMove(x, y, z = this.pointer.z) {
    if (!this.active) return;
    const previous = this.pointer;
    this.pointer = { x, y, z };
    if (this.grabbedId) {
      const item = this.pieces.find((entry) => entry.id === this.grabbedId);
      if (item && !item.placed) {
        item.x = clamp(x, .04, .96); item.y = clamp(y, .08, .92);
        if (this.depthMode !== 'off') item.z = clamp(z, .05, .95);
        this.dragDistance += distance(previous, { x, y });
      }
    } else this.hoveredId = this.#nearestPiece(x, y, this.#grabRadius())?.id || null;
    this.render();
  }

  pointerUp(x = this.pointer.x, y = this.pointer.y, z = this.pointer.z) {
    if (!this.active || !this.grabbedId) return false;
    const item = this.pieces.find((entry) => entry.id === this.grabbedId); this.grabbedId = null;
    if (!item) return false;
    item.x = x; item.y = y; item.z = z;
    const expected = this.mode === 'guided' ? this.pieces.find((entry) => !entry.placed) : item;
    const correctOrder = this.mode !== 'guided' || expected?.id === item.id;
    const close2d = distance(item, item.slot) <= this.#snapRadius();
    const closeDepth = this.depthMode !== 'spatial' || depthDistance(item, item.slot) <= this.#depthSnapRadius();
    const close = close2d && closeDepth;
    if (close && correctOrder) {
      Object.assign(item, item.slot, { placed: true, locked: true }); this.combo += 1;
      const depthBonus = this.depthMode === 'spatial' ? 35 : this.depthMode === 'assist' ? 12 : 0;
      const gain = 90 + this.combo * 15 + (this.mode === 'challenge' ? 35 : 0) + depthBonus;
      this.score += gain; this.callbacks.onSuccess?.({ piece: item, gain, depthBonus, ...this.snapshot() });
      if (this.pieces.every((entry) => entry.placed)) this.#complete();
    } else {
      this.combo = 0; this.misses += 1; this.score = Math.max(0, this.score - 20);
      if (this.mode !== 'free') Object.assign(item, item.start);
      this.callbacks.onMiss?.({ piece: item, expected, close, close2d, closeDepth, correctOrder, ...this.snapshot() });
    }
    this.callbacks.onProgress?.(this.snapshot()); this.render(); return close && correctOrder;
  }

  update({ gestures = [] } = {}, now = performance.now()) {
    if (!this.active || this.completed) return this.snapshot();
    this.remaining = Math.max(0, this.kit.timeLimit * 1000 - (now - this.startedAt));
    if (this.mode === 'challenge' && this.remaining <= 0) this.#complete(true);
    const gesture = gestures.find((entry) => entry?.palm) || null;
    this.depth = this.depthEstimator.observe(gesture, now);
    if (this.depth.detected) { this.depthVisited.add(this.depth.zone); this.callbacks.onDepth?.(this.depth); }
    if (gesture) {
      const point = gesture.motionPath?.at?.(-1) || gesture.palm;
      const x = clamp(point?.x ?? gesture.palm.x, 0, 1); const y = clamp(point?.y ?? gesture.palm.y, 0, 1);
      const z = this.depthMode === 'off' ? .5 : this.depth.normalized;
      const active = ['pinch', 'fist', 'ok'].includes(gesture.type);
      if (active && !this.lastGestureActive) this.pointerDown(x, y, z);
      else if (active) this.pointerMove(x, y, z);
      else if (this.lastGestureActive) this.pointerUp(x, y, z);
      else this.pointerMove(x, y, z);
      this.lastGestureActive = active;
    } else if (this.lastGestureActive) { this.pointerUp(); this.lastGestureActive = false; }
    this.tutorial.update({ gesture, grabbed: this.grabbedId, moved: this.dragDistance, depthVisited: this.depthVisited, placed: this.pieces.filter((item) => item.placed).length }, now);
    this.callbacks.onProgress?.(this.snapshot()); this.render(); return this.snapshot();
  }

  hint() {
    const expected = this.pieces.find((entry) => !entry.placed); if (!expected) return null;
    const depthText = this.depthMode === 'spatial' ? ` Ajuste também a profundidade para ${this.#depthLabel(expected.slot.z)}.` : '';
    this.callbacks.onHint?.({ piece: expected, text: `${expected.label}: mova ${expected.icon} até a área destacada.${depthText}` }); return expected;
  }
  reset() { return this.start({ kitId: this.kitId, mode: this.mode, depthMode: this.depthMode }); }
  #nearestPiece(x, y, radius) { return this.pieces.filter((item) => !item.placed).map((item) => ({ item, d: distance(item, { x, y }) })).filter((entry) => entry.d <= radius).sort((a, b) => a.d - b.d)[0]?.item || null; }
  #grabRadius() { return clamp(.075 * this.sensitivity, .055, .11); }
  #snapRadius() { const base = this.mode === 'challenge' ? .065 : this.mode === 'guided' ? .095 : .08; return clamp(base * this.sensitivity, .055, .13); }
  #depthSnapRadius() { return this.mode === 'challenge' ? .16 : .22; }
  #depthLabel(z) { return z < .34 ? 'LONGE' : z > .66 ? 'PERTO' : 'MÉDIO'; }

  #complete(timeout = false) {
    if (this.completed) return; this.completed = true;
    const placed = this.pieces.filter((item) => item.placed).length; const accuracy = placed / Math.max(1, placed + this.misses);
    const xp = Math.round(55 + placed * 20 + accuracy * 45 + (this.depthMode === 'spatial' ? 35 : 0) + (timeout ? 0 : 35));
    this.callbacks.onComplete?.({ timeout, xp, ...this.snapshot() });
  }

  snapshot() {
    const placed = this.pieces.filter((item) => item.placed).length; const expected = this.pieces.find((item) => !item.placed) || null;
    return { active: this.active, kit: this.kit, kitId: this.kitId, mode: this.mode, depthMode: this.depthMode, depth: this.depth, tutorial: this.tutorial.snapshot(), pieces: this.pieces.map((item) => ({ ...item })), placed, total: this.pieces.length, expected, score: this.score, combo: this.combo, misses: this.misses, remaining: this.remaining, completed: this.completed, accuracy: placed / Math.max(1, placed + this.misses) };
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect?.() || { width: 1280, height: 720 };
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr)); this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
    this.canvas.style.width = `${rect.width}px`; this.canvas.style.height = `${rect.height}px`; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.render();
  }

  #drawPiece(ctx, item, x, y, radius) {
    ctx.beginPath();
    const roundedRect = (rx, ry, rw, rh, rr) => {
      if (typeof ctx.roundRect === 'function') ctx.roundRect(rx, ry, rw, rh, rr);
      else ctx.rect(rx, ry, rw, rh);
    };
    if (item.shape === 'rect') roundedRect(x - radius * 1.25, y - radius * .68, radius * 2.5, radius * 1.36, 8);
    else if (item.shape === 'square') roundedRect(x - radius, y - radius, radius * 2, radius * 2, 8);
    else if (item.shape === 'diamond') { ctx.moveTo(x, y - radius); ctx.lineTo(x + radius, y); ctx.lineTo(x, y + radius); ctx.lineTo(x - radius, y); ctx.closePath(); }
    else if (item.shape === 'hex') { for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 6; const px = x + Math.cos(a) * radius; const py = y + Math.sin(a) * radius; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); }
    else ctx.arc(x, y, radius, 0, Math.PI * 2);
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const width = parseFloat(this.canvas.style.width) || this.canvas.width; const height = parseFloat(this.canvas.style.height) || this.canvas.height;
    this.ctx.clearRect(0, 0, width, height); this.canvas.classList.toggle('active', this.active); if (!this.active) return;
    const x = (value) => value * width; const y = (value) => value * height; const unit = Math.min(width, height); const ctx = this.ctx;
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    if (this.depthMode !== 'off') {
      const labels = [{ z: .16, text: 'LONGE' }, { z: .5, text: 'MÉDIO' }, { z: .84, text: 'PERTO' }];
      for (const marker of labels) { const px = width * (.08 + marker.z * .84); ctx.strokeStyle = 'rgba(125,211,252,.12)'; ctx.beginPath(); ctx.moveTo(px, height * .12); ctx.lineTo(px, height * .72); ctx.stroke(); ctx.fillStyle = 'rgba(190,235,248,.48)'; ctx.font = `600 ${Math.max(9, unit * .012)}px system-ui`; ctx.fillText(marker.text, px, height * .1); }
    }

    for (const item of this.pieces) {
      const expected = this.mode !== 'free' && this.pieces.find((entry) => !entry.placed)?.id === item.id;
      const slotScale = .78 + item.slot.z * .42; const radius = unit * .052 * slotScale;
      this.#drawPiece(ctx, item, x(item.slot.x), y(item.slot.y), radius);
      ctx.fillStyle = item.placed ? `${item.color}38` : expected ? `${item.color}28` : 'rgba(10,30,48,.22)'; ctx.fill();
      ctx.strokeStyle = item.placed ? item.color : expected ? '#c9fbff' : 'rgba(125,211,252,.28)'; ctx.lineWidth = expected ? 3 : 1.5; ctx.setLineDash(item.placed ? [] : [6, 6]); ctx.stroke(); ctx.setLineDash([]);
      if (this.depthMode === 'spatial' && !item.placed) { ctx.fillStyle = item.color; ctx.font = `600 ${Math.max(8, unit * .011)}px system-ui`; ctx.fillText(this.#depthLabel(item.slot.z), x(item.slot.x), y(item.slot.y) + radius + 12); }
    }

    for (const item of this.pieces) {
      const hovered = item.id === this.hoveredId || item.id === this.grabbedId; const scale = .72 + (item.z ?? .5) * .58; const radius = unit * (hovered ? .05 : .044) * scale;
      ctx.save(); ctx.shadowBlur = hovered || item.placed ? 24 : 12; ctx.shadowColor = item.color;
      this.#drawPiece(ctx, item, x(item.x), y(item.y), radius); ctx.fillStyle = item.placed ? `${item.color}55` : 'rgba(4,15,28,.9)'; ctx.fill(); ctx.strokeStyle = item.color; ctx.lineWidth = hovered ? 3 : 2; ctx.stroke();
      ctx.fillStyle = '#e8fbff'; ctx.font = `700 ${Math.max(10, unit * .016)}px system-ui`; ctx.fillText(item.icon, x(item.x), y(item.y) - 2); ctx.restore();
      if (!item.placed && height > 430) { ctx.fillStyle = 'rgba(218,244,255,.78)'; ctx.font = `600 ${Math.max(9, unit * .013)}px system-ui`; ctx.fillText(item.label, x(item.x), y(item.y) + radius + 13); }
    }

    if (this.tutorial.active) {
      const demo = this.tutorial.demonstration(); const radius = 18 + demo.depth * 15;
      ctx.save(); ctx.globalAlpha = .7; ctx.shadowBlur = 24; ctx.shadowColor = '#7dd3fc'; ctx.beginPath(); ctx.arc(x(demo.x), y(demo.y), radius, 0, Math.PI * 2); ctx.strokeStyle = '#baf5ff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(125,211,252,.18)'; ctx.fill(); ctx.font = `700 ${Math.max(13, unit * .018)}px system-ui`; ctx.fillStyle = '#fff'; ctx.fillText(demo.pinch ? '⌁' : '✋', x(demo.x), y(demo.y)); ctx.restore();
    }

    if (this.depth.detected && this.depthMode !== 'off') {
      const meterX = width - 30; const top = height * .24; const meterH = height * .42;
      ctx.fillStyle = 'rgba(2,14,28,.72)'; ctx.fillRect(meterX - 8, top, 16, meterH); ctx.fillStyle = this.depth.color; ctx.fillRect(meterX - 7, top + meterH * (1 - this.depth.normalized), 14, meterH * this.depth.normalized);
      ctx.fillStyle = '#dffbff'; ctx.font = '600 10px system-ui'; ctx.save(); ctx.translate(meterX - 15, top + meterH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(this.depth.zoneLabel, 0, 0); ctx.restore();
    }
    ctx.restore();
  }

  async dispose() { this.stop(); this.resizeObserver?.disconnect?.(); if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}
