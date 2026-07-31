# HoloMotion Lab DS 4.4.0 — Motion Academy Pro

Plataforma educacional de visão computacional, jogos corporais e hologramas 3D executada integralmente no navegador. A versão 4.4.0 reorganiza o projeto para reduzir o carregamento inicial e acrescenta tutorial validado, progressão local, perfis de desempenho e cinco novos módulos.

## Execução

O projeto utiliza somente recursos compatíveis com hospedagem estática:

- HTML, CSS e JavaScript ES Modules;
- Three.js carregado somente nos modos 3D;
- MediaPipe Tasks Vision carregado ao ativar a câmera;
- Canvas 2D, WebGL, Web Workers e WebAssembly;
- LocalStorage para configurações, recordes, XP e níveis;
- Service Worker e Cache Storage;
- GitHub Pages, sem backend e sem banco de dados remoto.

## Principais novidades

### Carregamento modular

A tela inicial carrega somente o portal, catálogo, versionamento, estilos e Service Worker. O arquivo `src/main.js`, o motor 3D, os sensores e os jogos são buscados depois que o usuário inicia uma experiência.

O Three.js não é carregado em atividades que usam apenas mãos, corpo, rosto ou Canvas. Ele é importado somente ao abrir:

- Holo Explorer;
- Holo Sandbox;
- Face Reactor.

Os novos módulos também usam `import()` individual:

- Motion Checklist;
- Simon Motion;
- Reflex Challenge;
- Gesture Marathon;
- Holo Defender.

### Perfis de desempenho

- Automático;
- Desempenho máximo;
- Equilibrado;
- Qualidade gráfica;
- Precisão dos sensores;
- DS Turbo;
- Economia de energia.

O modo Automático considera capacidade aproximada do equipamento, atividade aberta e FPS observado. O DS Turbo foi preparado para os notebooks mais potentes do laboratório de Desenvolvimento de Sistemas.

### Modos de uso

- Automático;
- Apresentação em aula;
- Jogos corporais;
- Gestos e mãos;
- Libras;
- Hologramas 3D;
- Duas pessoas;
- Offline;
- Modo professor.

### Motion Checklist

Tutorial etapa por etapa com 20 atividades principais e mais de 50 comandos e variações disponíveis no catálogo. Cada etapa apresenta requisitos separados, como:

- mão ou corpo detectado;
- orientação da palma;
- posição dos dedos;
- curvatura;
- estabilidade;
- duração mínima;
- ação corporal ou facial.

### Progressão

O sistema local registra:

- XP;
- nível;
- atividades concluídas;
- melhor pontuação por módulo;
- conquistas iniciais.

Níveis disponíveis:

1. Iniciante Digital;
2. Explorador de Gestos;
3. Operador Holográfico;
4. Controlador de Movimento;
5. Especialista Corporal;
6. Mestre Holográfico;
7. Operador Cósmico.

## Novos jogos

### Motion Checklist

Treinamento validado com checklist em tempo real, navegação entre etapas e XP.

### Simon Motion

Sequência crescente de gestos e movimentos corporais que o aluno precisa repetir na ordem correta.

### Reflex Challenge

Comandos rápidos com medição do tempo de resposta, bônus de velocidade, combo e cronômetro.

### Gesture Marathon

Maratona de 90 segundos com energia, penalidade por demora e recuperação por acertos.

### Holo Defender

Palmas abertas criam escudos; punho ou pinça disparam energia; braços cruzados ou posição de guarda ativam defesa corporal.

## Estrutura principal

```text
src/
├── bootstrap.js              # portal leve e início sob demanda
├── main.js                   # runtime interativo
├── module-loader.js          # importação e descarregamento
├── performance-manager.js    # perfis, FPS e adaptação
├── progression.js            # XP, níveis e conquistas
├── motion-catalog.js         # gestos e checklists
├── motion-checklist-game.js
├── simon-motion-game.js
├── reflex-game.js
├── marathon-game.js
├── defender-game.js
├── vision.js
├── vision.worker.js
├── three-scene.js
└── demais laboratórios
```

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Envie todo o conteúdo para a raiz do repositório.
3. Preserve `.github`, `.nojekyll`, `tests`, `scripts`, `downloads` e `assets`.
4. Abra **Settings → Pages**.
5. Em **Build and deployment**, escolha **GitHub Actions**.
6. Envie os arquivos ao branch `main`.

O workflow executa `npm run validate` antes da publicação.

## Teste local

A câmera exige HTTPS ou `localhost`.

```bash
python -m http.server 8080
```

Depois, acesse:

```text
http://localhost:8080
```

## Privacidade

- A câmera é processada no equipamento.
- Vídeos, fotos e áudio não são gravados nem enviados pelo projeto.
- O microfone e a localização não são solicitados.
- XP, configurações e recordes permanecem no navegador.
- O usuário pode desligar a câmera e limpar os dados locais.

## Limitações

- Webcam comum estima profundidade e não substitui Kinect ou sensor dedicado.
- Iluminação, enquadramento, câmera e hardware alteram a precisão.
- O modo DS Turbo não garante 60 FPS em todos os equipamentos.
- Reconhecimento facial e Libras continuam experimentais.
- Os testes automatizados não substituem testes com webcam física.

Consulte `docs/QA.md`, `docs/PERFORMANCE.md`, `docs/MODULES.md` e `docs/ROADMAP.md`.
