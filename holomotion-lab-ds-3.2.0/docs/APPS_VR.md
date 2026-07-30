# Central de Aplicativos VR

## Finalidade

A aba **Apps VR** transforma o HoloMotion Lab DS em uma central de distribuição para:

- experiências holográficas executadas na Web;
- sensores de mão, corpo e rosto;
- minijogos corporais;
- aplicativos Android VR que funcionam offline;
- aplicações futuras organizadas por versão e plataforma.

## Arquitetura

```text
index.html
  ├── store-ui.js          interface independente e leve
  ├── app-catalog.js       catálogo central
  ├── versioning.js        versões da loja e dos laboratórios
  └── downloads/           arquivos APK
```

A loja é carregada antes do motor principal. Ela não importa Three.js nem MediaPipe. Assim, os usuários ainda podem consultar e baixar aplicativos Android caso o carregamento do ambiente 3D falhe ou esteja lento.

## Plataformas

### Web

- executa diretamente no navegador;
- usa HTTPS do GitHub Pages;
- pode acessar câmera com autorização;
- utiliza cache e PWA depois do primeiro acesso;
- não exige backend.

### Android

- APK baixado pelo navegador;
- instalação realizada pelo Android;
- pode funcionar totalmente offline;
- adequado para celulares e óculos VR simples;
- deve apresentar versão, requisitos, tamanho e checksum.

## Inclusão de um APK

1. Use um nome sem espaços, por exemplo `Aplicativo-VR-v1.0.0.apk`.
2. Copie o arquivo para `downloads/`.
3. Calcule o SHA-256:

```bash
sha256sum downloads/Aplicativo-VR-v1.0.0.apk
```

4. Cadastre o item em `src/app-catalog.js`.
5. Defina `availability: "available"` somente quando o arquivo existir.
6. Execute:

```bash
npm run validate
```

7. Atualize `CHANGELOG.md` e `src/versioning.js`.

## Link direto para a loja

A loja pode ser aberta automaticamente por URL:

```text
https://SEU-USUARIO.github.io/holomotion-lab-ds/?store=all
https://SEU-USUARIO.github.io/holomotion-lab-ds/?store=android
https://SEU-USUARIO.github.io/holomotion-lab-ds/?store=offline
```

Esse formato é útil para criar um botão específico no Laboratório Virtual principal.
