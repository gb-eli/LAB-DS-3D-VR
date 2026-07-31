# Central de Aplicativos VR

## Finalidade

A aba **Apps VR** organiza:

- experiências holográficas executadas na Web;
- sensores de mãos, corpo e rosto;
- jogos corporais;
- ferramentas de treinamento;
- aplicativos Android VR offline;
- projetos futuros marcados como planejados.

## Ferramentas Web 4.2

- Holo Explorer;
- Academia de Movimentos;
- Sequência Corporal;
- Aura Cósmica;
- Holo Sandbox;
- Shape Catch;
- Holo Draw;
- Pose Mirror;
- Gesture Lab;
- Face Reactor.

## Arquitetura

```text
index.html
  ├── src/store-ui.js       interface leve
  ├── src/app-catalog.js    catálogo central
  ├── src/versioning.js     versões
  └── downloads/            arquivos APK
```

A loja não depende do Three.js nem do MediaPipe. Ela pode abrir mesmo quando o motor de visão ainda está carregando.

## Plataformas

### Web

- executa no navegador;
- usa HTTPS do GitHub Pages;
- acessa a câmera somente com autorização;
- pode manter recursos em cache;
- não depende de backend.

### Android

- arquivo APK baixado pelo navegador;
- instalação realizada pelo Android;
- possibilidade de uso offline;
- adequado para celular e óculos VR simples;
- cada arquivo deve apresentar versão, requisitos, tamanho e checksum.

## APK incluído

```text
Lab Virtual DS VR 360
Versão 0.3.3
Pacote br.com.labvirtualds.vr
Arquivo downloads/LabVirtualDS-VR-v0.3.3.apk
SHA-256 61024edb523a15130184dba23893ce4c1c111999e9c24e30eacdb4a1869af614
```

## Incluir um novo APK

1. Use nome de arquivo sem espaços.
2. Copie para `downloads/`.
3. Calcule o SHA-256.
4. Cadastre em `src/app-catalog.js`.
5. Defina `availability: "available"` somente quando o arquivo existir.
6. Atualize a versão da loja se houver mudança funcional.
7. Execute `npm run validate`.

## Links diretos

```text
https://SEU-USUARIO.github.io/holomotion-lab-ds/?store=all
https://SEU-USUARIO.github.io/holomotion-lab-ds/?store=android
https://SEU-USUARIO.github.io/holomotion-lab-ds/?store=offline
```
