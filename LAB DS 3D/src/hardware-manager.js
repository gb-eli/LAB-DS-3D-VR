const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 0) => Number(Number(value || 0).toFixed(digits));

export const SENSOR_DEFINITIONS = Object.freeze([
  { id: 'camera', label: 'Câmera', test: () => Boolean(globalThis.navigator?.mediaDevices?.getUserMedia) },
  { id: 'microphone', label: 'Microfone', test: () => Boolean(globalThis.navigator?.mediaDevices?.getUserMedia) },
  { id: 'motion', label: 'Movimento', test: () => 'DeviceMotionEvent' in globalThis },
  { id: 'orientation', label: 'Orientação', test: () => 'DeviceOrientationEvent' in globalThis },
  { id: 'accelerometer', label: 'Acelerômetro', test: () => 'Accelerometer' in globalThis },
  { id: 'gyroscope', label: 'Giroscópio', test: () => 'Gyroscope' in globalThis },
  { id: 'magnetometer', label: 'Magnetômetro', test: () => 'Magnetometer' in globalThis },
  { id: 'proximity', label: 'Proximidade', test: () => 'ProximitySensor' in globalThis || 'ondeviceproximity' in globalThis },
  { id: 'ambientLight', label: 'Luz ambiente', test: () => 'AmbientLightSensor' in globalThis },
  { id: 'absoluteOrientation', label: 'Orientação absoluta', test: () => 'AbsoluteOrientationSensor' in globalThis },
  { id: 'relativeOrientation', label: 'Orientação relativa', test: () => 'RelativeOrientationSensor' in globalThis }
]);

export function recommendHardwareProfile({ score = 0, refreshRate = 60, saveData = false, mobile = false } = {}) {
  if (saveData || score < 34) return 'economy';
  if (score >= 82 && refreshRate >= 90 && !mobile) return 'turbo';
  if (score >= 70 && !mobile) return 'turbo';
  if (score >= 48) return 'balanced';
  return 'performance';
}

export function buildHardwareScore({ cores = 2, memoryGb = 4, webgl2 = false, webgpu = false, maxTextureSize = 0, refreshRate = 60, mobile = false, saveData = false } = {}) {
  let score = 8;
  score += clamp(cores, 1, 24) * 2.15;
  score += clamp(memoryGb, 1, 32) * 2.2;
  score += webgl2 ? 13 : 0;
  score += webgpu ? 11 : 0;
  score += maxTextureSize >= 16384 ? 8 : maxTextureSize >= 8192 ? 5 : maxTextureSize >= 4096 ? 2 : 0;
  score += refreshRate >= 120 ? 9 : refreshRate >= 90 ? 6 : refreshRate >= 60 ? 3 : 0;
  score -= mobile ? 4 : 0;
  score -= saveData ? 12 : 0;
  return clamp(Math.round(score), 0, 100);
}

