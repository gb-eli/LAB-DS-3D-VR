import test from 'node:test';
import assert from 'node:assert/strict';
import { MOTION_COMMANDS, EXTENDED_COMMAND_IDS, evaluateMotion, findMotion } from '../src/motion-catalog.js';
import { MotionChecklistGame } from '../src/motion-checklist-game.js';
import { SimonMotionGame } from '../src/simon-motion-game.js';
import { ReflexGame } from '../src/reflex-game.js';
import { MarathonGame } from '../src/marathon-game.js';
import { PerformanceManager, PERFORMANCE_PROFILES, USAGE_MODES } from '../src/performance-manager.js';
import { ProgressionSystem } from '../src/progression.js';
import { LAZY_MODULES, ModuleLoader } from '../src/module-loader.js';
import { readFileSync } from 'node:fs';

const openGesture = { type:'open', confidence:.9, palmFacing:{type:'palm'}, metrics:{extendedCount:5} };
const openContext = { gestures:[openGesture], body:{detected:false,actions:new Set(),events:new Set(),metrics:{}}, face:{detected:false} };

function memoryStore() {
  const values = new Map();
  return { get:(key)=>values.get(key), set:(key,value)=>values.set(key,value) };
}

test('catálogo ampliado possui pelo menos 50 comandos e variações', () => {
  assert.ok(EXTENDED_COMMAND_IDS.length >= 50);
  assert.ok(MOTION_COMMANDS.length >= 20);
  assert.equal(new Set(EXTENDED_COMMAND_IDS).size, EXTENDED_COMMAND_IDS.length);
});

test('checklist detalha requisitos e valida mão aberta', () => {
  const evaluation = evaluateMotion(findMotion('open'), openContext);
  assert.equal(evaluation.completed, true);
  assert.ok(evaluation.results.length >= 4);
  assert.equal(evaluation.ratio, 1);
});

test('Motion Checklist avança após sustentação', () => {
  let successes = 0;
  const game = new MotionChecklistGame({ callbacks:{ onSuccess:()=>successes++ } });
  game.start({reset:true});
  game.update(openContext, 1000);
  game.update(openContext, 1800);
  assert.equal(successes, 1);
  assert.equal(game.index, 1);
});

test('Simon Motion cria sequência crescente', () => {
  const game = new SimonMotionGame();
  game.start();
  assert.equal(game.sequence.length, 1);
  game.addRound();
  assert.equal(game.sequence.length, 2);
  assert.equal(game.round, 2);
});

test('Reflex e Marathon iniciam com comandos válidos', () => {
  const reflex = new ReflexGame(); reflex.start();
  const marathon = new MarathonGame(); marathon.start();
  assert.ok(reflex.command?.id);
  assert.ok(marathon.command?.id);
  assert.ok(marathon.energy > 0);
});

test('perfis de desempenho e modos de uso estão completos', () => {
  for (const id of ['auto','performance','balanced','quality','precision','turbo','economy']) assert.ok(PERFORMANCE_PROFILES[id]);
  for (const id of ['auto','presentation','body','hands','libras','holograms','duo','offline','teacher']) assert.ok(USAGE_MODES[id]);
});

test('Performance Manager recomenda DS Turbo para equipamento potente', () => {
  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', { configurable:true, value:{ hardwareConcurrency:16, deviceMemory:16 } });
  const originalDocument = globalThis.document;
  globalThis.document = { createElement:()=>({ getContext:()=>({}) }) };
  const manager = new PerformanceManager();
  assert.equal(manager.detectCapability().recommendation, 'turbo');
  globalThis.document = originalDocument;
  Object.defineProperty(globalThis, 'navigator', { configurable:true, value:originalNavigator });
});

test('Progressão soma XP e altera nível', () => {
  const progression = new ProgressionSystem(memoryStore());
  progression.award(700, 'teste', {module:'checklist'});
  const snapshot = progression.snapshot();
  assert.equal(snapshot.xp, 700);
  assert.equal(snapshot.level.level, 3);
});

test('novos módulos são cadastrados para importação dinâmica', async () => {
  assert.deepEqual(Object.keys(LAZY_MODULES).sort(), ['checklist','defender','marathon','reflex','simon']);
  const loader = new ModuleLoader();
  const instance = await loader.load('checklist', {callbacks:{}});
  assert.ok(instance instanceof MotionChecklistGame);
  assert.equal(loader.snapshot().find((item)=>item.id==='checklist').loaded, true);
  await loader.deactivate('checklist', {dispose:true});
  assert.equal(loader.get('checklist'), null);
});

test('portal usa bootstrap e não main no carregamento inicial', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(html, /src\/bootstrap\.js/);
  assert.doesNotMatch(html, /src\/main\.js/);
  const core = sw.match(/const CORE_SHELL = \[([\s\S]*?)\];/)?.[1] || '';
  assert.match(core, /bootstrap\.js/);
  assert.doesNotMatch(core, /three-scene\.js|vision\.js|main\.js|motion-checklist-game\.js/);
});
