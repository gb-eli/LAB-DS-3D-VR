# HoloMotion Lab DS 4.5.1 — Recognition Upgrade

Plataforma educacional front-end de visão computacional, gestos, movimento corporal, hologramas, montagem 3D, scanner de ambiente e aplicativos VR. A versão 4.5.1 preserva a Central de Hardware e o Performance Engine da 4.5.0 e melhora a confiabilidade do reconhecimento.

## Novidades principais

- Correção da confusão entre gesto positivo e punho fechado.
- Classificação por candidatos com confiança e margem entre alternativas.
- Gesture Lab 2.0 com 16 desafios, pictogramas corretos e checklist detalhado.
- Academia de Movimentos ampliada de 12 para 20 etapas.
- Dance Mirror com 13 movimentos e seis coreografias.
- Avatar holográfico com núcleo energético e rastros adaptativos.
- Painel lateral de reconhecimento no desktop e interface compacta no mobile.
- Pontuação com bônus de precisão.

## Publicação no GitHub Pages

1. Extraia o conteúdo do ZIP.
2. Envie todos os arquivos ao repositório, incluindo `.github`, `.nojekyll`, `src`, `assets`, `tests` e `scripts`.
3. Em **Settings → Pages**, selecione **GitHub Actions**.
4. Envie os arquivos ao branch `main`.
5. A publicação será executada somente depois da validação automatizada.

## Funcionamento

- HTML, CSS, JavaScript, Web Workers e WebAssembly.
- Nenhum backend obrigatório.
- Câmera processada localmente.
- Three.js e sensores pesados continuam carregados sob demanda.
- Configurações, XP, versões e recordes ficam no armazenamento local.

## Teste recomendado após a publicação

- Mão fechada e positivo em diferentes distâncias.
- Mão direita e esquerda.
- Ambientes claros e escuros.
- Gesture Lab completo.
- Academia de 20 etapas.
- Dance Mirror e Avatar nos perfis Econômico, Equilibrado e DS Turbo.
- FPS prolongado nos notebooks do laboratório.

Consulte também:

- `docs/RECOGNITION_UPGRADE.md`;
- `docs/HARDWARE_AND_BENCHMARK.md`;
- `docs/PERFORMANCE.md`;
- `docs/QA.md`;
- `docs/ROADMAP.md`.
