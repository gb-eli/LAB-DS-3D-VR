# Holo Explorer 1.0.0

## Objetivo

Disponibilizar maquetes holográficas educacionais manipuláveis por câmera, mouse ou toque, sem backend e sem arquivos 3D pesados obrigatórios.

## Exposições

| Categoria | Exposição | Elementos principais |
|---|---|---|
| Espaço | Sistema Solar | Sol, oito planetas e órbitas |
| Espaço | Terra e Lua | atmosfera, equador, eixo e órbita lunar |
| Tecnologia | Placa-mãe | CPU, RAM, slots, chipset e cooler |
| Tecnologia | Drone | motores, hélices, controlador, bateria e câmera |
| Tecnologia | Robô | sensores, articulações, atuadores e núcleo |
| Terra | Vulcão | câmara magmática, conduto, cratera e cinzas |
| Terra | Caverna | galeria, rochas, cristais e formações |
| Terra | Mapa | regiões, marcadores e rotas simuladas |
| Lugares | Monumentos | torre, pirâmide, arco e estruturas |

## Controles por câmera

A mão é convertida em um cursor espacial. A pinça ou o punho captura a maquete, o movimento arrasta, a rotação do punho gira e a distância entre duas mãos controla a escala.

A webcam comum não mede profundidade como um Kinect. O projeto combina posição 2D, escala aparente, estado do gesto e animações assistidas para manter a interação estável.

## Controles alternativos

- arrastar com mouse ou toque;
- roda do mouse para zoom;
- botões Anterior e Próxima;
- seletor de exposição;
- vista explodida;
- pausar animação;
- centralizar.

## Arquitetura

O catálogo está em `src/explorer-catalog.js`. Os construtores procedurais ficam em `src/three-scene.js`. A interface utiliza o mesmo renderer do Holo Sandbox, evitando criar outro contexto WebGL.

## Expansão futura

A pasta `models/explorer/` está preparada para modelos GLB otimizados. Quando forem adicionados, devem usar carregamento sob demanda, Meshopt ou Draco quando apropriado e texturas compactadas.
