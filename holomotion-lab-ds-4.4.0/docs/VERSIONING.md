# Versionamento do HoloMotion Lab DS

A versão 4.4.0 usa versionamento semântico e um catálogo central em `src/versioning.js`.

## Formato

```text
MAJOR.MINOR.PATCH
```

- **MAJOR:** reconstrução estrutural ou mudança incompatível;
- **MINOR:** nova funcionalidade compatível;
- **PATCH:** correção, precisão, texto, gráfico ou desempenho.

## Componentes independentes

O catálogo mantém versões separadas para:

- aplicação completa;
- interface;
- Vision Core;
- rastreamento das mãos;
- rastreamento corporal;
- rastreamento facial;
- avatar holográfico;
- Holo Explorer;
- Academia de Movimentos;
- Sequência Corporal;
- Aura Cósmica;
- Holo Sandbox;
- Shape Catch;
- Holo Draw;
- Pose Mirror;
- Gesture Lab;
- Face Reactor;
- Apps VR;
- PWA e cache.

Uma correção exclusiva no Face Reactor não exige alterar a versão do Shape Catch. A versão geral muda quando uma entrega consolidada é publicada.

## Atualização de um módulo

1. Edite a entrada em `src/versioning.js`.
2. Atualize `version`, `summary` e `changes`.
3. Registre a mudança em `CHANGELOG.md`.
4. Execute `npm run validate`.

## Nova entrega geral

Atualize:

1. `VERSION_CATALOG.app`;
2. `RELEASE_HISTORY`;
3. `package.json` e `package-lock.json`;
4. identificador de cache em `sw.js`;
5. título e versão padrão em `index.html`;
6. `manifest.webmanifest`;
7. `README.md`;
8. `CHANGELOG.md`;
9. documentação e testes.

## Aplicativos Android

Cada APK disponível precisa conter no catálogo:

- versão;
- caminho;
- nome do arquivo;
- tamanho em bytes;
- SHA-256;
- requisitos;
- estado `available`.

Aplicativos sem arquivo real devem permanecer como `planned` e não podem exibir download ativo.
