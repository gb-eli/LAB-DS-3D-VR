import { VERSION_CATALOG, fullVersion } from './versioning.js';

const $ = (selector) => document.querySelector(selector);
let runtimePromise = null;
let runtimeReady = false;

function setPortalVersion() {
  const version = VERSION_CATALOG.app.version;
  document.title = `HoloMotion Lab DS ${version.split('.').slice(0, 2).join('.')}`;
  const appVersion = $('#appVersionLabel');
  const welcomeVersion = $('#welcomeVersionLabel');
  const dialogBadge = $('#versionDialogBadge');
  if (appVersion) appVersion.textContent = version;
  if (welcomeVersion) welcomeVersion.textContent = version;
  if (dialogBadge) dialogBadge.textContent = fullVersion(version);
  document.documentElement.dataset.portalReady = 'true';
}

function setPortalLoading(message, progress = 8) {
  const panel = $('#loadingPanel');
  const welcome = $('#welcomePanel');
  if (!panel) return;
  welcome?.classList.remove('panel-visible');
  panel.classList.add('panel-visible');
  panel.setAttribute('aria-hidden', 'false');
  const text = $('#loadingMessage');
  const bar = $('#loadingProgress');
  if (text) text.textContent = message;
  if (bar) bar.style.width = `${progress}%`;
}

async function ensureRuntime() {
  if (runtimeReady) return;
  if (!runtimePromise) {
    setPortalLoading('Carregando somente o núcleo da experiência solicitada…', 12);
    runtimePromise = import('./main.js')
      .then(() => {
        runtimeReady = true;
        document.documentElement.dataset.holoReady = 'true';
        window.dispatchEvent(new CustomEvent('holomotion:runtime-ready'));
      })
      .catch((error) => {
        runtimePromise = null;
        const panel = $('#loadingPanel');
        panel?.classList.remove('panel-visible');
        $('#welcomePanel')?.classList.add('panel-visible');
        const compatibility = $('#compatibilityText');
        if (compatibility) compatibility.textContent = `Falha ao carregar o motor: ${error?.message || 'erro desconhecido'}`;
        throw error;
      });
  }
  return runtimePromise;
}

function interceptAndReplay(button, { loadOnly = false } = {}) {
  if (!button) return;
  button.addEventListener('click', async (event) => {
    if (runtimeReady || event.__holoReplay) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    await ensureRuntime();
    if (!loadOnly) {
      const replay = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      Object.defineProperty(replay, '__holoReplay', { value: true });
      button.dispatchEvent(replay);
    }
  }, true);
}

function bindPortal() {
  interceptAndReplay($('#startCameraButton'));
  interceptAndReplay($('#demoButton'));
  [$('#versionButton'), $('#welcomeVersionButton')].forEach((button) => interceptAndReplay(button));
  window.addEventListener('holomotion:request-mode', async (event) => {
    const detail = event.detail;
    await ensureRuntime();
    window.dispatchEvent(new CustomEvent('holomotion:launch-mode', { detail }));
  });
  window.addEventListener('holomotion:launch-mode', async (event) => {
    if (runtimeReady) return;
    event.stopImmediatePropagation();
    await ensureRuntime();
    window.dispatchEvent(new CustomEvent('holomotion:launch-mode', { detail: event.detail }));
  }, { capture: true, once: true });
}

setPortalVersion();
bindPortal();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
}
