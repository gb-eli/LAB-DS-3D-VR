import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HardwareManager, buildHardwareScore, recommendHardwareProfile, bytesToText } from '../src/hardware-manager.js';
import { benchmarkRecommendation } from '../src/benchmark-engine.js';
import { PerformanceManager, PERFORMANCE_PROFILES } from '../src/performance-manager.js';
import { QUALITY_PROFILES } from '../src/config.js';
import { VERSION_CATALOG } from '../src/versioning.js';

function store(values = {}) {
  const map = new Map(Object.entries(values));
  return { get: (key) => map.get(key), set: (key, value) => map.set(key, value) };
}

test('pontuação de hardware diferencia equipamentos simples e potentes', () => {
  const weak = buildHardwareScore({ cores: 2, memoryGb: 2, webgl2: false, webgpu: false, maxTextureSize: 2048, refreshRate: 60, mobile: true });
  const strong = buildHardwareScore({ cores: 16, memoryGb: 32, webgl2: true, webgpu: true, maxTextureSize: 16384, refreshRate: 144 });
  assert.ok(strong > weak);
  assert.ok(strong >= 80);
  assert.equal(recommendHardwareProfile({ score: strong, refreshRate: 144 }), 'turbo');
  assert.equal(recommendHardwareProfile({ score: 20, refreshRate: 60 }), 'economy');
});

test('restrições de câmera respeitam dispositivo, resolução e FPS escolhidos', () => {
  const manager = new HardwareManager({ store: store({ cameraDeviceId: 'cam-2', cameraResolution: '1920x1080', cameraFps: 60 }) });
  const constraints = manager.cameraConstraints({ width: 640, height: 360, frameRate: 30 });
  assert.deepEqual(constraints.deviceId, { exact: 'cam-2' });
  assert.equal(constraints.width.ideal, 1920);
  assert.equal(constraints.height.ideal, 1080);
  assert.equal(constraints.frameRate.max, 60);
  manager.destroy();
});

test('benchmark recomenda perfil e alvo de renderização coerentes', () => {
  const result = benchmarkRecommendation({ cpuScore: 92, graphicsScore: 94, memoryScore: 88, refreshScore: 100, capabilityScore: 92, refreshRate: 144 });
  assert.ok(result.score >= 90);
  assert.equal(result.profile, 'turbo');
  assert.equal(result.renderTarget, 144);
});

test('Performance Manager limita meta pela taxa da tela', () => {
  const manager = new PerformanceManager({ profile: 'extreme' });
  manager.setRefreshRate(60);
  assert.equal(manager.targetFps, 60);
  manager.setRefreshRate(144);
  assert.equal(manager.targetFps, 144);
  assert.ok(PERFORMANCE_PROFILES.ultra);
  assert.ok(PERFORMANCE_PROFILES.extreme);
  assert.ok(QUALITY_PROFILES.ultra);
});

test('formatador de memória produz unidades legíveis', () => {
  assert.equal(bytesToText(1024), '1.0 KB');
  assert.equal(bytesToText(1024 ** 3), '1.0 GB');
});

test('Vision Core não mantém limite fixo de 30 FPS', () => {
  const source = readFileSync(new URL('../src/vision.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /frameRate:\s*\{\s*ideal:\s*profile\.camera\.frameRate,\s*max:\s*30/);
  assert.match(source, /async startCamera\(options = \{\}\)/);
});

test('interface e versionamento registram a central de hardware 4.5', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['hardwareDialog','cameraDeviceSelect','microphoneDeviceSelect','audioOutputDeviceSelect','runFullBenchmarkButton','hardwareSensorList']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.equal(VERSION_CATALOG.app.version, '4.5.2');
  assert.equal(VERSION_CATALOG.hardware.version, '1.0.0');
  assert.equal(VERSION_CATALOG.benchmark.version, '1.0.0');
});
