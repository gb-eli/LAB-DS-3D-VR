import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { VERSION_CATALOG, MODE_VERSION_KEYS, TECHNOLOGY_CATALOG, RELEASE_HISTORY, compactVersion } from "../src/versioning.js";
const root = fileURLToPath(new URL("../", import.meta.url));
test("catálogo possui versões semânticas válidas e módulos de todos os modos", () => { const semantic = /^\d+\.\d+\.\d+$/; for (const entry of Object.values(VERSION_CATALOG)) { assert.match(entry.version, semantic, `${entry.name} não possui versão semântica.`); assert.ok(entry.summary.length >= 20, `${entry.name} precisa de resumo.`); } for (const key of Object.values(MODE_VERSION_KEYS)) assert.ok(VERSION_CATALOG[key], `Módulo ausente: ${key}`); });
test("versão geral é consistente com package, service worker e histórico", () => { const appVersion = VERSION_CATALOG.app.version; const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8")); const sw = readFileSync(`${root}sw.js`, "utf8"); assert.equal(pkg.version, appVersion); assert.match(sw, new RegExp(`holomotion-v${appVersion.replaceAll(".", "\\.")}`)); assert.equal(RELEASE_HISTORY[0].version, appVersion); });
test("tecnologias e versões compactas estão disponíveis para a interface", () => { assert.ok(TECHNOLOGY_CATALOG.length >= 3); assert.equal(compactVersion("3.2.0"), "v3.2"); });
