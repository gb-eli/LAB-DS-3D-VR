import { PLAYER_COLORS } from "./config.js";

const TYPES = [
  { id: "circle", label: "CÍRCULOS", color: "#00d9ff" },
  { id: "square", label: "QUADRADOS", color: "#a855f7" },
  { id: "triangle", label: "TRIÂNGULOS", color: "#22c55e" }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class ShapeGame {
  constructor(canvas, {
    onScore = () => {},
    onObjective = () => {},
    onHit = () => {},
    onMiss = () => {},
    onStatus = () => {}
  } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    this.onScore = onScore;
    this.onObjective = onObjective;
    this.onHit = onHit;
    this.onMiss = onMiss;
    this.onStatus = onStatus;
    this.active = false;
    this.running = false;
    this.players = 1;
    this.captureMode = "close";
    this.shapes = [];
    this.effects = [];
    this.playerScores = [0, 0];
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.attempts = 0;
    this.level = 1;
    this.timeLeft = 60;
    this.targetIndex = 0;
    this.targetHits = 0;
    this.spawnAccumulator = 0;
    this.targetTimer = 0;
    this.lastTimestamp = performance.now();
    this.lastCaptureByZone = new Map();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const viewportWidth = globalThis.innerWidth || rect.width || 1024;
    const ratio = Math.min(globalThis.devicePixelRatio || 1, viewportWidth < 760 ? 1 : 1.2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  setPlayers(count) {
    this.players = count === 2 ? 2 : 1;
    this.start();
  }

  setCaptureMode(mode) {
    this.captureMode = mode === "touch" ? "touch" : "close";
  }

  setActive(active) {
    this.active = Boolean(active);
    this.lastTimestamp = performance.now();
    if (active && !this.running) this.start();
    if (!active) this.clear();
  }

  start() {
    this.reset();
    this.running = true;
    this.onStatus({ running: true, timeLeft: this.timeLeft, level: this.level, players: this.players });
  }

  reset() {
    this.shapes = [];
    this.effects = [];
    this.playerScores = [0, 0];
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.attempts = 0;
    this.level = 1;
    this.timeLeft = 60;
    this.targetIndex = Math.floor(Math.random() * TYPES.length);
    this.targetHits = 0;
    this.spawnAccumulator = 0;
    this.targetTimer = 0;
    this.lastCaptureByZone.clear();
    this.onObjective(this.objectiveText());
    this.emitScore();
  }

  objectiveText() {
    if (this.players === 2) return `Toque nos ${TYPES[this.targetIndex].label.toLowerCase()} com os punhos do esqueleto`;
    return this.captureMode === "touch"
      ? `Toque nos ${TYPES[this.targetIndex].label.toLowerCase()} com a mão`
      : `Feche a mão sobre ${TYPES[this.targetIndex].label.toLowerCase()}`;
  }

  nextTarget() {
    let next = this.targetIndex;
    while (next === this.targetIndex) next = Math.floor(Math.random() * TYPES.length);
    this.targetIndex = next;
    this.targetHits = 0;
    this.targetTimer = 0;
    this.onObjective(this.objectiveText());
  }

  spawnShape() {
    const targetBias = Math.random() < 0.58;
    const type = targetBias ? TYPES[this.targetIndex] : TYPES[Math.floor(Math.random() * TYPES.length)];
    const size = 27 + Math.random() * 24;
    const player = this.players === 2 ? Math.floor(Math.random() * 2) : 0;
    this.shapes.push({
      id: crypto.randomUUID?.() || `${performance.now()}-${Math.random()}`,
      type: type.id,
      color: type.color,
      player,
      x: size + Math.random() * Math.max(40, this.width - size * 2),
      y: -size - Math.random() * 90,
      size,
      speed: 88 + this.level * 17 + Math.random() * 76,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 2,
      pulse: Math.random() * Math.PI * 2,
      caught: false
    });
  }

  getHandZones(results) {
    return (results?.hands || []).map((hand, index) => {
      const gesture = results.gestures?.[index];
      const bounds = gesture?.bounds;
      const center = gesture?.palm || bounds?.center || hand?.[9] || hand?.[0];
      if (!center) return null;
      const size = bounds ? Math.max(bounds.width * this.width, bounds.height * this.height) : 70;
      const closed = ["fist", "pinch", "ok"].includes(gesture?.type);
      return {
        key: `${gesture?.handedness || "hand"}-${index}`,
        player: 0,
        x: center.x * this.width,
        y: center.y * this.height,
        radius: clamp(size * 0.42, 32, 88),
        active: this.captureMode === "touch" ? true : closed,
        justActivated: gesture?.justStarted || false,
        gesture
      };
    }).filter(Boolean);
  }

  getPoseZones(results) {
    const zones = [];
    (results?.poses || []).slice(0, this.players).forEach((pose, player) => {
      [15, 16].forEach((id, wristIndex) => {
        const point = pose?.[id];
        if (!point || (point.visibility ?? 1) < 0.45) return;
        zones.push({
          key: `P${player + 1}-wrist-${wristIndex}`,
          player,
          x: point.x * this.width,
          y: point.y * this.height,
          radius: clamp(this.width * 0.035, 28, 58),
          active: true,
          justActivated: false,
          gesture: { type: "touch", label: `JOGADOR ${player + 1}` }
        });
      });
    });
    return zones;
  }

  getCaptureZones(results) {
    if (this.players === 2) return this.getPoseZones(results);
    const hands = this.getHandZones(results);
    return hands.length ? hands : this.getPoseZones(results).slice(0, 2);
  }

  tryCapture(zones, now) {
    for (const zone of zones) {
      if (!zone.active) continue;
      const lastCapture = this.lastCaptureByZone.get(zone.key) || 0;
      const ready = zone.justActivated || now - lastCapture > (this.players === 2 ? 280 : 330);
      if (!ready) continue;
      let nearest = null;
      let nearestDistance = Infinity;
      for (const shape of this.shapes) {
        if (shape.caught) continue;
        if (this.players === 2 && shape.player !== zone.player) continue;
        const distance = Math.hypot(shape.x - zone.x, shape.y - zone.y);
        const limit = shape.size * 0.76 + zone.radius;
        if (distance <= limit && distance < nearestDistance) {
          nearest = shape;
          nearestDistance = distance;
        }
      }
      if (!nearest) continue;
      nearest.caught = true;
      this.lastCaptureByZone.set(zone.key, now);
      this.resolveCatch(nearest, zone);
    }
  }

  update(results, now = performance.now()) {
    const dt = clamp((now - this.lastTimestamp) / 1000, 0, 0.05);
    this.lastTimestamp = now;
    this.clear();
    if (!this.active) return;
    if (!this.running) {
      this.drawFinished();
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.spawnAccumulator += dt;
    this.targetTimer += dt;
    this.level = 1 + Math.floor(this.score / 1800);
    const interval = Math.max(0.38, 0.92 - this.level * 0.045);
    if (this.spawnAccumulator >= interval) {
      this.spawnAccumulator = 0;
      this.spawnShape();
    }
    if (this.targetTimer > 12) this.nextTarget();

    const zones = this.getCaptureZones(results);
    this.tryCapture(zones, now);
    const remaining = [];
    for (const shape of this.shapes) {
      shape.y += shape.speed * dt;
      shape.rotation += shape.spin * dt;
      shape.pulse += dt * 3;
      if (shape.caught) continue;
      if (shape.y - shape.size > this.height) {
        if (shape.type === TYPES[this.targetIndex].id) this.resolveMiss(shape.player);
      } else {
        remaining.push(shape);
        this.drawShape(shape);
      }
    }
    this.shapes = remaining;
    this.updateEffects(dt);
    this.drawCaptureZones(zones);
    this.drawTargetIndicator();
    this.onStatus({ running: true, timeLeft: this.timeLeft, level: this.level, players: this.players, playerScores: [...this.playerScores] });

    if (this.timeLeft <= 0) {
      this.running = false;
      this.onStatus({ running: false, timeLeft: 0, level: this.level, finished: true, players: this.players, playerScores: [...this.playerScores] });
    }
  }

  resolveCatch(shape, zone) {
    this.attempts += 1;
    const correct = shape.type === TYPES[this.targetIndex].id;
    if (correct) {
      this.hits += 1;
      this.combo += 1;
      this.targetHits += 1;
      const reward = 100 + Math.min(600, this.combo * 18);
      this.score += reward;
      this.playerScores[zone.player || 0] += reward;
      this.createBurst(shape.x, shape.y, this.players === 2 ? PLAYER_COLORS[zone.player || 0] : shape.color, 16);
      this.onHit({ x: shape.x, y: shape.y, color: shape.color, combo: this.combo, player: zone.player || 0, gesture: zone.gesture?.type });
      if (this.targetHits >= 5) this.nextTarget();
    } else {
      this.combo = 0;
      this.score = Math.max(0, this.score - 50);
      this.playerScores[zone.player || 0] = Math.max(0, this.playerScores[zone.player || 0] - 50);
      this.createBurst(shape.x, shape.y, "#fb7185", 8);
      this.onMiss({ reason: "wrong-shape", player: zone.player || 0 });
    }
    this.emitScore();
  }

  resolveMiss(player = 0) {
    this.attempts += 1;
    this.combo = 0;
    this.onMiss({ reason: "escaped", player });
    this.emitScore();
  }

  emitScore() {
    const accuracy = this.attempts ? Math.round((this.hits / this.attempts) * 100) : 100;
    this.onScore({ score: this.score, combo: this.combo, accuracy, level: this.level, playerScores: [...this.playerScores] });
  }

  createBurst(x, y, color, count) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 55 + Math.random() * 130;
      this.effects.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.55 + Math.random() * 0.35, color });
    }
  }

  updateEffects(dt) {
    const next = [];
    for (const effect of this.effects) {
      effect.life -= dt;
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      effect.vx *= 0.97;
      effect.vy *= 0.97;
      if (effect.life <= 0) continue;
      next.push(effect);
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = clamp(effect.life * 1.6, 0, 1);
      ctx.fillStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    this.effects = next;
  }

  drawCaptureZones(zones) {
    const ctx = this.ctx;
    zones.forEach((zone) => {
      const color = this.players === 2 ? PLAYER_COLORS[zone.player] : zone.active ? "#f8fafc" : "#00d9ff";
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = zone.active ? 3 : 1.4;
      ctx.globalAlpha = zone.active ? 0.9 : 0.42;
      ctx.setLineDash(zone.active ? [] : [6, 7]);
      ctx.shadowColor = color;
      ctx.shadowBlur = zone.active ? 16 : 7;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "700 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      const text = this.players === 2 ? `P${zone.player + 1}` : zone.active ? "CAPTURAR" : "FECHE A MÃO";
      ctx.fillText(text, zone.x, zone.y - zone.radius - 8);
      ctx.restore();
    });
  }

  drawTargetIndicator() {
    const type = TYPES[this.targetIndex];
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "800 13px system-ui";
    ctx.fillStyle = type.color;
    ctx.shadowColor = type.color;
    ctx.shadowBlur = 14;
    const instruction = this.players === 2 ? "TOQUE COM OS PUNHOS" : this.captureMode === "touch" ? "TOQUE COM A MÃO" : "FECHE A MÃO";
    ctx.fillText(`ALVO: ${type.label} · ${instruction}`, this.width / 2, 31);
    ctx.restore();
  }

  drawShape(shape) {
    const ctx = this.ctx;
    const glow = 12 + Math.sin(shape.pulse) * 4;
    const playerColor = this.players === 2 ? PLAYER_COLORS[shape.player] : shape.color;
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);
    ctx.strokeStyle = playerColor;
    ctx.fillStyle = `${shape.color}22`;
    ctx.lineWidth = 4;
    ctx.shadowColor = playerColor;
    ctx.shadowBlur = glow;
    ctx.beginPath();
    if (shape.type === "circle") ctx.arc(0, 0, shape.size * 0.65, 0, Math.PI * 2);
    else if (shape.type === "square") ctx.rect(-shape.size * 0.58, -shape.size * 0.58, shape.size * 1.16, shape.size * 1.16);
    else {
      ctx.moveTo(0, -shape.size * 0.72);
      ctx.lineTo(shape.size * 0.72, shape.size * 0.6);
      ctx.lineTo(-shape.size * 0.72, shape.size * 0.6);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    if (this.players === 2) {
      ctx.fillStyle = playerColor;
      ctx.font = "800 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`P${shape.player + 1}`, 0, 4);
    }
    ctx.restore();
  }

  drawFinished() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(2, 8, 20, .7)";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e9fdff";
    ctx.font = "800 28px system-ui";
    ctx.fillText("MISSÃO CONCLUÍDA", this.width / 2, this.height / 2 - 28);
    ctx.fillStyle = "#7ef3ff";
    ctx.font = "700 18px system-ui";
    ctx.fillText(`${this.score.toLocaleString("pt-BR")} pontos`, this.width / 2, this.height / 2 + 8);
    if (this.players === 2) {
      ctx.fillStyle = PLAYER_COLORS[0];
      ctx.fillText(`P1 ${this.playerScores[0].toLocaleString("pt-BR")}`, this.width / 2 - 70, this.height / 2 + 38);
      ctx.fillStyle = PLAYER_COLORS[1];
      ctx.fillText(`P2 ${this.playerScores[1].toLocaleString("pt-BR")}`, this.width / 2 + 70, this.height / 2 + 38);
    }
    ctx.restore();
  }

  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }
}

export { TYPES };
