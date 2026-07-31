const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const dist = (a, b) => a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Infinity;
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export const OBJECT_LABELS_PT = Object.freeze({
  person: 'pessoa', bicycle: 'bicicleta', car: 'carro', motorcycle: 'motocicleta', airplane: 'avião', bus: 'ônibus', train: 'trem', truck: 'caminhão', boat: 'barco',
  'traffic light': 'semáforo', 'fire hydrant': 'hidrante', 'stop sign': 'placa de pare', 'parking meter': 'parquímetro', bench: 'banco', bird: 'pássaro', cat: 'gato', dog: 'cachorro', horse: 'cavalo', sheep: 'ovelha', cow: 'vaca', elephant: 'elefante', bear: 'urso', zebra: 'zebra', giraffe: 'girafa',
  backpack: 'mochila', umbrella: 'guarda-chuva', handbag: 'bolsa', tie: 'gravata', suitcase: 'mala', frisbee: 'frisbee', skis: 'esquis', snowboard: 'prancha de neve', 'sports ball': 'bola', kite: 'pipa', 'baseball bat': 'taco', 'baseball glove': 'luva', skateboard: 'skate', surfboard: 'prancha', 'tennis racket': 'raquete',
  bottle: 'garrafa', 'wine glass': 'taça', cup: 'copo', fork: 'garfo', knife: 'faca', spoon: 'colher', bowl: 'tigela', banana: 'banana', apple: 'maçã', sandwich: 'sanduíche', orange: 'laranja', broccoli: 'brócolis', carrot: 'cenoura', 'hot dog': 'cachorro-quente', pizza: 'pizza', donut: 'rosquinha', cake: 'bolo',
  chair: 'cadeira', couch: 'sofá', 'potted plant': 'planta', bed: 'cama', 'dining table': 'mesa', toilet: 'vaso sanitário', tv: 'tela/televisão', laptop: 'notebook', mouse: 'mouse', remote: 'controle remoto', keyboard: 'teclado', 'cell phone': 'celular', microwave: 'micro-ondas', oven: 'forno', toaster: 'torradeira', sink: 'pia', refrigerator: 'geladeira', book: 'livro', clock: 'relógio', vase: 'vaso', scissors: 'tesoura', 'teddy bear': 'urso de pelúcia', 'hair drier': 'secador', toothbrush: 'escova de dentes'
});

export const COLOR_PALETTE = Object.freeze([
  { id: 'red', label: 'vermelho', rgb: [220, 45, 55] },
  { id: 'orange', label: 'laranja', rgb: [235, 125, 35] },
  { id: 'yellow', label: 'amarelo', rgb: [235, 210, 45] },
  { id: 'green', label: 'verde', rgb: [55, 165, 80] },
  { id: 'cyan', label: 'ciano', rgb: [45, 190, 205] },
  { id: 'blue', label: 'azul', rgb: [55, 95, 210] },
  { id: 'purple', label: 'roxo', rgb: [145, 65, 195] },
  { id: 'pink', label: 'rosa', rgb: [225, 90, 155] },
  { id: 'brown', label: 'marrom', rgb: [125, 85, 55] },
  { id: 'black', label: 'preto', rgb: [28, 32, 38] },
  { id: 'gray', label: 'cinza', rgb: [125, 130, 138] },
  { id: 'white', label: 'branco', rgb: [225, 228, 232] }
]);

export function translateObjectLabel(label = '') {
  const key = String(label).trim().toLowerCase();
  return OBJECT_LABELS_PT[key] || key.replaceAll('_', ' ') || 'objeto';
}

