import { APP_STORE_FILTERS, countAvailableApps, filterApps, formatFileSize, getAppById, resolveAppVersion } from "./app-catalog.js";
import { fullVersion, getVersionEntry } from "./versioning.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { filter: "all", query: "", selectedAppId: "labvirtualds-vr-android" };

const elements = {
  dialog: $("#appStoreDialog"),
  grid: $("#appStoreGrid"),
  details: $("#appStoreDetails"),
  search: $("#appStoreSearch"),
  filters: $("#appStoreFilters")
};

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function notify(message) {
  window.dispatchEvent(new CustomEvent("holomotion:toast", { detail: { message } }));
  const toast = $("#toast");
  if (!toast || toast.textContent === message) return;
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2200);
}

function platformLabel(app) {
  if (app.platform === "android") return "Android";
  return app.offlineCapable ? "Web · PWA" : "Web";
}

function availabilityLabel(app) {
  return app.availability === "available" ? "Disponível" : "Planejado";
}

function appCard(app) {
  const version = resolveAppVersion(app);
  const badges = [
    `<span data-platform="${escapeHtml(app.platform)}">${escapeHtml(platformLabel(app))}</span>`,
    app.delivery === "offline" ? '<span data-platform="offline">Offline</span>' : "",
    app.category === "hologram" ? "<span>Holograma</span>" : "",
    app.category === "sensors" ? "<span>Sensores</span>" : "",
    app.category === "games" ? "<span>Jogo</span>" : ""
  ].filter(Boolean).join("");
  return `<article class="app-card${state.selectedAppId === app.id ? " selected" : ""}" data-app-id="${escapeHtml(app.id)}" data-availability="${escapeHtml(app.availability)}" tabindex="0" role="button" aria-label="Ver detalhes de ${escapeHtml(app.name)}"><div class="app-card-cover"><span>${escapeHtml(app.icon)}</span><i></i></div><div class="app-card-body"><div class="app-card-title"><div><small>${escapeHtml(app.shortName)}</small><h3>${escapeHtml(app.name)}</h3></div><em>${app.version === "planejada" ? "planejada" : `v${escapeHtml(version)}`}</em></div><p>${escapeHtml(app.summary)}</p><div class="app-card-badges">${badges}</div><footer><span>${escapeHtml(availabilityLabel(app))}</span><b>${app.availability === "available" ? "Detalhes →" : "Roteiro futuro"}</b></footer></div></article>`;
}

function appActionMarkup(app) {
  if (app.availability !== "available" || app.action.type === "planned") return '<button class="store-primary-action" type="button" disabled>Aplicativo em planejamento</button>';
  if (app.action.type === "download") return `<a class="store-primary-action" href="${escapeHtml(app.file)}" download="${escapeHtml(app.fileName)}" data-app-download="${escapeHtml(app.id)}">${escapeHtml(app.action.label)}</a>`;
  if (app.action.type === "mode") return `<button class="store-primary-action" type="button" data-app-mode="${escapeHtml(app.action.value)}">${escapeHtml(app.action.label)}</button>`;
  return "";
}

function renderDetails(app) {
  if (!app) {
    elements.details.innerHTML = '<div class="app-details-empty"><span>⌕</span><b>Nenhum aplicativo encontrado</b><p>Altere os filtros ou a busca.</p></div>';
    return;
  }
  const version = resolveAppVersion(app);
  const technical = app.platform === "android"
    ? `<dl class="app-tech-list"><div><dt>Arquivo</dt><dd>${escapeHtml(app.fileName || "--")}</dd></div><div><dt>Tamanho</dt><dd>${escapeHtml(formatFileSize(app.fileSize))}</dd></div><div><dt>Pacote</dt><dd>${escapeHtml(app.packageName || "--")}</dd></div></dl>`
    : `<dl class="app-tech-list"><div><dt>Execução</dt><dd>Navegador com processamento local</dd></div><div><dt>Offline</dt><dd>${app.offlineCapable ? "Após o primeiro carregamento" : "Não"}</dd></div><div><dt>Privacidade</dt><dd>Câmera não é gravada</dd></div></dl>`;
  const checksum = app.sha256 ? `<div class="checksum-box"><small>SHA-256</small><code>${escapeHtml(app.sha256)}</code><button type="button" data-copy-checksum="${escapeHtml(app.sha256)}">Copiar</button></div>` : "";
  elements.details.innerHTML = `<div class="app-details-hero" data-platform="${escapeHtml(app.platform)}"><span>${escapeHtml(app.icon)}</span><div><small>${escapeHtml(platformLabel(app))} · ${escapeHtml(availabilityLabel(app))}</small><h3>${escapeHtml(app.name)}</h3><b>${app.version === "planejada" ? "Versão em planejamento" : `Versão ${escapeHtml(version)}`}</b></div></div><p class="app-details-description">${escapeHtml(app.description)}</p><div class="detail-chip-row"><span>${escapeHtml(app.delivery === "offline" ? "Funciona offline" : "Executa na Web")}</span><span>${escapeHtml(app.category === "vr" ? "Realidade virtual" : app.category === "sensors" ? "Sensores" : app.category === "games" ? "Jogo corporal" : "Holograma 3D")}</span></div><h4>Requisitos</h4><ul class="requirement-list">${app.requirements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${technical}${checksum}<div class="app-details-actions">${appActionMarkup(app)}</div>${app.platform === "android" && app.availability === "available" ? '<p class="android-install-note">Após baixar, abra o APK no Android. O sistema poderá solicitar autorização para instalar aplicativos desta fonte.</p>' : ""}`;
}

