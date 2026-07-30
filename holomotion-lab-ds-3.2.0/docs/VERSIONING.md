# Versionamento do HoloMotion Lab DS

A versão 3.2.0 utiliza versionamento semântico e um catálogo central em `src/versioning.js`.

## Formato

```text
MAJOR.MINOR.PATCH
```

- **MAJOR:** reconstrução estrutural ou mudança incompatível;
- **MINOR:** nova funcionalidade compatível;
- **PATCH:** correção, ajuste de precisão, texto, gráfico ou desempenho.

## Escopos independentes

O catálogo mantém versões separadas para:

- aplicação completa;
- interface;
- motor de visão;
- rastreamento das mãos;
- rastreamento corporal;
- rastreamento facial;
- Holo Sandbox;
- Shape Catch;
- Holo Draw;
- Pose Mirror;
- Gesture Lab;
- Face Reactor;
- PWA e cache.

Uma correção exclusiva do Shape Catch deve alterar somente a versão do Shape Catch. A versão geral é atualizada quando uma nova entrega consolidada é publicada.

## Como registrar uma atualização

1. Edite a entrada correspondente em `src/versioning.js`.
2. Atualize `version`, `summary` e `changes`.
3. Quando houver nova entrega geral, atualize também `VERSION_CATALOG.app`, `RELEASE_HISTORY`, `package.json` e o identificador de cache em `sw.js`.
4. Registre a entrega em `CHANGELOG.md`.
5. Execute:

```bash
npm run validate
```

Os testes verificam versões semânticas e consistência entre o catálogo, o pacote, o histórico e o Service Worker.


## Catálogo de aplicativos

A loja possui versão própria em `VERSION_CATALOG.appStore`. O pacote geral deve receber uma nova versão `MINOR` quando forem adicionados filtros, tipos de plataforma ou recursos de distribuição.

Cada aplicativo é cadastrado em `src/app-catalog.js`. Aplicativos Web podem usar `versionKey` para reaproveitar a versão do laboratório. APKs usam uma versão explícita, caminho do arquivo, tamanho e SHA-256.

A atualização de um APK não exige alterar a versão dos sensores ou dos laboratórios Web. Atualize apenas:

1. arquivo em `downloads/`;
2. entrada correspondente em `src/app-catalog.js`;
3. versão da loja, quando houver mudança funcional;
4. histórico da entrega;
5. checksum e tamanho.
