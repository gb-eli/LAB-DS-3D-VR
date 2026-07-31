let api = null;
let fileset = null;
let detector = null;
let delegate = 'CPU';
let config = null;
let canvas = null;
let context = null;

function post(type, payload = {}) { self.postMessage({ type, ...payload }); }

function plainDetection(detection) {
  return {
    boundingBox: detection.boundingBox ? {
      originX: Number(detection.boundingBox.originX) || 0,
      originY: Number(detection.boundingBox.originY) || 0,
      width: Number(detection.boundingBox.width) || 0,
      height: Number(detection.boundingBox.height) || 0
    } : null,
    categories: (detection.categories || []).slice(0, 3).map((category) => ({
      score: Number(category.score) || 0,
      index: Number(category.index) || 0,
      categoryName: category.categoryName || '',
      displayName: category.displayName || ''
    }))
  };
}

async function createDetector(nextDelegate) {
  detector?.close?.();
  detector = await api.ObjectDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: config.objectModel, delegate: nextDelegate },
    runningMode: 'VIDEO',
    maxResults: 24,
    scoreThreshold: 0.22
  });
  delegate = nextDelegate;
}

async function initialize(message) {
  config = message.config;
  post('progress', { progress: 12, message: 'Carregando detector de objetos…' });
  api = await import(config.moduleUrl);
  post('progress', { progress: 36, message: 'Preparando WebAssembly do scanner…' });
  fileset = await api.FilesetResolver.forVisionTasks(config.wasmPath);
  try {
    post('progress', { progress: 62, message: 'Ativando aceleração gráfica…' });
    await createDetector('GPU');
  } catch (error) {
    post('progress', { progress: 68, message: 'GPU indisponível. Ajustando detector para CPU…' });
    await createDetector('CPU');
  }
  post('progress', { progress: 100, message: 'Vision Scanner pronto.' });
  post('ready', { delegate });
}

function ensureCanvas(bitmap) {
  if (!canvas || canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
    canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    context = canvas.getContext('2d', { alpha: false, desynchronized: true });
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function process(message) {
  const started = performance.now();
  try {
    const source = ensureCanvas(message.bitmap);
    const result = detector.detectForVideo(source, message.timestamp);
    post('result', {
      requestId: message.requestId,
      timestamp: message.timestamp,
      width: source.width,
      height: source.height,
      duration: performance.now() - started,
      detections: (result.detections || []).map(plainDetection)
    });
  } catch (error) {
    post('processing-error', { requestId: message.requestId, message: error?.message || String(error) });
  } finally {
    message.bitmap?.close?.();
  }
}

self.addEventListener('message', async (event) => {
  const message = event.data || {};
  try {
    if (message.type === 'init') await initialize(message);
    else if (message.type === 'process') await process(message);
    else if (message.type === 'close') { detector?.close?.(); detector = null; }
  } catch (error) {
    post('fatal-error', { message: error?.message || String(error), stack: error?.stack || '' });
  }
});