export function normalizeDetections(detections = [], frameWidth = 1, frameHeight = 1) {
  return detections.map((item, index) => {
    const box = item.boundingBox || item.bbox || {};
    const category = item.categories?.[0] || item.category || {};
    const rawLabel = category.categoryName || category.displayName || item.label || 'object';
    return {
      id: item.id || `detection-${index}`,
      rawLabel,
      label: translateObjectLabel(rawLabel),
      score: Number(category.score ?? item.score ?? 0),
      bbox: {
        x: clamp(Number(box.originX ?? box.x ?? 0) / Math.max(1, frameWidth), 0, 1),
        y: clamp(Number(box.originY ?? box.y ?? 0) / Math.max(1, frameHeight), 0, 1),
        width: clamp(Number(box.width ?? 0) / Math.max(1, frameWidth), 0, 1),
        height: clamp(Number(box.height ?? 0) / Math.max(1, frameHeight), 0, 1)
      }
    };
  }).filter((item) => item.bbox.width > 0.005 && item.bbox.height > 0.005);
}

export function boxIou(a, b) {
  if (!a || !b) return 0;
  const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width), y2 = Math.min(a.y + a.height, b.y + b.height);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

export class DetectionTracker {
  constructor({ maxMisses = 8, smoothing = 0.58 } = {}) {
    this.maxMisses = maxMisses;
    this.smoothing = smoothing;
    this.tracks = new Map();
    this.nextId = 1;
  }

  reset() { this.tracks.clear(); this.nextId = 1; }

  update(detections = []) {
    const unmatched = new Set(this.tracks.keys());
    const output = [];
    for (const detection of detections) {
      let matchId = null;
      let best = 0.16;
      for (const [id, track] of this.tracks) {
        if (track.rawLabel !== detection.rawLabel || !unmatched.has(id)) continue;
        const score = boxIou(track.bbox, detection.bbox);
        if (score > best) { best = score; matchId = id; }
      }
      if (!matchId) matchId = `obj-${this.nextId++}`;
      const previous = this.tracks.get(matchId);
      const mix = previous ? this.smoothing : 0;
      const bbox = previous ? {
        x: previous.bbox.x * mix + detection.bbox.x * (1 - mix),
        y: previous.bbox.y * mix + detection.bbox.y * (1 - mix),
        width: previous.bbox.width * mix + detection.bbox.width * (1 - mix),
        height: previous.bbox.height * mix + detection.bbox.height * (1 - mix)
      } : { ...detection.bbox };
      const track = { ...detection, id: matchId, bbox, age: (previous?.age || 0) + 1, misses: 0 };
      this.tracks.set(matchId, track);
      unmatched.delete(matchId);
      output.push(track);
    }
    for (const id of unmatched) {
      const track = this.tracks.get(id);
      track.misses = (track.misses || 0) + 1;
      if (track.misses > this.maxMisses) this.tracks.delete(id);
    }
    return output.sort((a, b) => b.score - a.score);
  }
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

export function classifyColor(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b);
  if (v < 0.16) return 'black';
  if (s < 0.12 && v > 0.82) return 'white';
  if (s < 0.18) return 'gray';
  if (h < 15 || h >= 345) return 'red';
  if (h < 42) return v < 0.58 ? 'brown' : 'orange';
  if (h < 68) return 'yellow';
  if (h < 165) return 'green';
  if (h < 195) return 'cyan';
  if (h < 255) return 'blue';
  if (h < 310) return 'purple';
  return 'pink';
}

