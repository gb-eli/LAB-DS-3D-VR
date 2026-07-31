# Bibliotecas locais opcionais

A distribuição padrão usa versões fixadas de Three.js e MediaPipe Tasks Vision por CDN. Isso reduz o ZIP, mas exige internet no primeiro acesso.

Uma instalação institucional totalmente autônoma pode colocar nesta pasta:

- `three.module.js`;
- o bundle ESM do MediaPipe Tasks Vision;
- os arquivos JavaScript e WASM necessários pelo `FilesetResolver`.

Após copiar os arquivos, atualize o `importmap` em `index.html`, `moduleUrl` e `wasmPath` em `src/config.js`, além da lista `APP_SHELL` em `sw.js`.
