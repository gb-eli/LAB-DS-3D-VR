import { ObjectVisionEngine } from './object-vision.js';
import {
  DetectionTracker, normalizeDetections, analyzeDominantColor, analyzeSimpleShape,
  associateHandsWithObjects, countPeople, summarizeScene, detectProbableHug,
  detectProbableHandshake, COLOR_PALETTE
} from './environment-analysis.js';
import { BodyMotionAnalyzer, BODY_ACTION_LABELS } from './body-actions.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const SCANNER_ACTIVITIES = Object.freeze({
  scan: { label: 'Scanner livre', icon: '⌗', hint: 'Explore objetos, pessoas, cores e relações detectadas no ambiente.' },
  object: { label: 'Object Quest', icon: '▣', hint: 'Encontre e mostre o objeto solicitado.' },
  color: { label: 'Color Quest', icon: '◐', hint: 'Mostre um objeto da cor solicitada.' },
  shape: { label: 'Shape Scanner', icon: '△', hint: 'Centralize uma forma escura sobre fundo claro.' },
  classroom: { label: 'Classroom Scanner', icon: '⌂', hint: 'Analise a sala e confira a contagem aproximada dos itens.' },
  actions: { label: 'Action Detective', icon: '◎', hint: 'Realize a ação corporal solicitada.' }
});

export const OBJECT_MISSIONS = Object.freeze([
  { id: 'bottle', label: 'garrafa', raw: 'bottle', icon: '◒' },
  { id: 'cell-phone', label: 'celular', raw: 'cell phone', icon: '▯' },
  { id: 'backpack', label: 'mochila', raw: 'backpack', icon: '▰' },
  { id: 'chair', label: 'cadeira', raw: 'chair', icon: '⌑' },
  { id: 'book', label: 'livro', raw: 'book', icon: '▤' },
  { id: 'cup', label: 'copo', raw: 'cup', icon: '◫' },
  { id: 'laptop', label: 'notebook', raw: 'laptop', icon: '▱' },
  { id: 'keyboard', label: 'teclado', raw: 'keyboard', icon: '⌨' }
]);

export const SHAPE_MISSIONS = Object.freeze([
  { id: 'circle', label: 'círculo', icon: '○' },
  { id: 'square', label: 'quadrado', icon: '□' },
  { id: 'triangle', label: 'triângulo', icon: '△' },
  { id: 'rectangle', label: 'retângulo', icon: '▭' }
]);

export const ACTION_MISSIONS = Object.freeze([
  { id: 'arms_open', label: 'abrir os braços', icon: '↔' },
  { id: 'hands_up', label: 'levantar as mãos', icon: '🙌' },
  { id: 'squat', label: 'agachar', icon: '▼' },
  { id: 'jump', label: 'pular', icon: '↟' },
  { id: 'clap', label: 'bater palmas', icon: '👏' },
  { id: 'arms_crossed', label: 'cruzar os braços', icon: '×' },
  { id: 'hug', label: 'abraço provável entre duas pessoas', icon: '♡' },
  { id: 'handshake', label: 'aperto de mãos provável', icon: '⇄' }
]);

function randomFrom(list, previousId = '') {
  const available = list.filter((item) => item.id !== previousId);
  return available[Math.floor(Math.random() * available.length)] || list[0];
}

function scoreColor(color) { return color ? Math.round(color.confidence * 100) : 0; }

export class VisionScanner {
  constructor(context = {}) {
    this.video = context.video || null;
    this.canvas = context.canvas || null;
    this.ctx = this.canvas?.getContext?.('2d') || null;
    this.callbacks = context.callbacks || {};
    this.mirror = context.mirror !== false;
    this.quality = context.quality || 'balanced';
    this.demo = Boolean(context.demo);
    this.activity = context.activity || 'scan';
    this.confidence = Number(context.confidence || 0.38);
    this.active = false;
    this.paused = false;
    this.engine = null;
    this.tracker = new DetectionTracker();
    this.detections = [];
    this.relations = [];
    this.sceneSummary = [];
    this.people = 0;
    this.actions = new Set();
    this.actionConfidence = new Map();
    this.shape = null;
    this.mission = null;
    this.missionProgress = 0;
    this.holdStartedAt = 0;
    this.score = 0;
    this.completed = 0;
    this.lastColorAt = 0;
    this.lastShapeAt = 0;
    this.lastResultAt = 0;
    this.bodyAnalyzers = [new BodyMotionAnalyzer(), new BodyMotionAnalyzer()];
    this.latestInput = { hands: [], poses: [], gestures: [], body: null };
    this.stats = { hz: 0, duration: 0, delegate: '--', backend: '--' };
    this.resizeObserver = null;
    this.boundResize = () => this.resize();
  }

