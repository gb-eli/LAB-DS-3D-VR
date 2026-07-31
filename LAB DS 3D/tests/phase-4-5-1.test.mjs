import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeHand } from '../src/gesture-engine.js';
import { CHALLENGES, GestureGame } from '../src/gesture-game.js';
import { assessGestureChallenge, gesturePresentation } from '../src/gesture-catalog.js';
import { ACADEMY_STEPS } from '../src/academy-game.js';
import { DANCE_MOVES, DANCE_PATTERNS } from '../src/dance-game.js';
import { VERSION_CATALOG } from '../src/versioning.js';

function closedHand() {
  const x=.5,y=.5,spread=.018;
  const points=Array.from({length:21},()=>({x,y,z:0}));
  points[0]={x,y:y+.08,z:0};
  const fingers=[[5,6,7,8,-.045],[9,10,11,12,-.015],[13,14,15,16,.02],[17,18,19,20,.055]];
  fingers.forEach(([mcp,pip,dip,tip,dx])=>{
    points[mcp]={x:x+dx,y,z:0}; points[pip]={x:x+dx,y:y-spread,z:0};
    points[dip]={x:x+dx,y:y-spread*1.7,z:0}; points[tip]={x:x+dx,y:y-spread*2.5,z:0};
  });
  points[1]={x:x-.05,y:y+.025,z:0}; points[2]={x:x-.07,y:y+.005,z:0};
  points[3]={x:x-.085,y:y-spread*.3,z:0}; points[4]={x:x-.025,y:y-spread*.6,z:0};
  [8,12,16,20].forEach((id,index)=>{points[id]={x:x+(index-1.5)*.018,y:y+.015,z:0};});
  return points;
}

function thumbsUpHand() {
  const points=closedHand();
  points[1]={x:.44,y:.53,z:0}; points[2]={x:.44,y:.49,z:0};
  points[3]={x:.44,y:.43,z:0}; points[4]={x:.44,y:.36,z:0};
  return points;
}

test('positivo não é confundido com punho fechado', () => {
  const result=analyzeHand(thumbsUpHand());
  assert.equal(result.type,'thumbs_up');
  assert.ok(result.confidence>0.85);
  assert.equal(result.alternatives[1].type,'fist');
  assert.ok(result.scoreMargin>0.4);
});

test('catálogo fornece pictograma correto para cada gesto', () => {
  assert.equal(gesturePresentation('fist').icon,'✊');
  assert.equal(gesturePresentation('thumbs_up').icon,'👍');
  assert.equal(gesturePresentation('point').icon,'☝');
  assert.equal(CHALLENGES.find((item)=>item.id==='ok').icon,'👌');
  assert.equal(new Set(CHALLENGES.map((item)=>item.id)).size,CHALLENGES.length);
});

test('checklist do positivo exige direção do polegar', () => {
  const challenge=CHALLENGES.find((item)=>item.id==='thumbs_up');
  const gesture=analyzeHand(thumbsUpHand());
  const result=assessGestureChallenge(challenge,gesture,{holdProgress:1});
  assert.equal(result.directMatch,true);
  assert.ok(result.checklist.some((item)=>item.id==='thumb-direction'&&item.passed));
  assert.ok(result.precision>=80);
});

test('Gesture Game envia avaliação e bônus de precisão', () => {
  let success=null;
  const game=new GestureGame({onSuccess:(value)=>{success=value;}});
  game.active=true;
  game.index=CHALLENGES.findIndex((item)=>item.id==='thumbs_up');
  const gesture={...analyzeHand(thumbsUpHand()),type:'thumbs_up',heldFor:900,label:'POSITIVO'};
  game.update([gesture],100);
  game.update([gesture],900);
  assert.equal(success?.challenge.id,'thumbs_up');
  assert.ok(success?.score>100);
});

test('academia e dança foram ampliadas', () => {
  assert.equal(ACADEMY_STEPS.length,20);
  assert.ok(DANCE_MOVES.length>=13);
  assert.ok(DANCE_PATTERNS.length>=6);
  assert.ok(DANCE_MOVES.some((item)=>item.id==='jump'));
  assert.ok(DANCE_MOVES.some((item)=>item.id==='left_leg'));
});

test('interface registra diagnóstico do gesto e versão 4.5.1', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['gestureChallengeIcon','gestureDetected','gestureConfidence','gestureFormScore','gestureStability','gestureChecklistMini','gestureTelemetryPanel']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
  assert.equal(VERSION_CATALOG.app.version,'4.5.2');
  assert.equal(VERSION_CATALOG.hands.version,'3.0.0');
  assert.equal(VERSION_CATALOG.gestures.version,'2.0.0');
});
