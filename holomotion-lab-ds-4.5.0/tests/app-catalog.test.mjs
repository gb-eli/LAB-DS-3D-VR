import test from "node:test";
import assert from "node:assert/strict";
import { APP_CATALOG, APP_STORE_FILTERS, countAvailableApps, filterApps, formatFileSize, getAppById, resolveAppVersion } from "../src/app-catalog.js";

test("catálogo possui IDs únicos e ações válidas", () => {
  const ids = APP_CATALOG.map((app) => app.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(APP_CATALOG.every((app) => ["web", "android"].includes(app.platform)));
  assert.ok(APP_CATALOG.every((app) => ["available", "planned"].includes(app.availability)));
  assert.ok(APP_CATALOG.every((app) => app.action?.type));
});

test("APK disponível possui metadados de integridade", () => {
  const apk = getAppById("labvirtualds-vr-android");
  assert.equal(apk.platform, "android");
  assert.equal(apk.availability, "available");
  assert.match(apk.file, /\.apk$/);
  assert.match(apk.sha256, /^[a-f0-9]{64}$/);
  assert.ok(apk.fileSize > 0);
  assert.equal(formatFileSize(apk.fileSize), "53 KB");
});

test("filtros separam Web, Android e offline", () => {
  assert.ok(filterApps({ filter: "web" }).every((app) => app.platform === "web"));
  assert.ok(filterApps({ filter: "android" }).every((app) => app.platform === "android"));
  assert.ok(filterApps({ filter: "offline" }).every((app) => app.offlineCapable));
  assert.ok(filterApps({ query: "desenho" }).some((app) => app.id === "holo-draw-web"));
  assert.ok(APP_STORE_FILTERS.some((filter) => filter.id === "android"));
});

test("versões internas são resolvidas pelo catálogo central", () => {
  const sandbox = getAppById("holo-sandbox-web");
  assert.equal(resolveAppVersion(sandbox), "2.2.0");
  assert.equal(countAvailableApps("android"), 1);
  assert.ok(countAvailableApps("web") >= 9);
});
