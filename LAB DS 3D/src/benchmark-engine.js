import { buildHardwareScore, recommendHardwareProfile } from './hardware-manager.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const waitFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

export function benchmarkRecommendation(result = {}) {
  const combined = Math.round(
    (result.cpuScore || 0) * 0.28 +
    (result.graphicsScore || 0) * 0.34 +
    (result.memoryScore || 0) * 0.14 +
    (result.refreshScore || 0) * 0.12 +
    (result.capabilityScore || 0) * 0.12
  );
  const score = clamp(combined, 0, 100);
  return {
    score,
    profile: recommendHardwareProfile({ score, refreshRate: result.refreshRate || 60, mobile: result.mobile, saveData: result.saveData }),
    renderTarget: result.refreshRate >= 144 && score >= 80 ? 144 : result.refreshRate >= 120 && score >= 72 ? 120 : result.refreshRate >= 90 && score >= 62 ? 90 : score >= 45 ? 60 : 30
  };
}

export class BenchmarkEngine {
  constructor({ hardwareManager = null, onProgress = () => {} } = {}) {
    this.hardwareManager = hardwareManager;
    this.onProgress = onProgress;
    this.running = false;
  }

  async measureRefreshRate(sampleFrames = 90) {
    if (typeof requestAnimationFrame !== 'function') return 60;
    const timestamps = [];
    while (timestamps.length < sampleFrames) timestamps.push(await waitFrame());
    const deltas = timestamps.slice(1).map((time, index) => time - timestamps[index]).filter((value) => value > 3 && value < 100);
    if (!deltas.length) return 60;
    deltas.sort((a, b) => a - b);
    const median = deltas[Math.floor(deltas.length / 2)];
    const measured = Math.round(1000 / median);
    const common = [30, 60, 75, 90, 100, 120, 144, 165, 240];
    return common.reduce((best, value) => Math.abs(value - measured) < Math.abs(best - measured) ? value : best, 60);
  }

  async cpuTest(duration = 280) {
    const started = performance.now();
    let operations = 0;
    let seed = 0.61803398875;
    while (performance.now() - started < duration) {
      for (let i = 0; i < 6000; i += 1) {
        seed = Math.sin(seed * 12.9898 + i * 0.00013) * 43758.5453;
        seed -= Math.floor(seed);
        operations += 1;
      }
      await Promise.resolve();
    }
    const elapsed = performance.now() - started;
    const opsPerMs = operations / elapsed;
    return { operations, elapsed, opsPerMs, score: clamp(Math.round(opsPerMs / 115), 5, 100) };
  }

  async canvasTest(duration = 260) {
    if (!globalThis.document?.createElement) return { score: 25, draws: 0, elapsed: 0 };
    const canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 540;
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!context) return { score: 15, draws: 0, elapsed: 0 };
    const started = performance.now();
    let draws = 0;
    while (performance.now() - started < duration) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 420; i += 1) {
        context.globalAlpha = 0.15 + (i % 7) * 0.08;
        context.fillStyle = `hsl(${(i * 17 + draws) % 360} 90% 55%)`;
        context.fillRect((i * 29 + draws * 3) % 940, (i * 47 + draws * 2) % 520, 18 + (i % 9), 18 + (i % 11));
      }
      draws += 420;
      await Promise.resolve();
    }
    const elapsed = performance.now() - started;
    return { draws, elapsed, score: clamp(Math.round((draws / elapsed) * 0.16), 5, 100) };
  }

  async webglTest(duration = 300) {
    if (!globalThis.document?.createElement) return { score: 0, frames: 0, elapsed: 0, available: false };
    const canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 540;
    const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance', antialias: false, alpha: false });
    if (!gl) return { score: 0, frames: 0, elapsed: 0, available: false };
    const vertexSource = `#version 300 es\nin vec2 p; uniform float t; void main(){ float a=t+float(gl_InstanceID)*0.017; vec2 o=vec2(cos(a),sin(a))*0.72; gl_Position=vec4(p*0.018+o,0.,1.); }`;
    const fragmentSource = `#version 300 es\nprecision mediump float; out vec4 c; void main(){ c=vec4(0.0,0.85,1.0,1.0); }`;
    const compile = (type, source) => { const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); return shader; };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program); gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 0,1]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    const timeLocation = gl.getUniformLocation(program, 't');
    const started = performance.now();
    let frames = 0;
    while (performance.now() - started < duration) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0.03, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLocation, frames * 0.03);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, 1200);
      frames += 1;
      if (frames % 8 === 0) await Promise.resolve();
    }
    gl.finish();
    const elapsed = performance.now() - started;
    gl.deleteBuffer(buffer); gl.deleteProgram(program);
    gl.getExtension('WEBGL_lose_context')?.loseContext?.();
    return { frames, elapsed, available: true, score: clamp(Math.round((frames / elapsed) * 115), 5, 100) };
  }

  memoryScore(snapshot = {}) {
    const memory = snapshot.memory?.deviceMemoryGb || 4;
    const storageFree = Math.max(0, (snapshot.storage?.quota || 0) - (snapshot.storage?.usage || 0));
    const memoryPart = clamp(memory / 16, 0.15, 1);
    const storagePart = snapshot.storage?.quota ? clamp(storageFree / (2 * 1024 ** 3), 0.15, 1) : 0.55;
    return Math.round((memoryPart * 0.72 + storagePart * 0.28) * 100);
  }

  async run() {
    if (this.running) throw new Error('Benchmark já está em execução.');
    this.running = true;
    try {
      this.onProgress({ progress: 4, label: 'Medindo taxa da tela…' });
      const refreshRate = await this.measureRefreshRate();
      this.onProgress({ progress: 18, label: 'Analisando CPU…' });
      const cpu = await this.cpuTest();
      this.onProgress({ progress: 40, label: 'Testando Canvas 2D…' });
      const canvas = await this.canvasTest();
      this.onProgress({ progress: 58, label: 'Testando WebGL 2…' });
      const webgl = await this.webglTest();
      this.onProgress({ progress: 76, label: 'Lendo armazenamento e memória…' });
      const hardware = await this.hardwareManager?.detectHardware({ refreshRate }) || {};
      const memoryScore = this.memoryScore(hardware);
      const refreshScore = clamp(Math.round((refreshRate / 144) * 100), 20, 100);
      const graphicsScore = webgl.available ? Math.round(webgl.score * 0.78 + canvas.score * 0.22) : canvas.score;
      const capabilityScore = hardware.score || buildHardwareScore({ cores: hardware.cores, memoryGb: hardware.memory?.deviceMemoryGb, webgl2: hardware.webgl?.webgl2, webgpu: hardware.webgpu?.available, maxTextureSize: hardware.webgl?.maxTextureSize, refreshRate, mobile: hardware.mobile, saveData: hardware.saveData });
      const recommendation = benchmarkRecommendation({ cpuScore: cpu.score, graphicsScore, memoryScore, refreshScore, capabilityScore, refreshRate, mobile: hardware.mobile, saveData: hardware.saveData });
      const result = { timestamp: Date.now(), refreshRate, cpu, canvas, webgl, hardware, memoryScore, graphicsScore, capabilityScore, ...recommendation };
      this.onProgress({ progress: 100, label: 'Benchmark concluído.', result });
      return result;
    } finally {
      this.running = false;
    }
  }
}
