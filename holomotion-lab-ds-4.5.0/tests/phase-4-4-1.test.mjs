import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  translateObjectLabel, normalizeDetections, boxIou, DetectionTracker,
  classifyColor, analyzeDominantColor, analyzeSimpleShape,
  associateHandsWithObjects, countPeople, summarizeScene
} from '../src/environment-analysis.js';
import { SCANNER_ACTIVITIES, OBJECT_MISSIONS, SHAPE_MISSIONS, ACTION_MISSIONS } from '../src/vision-scanner.js';
import { MEDIAPIPE, MODES, TRACKING_PROFILES } from '../src/config.js';
import { LAZY_MODULES } from '../src/module-loader.js';
import { VERSION_CATALOG, MODE_VERSION_KEYS, SENSOR_VERSION_KEYS } from '../src/versioning.js';
import { getAppById } from '../src/app-catalog.js';

function rgba(width, height, painter) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const [r,g,b,a=255] = painter(x,y);
    const i=(y*width+x)*4; data[i]=r; data[i+1]=g; data[i+2]=b; data[i+3]=a;
  }
  return data;
}

function handAt(x,y) {
  const hand=Array.from({length:21},()=>({x,y}));
  [0,5,9,13,17].forEach((i)=>{ hand[i]={x,y}; });
  return hand;
}

test('rótulos e detecções do scanner são normalizados', () => {
  assert.equal(translateObjectLabel('cell phone'), 'celular');
  const result = normalizeDetections([{ categories:[{ categoryName:'bottle', score:.91 }], boundingBox:{ originX:10, originY:20, width:30, height:40 } }], 100, 100);
  assert.equal(result[0].label, 'garrafa');
  assert.deepEqual(result[0].bbox, {x:.1,y:.2,width:.3,height:.4});
});

test('rastreador mantém identidade entre quadros próximos', () => {
  const tracker = new DetectionTracker();
  const first = tracker.update([{rawLabel:'bottle',label:'garrafa',score:.9,bbox:{x:.1,y:.1,width:.2,height:.4}}]);
  const second = tracker.update([{rawLabel:'bottle',label:'garrafa',score:.88,bbox:{x:.11,y:.1,width:.2,height:.4}}]);
  assert.equal(first[0].id, second[0].id);
  assert.ok(boxIou(first[0].bbox, second[0].bbox) > .7);
});

test('cores predominantes são analisadas localmente', () => {
  assert.equal(classifyColor(20,90,230), 'blue');
  const data=rgba(20,20,()=>[20,90,230,255]);
  const color=analyzeDominantColor(data,20,20);
  assert.equal(color.id,'blue');
  assert.ok(color.confidence>.95);
});

test('scanner reconhece uma forma retangular de alto contraste', () => {
  const width=80,height=60;
  const data=rgba(width,height,(x,y)=>(x>=18&&x<=61&&y>=18&&y<=42)?[10,10,10,255]:[250,250,250,255]);
  const shape=analyzeSimpleShape(data,width,height);
  assert.ok(['rectangle','square'].includes(shape.id));
  assert.ok(shape.confidence>.5);
});

test('mão próxima é associada ao objeto e pessoas são contadas', () => {
  const detections=[
    {id:'p1',rawLabel:'person',label:'pessoa',score:.9,bbox:{x:.05,y:.05,width:.4,height:.9}},
    {id:'b1',rawLabel:'bottle',label:'garrafa',score:.9,bbox:{x:.6,y:.4,width:.15,height:.35}}
  ];
  const relations=associateHandsWithObjects(detections,[handAt(.67,.56)]);
  assert.equal(relations[0].label,'garrafa');
  assert.equal(countPeople(detections,[Array(33)]),1);
  assert.deepEqual(summarizeScene(detections).find((item)=>item.label==='pessoa'),{label:'pessoa',count:1});
});

test('catálogo do Vision Scanner possui seis experiências e missões', () => {
  assert.deepEqual(Object.keys(SCANNER_ACTIVITIES), ['scan','object','color','shape','classroom','actions']);
  assert.ok(OBJECT_MISSIONS.length>=8);
  assert.ok(SHAPE_MISSIONS.length>=4);
  assert.ok(ACTION_MISSIONS.some((item)=>item.id==='hug'));
  assert.ok(ACTION_MISSIONS.some((item)=>item.id==='jump'));
});

test('scanner permanece isolado e carregado sob demanda', () => {
  assert.equal(LAZY_MODULES.scanner.entry,'./vision-scanner.js');
  assert.equal(LAZY_MODULES.scanner.weight,'heavy');
  assert.ok(MEDIAPIPE.objectModel.includes('efficientdet_lite0'));
  assert.ok(TRACKING_PROFILES.scanner);
  assert.ok(MODES.scanner);
  const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  const core=sw.match(/const CORE_SHELL = \[([\s\S]*?)\];/)?.[1]||'';
  assert.doesNotMatch(core,/vision-scanner|object-vision|efficientdet|tasks-vision/);
});

test('versionamento e loja registram o novo sensor e laboratório', () => {
  assert.match(VERSION_CATALOG.app.version,/^\d+\.\d+\.\d+$/);
  assert.equal(VERSION_CATALOG.scanner.version,'1.0.0');
  assert.equal(VERSION_CATALOG.objectSensor.version,'1.0.0');
  assert.equal(MODE_VERSION_KEYS.scanner,'scanner');
  assert.equal(SENSOR_VERSION_KEYS.objects,'objectSensor');
  assert.equal(getAppById('vision-scanner-web').action.value,'scanner');
});

test('interface contém controles e camadas do Vision Scanner', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for (const id of ['objectCanvas','visionScannerPanel','scannerActivitySelect','scannerConfidenceRange','objectStatus','sceneStatus']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/data-mode-target="scanner"/);
});
