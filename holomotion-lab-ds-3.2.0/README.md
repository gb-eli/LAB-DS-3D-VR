# HoloMotion Lab DS 3.2

Laboratório holográfico 3D controlado por câmera, mãos, corpo e rosto. O projeto funciona **100% no front-end**, sem backend, banco de dados remoto ou chave de API, e está pronto para publicação no GitHub Pages.

A versão 3.2 mantém o motor adaptativo e o versionamento modular e acrescenta uma central estilo loja para organizar experiências Web, sensores holográficos e aplicativos Android VR offline. A loja funciona como módulo leve e independente do motor 3D, permitindo acessar os APKs mesmo quando as bibliotecas gráficas ainda estão carregando.


## Aplicativos VR e plataformas

A aba **Apps VR** organiza o projeto em duas formas de uso:

| Plataforma | Como funciona | Exemplos |
|---|---|---|
| Web | Abre diretamente no navegador e usa câmera, WebGL e sensores locais | Holo Sandbox, Gesture Lab, Shape Catch, Holo Draw, Pose Mirror e Face Reactor |
| Android | APK instalado no celular, preparado para funcionar offline | Lab Virtual DS VR 360 v0.3.3 |

A central possui filtros por Web, Android, offline, hologramas, sensores e jogos. Cada aplicativo mostra versão, disponibilidade, requisitos e finalidade. Aplicações futuras ficam identificadas como **planejadas**, sem apresentar botões de download inexistentes.

### APK incluído

- aplicativo: **Lab Virtual DS VR 360**;
- versão: `0.3.3`;
- pacote identificado: `br.com.labvirtualds.vr`;
- arquivo: `downloads/LabVirtualDS-VR-v0.3.3.apk`;
- tamanho: `53 KB`;
- SHA-256: `61024edb523a15130184dba23893ce4c1c111999e9c24e30eacdb4a1869af614`;
- uso: experiência VR 360 para Android, celular e óculos VR simples;
- execução: offline depois da instalação.

O APK não faz parte do carregamento inicial da página. Ele só é transferido quando o usuário pressiona **Baixar APK**.

O arquivo `src/app-catalog.js` é a fonte central do catálogo. O módulo `src/store-ui.js` renderiza a loja sem depender do Three.js ou do MediaPipe, preservando o acesso aos downloads caso o motor holográfico ainda não esteja disponível.

## O que está incluído

### Holo Sandbox 3D

- cubo, esfera, pirâmide, torus e cilindro;
- pinça ou mão fechada para agarrar;
- movimento pela ponta do indicador;
- rotação orientada pelo punho;
- ampliação e redução com duas mãos;
- troca de objeto por movimento lateral;
- seleção de cores e rotação automática;
- alternativa completa por mouse ou toque.

### Shape Catch

- círculos, quadrados e triângulos em queda;
- coleta por pinça, mão fechada ou toque;
- zona de captura proporcional ao tamanho da mão;
- objetivo dinâmico, pontuação, combo, precisão, nível e cronômetro;
- modo para **duas pessoas**, com rastreamento corporal e pontuação independente;
- feedback visual de acerto, erro e partículas.

### Holo Draw

- desenho no ar usando pinça;
- borracha com mão fechada;
- suavização do traço;
- cor e espessura configuráveis;
- movimento lateral para desfazer ou trocar a cor;
- limpar, desfazer e exportar PNG.

### Pose Mirror

- até dois esqueletos corporais quando o modo solicita;
- 33 pontos por corpo;
- comparação de ângulos de braços, ombros, quadril e pernas;
- sequência de poses com indicador de sustentação;
- feedback de precisão e progressão.

### Gesture Lab

Treinamento guiado para:

- mão aberta;
- mão fechada;
- pinça;
- indicador apontando;
- vitória;
- positivo;
- mão em pé;
- mão deitada;
- movimento lateral rápido.

### Face Reactor

O sensor facial detalhado é carregado somente ao abrir este modo. Ele reconhece:

- sorriso;
- boca aberta;
- piscada de cada olho;
- sobrancelhas levantadas;
- inclinação da cabeça;
- 478 pontos faciais;
- blendshapes para controlar cor, escala, rotação e pulsos do reator.

## Inteligência dos gestos

O motor não depende de uma distância fixa em pixels. Ele usa proporções relativas à palma, ângulos das articulações, extensão dos dedos, coordenadas 3D estimadas e estabilidade temporal.