  configure(context = {}) {
    if (context.video) this.video = context.video;
    if (context.canvas && context.canvas !== this.canvas) { this.canvas = context.canvas; this.ctx = this.canvas.getContext('2d'); }
    if (context.callbacks) this.callbacks = context.callbacks;
    if (context.mirror != null) this.mirror = Boolean(context.mirror);
    if (context.quality) this.quality = context.quality;
    if (context.demo != null) this.demo = Boolean(context.demo);
    if (context.activity && SCANNER_ACTIVITIES[context.activity]) this.activity = context.activity;
    if (context.confidence != null) this.confidence = Number(context.confidence);
  }

  async start(context = {}) {
    this.configure(context);
    this.active = true;
    this.paused = false;
    this.resize();
    window.addEventListener('resize', this.boundResize, { passive: true });
    if (!this.demo) {
      if (!this.engine) {
        this.engine = new ObjectVisionEngine(this.video, {
          quality: this.quality,
          onResults: (result) => this.handleDetections(result),
          onStatus: (status) => this.handleStatus(status),
          onStats: (stats) => { this.stats = stats; this.callbacks.onStats?.(stats); }
        });
      }
      this.callbacks.onStatus?.({ state: 'loading', message: 'Carregando o detector somente para o Vision Scanner…' });
      try {
        await this.engine.start((progress, message) => this.callbacks.onLoading?.({ progress, message }));
      } catch (error) {
        this.callbacks.onStatus?.({ state: 'error', message: error?.message || 'Falha ao carregar detector.' });
      }
    } else {
      this.callbacks.onStatus?.({ state: 'ready', backend: 'DEMO', delegate: 'SIMULADO', message: 'Cena demonstrativa sem câmera.' });
    }
    this.newMission(false);
    this.callbacks.onActivity?.({ id: this.activity, ...SCANNER_ACTIVITIES[this.activity] });
  }

  stop() {
    this.active = false;
    this.engine?.stop();
    window.removeEventListener('resize', this.boundResize);
    this.clearCanvas();
  }

  async dispose() {
    this.stop();
    await this.engine?.dispose?.();
    this.engine = null;
    this.tracker.reset();
    this.detections = [];
    this.relations = [];
    this.shape = null;
  }

  setMirror(value) { this.mirror = Boolean(value); }
  setQuality(value) { this.quality = value; this.engine?.setQuality(value); }
  setConfidence(value) { this.confidence = clamp(Number(value) || 0.38, 0.2, 0.85); }

  setActivity(activity) {
    if (!SCANNER_ACTIVITIES[activity]) return;
    this.activity = activity;
    this.shape = null;
    this.holdStartedAt = 0;
    this.missionProgress = 0;
    this.newMission(false);
    this.callbacks.onActivity?.({ id: activity, ...SCANNER_ACTIVITIES[activity] });
  }

  togglePause(force) {
    this.paused = force == null ? !this.paused : Boolean(force);
    if (this.paused) this.engine?.stop();
    else this.engine?.start?.(() => {}).catch(() => {});
    this.callbacks.onStatus?.({ state: this.paused ? 'paused' : 'ready', message: this.paused ? 'Scanner pausado.' : 'Scanner em execução.' });
    return this.paused;
  }

  newMission(announce = true) {
    const previous = this.mission?.id;
    if (this.activity === 'object') this.mission = { type: 'object', ...randomFrom(OBJECT_MISSIONS, previous) };
    else if (this.activity === 'color') this.mission = { type: 'color', ...randomFrom(COLOR_PALETTE.filter((item) => !['black', 'white', 'gray'].includes(item.id)), previous) };
    else if (this.activity === 'shape') this.mission = { type: 'shape', ...randomFrom(SHAPE_MISSIONS, previous) };
    else if (this.activity === 'actions') this.mission = { type: 'action', ...randomFrom(ACTION_MISSIONS, previous) };
    else this.mission = null;
    this.holdStartedAt = 0;
    this.missionProgress = 0;
    if (this.mission) this.callbacks.onMission?.({ ...this.mission, announce });
    return this.mission;
  }

  handleStatus(status) {
    this.callbacks.onStatus?.(status);
  }

