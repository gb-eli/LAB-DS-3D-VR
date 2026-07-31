const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

export class AuraGame {
  constructor(canvas, { onScore = () => {}, onLevel = () => {} } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    this.onScore = onScore;
    this.onLevel = onLevel;
    this.active = false;
    this.energy = 0;
    this.score = 0;
    this.level = 0;
    this.particles = [];
    this.lastAt = performance.now();
    this.lastEmitAt = 0;
    this.width = 1;
    this.height = 1;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.35);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  setActive(active) {
    this.active = Boolean(active);
    this.canvas.classList.toggle("active-aura", this.active);
    if (!this.active) this.clear();
  }

  reset() {
    this.energy = 0;
    this.score = 0;
    this.level = 0;
    this.particles = [];
    this.onScore({ energy: 0, score: 0, level: 0 });
  }

  clear() { this.ctx.clearRect(0, 0, this.width, this.height); }

  emit(x, y, amount, energy) {
    const count = Math.min(18, Math.max(2, Math.round(amount)));
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * (70 + energy * 0.6);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0.55 + Math.random() * 0.75,
        maxLife: 1.3,
        size: 1.5 + Math.random() * 4,
        hue: 180 + energy * 1.45 + Math.random() * 45
      });
    }
    if (this.particles.length > 460) this.particles.splice(0, this.particles.length - 460);
  }

  update(display = {}, body = {}, now = performance.now()) {
    if (!this.active) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastAt) / 1000));
    this.lastAt = now;
    const pose = display.poses?.[0] || [];
    const movement = clamp((body.movement || 0) * 85, 0, 9);
    let bonus = 0;
    if (body.actions?.has("hands_up")) bonus += 2.4;
    if (body.actions?.has("arms_open")) bonus += 1.7;
    if (body.actions?.has("hands_together")) bonus += 1.2;
    if (body.events?.has("jump")) bonus += 12;
    if (body.events?.has("clap")) bonus += 8;
    const handMotion = (display.gestures || []).reduce((sum, gesture) => sum + clamp((gesture?.motion?.speed || 0) * 3.5, 0, 4), 0);
    const gain = movement + bonus + handMotion;
    this.energy = clamp(this.energy + gain * dt * 12 - dt * 3.2, 0, 100);
    this.score += Math.round(gain * dt * 18);
    const level = Math.min(5, Math.floor(this.energy / 20));
    if (level !== this.level) {
      this.level = level;
      this.onLevel({ level, energy: this.energy, score: this.score });
    }
    this.onScore({ energy: Math.round(this.energy), score: this.score, level: this.level });

    const wrists = [pose[15], pose[16]].filter(Boolean);
    if (now - this.lastEmitAt > 44 && wrists.length) {
      wrists.forEach((point) => this.emit(point.x * this.width, point.y * this.height, 2 + gain, this.energy));
      this.lastEmitAt = now;
    }
    this.draw(pose, dt);
  }

  draw(pose, dt) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const bodyPoints = [0, 11, 12, 15, 16, 23, 24, 25, 26, 27, 28].map((id) => pose[id]).filter(Boolean);
    if (bodyPoints.length) {
      const cx = bodyPoints.reduce((sum, point) => sum + point.x, 0) / bodyPoints.length * this.width;
      const cy = bodyPoints.reduce((sum, point) => sum + point.y, 0) / bodyPoints.length * this.height;
      const radius = 70 + this.energy * 2.2;
      const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, radius);
      gradient.addColorStop(0, `hsla(${190 + this.energy * 1.2}, 100%, 72%, ${0.1 + this.energy / 850})`);
      gradient.addColorStop(0.45, `hsla(${220 + this.energy}, 100%, 58%, ${0.08 + this.energy / 1100})`);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      for (let ring = 0; ring < 3; ring += 1) {
        ctx.strokeStyle = `hsla(${185 + this.energy * 1.3 + ring * 25},100%,70%,${0.08 + this.energy / 620})`;
        ctx.lineWidth = 1 + ring * 0.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius * (0.55 + ring * 0.18), radius * (0.22 + ring * 0.08), performance.now() * 0.00025 * (ring % 2 ? -1 : 1), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    this.particles.forEach((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.985;
      particle.vy = lerp(particle.vy, -12, dt * 0.8);
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = `hsla(${particle.hue},100%,70%,${alpha})`;
      ctx.shadowColor = `hsl(${particle.hue},100%,60%)`;
      ctx.shadowBlur = 10 + this.energy * 0.12;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    this.particles = this.particles.filter((particle) => particle.life > 0);
    ctx.restore();
  }
}
