export class DrawEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    this.color = "#00e5ff";
    this.size = 7;
    this.active = false;
    this.lastPoint = null;
    this.lastMode = "idle";
    this.history = [];
    this.maxHistory = 10;
    this.resizeObserver = new ResizeObserver(() => this.resize(true));
    this.resizeObserver.observe(canvas.parentElement);
    this.resize(false);
  }

  resize(preserve = true) {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.35);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width === width && this.canvas.height === height) return;
    let snapshot = null;
    if (preserve && this.canvas.width && this.canvas.height) {
      snapshot = document.createElement("canvas");
      snapshot.width = this.canvas.width;
      snapshot.height = this.canvas.height;
      snapshot.getContext("2d").drawImage(this.canvas, 0, 0);
    }
    this.canvas.width = width;
    this.canvas.height = height;
    this.ratio = ratio;
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (snapshot) this.ctx.drawImage(snapshot, 0, 0, snapshot.width / ratio, snapshot.height / ratio);
  }

  setActive(active) {
    this.active = Boolean(active);
    this.lastPoint = null;
    this.lastMode = "idle";
  }

  setColor(color) { this.color = color; }
  setSize(size) { this.size = Number(size) || 7; }

  saveHistory() {
    const snapshot = document.createElement("canvas");
    snapshot.width = this.canvas.width;
    snapshot.height = this.canvas.height;
    snapshot.getContext("2d").drawImage(this.canvas, 0, 0);
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
  }

  update(hand, gesture) {
    if (!this.active || !hand?.[8]) {
      this.lastPoint = null;
      this.lastMode = "idle";
      return;
    }
    const point = { x: hand[8].x * this.cssWidth, y: hand[8].y * this.cssHeight };
    const mode = gesture?.type === "pinch" ? "draw" : gesture?.type === "fist" ? "erase" : "idle";
    if (mode === "idle") {
      this.lastPoint = null;
      this.lastMode = mode;
      return;
    }
    if (mode !== this.lastMode) {
      this.saveHistory();
      this.lastPoint = point;
      this.lastMode = mode;
      return;
    }
    if (!this.lastPoint) {
      this.lastPoint = point;
      return;
    }

    const distance = Math.hypot(point.x - this.lastPoint.x, point.y - this.lastPoint.y);
    if (distance > 120) {
      this.lastPoint = point;
      return;
    }

    const mid = { x: (this.lastPoint.x + point.x) / 2, y: (this.lastPoint.y + point.y) / 2 };
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.shadowBlur = 0;
      ctx.lineWidth = Math.max(24, this.size * 3.2);
    } else {
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 16;
      ctx.lineWidth = this.size;
    }
    ctx.beginPath();
    ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
    ctx.quadraticCurveTo(this.lastPoint.x, this.lastPoint.y, mid.x, mid.y);
    ctx.stroke();
    ctx.restore();
    this.lastPoint = point;
  }

  drawWithPointer(x, y, drawing, erasing = false) {
    const fake = Array.from({ length: 21 }, () => ({ x: x / this.cssWidth, y: y / this.cssHeight, z: 0 }));
    fake[8] = { x: x / this.cssWidth, y: y / this.cssHeight, z: 0 };
    this.update(fake, { type: erasing ? "fist" : drawing ? "pinch" : "open" });
  }

  undo() {
    const snapshot = this.history.pop();
    if (!snapshot) return false;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(snapshot, 0, 0);
    this.ctx.restore();
    this.lastPoint = null;
    return true;
  }

  clear() {
    this.saveHistory();
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.lastPoint = null;
  }

  exportPng() {
    const output = document.createElement("canvas");
    output.width = this.canvas.width;
    output.height = this.canvas.height;
    const ctx = output.getContext("2d");
    ctx.fillStyle = "#03101e";
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.drawImage(this.canvas, 0, 0);
    const link = document.createElement("a");
    link.download = `holodraw-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.png`;
    link.href = output.toDataURL("image/png");
    link.click();
  }
}
