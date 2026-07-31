import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BLOCK_TYPES, BLOCK_TOOLS, getBlockReaction, HoloBlocks } from "../src/holo-blocks.js";
import { AVATAR_THEMES } from "../src/vision-renderer.js";
import { LAZY_MODULES } from "../src/module-loader.js";
import { VERSION_CATALOG } from "../src/versioning.js";

function sceneStub(){
  return { count:0, material:"earth", tool:"place", setBlocksEnabled(){}, setBlocksMaterial(value){this.material=value;}, setBlocksTool(value){this.tool=value;}, getBlocksSnapshot(){return {count:this.count,material:this.material,tool:this.tool};}, seedBlocks(){this.count=10;}, clearBlocks(){this.count=0;}, resetBlocks(){}, setBlocksHandInteraction(){} };
}

test("catálogo contém materiais visuais e ferramentas",()=>{
  for(const id of ["earth","water","lava","mud","ice","crystal","metal","wood","obsidian"]) assert.ok(BLOCK_TYPES[id]);
  assert.equal(Object.keys(BLOCK_TYPES).length,12);
  assert.deepEqual(Object.keys(BLOCK_TOOLS),["place","remove","inspect"]);
});

test("reações de materiais são educativas e determinísticas",()=>{
  assert.equal(getBlockReaction("water","lava").result,"obsidian");
  assert.equal(getBlockReaction("earth","water").result,"mud");
  assert.equal(getBlockReaction("ice","lava").result,"stone");
  assert.equal(getBlockReaction("sand","lava").result,"crystal");
  assert.equal(getBlockReaction("metal","wood"),null);
});

test("Holo Blocks atualiza material, ferramenta e pontuação",()=>{
  const scene=sceneStub(); let xp=0;
  const game=new HoloBlocks({scene,callbacks:{onXp:(value)=>{xp+=value;}}});
  game.start({material:"water",tool:"place"});
  assert.equal(game.material,"water"); assert.equal(scene.material,"water");
  game.setTool("remove"); assert.equal(scene.tool,"remove");
  game.handleSceneAction({action:"place",material:"water"});
  game.handleSceneAction({action:"reaction",reaction:getBlockReaction("water","lava")});
  assert.ok(game.score>=38); assert.equal(game.reactions,1); assert.equal(xp,30);
});

test("temas de avatar e módulo visual foram registrados",()=>{
  assert.deepEqual(Object.keys(AVATAR_THEMES),["hologram","robot","cosmic","armor"]);
  assert.equal(LAZY_MODULES.blocks.entry,"./holo-blocks.js");
  assert.equal(VERSION_CATALOG.app.version,"4.5.2");
  assert.equal(VERSION_CATALOG.blocks.version,"1.0.0");
  assert.equal(VERSION_CATALOG.avatar.version,"1.2.0");
});

test("interface inclui Holo Blocks e seletores visuais",()=>{
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  for(const id of ["blocksPanel","blocksMaterialGrid","blocksReactionStatus","avatarThemeSelect","visualThemeSelect"]) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/data-mode-target="blocks"/);
  const sw=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
  assert.match(sw,/holomotion-v4\.5\.2/);
  assert.doesNotMatch(sw,/holo-blocks\.js/);
});


test("Holo Blocks recebe a cena 3D real depois do carregamento",()=>{
  const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
  const ensurePos=main.indexOf('if (["explorer", "sandbox", "blocks", "face"].includes(mode)) await ensureHoloScene();');
  const startPos=main.indexOf('if (mode === "blocks") moduleLoader.get("blocks")?.start?.({ scene: holoScene');
  assert.ok(ensurePos >= 0 && startPos > ensurePos);
  const scene=readFileSync(new URL("../src/three-scene.js",import.meta.url),"utf8");
  assert.match(scene,/materialInfo:BLOCK_TYPES\[material\]/);
});
