const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class DefenderGame {
  constructor({ canvas, callbacks = {} } = {}) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.callbacks = callbacks;
    this.active = false;
    this.targets = [];
    this.score = 0;
    this.combo = 0;
    this.lastSpawnAt = 0;
    this.startedAt = 0;
    this.duration = 60_000;
    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    this.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  start() {
    this.active = true; this.targets = []; this.score = 0; this.combo = 0;
    this.startedAt = performance.now(); this.lastSpawnAt = 0;
    this.callbacks.onStart?.();
  }
  stop() { this.active = false; this.clear(); }
  dispose() { this.stop(); window.removeEventListener('resize', this.resize); this.callbacks = {}; }
  clear() { if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight); }

  spawn(width, height) {
    const side = Math.random() > .5 ? 1 : -1;
    this.targets.push({
      x: side > 0 ? -40 : width + 40,
      y: height * (.2 + Math.random() * .62),
      vx: side * (90 + Math.random() * 95),
      r: 13 + Math.random() * 13,
      hue: 180 + Math.random() * 130,
      life: 1
    });
  }

  getHands(display) {
    return (display.hands || []).slice(0, 2).map((hand, index) => {
      const point = hand[9] || hand[0];
      const gesture = display.gestures?.[index];
      return point ? { x: point.x, y: point.y, shield: gesture?.type === 'open', blast: ['fist','pinch'].includes(gesture?.type) } : null;
    }).filter(Boolean);
  }

  update(display, body, now = performance.now()) {
    if (!this.active || !this.ctx || !this.canvas) return;
    const width = this.canvas.clientWidth; const height = this.canvas.clientHeight;
    const elapsed = now - this.startedAt; const remaining = Math.max(0, this.duration - elapsed);
    if (!remaining) {
      this.active = false;
      this.callbacks.onComplete?.({ score: this.score, combo: this.combo, xp: 70 + Math.round(this.score / 500) });
      return;
    }
    if (now - this.lastSpawnAt > Math.max(420, 1050 - elapsed / 80)) {
      this.spawn(width, height); this.lastSpawnAt = now;
    }
    const dt = 1 / 60;
    const hands = this.getHands(display);
    const bodyShield = body?.actions?.has('guard') || body?.actions?.has('arms_crossed');
    this.targets.forEach((target) => {
      target.x += target.vx * dt;
      hands.forEach((hand) => {
        const hx = hand.x * width; const hy = hand.y * height;
        const distance = Math.hypot(hx - target.x, hy - target.y);
        if (distance < target.r + (hand.shield ? 72 : 38) && (hand.shield || hand.blast)) {
          target.life = 0;
          this.combo += 1;
          const gained = 100 + this.combo * 15;
          this.score += gained;
          this.callbacks.onHit?.({ gained, score: this.score, combo: this.combo, type: hand.shield ? 'shield' : 'blast', xp: 3 });
        }
      });
      if (bodyShield && Math.abs(target.x - width / 2) < 90) {
        target.life = 0; this.combo += 1; this.score += 150;
        this.callbacks.onHit?.({ gained: 150, score: this.score, combo: this.combo, type: 'body', xp: 4 });
      }
      if (target.x < -80 || target.x > width + 80) {
        if (target.life > 0) { this.combo = 0; this.callbacks.onMiss?.({ score: this.score }); }
        target.life = 0;
      }
    });
    this.targets = this.targets.filter((target) => target.life > 0);
    this.draw(width, height, hands, bodyShield);
    this.callbacks.onProgress?.({ score: this.score, combo: this.combo, remaining, targets: this.targets.length });
  }

  draw(width, height, hands, bodyShield) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.targets.forEach((target) => {
      const glow = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, target.r * 2.6);
      glow.addColorStop(0, `hsla(${target.hue},100%,80%,1)`);
      glow.addColorStop(.35, `hsla(${target.hue},100%,55%,.8)`);
      glow.addColorStop(1, `hsla(${target.hue},100%,45%,0)`);
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(target.x, target.y, target.r * 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `hsl(${target.hue} 100% 72%)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2); ctx.stroke();
    });
    hands.forEach((hand) => {
      const x = hand.x * width; const y = hand.y * height; const radius = hand.shield ? 72 : 34;
      ctx.strokeStyle = hand.shield ? '#65e7ff' : '#ff6ae7'; ctx.lineWidth = hand.shield ? 5 : 3;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = .15; ctx.fillStyle = hand.shield ? '#36d8ff' : '#ff4fd8'; ctx.fill(); ctx.globalAlpha = 1;
    });
    if (bodyShield) {
      ctx.strokeStyle = '#9b8cff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(width / 2, height * .52, 105, Math.PI, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}