export function analyzeDominantColor(imageData, width, height, bbox = null) {
  if (!imageData?.length || !width || !height) return null;
  const region = bbox ? {
    x0: clamp(Math.floor(bbox.x * width), 0, width - 1),
    y0: clamp(Math.floor(bbox.y * height), 0, height - 1),
    x1: clamp(Math.ceil((bbox.x + bbox.width) * width), 1, width),
    y1: clamp(Math.ceil((bbox.y + bbox.height) * height), 1, height)
  } : { x0: 0, y0: 0, x1: width, y1: height };
  const counts = new Map();
  let rSum = 0, gSum = 0, bSum = 0, samples = 0;
  const step = Math.max(1, Math.floor(Math.sqrt(((region.x1 - region.x0) * (region.y1 - region.y0)) / 1600)));
  for (let y = region.y0; y < region.y1; y += step) {
    for (let x = region.x0; x < region.x1; x += step) {
      const i = (y * width + x) * 4;
      const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2], a = imageData[i + 3];
      if (a < 180) continue;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max - min < 5 && max > 245) continue;
      const id = classifyColor(r, g, b);
      counts.set(id, (counts.get(id) || 0) + 1);
      rSum += r; gSum += g; bSum += b; samples += 1;
    }
  }
  if (!samples) return null;
  const [id, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || ['gray', 0];
  const palette = COLOR_PALETTE.find((item) => item.id === id) || COLOR_PALETTE[10];
  const average = [Math.round(rSum / samples), Math.round(gSum / samples), Math.round(bSum / samples)];
  const hex = `#${average.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  return { id, label: palette.label, confidence: count / samples, rgb: average, hex };
}

function largestBinaryComponent(mask, width, height) {
  const visited = new Uint8Array(mask.length);
  let best = null;
  const stack = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    let area = 0, minX = width, minY = height, maxX = 0, maxY = 0, perimeter = 0, sx = 0, sy = 0;
    stack.push(start); visited[start] = 1;
    while (stack.length) {
      const index = stack.pop();
      const x = index % width, y = Math.floor(index / width);
      area += 1; sx += x; sy += y;
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      let edges = 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) { edges += 1; continue; }
        const next = ny * width + nx;
        if (!mask[next]) edges += 1;
        else if (!visited[next]) { visited[next] = 1; stack.push(next); }
      }
      perimeter += edges;
    }
    if (!best || area > best.area) best = { area, minX, minY, maxX, maxY, perimeter, cx: sx / area, cy: sy / area };
  }
  return best;
}

export function analyzeSimpleShape(imageData, width, height) {
  if (!imageData?.length || width < 16 || height < 16) return null;
  let mean = 0, count = 0;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    const value = Math.round(imageData[offset] * 0.299 + imageData[offset + 1] * 0.587 + imageData[offset + 2] * 0.114);
    gray[i] = value; mean += value; count += 1;
  }
  mean /= Math.max(1, count);
  const threshold = clamp(mean * 0.76, 45, 185);
  const mask = new Uint8Array(gray.length);
  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      const index = y * width + x;
      if (gray[index] < threshold) mask[index] = 1;
    }
  }
  const component = largestBinaryComponent(mask, width, height);
  if (!component || component.area < width * height * 0.018) return null;
  const boxWidth = component.maxX - component.minX + 1;
  const boxHeight = component.maxY - component.minY + 1;
  const extent = component.area / Math.max(1, boxWidth * boxHeight);
  const circularity = 4 * Math.PI * component.area / Math.max(1, component.perimeter * component.perimeter);
  const aspect = boxWidth / Math.max(1, boxHeight);
  let id = 'unknown', label = 'forma indefinida', confidence = 0.35;
  if (circularity > 0.68 && extent > 0.58 && extent < 0.9 && aspect > 0.72 && aspect < 1.38) {
    id = 'circle'; label = 'círculo'; confidence = clamp((circularity + (1 - Math.abs(1 - aspect))) / 2, 0, 1);
  } else if (extent > 0.72 && aspect > 0.78 && aspect < 1.28) {
    id = 'square'; label = 'quadrado'; confidence = clamp(extent, 0, 1);
  } else if (extent > 0.72) {
    id = 'rectangle'; label = 'retângulo'; confidence = clamp(extent * 0.92, 0, 1);
  } else if (extent > 0.38 && extent < 0.7 && circularity > 0.34 && circularity < 0.72) {
    id = 'triangle'; label = 'triângulo'; confidence = clamp(0.5 + (0.68 - Math.abs(extent - 0.5)) * 0.5, 0, 1);
  } else if (circularity < 0.38 && extent < 0.66) {
    id = 'star'; label = 'estrela ou forma pontiaguda'; confidence = clamp(0.42 + (0.4 - circularity), 0, 0.82);
  }
  return {
    id, label, confidence, extent, circularity, aspect,
    bbox: { x: component.minX / width, y: component.minY / height, width: boxWidth / width, height: boxHeight / height }
  };
}

export function handCenter(hand = []) {
  const points = [0, 5, 9, 13, 17].map((index) => hand[index]).filter(Boolean);
  if (!points.length) return null;
  return points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
}

function pointInside(point, box, padding = 0) {
  return point && point.x >= box.x - padding && point.x <= box.x + box.width + padding && point.y >= box.y - padding && point.y <= box.y + box.height + padding;
}

export function associateHandsWithObjects(detections = [], hands = []) {
  const relations = [];
  const objects = detections.filter((item) => item.rawLabel !== 'person');
  hands.forEach((hand, handIndex) => {
    const center = handCenter(hand);
    if (!center) return;
    let best = null;
    for (const object of objects) {
      const box = object.bbox;
      const objectCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const score = pointInside(center, box, 0.055) ? 1 : Math.max(0, 1 - dist(center, objectCenter) / 0.32);
      if (score > 0.48 && (!best || score > best.score)) best = { handIndex, objectId: object.id, label: object.label, score, hand: center, object: objectCenter };
    }
    if (best) relations.push(best);
  });
  return relations;
}

function poseCenter(pose = []) {
  const points = [pose[11], pose[12], pose[23], pose[24]].filter(Boolean);
  if (points.length < 3) return null;
  return points.reduce((sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }), { x: 0, y: 0 });
}

function shoulderWidth(pose = []) { return pose[11] && pose[12] ? dist(pose[11], pose[12]) : 0.18; }

export function detectProbableHug(poses = []) {
  if (poses.length < 2) return { detected: false, confidence: 0 };
  const [a, b] = poses;
  const ca = poseCenter(a), cb = poseCenter(b);
  if (!ca || !cb) return { detected: false, confidence: 0 };
  const scale = Math.max(0.12, (shoulderWidth(a) + shoulderWidth(b)) / 2);
  const proximity = clamp(1 - dist(ca, cb) / Math.max(0.22, scale * 2.1), 0, 1);
  const aWrap = [a[15], a[16]].filter(Boolean).some((wrist) => [b[11], b[12], b[23], b[24]].filter(Boolean).some((target) => dist(wrist, target) < scale * 0.95));
  const bWrap = [b[15], b[16]].filter(Boolean).some((wrist) => [a[11], a[12], a[23], a[24]].filter(Boolean).some((target) => dist(wrist, target) < scale * 0.95));
  const confidence = proximity * 0.62 + (aWrap ? 0.19 : 0) + (bWrap ? 0.19 : 0);
  return { detected: confidence > 0.62, confidence: clamp(confidence, 0, 1) };
}

export function detectProbableHandshake(poses = []) {
  if (poses.length < 2) return { detected: false, confidence: 0 };
  const [a, b] = poses;
  const wristPairs = [[a[15], b[15]], [a[15], b[16]], [a[16], b[15]], [a[16], b[16]]].filter(([p, q]) => p && q);
  const closest = Math.min(...wristPairs.map(([p, q]) => dist(p, q)), Infinity);
  const centers = [poseCenter(a), poseCenter(b)];
  const separation = centers.every(Boolean) ? dist(centers[0], centers[1]) : 0;
  const confidence = clamp((0.14 - closest) / 0.1, 0, 1) * clamp(separation / 0.25, 0, 1);
  return { detected: confidence > 0.58, confidence };
}

export function countPeople(detections = [], poses = []) {
  const detected = detections.filter((item) => item.rawLabel === 'person' && item.score >= 0.35).length;
  return Math.max(detected, poses.length || 0);
}

export function summarizeScene(detections = []) {
  const counts = new Map();
  for (const item of detections) counts.set(item.label, (counts.get(item.label) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
}
