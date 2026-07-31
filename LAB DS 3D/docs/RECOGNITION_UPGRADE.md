# Recognition Upgrade — HoloMotion Lab DS 4.5.1

## Objetivo

A versão 4.5.1 melhora a interpretação dos gestos, as instruções visuais, o avatar corporal e os jogos rítmicos sem adicionar novos modelos pesados ao carregamento inicial.

## Classificação por candidatos

O Hand Tracking calcula pontuações para os principais candidatos:

- mão aberta;
- punho fechado;
- pinça;
- apontar;
- vitória;
- positivo;
- negativo;
- OK.

O gesto final considera a melhor pontuação, a segunda alternativa e a margem entre ambas. Gestos ambíguos exigem confiança mínima antes de se tornarem estáveis.

### Correção de positivo e punho

O polegar levantado ou abaixado é verificado antes do punho. O punho fechado recebe penalização quando o polegar está claramente estendido. Isso evita que o gesto positivo seja exibido como mão fechada.

## Gesture Lab 2.0

O painel exibe:

- pictograma do gesto solicitado;
- gesto detectado;
- confiança;
- qualidade da forma;
- estabilidade;
- orientação;
- curvatura;
- alternativa mais próxima;
- checklist por dedo e condição.

O gesto só é concluído depois de atingir a confiança mínima e permanecer estável. A pontuação recebe bônus de precisão.

## Academia de Movimentos 1.1

A trilha possui 20 etapas:

1. mão aberta;
2. punho;
3. pinça;
4. apontar;
5. vitória;
6. positivo;
7. OK;
8. mão vertical;
9. mão horizontal;
10. deslizar lateralmente;
11. girar o punho;
12. braços abertos;
13. mãos ao alto;
14. braços cruzados;
15. defesa;
16. agachamento;
17. inclinação;
18. equilíbrio;
19. palmas;
20. pulo.

## Dance Mirror 1.1

Foram incluídos seis padrões com treze movimentos corporais. A pontuação considera a sustentação e a proximidade do ritmo esperado.

## Avatar Holográfico 1.1

O avatar recebeu:

- núcleo luminoso no tronco;
- rastros temporais em qualidade alta;
- maior diferenciação entre articulações;
- manutenção dos modos avatar, esqueleto e híbrido.

## Desempenho

O Recognition Upgrade não adiciona novos modelos de inteligência artificial. Os novos cálculos são geométricos e utilizam os mesmos 21 pontos das mãos e 33 pontos corporais já disponíveis.
