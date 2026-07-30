import { FACE_CONTOURS, HAND_CONNECTIONS, PLAYER_COLORS, POSE_CONNECTIONS } from "./config.js";

const FINGERTIPS = new Set([4, 8, 12, 16, 20]);
const MAJOR_BODY = new Set([0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]);

export class VisionRenderer {
  constructor(canvas, { quality = "balanced" } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    this.enabled = true;
    this.detail = "auto";
    this.quality = quality;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
  }

  setQuality(quality) {
    this.quality = quality;
    this.lastWidth = 0;
    this.resize();
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (!this.enabled) this.clear();
  }

  setDetail(detail) {
    this.detail = detail || "auto";
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const cap = this.quality === "high" ? 1.35 : this.quality === "low" ? 0.9 : 1.1;
    const ratio = Math.min(devicePixelRatio || 1, cap);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (width === this.lastWidth && height === this.lastHeight) return;
    this.lastWidth = width;
    this.lastHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
    this.ratio = ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  render({ poses = [], hands = [], gestures = [], faces = [] } = {}) {
    this.resize();
    this.clear();
    if (!this.enabled) return;
    poses.forEach((pose, index) => this.drawPose(pose, PLAYER_COLORS[index % PLAYER_COLORS.length], index));
    hands.forEach((hand, index) => this.drawHand(hand, gestures[index], index));
    faces.forEach((face, index) => this.drawFace(face, PLAYER_COLORS[index % PLAYER_COLORS.length]));
  }

  drawPose(pose, color, personIndex) {
    if (!pose?.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.drawConnections(pose, POSE_CONNECTIONS, `${color}b8`, this.quality === "low" ? 1.3 : 1.8, 0.4);
    pose.forEach((point, index) => {
      if ((point.visibility ?? 1) < 0.42) return;
      const radius = MAJOR_BODY.has(index) ? 3.2 : 2;
      this.drawPoint(point, radius, color, 10);
    });
    const head = pose[0];
    if (head && (head.visibility ?? 1) > 0.4) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(2, 9, 20, .78)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const x = head.x * this.cssWidth + 12;
      const y = head.y * this.cssHeight - 14;
      ctx.fillRect(x, y, 34, 20);
      ctx.strokeRect(x, y, 34, 20);
      ctx.fillStyle = "#e8fdff";
      ctx.font = "700 11px system-ui";
      ctx.fillText(`P${personIndex + 1}`, x + 9, y + 14);
    }
    ctx.restore();
  }

  drawHand(hand, gesture, index) {
    if (!hand?.length) return;
    const color = index % 2 === 0 ? "#00e5ff" : "#ff4fd8";
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.drawConnections(hand, HAND_CONNECTIONS, `${color}dd`, this.quality === "low" ? 1.15 : 1.65, 0);
    this.drawPalm(hand, color);
    hand.forEach((point, pointIndex) => {
      const radius = FINGERTIPS.has(pointIndex) ? 3.7 : 2.1;
      this.drawPoint(point, radius, pointIndex === 8 ? "#ffffff" : color, FINGERTIPS.has(pointIndex) ? 14 : 7);
    });
    ctx.restore();
    this.drawHandPanel(gesture, color);
  }

  drawFace(face, color) {
    if (!face?.length) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const step = this.quality === "low" ? 4 : this.quality === "balanced" ? 2 : 1;
    for (let index = 0; index < face.length; index += step) {
      const point = face[index];
      if (!point) continue;
      this.drawPoint(point, this.quality === "high" ? 0.9 : 0.7, `${color}aa`, 3);
    }
    Object.values(FACE_CONTOURS).forEach((indices) => this.drawContour(face, indices, `${color}c5`));
    ctx.restore();
  }

  drawContour(points, indices, color) {
    const ctx = this.ctx;
    ctx.beginPath();
    let started = false;
    indices.forEach((index) => {
      const point = points[index];
      if (!point) return;
      const x = point.x * this.cssWidth;
      const y = point.y * this.cssHeight;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 7;
    ctx.stroke();
  }

  drawConnections(points, connections, color, width, minimumVisibility) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.shadowColor = color;
    ctx.shadowBlur = this.quality === "low" ? 4 : 8;
    connections.forEach(([fromIndex, toIndex]) => {
      const from = points[fromIndex];
      const to = points[toIndex];
      if (!from || !to) return;
      if ((from.visibility ?? 1) < minimumVisibility || (to.visibility ?? 1) < minimumVisibility) return;
      ctx.beginPath();
      ctx.moveTo(from.x * this.cssWidth, from.y * this.cssHeight);
      ctx.lineTo(to.x * this.cssWidth, to.y * this.cssHeight);
      ctx.stroke();
    });
  }

  drawPoint(point, radius, color, blur = 8) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = this.quality === "low" ? Math.min(4, blur) : blur;
    ctx.beginPath();
    ctx.arc(point.x * this.cssWidth, point.y * this.cssHeight, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPalm(hand, color) {
    const ids = [0, 5, 9, 13, 17];
    if (!ids.every((id) => hand[id])) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `${color}18`;
    ctx.strokeStyle = `${color}8f`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ids.forEach((id, index) => {
      const point = hand[id];
      const x = point.x * this.cssWidth;
      const y = point.y * this.cssHeight;
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawHandPanel(gesture, color) {
    if (!gesture?.bounds) return;
    const { bounds } = gesture;
    const x = bounds.minX * this.cssWidth;
    const y = bounds.minY * this.cssHeight;
    const width = bounds.width * this.cssWidth;
    const height = bounds.height * this.cssHeight;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = `${color}7d`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.strokeRect(x - 7, y - 7, width + 14, height + 14);
    ctx.setLineDash([]);
    const orientation = gesture.orientation?.label || "";
    const label = `${gesture.label} · ${orientation}`;
    ctx.font = "700 10px system-ui";
    const labelWidth = Math.min(this.cssWidth - 14, ctx.measureText(label).width + 14);
    const labelY = Math.max(22, y - 12);
    ctx.fillStyle = "rgba(2, 9, 20, .82)";
    ctx.fillRect(Math.max(7, x - 7), labelY - 17, labelWidth, 21);
    ctx.strokeStyle = color;
    ctx.strokeRect(Math.max(7, x - 7), labelY - 17, labelWidth, 21);
    ctx.fillStyle = "#eefeff";
    ctx.fillText(label, Math.max(14, x), labelY - 3);
    ctx.restore();
  }
}
