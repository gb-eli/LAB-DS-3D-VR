import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HandDepthEstimator } from '../src/depth-estimator.js';
import { TutorialDirector, ASSEMBLY_TUTORIAL_STEPS } from '../src/tutorial-director.js';
import { AccessibilityManager, ACCESSIBILITY_PRESETS } from '../src/accessibility-manager.js';
import { DepthTrainerGame } from '../src/depth-trainer-game.js';
import { ASSEMBLY_KITS, AssemblyGame } from '../src/assembly-game.js';
import { LAZY_MODULES } from '../src/module-loader.js';
import { VERSION_CATALOG } from '../src/versioning.js';
import { PerformanceManager } from '../src/performance-manager.js';

const gesture = (scale, type='open') => ({ type, palm:{x:.5,y:.5,z:0}, palmScale:scale, confidence:.92, heldFor:400 });

test('estimador separa zonas longe, médio e perto com histerese', () => {
  const estimator=new HandDepthEstimator({smoothing:1});
  assert.equal(estimator.observe(gesture(.045)).zone,'far');
  assert.equal(estimator.observe(gesture(.105)).zone,'mid');
  assert.equal(estimator.observe(gesture(.19)).zone,'near');
});

test('tutorial animado possui seis etapas e valida sustentação', () => {
  let validated=0;
  const director=new TutorialDirector({callbacks:{onValidated:()=>validated++}});
  director.start();
  director.update({gesture:gesture(.1)},1000);
  director.update({gesture:gesture(.1)},1800);
  assert.equal(ASSEMBLY_TUTORIAL_STEPS.length,6);
  assert.ok(validated>=1);
  assert.equal(director.index,1);
});

test('Holo Assembly possui oito kits e profundidade opcional', () => {
  assert.equal(Object.keys(ASSEMBLY_KITS).length,8);
  for (const id of ['network','satellite','rover','circuit']) assert.ok(ASSEMBLY_KITS[id]);
  const game=new AssemblyGame({depthMode:'spatial',tutorial:false});
  const snapshot=game.start({kitId:'network',mode:'free',depthMode:'spatial'});
  assert.equal(snapshot.depthMode,'spatial');
  assert.ok(snapshot.pieces.every((item)=>Number.isFinite(item.z)&&Number.isFinite(item.slot.z)));
});

test('encaixe espacial rejeita profundidade incorreta', () => {
  const game=new AssemblyGame({depthMode:'spatial',tutorial:false});
  game.start({kitId:'circuit',mode:'free',depthMode:'spatial'});
  const item=game.pieces[0];
  game.pointerDown(item.x,item.y,item.z);
  assert.equal(game.pointerUp(item.slot.x,item.slot.y,item.slot.z>.5?0:.95),false);
  game.pointerDown(item.x,item.y,item.z);
  assert.equal(game.pointerUp(item.slot.x,item.slot.y,item.slot.z),true);
});

test('Depth Trainer permanece leve e carregado sob demanda', () => {
  assert.equal(LAZY_MODULES.depth.entry,'./depth-trainer-game.js');
  const game=new DepthTrainerGame();
  const state=game.start();
  assert.equal(state.active,true);
  assert.ok(state.target);
  assert.equal(VERSION_CATALOG.depth.version,'1.0.0');
});

test('perfis de acessibilidade são aplicáveis e persistíveis', () => {
  const classes=new Set();
  const root={dataset:{},classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)}};
  const saved={};
  const manager=new AccessibilityManager({root,store:{get:()=>null,set:(key,value)=>saved[key]=value}});
  const preset=manager.apply('classroom');
  assert.equal(preset.largeText,true);
  assert.ok(classes.has('a11y-contrast'));
  assert.equal(saved.accessibilityPreset,'classroom');
  assert.equal(Object.keys(ACCESSIBILITY_PRESETS).length,5);
});

test('Performance Manager oferece quinto nível emergencial', () => {
  const manager=new PerformanceManager({profile:'performance'});
  manager.adaptiveLevel=4;
  const budget=manager.budget();
  assert.ok(budget.pixelRatio<.6);
  assert.ok(budget.particles<.1);
  assert.ok(budget.motionScale<.6);
});

test('interface registra profundidade, tutorial e acessibilidade', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for (const id of ['depthPanel','restartDepthButton','assemblyDepthSelect','assemblyTutorialToggle','assemblyDepthZone','accessibilityPresetSelect','audioCuesButton','accessibilityAnnouncer']) assert.match(html,new RegExp(`id="${id}"`));
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const core=sw.match(/const CORE_SHELL = \[([\s\S]*?)\];/)?.[1]||'';
  assert.doesNotMatch(core,/depth-trainer|depth-estimator|tutorial-director|accessibility-manager|assembly-game/);
});
