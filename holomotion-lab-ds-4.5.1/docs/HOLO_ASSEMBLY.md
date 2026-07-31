# Holo Assembly 1.1

Laboratório de montagem interativa carregado sob demanda. Permite selecionar, movimentar e encaixar peças usando gestos, mouse ou toque.

## Kits disponíveis

1. Computador modular;
2. Drone educacional;
3. Robô articulado;
4. Sistema Terra–Lua;
5. Rede de computadores;
6. Satélite orbital;
7. Rover explorador;
8. Circuito eletrônico.

Cada peça possui identificador, formato visual, posição inicial, encaixe e profundidade aproximada.

## Modos de atividade

- **Guiado:** indica a próxima peça e oferece dicas.
- **Desafio:** registra tempo, erros, combo e pontuação.
- **Livre:** permite montar sem ordem fixa.

## Modos de profundidade

- **Desligado:** somente posição 2D.
- **Assistido:** mostra LONGE, MÉDIO e PERTO, sem bloquear encaixe.
- **Espacial:** exige posição e profundidade aproximada corretas.

## Tutorial animado

O tutorial possui seis etapas e utiliza uma mão fantasma:

1. detectar a mão;
2. apontar;
3. fazer pinça;
4. arrastar;
5. variar a profundidade;
6. encaixar e soltar.

## Controles

- apontar: destacar;
- pinça ou clique: segurar;
- movimento, mouse ou toque: arrastar;
- abrir a mão ou soltar: liberar;
- duas mãos não são obrigatórias;
- dica: destaca peça ou destino;
- reiniciar: reorganiza o kit.

## Acessibilidade

As peças são diferenciadas por cor, forma, ícone e rótulo. Há presets de alto contraste, texto grande e movimento reduzido.

## Desempenho

- Canvas 2D;
- sem Three.js;
- somente sensor das mãos;
- profundidade calculada no mesmo fluxo;
- módulo removível da memória;
- efeitos adaptados ao FPS.

## Limitações

A profundidade é estimada e não substitui um sensor físico. O modo espacial deve ser calibrado e pode precisar ser desativado em câmeras instáveis.