  handleDetections(result) {
    if (!this.active || this.paused) return;
    const normalized = normalizeDetections(result.detections, result.width, result.height).filter((item) => item.score >= this.confidence);
    this.detections = this.tracker.update(normalized);
    this.lastResultAt = performance.now();
    this.enrichColors();
    this.sceneSummary = summarizeScene(this.detections);
  }

  enrichColors() {
    const now = performance.now();
    if (!this.engine || now - this.lastColorAt < 550 || !this.detections.length) return;
    this.lastColorAt = now;
    const frame = this.engine.getFrameImageData(240, 135);
    if (!frame) return;
    for (const detection of this.detections.slice(0, 10)) {
      detection.color = analyzeDominantColor(frame.data, frame.width, frame.height, detection.bbox);
    }
  }

  update(input = {}, now = performance.now()) {
    if (!this.active) return;
    this.latestInput = input;
    const poses = input.poses || [];
    const hands = input.hands || [];
    const bodyResults = poses.slice(0, 2).map((pose, index) => this.bodyAnalyzers[index].update(pose, now));
    this.people = countPeople(this.detections, poses);
    const interactionDetections = this.mirror
      ? this.detections.map((item) => ({ ...item, bbox: this.displayBox(item.bbox) }))
      : this.detections;
    this.relations = associateHandsWithObjects(interactionDetections, hands);
    this.actions = new Set();
    bodyResults.forEach((result) => {
      result.actions?.forEach((action) => this.actions.add(action));
      result.events?.forEach((event) => this.actions.add(event));
    });
    const hug = detectProbableHug(poses);
    const handshake = detectProbableHandshake(poses);
    if (hug.detected) this.actions.add('hug');
    if (handshake.detected) this.actions.add('handshake');
    this.actionConfidence.set('hug', hug.confidence);
    this.actionConfidence.set('handshake', handshake.confidence);
    this.relations.forEach((relation) => this.actions.add(`holding:${relation.label}`));

    if (this.activity === 'shape' && now - this.lastShapeAt > 460) {
      this.lastShapeAt = now;
      const frame = this.engine?.getFrameImageData(200, 112);
      this.shape = frame ? analyzeSimpleShape(frame.data, frame.width, frame.height) : null;
    }
    if (this.demo && !this.detections.length) this.applyDemoScene(now);
    this.evaluateMission(now);
    this.render(now);
    this.callbacks.onScene?.(this.snapshot());
  }

  applyDemoScene(now) {
    const phase = (now / 1800) % 1;
    this.detections = [
      { id: 'demo-person', rawLabel: 'person', label: 'pessoa', score: .96, bbox: { x: .36, y: .12, width: .28, height: .76 }, color: { id: 'blue', label: 'azul', confidence: .62, hex: '#3d74cf' } },
      { id: 'demo-bottle', rawLabel: 'bottle', label: 'garrafa', score: .88, bbox: { x: .68 + Math.sin(phase * Math.PI * 2) * .03, y: .5, width: .1, height: .3 }, color: { id: 'blue', label: 'azul', confidence: .8, hex: '#2386d1' } },
      { id: 'demo-chair', rawLabel: 'chair', label: 'cadeira', score: .78, bbox: { x: .08, y: .48, width: .24, height: .4 }, color: { id: 'gray', label: 'cinza', confidence: .7, hex: '#737a82' } }
    ];
    this.people = 1;
    this.sceneSummary = summarizeScene(this.detections);
    if (this.activity === 'shape') this.shape = { id: 'circle', label: 'círculo', confidence: .88, bbox: { x: .37, y: .27, width: .26, height: .46 } };
  }

  missionCondition() {
    if (!this.mission) return false;
    if (this.mission.type === 'object') return this.detections.some((item) => item.rawLabel === this.mission.raw && item.score >= this.confidence);
    if (this.mission.type === 'color') return this.detections.some((item) => item.color?.id === this.mission.id && scoreColor(item.color) >= 28);
    if (this.mission.type === 'shape') {
      if (!this.shape) return false;
      if (this.mission.id === 'square') return ['square'].includes(this.shape.id) && this.shape.confidence >= .5;
      return this.shape.id === this.mission.id && this.shape.confidence >= .48;
    }
    if (this.mission.type === 'action') return this.actions.has(this.mission.id);
    return false;
  }

  evaluateMission(now) {
    if (!this.mission) { this.missionProgress = 0; return; }
    if (this.missionCondition()) {
      if (!this.holdStartedAt) this.holdStartedAt = now;
      const required = this.mission.type === 'action' && ['jump', 'clap'].includes(this.mission.id) ? 120 : 850;
      this.missionProgress = clamp((now - this.holdStartedAt) / required, 0, 1);
      if (this.missionProgress >= 1) this.completeMission();
    } else {
      this.holdStartedAt = 0;
      this.missionProgress = Math.max(0, this.missionProgress - .08);
    }
    this.callbacks.onProgress?.({ progress: this.missionProgress, score: this.score, completed: this.completed });
  }