function render() {
  const apps = filterApps({ filter: state.filter, query: state.query });
  if (!apps.some((app) => app.id === state.selectedAppId)) state.selectedAppId = apps[0]?.id || null;
  elements.grid.innerHTML = apps.map(appCard).join("") || '<div class="store-empty"><span>⌕</span><b>Nenhum aplicativo encontrado</b><p>Tente outro filtro ou termo.</p></div>';
  $("#appStoreResultText").textContent = `${apps.length} ${apps.length === 1 ? "aplicativo encontrado" : "aplicativos encontrados"}`;
  $$('[data-store-filter]').forEach((button) => button.classList.toggle("active", button.dataset.storeFilter === state.filter));
  renderDetails(getAppById(state.selectedAppId));
}

export function openAppStore(filter = state.filter) {
  state.filter = APP_STORE_FILTERS.some((item) => item.id === filter) ? filter : "all";
  elements.search.value = state.query;
  render();
  if (!elements.dialog.open) {
    if (typeof elements.dialog.showModal === "function") elements.dialog.showModal();
    else elements.dialog.setAttribute("open", "");
  }
}

function closeStore() {
  if (typeof elements.dialog.close === "function" && elements.dialog.open) elements.dialog.close();
  else elements.dialog.removeAttribute("open");
}

function selectCard(card) {
  state.selectedAppId = card.dataset.appId;
  render();
}

function bind() {
  [$("#appStoreButton"), $("#welcomeStoreButton"), $("#appStoreDetailsButton")].filter(Boolean).forEach((button) => button.addEventListener("click", () => openAppStore("all")));
  $("#closeAppStoreButton")?.addEventListener("click", closeStore);
  elements.filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-store-filter]");
    if (!button) return;
    state.filter = button.dataset.storeFilter;
    render();
  });
  elements.search.addEventListener("input", (event) => { state.query = event.target.value; render(); });
  elements.grid.addEventListener("click", (event) => { const card = event.target.closest("[data-app-id]"); if (card) selectCard(card); });
  elements.grid.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-app-id]");
    if (!card) return;
    event.preventDefault();
    selectCard(card);
  });
  elements.details.addEventListener("click", async (event) => {
    const modeButton = event.target.closest("[data-app-mode]");
    if (modeButton) {
      if (document.documentElement.dataset.holoReady !== "true") {
        notify("O motor Web ainda está carregando. Aguarde alguns segundos ou use um aplicativo Android.");
        return;
      }
      closeStore();
      window.dispatchEvent(new CustomEvent("holomotion:launch-mode", { detail: { mode: modeButton.dataset.appMode } }));
    }
    const copyButton = event.target.closest("[data-copy-checksum]");
    if (copyButton) {
      try { await navigator.clipboard.writeText(copyButton.dataset.copyChecksum); notify("Checksum copiado"); }
      catch { notify("Não foi possível copiar automaticamente"); }
    }
    if (event.target.closest("[data-app-download]")) notify("Download do APK iniciado");
  });
}

function initialize() {
  const appStoreVersion = getVersionEntry("appStore");
  $("#appStoreVersionBadge").textContent = fullVersion(appStoreVersion?.version);
  $("#webAppCount").textContent = `${countAvailableApps("web")} disponíveis`;
  $("#androidAppCount").textContent = `${countAvailableApps("android")} disponível`;
  elements.filters.innerHTML = APP_STORE_FILTERS.map((filter) => `<button class="store-filter${filter.id === state.filter ? " active" : ""}" type="button" data-store-filter="${escapeHtml(filter.id)}">${escapeHtml(filter.label)}</button>`).join("");
  render();
  bind();
  const params = new URLSearchParams(window.location.search);
  if (params.has("store")) queueMicrotask(() => openAppStore(params.get("store") || "all"));
}

initialize();
