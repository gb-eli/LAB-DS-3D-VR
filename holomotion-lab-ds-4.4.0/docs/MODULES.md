# Arquitetura modular

## Inicialização

O HTML carrega `store-ui.js` e `bootstrap.js`. O bootstrap não importa Three.js, MediaPipe ou jogos. Ao pressionar iniciar, ele importa `main.js` e repete a ação original.

## Módulos dinâmicos

O catálogo `LAZY_MODULES` fica em `src/module-loader.js`. Cada item define:

- arquivo de entrada;
- classe exportada;
- peso aproximado;
- sensores necessários;
- nome de exibição.

A interface utiliza:

```javascript
await moduleLoader.activate("checklist", context);
```

Ao trocar de atividade:

```javascript
await moduleLoader.deactivate(id, { dispose: true });
```

## Motor 3D

`three-scene.js` é importado somente por `ensureHoloScene()` nos modos Explorer, Sandbox e Face Reactor.

## Service Worker

- `CORE_CACHE`: portal leve;
- `MODULE_CACHE`: arquivos buscados durante o uso;
- `EXTERNAL_CACHE`: Three.js, MediaPipe, WASM e modelos externos.

## Liberação de memória

O botão **Liberar memória** remove módulos dinâmicos inativos. Ao fechar a página, Workers, câmera, Three.js e módulos carregados recebem `dispose()` ou `close()`.
