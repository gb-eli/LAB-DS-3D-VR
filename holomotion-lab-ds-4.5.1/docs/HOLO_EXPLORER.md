# Holo Explorer Advanced 2.0

## Objetivo

Transformar maquetes holográficas educacionais em experiências guiadas, desafios e quizzes manipuláveis por câmera, mouse ou toque, sem backend e sem arquivos 3D pesados obrigatórios.

## Modos

| Modo | Finalidade |
|---|---|
| Exploração livre | observar, girar, ampliar, explodir e selecionar componentes |
| Visita guiada | seguir uma sequência pedagógica com instruções e fatos |
| Desafio | localizar componentes contra o tempo e formar combos |
| Holo Quiz | responder perguntas relacionadas à exposição |

## Exposições e partes selecionáveis

### Sistema Solar — Orbit Master

Sol e oito planetas. A atividade trabalha ordem, planetas rochosos, gigantes e órbitas.

### Terra e Lua

Terra, atmosfera, Equador e Lua. A atividade aborda rotação, fases e relações entre os astros.

### Placa-mãe — Hardware Repair

Processador, RAM, armazenamento, PCI Express, chipset e cooler.

### Drone — Drone Balance

Corpo, câmera, bateria, quatro motores e hélices.

### Robô — Robot Trainer

Cabeça, núcleo, braços, mãos e pernas.

### Vulcão — Volcano Lab

Cone, câmara magmática, conduto e cratera. A simulação permite variar pressão, temperatura e viscosidade.

### Caverna — Crystal Hunt

Entrada, galeria, cristais e estalactites.

### Mapa — Geo Routes

Américas, África, Europa, Ásia e Oceania.

### Monumentos — Monument Puzzle

Torre, pirâmide e arco estrutural.

## Controles

### Câmera

- apontar para destacar;
- pinça para selecionar;
- movimento da mão para arrastar;
- giro do punho para rotacionar;
- distância entre duas mãos para escala.

### Mouse e toque

- clique ou toque para selecionar;
- arrastar para mover ou girar;
- roda do mouse para zoom;
- botões para anterior, próxima, explodir, pausar e centralizar.

## Validação de atividades

Cada etapa contém:

- identificador da peça esperada;
- título e instrução;
- dica opcional;
- fato educativo;
- pontuação;
- tempo e combo no modo desafio.

A peça incorreta não avança a atividade. A peça correta recebe foco visual e libera a próxima etapa.

## Quiz

Cada exposição possui perguntas próprias. A interface registra:

- resposta escolhida;
- acerto ou erro;
- explicação;
- pontuação;
- progresso até a conclusão.

## Pacote offline

Como as maquetes são procedurais, um único pacote armazena:

- `explorer-advanced.js`;
- catálogo das exposições;
- motor 3D;
- Three.js;
- estilos e arquivos compartilhados necessários.

Não é necessário duplicar um arquivo GLB para cada categoria.

## Desempenho

- somente Hand Tracking fica ativo;
- o objeto anterior é descartado ao trocar de exposição;
- geometrias e materiais recebem `dispose()`;
- sensores de corpo, rosto e objetos permanecem pausados;
- resolução, partículas e pixel ratio seguem o perfil selecionado.

## Expansão futura

A pasta `models/explorer/` permanece preparada para modelos GLB opcionais. Eles deverão ser compactados, carregados sob demanda e possuir versões leves para dispositivos móveis.
