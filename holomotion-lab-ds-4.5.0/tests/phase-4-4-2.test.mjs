import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EXPLORER_ACTIVITIES, EXPLORER_ACTIVITY_MODES, ExplorerAdvanced, getExplorerActivity } from '../src/explorer-advanced.js';
import { LAZY_MODULES } from '../src/module-loader.js';
import { VERSION_CATALOG } from '../src/versioning.js';

test('Holo Explorer Advanced possui quatro modos e atividades para nove exposições', () => {
  assert.deepEqual(Object.keys(EXPLORER_ACTIVITY_MODES), ['free','guided','challenge','quiz']);
  assert.equal(Object.keys(EXPLORER_ACTIVITIES).length, 9);
  for (const activity of Object.values(EXPLORER_ACTIVITIES)) {
    assert.ok(activity.steps.length >= 3);
    assert.ok(activity.quiz.length >= 2);
  }
});

test('atividade guiada valida a peça correta e rejeita a incorreta', () => {
  const events=[];
  const lab=new ExplorerAdvanced({ callbacks:{ onSuccess:(event)=>events.push(event), onMiss:(event)=>events.push(event) } });
  lab.start({ exhibitId:'motherboard', activityMode:'guided' });
  assert.equal(lab.selectPart('ram'), false);
  assert.equal(lab.score, 0);
  assert.equal(lab.selectPart('cpu'), true);
  assert.equal(lab.index, 1);
  assert.ok(lab.score > 0);
  assert.equal(events.length, 2);
});

test('Holo Quiz calcula pontuação e avança perguntas', () => {
  const lab=new ExplorerAdvanced();
  lab.start({ exhibitId:'solar-system', activityMode:'quiz' });
  const question=getExplorerActivity('solar-system').quiz[0];
  assert.equal(lab.answerQuiz(question.answer), true);
  assert.ok(lab.score > 0);
  lab.nextQuiz();
  assert.equal(lab.quizIndex, 1);
});

test('Volcano Lab atualiza parâmetros de simulação', () => {
  let values=null;
  const lab=new ExplorerAdvanced({callbacks:{onSimulation:(event)=>{values=event.values;}}});
  lab.start({exhibitId:'volcano',activityMode:'free'});
  lab.setSimulationValue('pressure',88);
  assert.equal(values.pressure,88);
  assert.equal(lab.simulation.pressure,88);
});

test('Holo Explorer continua carregado sob demanda e versionado', () => {
  assert.equal(LAZY_MODULES.explorer.entry,'./explorer-advanced.js');
  assert.equal(LAZY_MODULES.explorer.weight,'heavy');
  assert.match(VERSION_CATALOG.app.version,/^\d+\.\d+\.\d+$/);
  assert.equal(VERSION_CATALOG.explorer.version,'2.0.0');
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const core=sw.match(/const CORE_SHELL = \[([\s\S]*?)\];/)?.[1]||'';
  assert.doesNotMatch(core,/explorer-advanced|three-scene/);
});

test('interface contém controles avançados do Explorer', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for (const id of ['explorerActivityMode','startExplorerActivityButton','explorerActivityPanel','explorerActivitySteps','explorerQuizOptions','explorerPressure']) assert.match(html,new RegExp(`id="${id}"`));
});