| Informação reconhecida | Exemplos de uso |
|---|---|
| Ponta do indicador | cursor, desenho e seleção |
| Pinça | clicar, desenhar e agarrar |
| Mão aberta | soltar, repousar e confirmar postura |
| Mão fechada | coletar, apagar e segurar |
| Mão em pé ou deitada | desafios e comandos direcionais |
| Mão plana, curva ou dobrada | análise de postura da mão |
| Palma ou dorso voltado para a câmera | comandos espaciais |
| Duas mãos | escala e interações bimanual |
| Deslizar | trocar objeto, cor ou desfazer |
| Aproximar/afastar da câmera | empurrar e puxar |
| Girar o punho | rotação do holograma |

A classificação possui histerese e confirmação por quadros consecutivos, reduzindo alternâncias involuntárias entre gestos semelhantes.

## Sistema de versionamento

O arquivo `src/versioning.js` é a fonte única de verdade para as versões. Ele registra:

- versão geral do pacote;
- versões independentes dos sensores de mãos, corpo e rosto;
- versão de cada laboratório;
- versão da interface, loja de aplicativos, PWA e cache;
- tecnologias utilizadas e respectivas versões;
- resumos curtos de bugs corrigidos, gráficos, sensores e funcionalidades;
- histórico das entregas e créditos.

Na interface, a versão geral aparece discretamente no topo. Cada laboratório exibe uma versão compacta no desktop e no painel de controles. No mobile, informações secundárias são ocultadas para preservar o campo visual. O painel **Versões, novidades e créditos** reúne os detalhes completos em abas. A loja possui versão independente, atualmente `1.0.0`.

A numeração segue versionamento semântico:

```text
MAJOR.MINOR.PATCH
3.2.0
```

- `MAJOR`: mudança estrutural incompatível ou grande reconstrução;
- `MINOR`: nova funcionalidade compatível;
- `PATCH`: correção de bug, precisão, texto ou desempenho.

## Arquitetura de desempenho

```text
Câmera
  ↓
Quadro redimensionado
  ↓
Worker de visão computacional
  ↓
MediaPipe Hand / Pose / Face Landmarker
  ↓
Estabilização e classificação geométrica
  ↓
Roteador de ações
  ↓
Jogos, desenho, interface e Three.js
```

### Otimizações principais

- inferência fora da thread principal quando `Web Worker`, `OffscreenCanvas` e `ImageBitmap` estão disponíveis;
- fallback automático para a thread principal em navegadores incompatíveis;
- somente **uma inferência pesada por ciclo**;
- mãos, corpo e rosto agendados conforme o modo ativo;
- rosto carregado sob demanda;
- corpo configurado para uma ou duas pessoas somente quando necessário;
- resolução da IA independente da resolução exibida pela câmera;
- suavização adaptativa: movimentos rápidos recebem menos atraso e movimentos pequenos recebem mais estabilidade;
- descarte de quadros quando o processador ainda está ocupado;
- redução automática da resolução e frequência quando FPS ou tempo de inferência pioram;
- pixel ratio, partículas e frequência de renderização adaptativos;
- pausa da câmera ao ocultar a página;
- criação protegida dos sensores para evitar inicializações duplicadas.

## Perfis de qualidade

| Perfil | Câmera ideal | Resolução da IA | Renderização alvo | Uso recomendado |
|---|---:|---:|---:|---|
| Econômica | 640×360 | 384×216 | 30 FPS | celulares e Chromebooks simples |
| Equilibrada | 960×540 | 512×288 | 45 FPS | configuração padrão |
| Precisão | 1280×720 | 640×360 | 60 FPS | computador com GPU mais forte |

O modo automático pode reduzir temporariamente esses valores para recuperar estabilidade. A interface exibe FPS, frequência de cada sensor, tempo de inferência, resolução usada, backend e acelerador.

## Interface e mobile

- campo de interação preservado;
- HUD compacto no canto;
- barra inferior com seis modos;
- instruções contextuais somente quando necessárias;
- controles e sensores em painéis recolhíveis;
- painéis viram folhas deslizantes no celular;
- status da câmera reduzido a indicador compacto em telas estreitas;
- suporte a áreas seguras de aparelhos com recorte;
- interface com toque, mouse, teclado e gestos;
- animações reduzidas quando o sistema solicita `prefers-reduced-motion`.

As prévias visuais utilizadas na revisão estão em `docs/screenshots/`, incluindo a loja em desktop e mobile.

## Armazenamento e privacidade

O projeto não grava nem envia vídeo, fotos, rosto, áudio ou localização. Os quadros existem apenas em memória durante o reconhecimento.

