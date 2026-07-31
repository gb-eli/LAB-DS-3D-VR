import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { APP_CATALOG } from "../src/app-catalog.js";
import { dirname, join, normalize } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = normalize(fileURLToPath(new URL("../", import.meta.url)));
const srcDir = join(root, "src");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function localPath(fromFile, reference) {
  const clean = reference.split(/[?#]/)[0];
  if (!clean || clean.startsWith("http:") || clean.startsWith("https:") || clean.startsWith("data:") || clean.startsWith("#")) return null;
  return normalize(join(dirname(fromFile), clean));
}

for (const file of readdirSync(srcDir).filter((name) => name.endsWith(".js"))) {
  const fullPath = join(srcDir, file);
  const result = spawnSync(process.execPath, ["--check", fullPath], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
  const source = readFileSync(fullPath, "utf8");
  for (const match of source.matchAll(/(?:from\s+|import\s*\()\s*["'](\.[^"']+)["']/g)) {
    const imported = localPath(fullPath, match[1]);
    assert(imported && existsSync(imported), `Importação local ausente em ${file}: ${match[1]}`);
  }
  for (const match of source.matchAll(/new URL\(["'](\.[^"']+)["'],\s*import\.meta\.url\)/g)) {
    const referenced = localPath(fullPath, match[1]);
    assert(referenced && existsSync(referenced), `Recurso local ausente em ${file}: ${match[1]}`);
  }
}

const swResult = spawnSync(process.execPath, ["--check", join(root, "sw.js")], { stdio: "inherit" });
if (swResult.status !== 0) process.exit(swResult.status || 1);
const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
assert(manifest.name && manifest.start_url, "Manifesto incompleto.");
for (const icon of manifest.icons || []) {
  const iconPath = localPath(join(root, "manifest.webmanifest"), icon.src);
  assert(iconPath && existsSync(iconPath), `Ícone do manifesto ausente: ${icon.src}`);
}

const required = [
  "index.html", "assets/styles.css", "sw.js", "src/bootstrap.js", "src/main.js", "src/module-loader.js", "src/performance-manager.js", "src/progression.js", "src/motion-catalog.js", "src/motion-checklist-game.js", "src/simon-motion-game.js", "src/reflex-game.js", "src/marathon-game.js", "src/defender-game.js", "src/vision.js", "src/vision.worker.js", "src/explorer-advanced.js", "src/vision-scanner.js", "src/object-vision.js", "src/object-vision.worker.js", "src/environment-analysis.js", "src/assembly-game.js", "src/sensor-calibration.js",
  "src/depth-estimator.js", "src/tutorial-director.js", "src/accessibility-manager.js", "src/depth-trainer-game.js", "src/hardware-manager.js", "src/benchmark-engine.js", "src/gesture-engine.js", "src/gesture-catalog.js", "src/interaction-router.js", "src/shape-game.js", "src/gesture-game.js", "src/versioning.js", "src/app-catalog.js", "src/store-ui.js",
  "src/face-engine.js", "src/body-actions.js", "src/academy-game.js", "src/sequence-game.js", "src/aura-game.js", "src/body-challenge-game.js", "src/dance-game.js", "src/stretch-game.js", "src/saber-game.js", "src/libras-game.js", "tests/gesture-engine.test.mjs", "tests/shape-game.test.mjs", "tests/versioning.test.mjs", "tests/app-catalog.test.mjs", "tests/body-actions.test.mjs", "tests/training-games.test.mjs", "tests/phase-4-1.test.mjs", "tests/phase-4-3.test.mjs", "tests/phase-4-4-1.test.mjs", "tests/phase-4-4-2.test.mjs", "tests/phase-4-4-3.test.mjs", "tests/phase-4-4-4.test.mjs", "tests/phase-4-5.test.mjs", "tests/phase-4-5-1.test.mjs", "docs/HARDWARE_AND_BENCHMARK.md", "docs/RECOGNITION_UPGRADE.md", "docs/DEPTH_AND_ACCESSIBILITY.md", "docs/LIBRAS_LAB.md", "docs/HOLO_ASSEMBLY.md", "docs/HOLO_EXPLORER.md", "docs/VISION_SCANNER.md", "downloads/LabVirtualDS-VR-v0.3.3.apk", ".nojekyll"
];
for (const file of required) {
  const fullPath = join(root, file);
  assert(existsSync(fullPath) && statSync(fullPath).isFile(), `Arquivo obrigatório ausente: ${file}`);
}


for (const app of APP_CATALOG.filter((item) => item.action?.type === "download" && item.availability === "available")) {
  const filePath = normalize(join(root, app.file.replace(/^\.\//, "")));
  assert(existsSync(filePath), `APK cadastrado ausente: ${app.file}`);
  const file = readFileSync(filePath);
  assert(file.length === app.fileSize, `Tamanho divergente para ${app.file}: catálogo ${app.fileSize}, arquivo ${file.length}`);
  const digest = createHash("sha256").update(file).digest("hex");
  assert(digest === app.sha256, `SHA-256 divergente para ${app.file}`);
}

const htmlPath = join(root, "index.html");
const html = readFileSync(htmlPath, "utf8");
for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const reference = localPath(htmlPath, match[1]);
  if (reference) assert(existsSync(reference), `Referência local ausente no HTML: ${match[1]}`);
}
const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
assert(duplicates.length === 0, `IDs duplicados no HTML: ${[...new Set(duplicates)].join(", ")}`);

const main = readFileSync(join(srcDir, "main.js"), "utf8");
for (const match of main.matchAll(/\$\(["']#([^"']+)["']\)/g)) {
  assert(ids.includes(match[1]), `Elemento usado no main.js não existe no HTML: #${match[1]}`);
}

const sw = readFileSync(join(root, "sw.js"), "utf8");
const shellMatch = sw.match(/const (?:CORE_SHELL|APP_SHELL) = \[([\s\S]*?)\];/);
assert(shellMatch, "CORE_SHELL não encontrado no Service Worker.");
for (const match of shellMatch[1].matchAll(/["'](\.\/[^"']*)["']/g)) {
  if (match[1] === "./") continue;
  const shellPath = normalize(join(root, match[1].slice(2)));
  assert(existsSync(shellPath), `Arquivo do cache inicial ausente: ${match[1]}`);
}

console.log(`Estrutura e sintaxe validadas: ${readdirSync(srcDir).filter((name) => name.endsWith(".js")).length} módulos, ${ids.length} IDs e cache inicial íntegro.`);
