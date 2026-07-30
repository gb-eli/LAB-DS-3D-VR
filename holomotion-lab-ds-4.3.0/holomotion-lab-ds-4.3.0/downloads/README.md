# Aplicativos Android

Esta pasta contém os APKs disponibilizados pela aba **Aplicativos VR**.

## Aplicativo atual

- Arquivo: `LabVirtualDS-VR-v0.3.3.apk`
- Pacote identificado: `br.com.labvirtualds.vr`
- Versão de catálogo: `0.3.3`
- SHA-256: `61024edb523a15130184dba23893ce4c1c111999e9c24e30eacdb4a1869af614`

## Como adicionar um novo aplicativo

1. Copie o APK para esta pasta usando um nome sem espaços.
2. Calcule o SHA-256 do arquivo.
3. Cadastre o aplicativo em `src/app-catalog.js`.
4. Atualize a versão da loja em `src/versioning.js`.
5. Execute `npm run validate`.

Os APKs não são carregados na abertura da página. O download só ocorre quando o usuário escolhe instalar o aplicativo.