O navegador pode armazenar localmente:

- preferências;
- perfil de qualidade;
- sensibilidade;
- modo espelhado;
- recordes e pontuações;
- objeto e cor escolhidos;
- quantidade de sessões.

Microfone e localização são bloqueados pela política da própria página porque não são necessários.

## Dependências

- Three.js `0.185.1`;
- MediaPipe Tasks Vision `0.10.35`;
- Hand Landmarker float16;
- Pose Landmarker Lite float16;
- Face Landmarker float16.

As versões estão fixadas em `index.html` e `src/config.js`. No primeiro acesso, navegador, WASM e modelos precisam ser baixados. O Service Worker mantém os recursos em cache quando o navegador permite.

## Publicação no GitHub Pages

1. Crie um repositório, por exemplo `holomotion-lab-ds`.
2. Extraia o ZIP na raiz do repositório.
3. Envie todos os arquivos, inclusive `.github`, `.nojekyll`, `tests` e `scripts`.
4. Abra **Settings → Pages**.
5. Em **Build and deployment**, selecione **GitHub Actions**.
6. Faça o envio para o branch `main`.
7. Acompanhe os testes e a publicação na aba **Actions**.

O endereço será semelhante a:

```text
https://SEU-USUARIO.github.io/holomotion-lab-ds/
```

O workflow executa `npm test` e `npm run check` antes da publicação. A validação também confere o tamanho e o SHA-256 de cada APK cadastrado; uma falha impede a substituição da versão on-line.

## Teste local

Não abra diretamente por `file://`. Inicie um servidor:

```bash
python -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

Validação com Node.js 22 ou superior:

```bash
npm test
npm run check
npm run validate
```

## Testes incluídos

- classificação de mão aberta e fechada;
- espelhamento sem alteração dos dados originais;
- estabilidade temporal dos gestos;
- orientação vertical e horizontal;
- movimento lateral rápido;
- sorriso, boca e inclinação facial;
- coleta de forma com a mão fechada;
- pontuação independente para duas pessoas.

Consulte `docs/QA.md` para o relatório da versão.

A central de aplicativos possui documentação própria em `docs/APPS_VR.md`.

## Integração com o Laboratório Virtual

```html
<a
  href="https://SEU-USUARIO.github.io/holomotion-lab-ds/"
  target="_blank"
  rel="noopener noreferrer"
>
  Abrir Laboratório Holográfico 3D
</a>
```

A nova aba oferece mais espaço, simplifica a permissão da câmera e evita conflitos de `iframe`. Para abrir diretamente a loja Android, use `?store=android`.

## Estrutura principal

```text
holomotion-lab-ds/
├── .github/workflows/deploy-pages.yml
├── assets/
│   ├── icons/icon.svg
│   └── styles.css
├── docs/
│   ├── APPS_VR.md
│   ├── QA.md
│   ├── VERSIONING.md
│   └── screenshots/
├── downloads/
│   ├── LabVirtualDS-VR-v0.3.3.apk
│   └── README.md
├── scripts/check.mjs
├── src/
│   ├── app-catalog.js
│   ├── audio.js
│   ├── config.js
│   ├── draw-engine.js
│   ├── face-engine.js
│   ├── gesture-engine.js
│   ├── gesture-game.js
│   ├── interaction-router.js
│   ├── main.js
│   ├── pose-game.js
│   ├── shape-game.js
│   ├── storage.js
│   ├── store-ui.js
│   ├── three-scene.js
│   ├── vision-renderer.js
│   ├── vision.js
│   └── vision.worker.js
├── tests/
├── index.html
├── manifest.webmanifest
├── sw.js
└── README.md
```

## Limitações reais

Uma webcam comum não possui o sensor físico de profundidade do Kinect. A profundidade é estimada, portanto podem ocorrer perdas quando mãos se sobrepõem, partes do corpo saem do quadro, existe pouca luz ou o dispositivo reduz o desempenho.

O modo para duas pessoas usa os punhos do esqueleto corporal, pois tentar rastrear quatro mãos detalhadas junto com dois corpos em uma webcam comum produziria maior atraso. O modo facial detalhado trabalha com uma pessoa por vez para manter estabilidade e qualidade.

Para o jogo corporal, mantenha as pessoas a aproximadamente 1,5 a 2,5 metros da câmera, com iluminação frontal e espaço livre ao redor.

## Documentação de versionamento

Consulte `docs/VERSIONING.md` para regras de atualização, escopos independentes e procedimento de publicação.
