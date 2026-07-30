const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const pointSegmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length2 = dx * dx + dy * dy || 1;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / length2, 0, 1);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

export class SaberGame {
  constructor(canvas, { onScore = () => {}, onHit = () => {}, onMiss = () => {} } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onScore = onScore;
    this.onHit = onHit;
    this.onMiss = onMiss;
    this.active = false;
    this.targets = [];
    this.score = 0;
    this.combo = 0;
    this.lastSpawnAt = 0;
    this.sabers = [];
    this.width = 1;
    this.height = 1;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setActive(active) {
    this.active = active;
    if (active) this.reset();
    else this.clear();
  }

  reset() {
    this.targets = [];
    this.score = 0;
    this.combo = 0;
    this.lastSpawnAt = 0;
    this.onScore({ score: 0, combo: 0, hits: 0 });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(1.5, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.width = rect.width;
    this.height = rect.height;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  clear() { this.ctx.clearRect(0, 0, this.width, this.height); }

  update({ pose = [], gestures = [] } = {}, now = performance.now()) {
    if (!this.active) return;
    this.sabers = [];
    const makeSaber = (elbowId, wristId, color) => {
      const elbow = pose[elbowId], wrist = pose[wristId];
      if (!elbow || !wrist || (elbow.visibility ?? 1) < 0.4 || (wrist.visibility ?? 1) < 0.4) return;
      const a = { x: elbow.x * this.width, y: elbow.y * this.height };
      const wristPoint = { x: wrist.x * this.width, y: wrist.y * this.height };
      const dx = wristPoint.x - a.x, dy = wristPoint.y - a.y;
      const length = Math.hypot(dx, dy) || 1;
      const extension = Math.max(105, length * 2.25);
      const b = { x: wristPoint.x + dx / length * extension, y: wristPoint.y + dy / length * extension };
      this.sabers.push({ a: wristPoint, b, color });
    };
    makeSaber(13, 15, "#00e5ff");
    makeSaber(14, 16, "#ff4fd8");
    if (!this.sabers.length && gestures[0]?.palm) {
      const p = gestures[0].palm;
      this.sabers.push({ a: { x: p.x * this.width, y: p.y * this.height + 30 }, b: { x: p.x * this.width, y: p.y * this.height - 135 }, color: "#00e5ff" });
    }

    if (now - this.lastSpawnAt > Math.max(520, 1050 - this.score * 0.06)) {
      this.targets.push({ x: 40 + Math.random() * Math.max(40, this.width - 80), y: -24, r: 17 + Math.random() * 10, vy: 80 + Math.random() * 80, spin: Math.random() * Math.PI, hit: false });
      this.lastSpawnAt = now;
    }

    const dt = 1 / 60;
    for (const target of this.targets) {
      target.y += target.vy * dt;
      target.spin += dt * 3;
      if (!target.hit && this.sabers.some((saber) => pointSegmentDistance(target, saber.a, saber.b) < target.r + 8)) {
        target.hit = true;
        this.combo += 1;
        this.score += 100 + this.combo * 18;
        this.onHit({ score: this.score, combo: this.combo, target });
        this.onScore({ score: this.score, combo: this.combo });
      }
    }
    const missed = this.targets.filter((target) => !target.hit && target.y - target.r > this.height).length;
    if (missed) {
      this.combo = 0;
      this.onMiss({ missed, score: this.score, combo: this.combo });
      this.onScore({ score: this.score, combo: this.combo });
    }
    this.targets = this.targets.filter((target) => !target.hit && target.y - target.r <= this.height);
  }

  loop() {
    this.resize();
    this.clear();
    if (this.active) this.render();
    requestAnimationFrame(this.loop);
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const target of this.targets) {
      const glow = ctx.createRadialGradient(target.x, target.y, 2, target.x, target.y, target.r * 1.8);
      glow.addColorStop(0, "rgba(255,255,255,.95)");
      glow.addColorStop(.28, "rgba(255,181,71,.8)");
      glow.addColorStop(1, "rgba(255,73,216,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(target.x, target.y, target.r * 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffcf65"; ctx.lineWidth = 2; ctx.shadowColor = "#ff6b00"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(target.x - target.r * .7, target.y); ctx.lineTo(target.x + target.r * .7, target.y); ctx.stroke();
    }
    for (const saber of this.sabers) {
      ctx.strokeStyle = saber.color; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.shadowColor = saber.color; ctx.shadowBlur = 28;
      ctx.beginPath(); ctx.moveTo(saber.a.x, saber.a.y); ctx.lineTo(saber.b.x, saber.b.y); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 3; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(saber.a.x, saber.a.y); ctx.lineTo(saber.b.x, saber.b.y); ctx.stroke();
      ctx.fillStyle = "#1a2938"; ctx.shadowBlur = 5; ctx.beginPath(); ctx.arc(saber.a.x, saber.a.y, 8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}