function bytesToText(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'não informado';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function mediaDeviceLabel(device, index, fallback) {
  return device.label || `${fallback} ${index + 1}`;
}

async function queryPermission(name) {
  try {
    if (!globalThis.navigator?.permissions?.query) return 'unknown';
    return (await globalThis.navigator.permissions.query({ name })).state || 'unknown';
  } catch {
    return 'unknown';
  }
}

export class HardwareManager {
  constructor({ store = null, onUpdate = () => {}, onDevices = () => {} } = {}) {
    this.store = store;
    this.onUpdate = onUpdate;
    this.onDevices = onDevices;
    this.devices = { videoinput: [], audioinput: [], audiooutput: [] };
    this.selected = {
      cameraId: store?.get?.('cameraDeviceId') || '',
      microphoneId: store?.get?.('microphoneDeviceId') || '',
      audioOutputId: store?.get?.('audioOutputDeviceId') || '',
      cameraResolution: store?.get?.('cameraResolution') || 'auto',
      cameraFps: Number(store?.get?.('cameraFps') || 0)
    };
    this.snapshotData = null;
    this.sensorReadings = {};
    this.deviceChangeHandler = () => this.refreshDevices().catch(() => {});
    globalThis.navigator?.mediaDevices?.addEventListener?.('devicechange', this.deviceChangeHandler);
  }

  async requestDeviceAccess({ camera = true, microphone = true } = {}) {
    if (!globalThis.navigator?.mediaDevices?.getUserMedia) throw new Error('A API de mídia não está disponível.');
    const constraints = { video: camera, audio: microphone };
    let stream;
    try {
      stream = await globalThis.navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      if (camera && microphone) {
        stream = await globalThis.navigator.mediaDevices.getUserMedia({ video: camera, audio: false });
      } else throw error;
    }
    stream.getTracks().forEach((track) => track.stop());
    return this.refreshDevices();
  }

  async refreshDevices() {
    if (!globalThis.navigator?.mediaDevices?.enumerateDevices) return this.devices;
    const list = await globalThis.navigator.mediaDevices.enumerateDevices();
    const grouped = { videoinput: [], audioinput: [], audiooutput: [] };
    list.forEach((device) => { if (grouped[device.kind]) grouped[device.kind].push(device); });
    this.devices = grouped;
    if (this.selected.cameraId && !grouped.videoinput.some((item) => item.deviceId === this.selected.cameraId)) this.selected.cameraId = '';
    if (this.selected.microphoneId && !grouped.audioinput.some((item) => item.deviceId === this.selected.microphoneId)) this.selected.microphoneId = '';
    if (this.selected.audioOutputId && !grouped.audiooutput.some((item) => item.deviceId === this.selected.audioOutputId)) this.selected.audioOutputId = '';
    const payload = this.deviceOptions();
    this.onDevices(payload);
    return payload;
  }

  deviceOptions() {
    return {
      cameras: this.devices.videoinput.map((item, index) => ({ id: item.deviceId, label: mediaDeviceLabel(item, index, 'Câmera') })),
      microphones: this.devices.audioinput.map((item, index) => ({ id: item.deviceId, label: mediaDeviceLabel(item, index, 'Microfone') })),
      outputs: this.devices.audiooutput.map((item, index) => ({ id: item.deviceId, label: mediaDeviceLabel(item, index, 'Saída de áudio') })),
      selected: { ...this.selected }
    };
  }

  setSelected(next = {}) {
    Object.assign(this.selected, next);
    const mapping = {
      cameraId: 'cameraDeviceId',
      microphoneId: 'microphoneDeviceId',
      audioOutputId: 'audioOutputDeviceId',
      cameraResolution: 'cameraResolution',
      cameraFps: 'cameraFps'
    };
    Object.entries(next).forEach(([key, value]) => { if (mapping[key]) this.store?.set?.(mapping[key], value); });
    this.onDevices(this.deviceOptions());
    return { ...this.selected };
  }

  cameraConstraints(profileCamera = {}) {
    const resolutionMap = {
      '640x360': [640, 360],
      '640x480': [640, 480],
      '1280x720': [1280, 720],
      '1920x1080': [1920, 1080]
    };
    const selectedResolution = resolutionMap[this.selected.cameraResolution];
    const width = selectedResolution?.[0] || profileCamera.width || 960;
    const height = selectedResolution?.[1] || profileCamera.height || 540;
    const frameRate = this.selected.cameraFps || profileCamera.frameRate || 30;
    return {
      deviceId: this.selected.cameraId ? { exact: this.selected.cameraId } : undefined,
      facingMode: this.selected.cameraId ? undefined : 'user',
      width: { ideal: width },
      height: { ideal: height },
      frameRate: { ideal: frameRate, max: frameRate }
    };
  }

  microphoneConstraints() {
    return {
      deviceId: this.selected.microphoneId ? { exact: this.selected.microphoneId } : undefined,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };
  }

  async detectWebGl() {
    const result = { available: false, webgl2: false, renderer: 'não disponível', vendor: '--', version: '--', maxTextureSize: 0, maxRenderBufferSize: 0, maxSamples: 0 };
    if (!globalThis.document?.createElement) return result;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2', { powerPreference: 'high-performance', failIfMajorPerformanceCaveat: false }) || canvas.getContext('webgl');
      if (!gl) return result;
      result.available = true;
      result.webgl2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      result.version = gl.getParameter(gl.VERSION) || '--';
      result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
      result.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0;
      result.maxSamples = result.webgl2 ? gl.getParameter(gl.MAX_SAMPLES) || 0 : 0;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        result.renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || result.renderer;
        result.vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || result.vendor;
      } else {
        result.renderer = gl.getParameter(gl.RENDERER) || result.renderer;
        result.vendor = gl.getParameter(gl.VENDOR) || result.vendor;
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext?.();
    } catch {}
    return result;
  }

  async detectWebGpu() {
    const result = { available: false, adapter: '--', features: [], limits: {} };
    try {
      if (!globalThis.navigator?.gpu?.requestAdapter) return result;
      const adapter = await globalThis.navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) return result;
      result.available = true;
      const info = adapter.info || (adapter.requestAdapterInfo ? await adapter.requestAdapterInfo() : null);
      result.adapter = [info?.vendor, info?.architecture, info?.device, info?.description].filter(Boolean).join(' · ') || 'Adaptador WebGPU';
      result.features = [...(adapter.features || [])].slice(0, 20);
      result.limits = {
        maxTextureDimension2D: Number(adapter.limits?.maxTextureDimension2D || 0),
        maxBufferSize: Number(adapter.limits?.maxBufferSize || 0)
      };
    } catch {}
    return result;
  }

  async detectStorage() {
    try {
      const estimate = await globalThis.navigator?.storage?.estimate?.();
      return {
        usage: Number(estimate?.usage || 0),
        quota: Number(estimate?.quota || 0),
        usageText: bytesToText(estimate?.usage || 0),
        quotaText: bytesToText(estimate?.quota || 0),
        percent: estimate?.quota ? round((estimate.usage / estimate.quota) * 100, 1) : 0,
        persisted: await globalThis.navigator?.storage?.persisted?.().catch?.(() => false) || false
      };
    } catch {
      return { usage: 0, quota: 0, usageText: 'não informado', quotaText: 'não informado', percent: 0, persisted: false };
    }
  }

  detectMemory() {
    const memory = globalThis.performance?.memory;
    return {
      deviceMemoryGb: Number(globalThis.navigator?.deviceMemory || 0),
      jsHeapUsed: Number(memory?.usedJSHeapSize || 0),
      jsHeapLimit: Number(memory?.jsHeapSizeLimit || 0),
      jsHeapUsedText: bytesToText(memory?.usedJSHeapSize || 0),
      jsHeapLimitText: bytesToText(memory?.jsHeapSizeLimit || 0)
    };
  }

  detectSensors() {
    return SENSOR_DEFINITIONS.map((sensor) => ({ id: sensor.id, label: sensor.label, api: Boolean(sensor.test()), tested: Boolean(this.sensorReadings[sensor.id]), reading: this.sensorReadings[sensor.id] || null }));
  }

  async detectHardware({ refreshRate = 60 } = {}) {
    const [webgl, webgpu, storage, devices, cameraPermission, micPermission] = await Promise.all([
      this.detectWebGl(), this.detectWebGpu(), this.detectStorage(), this.refreshDevices(), queryPermission('camera'), queryPermission('microphone')
    ]);
    const cores = Number(globalThis.navigator?.hardwareConcurrency || 2);
    const memory = this.detectMemory();
    const mobile = (globalThis.navigator?.maxTouchPoints || 0) > 0 && Math.min(globalThis.screen?.width || 1280, globalThis.screen?.height || 720) < 900;
    const saveData = Boolean(globalThis.navigator?.connection?.saveData);
    const score = buildHardwareScore({ cores, memoryGb: memory.deviceMemoryGb || 4, webgl2: webgl.webgl2, webgpu: webgpu.available, maxTextureSize: webgl.maxTextureSize, refreshRate, mobile, saveData });
    const recommendation = recommendHardwareProfile({ score, refreshRate, mobile, saveData });
    this.snapshotData = {
      timestamp: Date.now(),
      cores,
      memory,
      mobile,
      saveData,
      connection: globalThis.navigator?.connection?.effectiveType || 'não informado',
      webgl,
      webgpu,
      storage,
      devices,
      permissions: { camera: cameraPermission, microphone: micPermission },
      sensors: this.detectSensors(),
      refreshRate,
      score,
      recommendation,
      browser: globalThis.navigator?.userAgent || '--'
    };
    this.onUpdate(this.snapshotData);
    return this.snapshotData;
  }

  async testMicrophone({ duration = 1200, onLevel = () => {} } = {}) {
    if (!globalThis.navigator?.mediaDevices?.getUserMedia) throw new Error('Microfone não disponível.');
    const stream = await globalThis.navigator.mediaDevices.getUserMedia({ audio: this.microphoneConstraints(), video: false });
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) { stream.getTracks().forEach((track) => track.stop()); throw new Error('AudioContext indisponível.'); }
    const context = new Context();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const started = performance.now();
    let peak = 0;
    await new Promise((resolve) => {
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) { const normalized = (value - 128) / 128; sum += normalized * normalized; }
        const level = Math.sqrt(sum / data.length);
        peak = Math.max(peak, level);
        onLevel(clamp(level * 4.5, 0, 1));
        if (performance.now() - started >= duration) resolve(); else requestAnimationFrame(tick);
      };
      tick();
    });
    stream.getTracks().forEach((track) => track.stop());
    await context.close().catch(() => {});
    return { peak: round(peak, 3), label: peak > 0.12 ? 'alto' : peak > 0.035 ? 'normal' : 'baixo' };
  }

  async testSensorEvents({ duration = 1200 } = {}) {
    const readings = {};
    const cleanups = [];
    const captureEvent = (id, eventName, mapper) => {
      if (!globalThis.addEventListener) return;
      const handler = (event) => { readings[id] = mapper(event); };
      globalThis.addEventListener(eventName, handler, { passive: true });
      cleanups.push(() => globalThis.removeEventListener(eventName, handler));
    };
    try {
      if (typeof globalThis.DeviceMotionEvent?.requestPermission === 'function') await globalThis.DeviceMotionEvent.requestPermission().catch(() => {});
      if (typeof globalThis.DeviceOrientationEvent?.requestPermission === 'function') await globalThis.DeviceOrientationEvent.requestPermission().catch(() => {});
    } catch {}
    captureEvent('motion', 'devicemotion', (event) => ({ x: round(event.accelerationIncludingGravity?.x, 2), y: round(event.accelerationIncludingGravity?.y, 2), z: round(event.accelerationIncludingGravity?.z, 2) }));
    captureEvent('orientation', 'deviceorientation', (event) => ({ alpha: round(event.alpha, 1), beta: round(event.beta, 1), gamma: round(event.gamma, 1) }));
    const sensorClasses = [
      ['accelerometer', globalThis.Accelerometer], ['gyroscope', globalThis.Gyroscope], ['magnetometer', globalThis.Magnetometer], ['ambientLight', globalThis.AmbientLightSensor], ['proximity', globalThis.ProximitySensor]
    ];
    const instances = [];
    for (const [id, SensorClass] of sensorClasses) {
      if (!SensorClass) continue;
      try {
        const sensor = new SensorClass({ frequency: 10 });
        sensor.addEventListener('reading', () => {
          readings[id] = id === 'ambientLight' ? { illuminance: round(sensor.illuminance, 1) } : id === 'proximity' ? { distance: round(sensor.distance, 2), near: Boolean(sensor.near) } : { x: round(sensor.x, 2), y: round(sensor.y, 2), z: round(sensor.z, 2) };
        });
        sensor.start();
        instances.push(sensor);
      } catch {}
    }
    await new Promise((resolve) => setTimeout(resolve, duration));
    cleanups.forEach((cleanup) => cleanup());
    instances.forEach((sensor) => sensor.stop?.());
    this.sensorReadings = { ...this.sensorReadings, ...readings };
    this.onUpdate({ type: 'sensors', readings: this.sensorReadings });
    return this.sensorReadings;
  }

  async setAudioOutput(audioContext, deviceId = this.selected.audioOutputId) {
    if (!deviceId) return { supported: Boolean(audioContext?.setSinkId), applied: false };
    if (typeof audioContext?.setSinkId !== 'function') return { supported: false, applied: false };
    await audioContext.setSinkId(deviceId);
    this.setSelected({ audioOutputId: deviceId });
    return { supported: true, applied: true };
  }

  destroy() {
    globalThis.navigator?.mediaDevices?.removeEventListener?.('devicechange', this.deviceChangeHandler);
  }
}

export { bytesToText };