  completeMission() {
    const mission = this.mission;
    const points = mission.type === 'action' ? 160 : mission.type === 'shape' ? 130 : 110;
    const xp = mission.type === 'action' ? 28 : 20;
    this.score += points;
    this.completed += 1;
    this.missionProgress = 0;
    this.holdStartedAt = 0;
    this.callbacks.onComplete?.({ mission, points, xp, score: this.score, completed: this.completed });
    setTimeout(() => { if (this.active && this.mission === mission) this.newMission(); }, 850);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality === 'turbo' ? 1.75 : 1.35);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
  }

  clearCanvas() { if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }

  displayBox(box) {
    return this.mirror ? { x: 1 - box.x - box.width, y: box.y, width: box.width, height: box.height } : box;
  }

  render(now) {
    if (!this.ctx || !this.canvas) return;
    this.resize();
    const ctx = this.ctx, width = this.canvas.width, height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.lineWidth = Math.max(2, width / 520);
    ctx.font = `${Math.max(11, Math.round(width / 78))}px ui-monospace, monospace`;
    const pulse = .65 + Math.sin(now / 180) * .25;
    for (const detection of this.detections) {
      const box = this.displayBox(detection.bbox);
      const x = box.x * width, y = box.y * height, w = box.width * width, h = box.height * height;
      const target = this.mission?.type === 'object' && detection.rawLabel === this.mission.raw;
      const color = detection.rawLabel === 'person' ? '#a855f7' : target ? '#facc15' : '#00e5ff';
      ctx.strokeStyle = color; ctx.globalAlpha = target ? pulse : .82;
      ctx.strokeRect(x, y, w, h);
      const label = `${detection.label.toUpperCase()} ${Math.round(detection.score * 100)}%${detection.color ? ` · ${detection.color.label}` : ''}`;
      const textWidth = ctx.measureText(label).width + 14;
      ctx.fillStyle = 'rgba(2,8,20,.82)'; ctx.fillRect(x, Math.max(0, y - 24), Math.min(textWidth, width - x), 23);
      ctx.fillStyle = color; ctx.fillText(label, x + 7, Math.max(15, y - 8));
      ctx.globalAlpha = 1;
    }
    for (const relation of this.relations) {
      const object = this.detections.find((item) => item.id === relation.objectId);
      if (!object) continue;
      const handX = relation.hand.x * width;
      const handY = relation.hand.y * height;
      const box = this.displayBox(object.bbox);
      const objectX = (box.x + box.width / 2) * width, objectY = (box.y + box.height / 2) * height;
      ctx.strokeStyle = '#22c55e'; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(objectX, objectY); ctx.stroke(); ctx.setLineDash([]);
    }
    if (this.activity === 'shape') {
      ctx.strokeStyle = 'rgba(250,204,21,.75)'; ctx.setLineDash([12, 9]);
      ctx.strokeRect(width * .28, height * .18, width * .44, height * .64); ctx.setLineDash([]);
      if (this.shape) {
        const box = this.displayBox(this.shape.bbox);
        ctx.strokeStyle = '#facc15'; ctx.lineWidth *= 1.5; ctx.strokeRect(box.x * width, box.y * height, box.width * width, box.height * height);
        ctx.fillStyle = '#facc15'; ctx.fillText(`${this.shape.label.toUpperCase()} ${Math.round(this.shape.confidence * 100)}%`, box.x * width + 6, box.y * height + 18);
      }
    }
    ctx.restore();
  }

  snapshot() {
    return {
      activity: this.activity,
      activityInfo: SCANNER_ACTIVITIES[this.activity],
      detections: this.detections,
      summary: this.sceneSummary,
      people: this.people,
      relations: this.relations,
      actions: [...this.actions],
      actionLabels: [...this.actions].map((id) => id.startsWith('holding:') ? `Segurando ${id.slice(8)}` : BODY_ACTION_LABELS[id] || (id === 'hug' ? 'Abraço provável' : id === 'handshake' ? 'Aperto de mãos provável' : id)),
      shape: this.shape,
      mission: this.mission,
      progress: this.missionProgress,
      score: this.score,
      completed: this.completed,
      stats: this.stats,
      paused: this.paused
    };
  }
}
