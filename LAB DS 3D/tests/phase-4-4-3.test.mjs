import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AssemblyGame, ASSEMBLY_KITS } from '../src/assembly-game.js';
import { AdaptiveGestureCalibrator, SensorStabilityMonitor } from '../src/sensor-calibration.js';
import { PerformanceManager } from '../src/performance-manager.js';
import { LAZY_MODULES } from '../src/module-loader.js';
import { VERSION_CATALOG } from '../src/versioning.js';

function gesture(type, pinchRatio, x=.5, y=.5, confidence=.9) {
  return { type, pinchRatio, palm:{x,y}, palmScale:.1, confidence, heldFor:300 };
}

test('Holo Assembly possui oito kits com peças e encaixes únicos', () => {
  assert.equal(Object.keys(ASSEMBLY_KITS).length, 8);
  for (const kit of Object.values(ASSEMBLY_KITS)) {
    assert.ok(kit.pieces.length >= 4);
    assert.equal(new Set(kit.pieces.map((item)=>item.id)).size, kit.pieces.length);
    for (const item of kit.pieces) assert.ok(item.slot && item.start && item.fact);
  }
});

test('montagem guiada rejeita ordem incorreta e aceita a peça esperada', () => {
  const game = new AssemblyGame();
  game.start({kitId:'computer',mode:'guided'});
  const gpu=game.pieces.find((item)=>item.id==='gpu');
  game.pointerDown(gpu.x,gpu.y);
  assert.equal(game.pointerUp(gpu.slot.x,gpu.slot.y),false);
  const cpu=game.pieces.find((item)=>item.id==='cpu');
  game.pointerDown(cpu.x,cpu.y);
  assert.equal(game.pointerUp(cpu.slot.x,cpu.slot.y),true);
  assert.equal(game.snapshot().placed,1);
  assert.ok(game.snapshot().score>0);
});

test('montagem completa gera conclusão e XP', () => {
  let completed=null;
  const game = new AssemblyGame({callbacks:{onComplete:(event)=>{completed=event;}}});
  game.start({kitId:'solar',mode:'free'});
  for (const item of [...game.pieces]) {
    game.pointerDown(item.x,item.y);
    game.pointerUp(item.slot.x,item.slot.y);
  }
  assert.equal(game.completed,true);
  assert.ok(completed.xp>0);
  assert.equal(completed.placed,completed.total);
});

test('calibração adaptativa calcula sensibilidade e estabilidade', () => {
  const calibrator=new AdaptiveGestureCalibrator();
  for(let i=0;i<14;i++) calibrator.observe(gesture('open',.72,.5+i*.0003,.5));
  for(let i=0;i<10;i++) calibrator.observe(gesture('pinch',.29,.5+i*.0002,.5));
  const result=calibrator.recommendation(1);
  assert.equal(result.ready,true);
  assert.ok(result.sensitivity>=.76 && result.sensitivity<=1.36);
  assert.ok(result.score>40);
  const monitor=new SensorStabilityMonitor();
  let snapshot;
  for(let i=0;i<20;i++) snapshot=monitor.observe({fps:58,confidence:.9,detected:true,inferenceMs:26,jitter:.001});
  assert.ok(snapshot.score>=70);
  assert.match(snapshot.label,/EXCELENTE|ESTÁVEL/);
});

test('Performance Manager reduz orçamento em FPS baixo', () => {
  const adaptations=[];
  const manager=new PerformanceManager({profile:'performance',onAdapt:(event)=>adaptations.push(event)});
  for(let i=0;i<12;i++) manager.sample(22,2000+i*2000);
  assert.ok(manager.adaptiveLevel>=1);
  assert.ok(manager.budget().particles<1);
  assert.ok(adaptations.some((event)=>event.direction==='down'));
});

test('Assembly permanece sob demanda, versionado e fora do cache inicial', () => {
  assert.equal(LAZY_MODULES.assembly.entry,'./assembly-game.js');
  assert.match(VERSION_CATALOG.app.version,/^\d+\.\d+\.\d+$/);
  assert.equal(VERSION_CATALOG.assembly.version,'1.1.0');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const core=sw.match(/const CORE_SHELL = \[([\s\S]*?)\];/)?.[1]||'';
  assert.doesNotMatch(core,/assembly-game|sensor-calibration/);
});

test('interface contém painel, canvas e controles da montagem', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for (const id of ['assemblyCanvas','assemblyPanel','assemblyKitSelect','assemblyModeSelect','startAssemblyButton','autoSensitivityButton','sensorStabilityStatus']) assert.match(html,new RegExp(`id="${id}"`));
});
