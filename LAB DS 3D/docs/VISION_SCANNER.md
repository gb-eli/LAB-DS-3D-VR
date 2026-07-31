# Vision Scanner 1.0

O Vision Scanner é o subsistema de inteligência visual do HoloMotion Lab DS 4.4.1. Ele é carregado somente quando o usuário abre o modo **Scanner**, preservando o carregamento inicial e o FPS dos demais laboratórios.

## Experiências

- **Scanner livre:** caixas, categorias, confiança, cores e relações detectadas.
- **Object Quest:** solicita objetos comuns, como garrafa, celular, mochila, cadeira, livro, copo, notebook e teclado.
- **Color Quest:** procura objetos com a cor solicitada.
- **Shape Scanner:** analisa formas de alto contraste, como círculo, quadrado, retângulo e triângulo.
- **Classroom Scanner:** apresenta uma contagem aproximada de pessoas e objetos da sala.
- **Action Detective:** solicita ações corporais, pulo, palmas, braços, abraço provável e aperto de mãos provável.

## Funcionamento

1. A câmera é compartilhada com o Vision Core.
2. O detector de objetos é iniciado em um Web Worker quando possível.
3. O modelo EfficientDet Lite0 é baixado somente no primeiro uso.
4. As caixas são rastreadas entre análises para manter IDs mais estáveis.
5. Cores e formas são analisadas localmente em uma cópia reduzida do quadro.
6. Corpo e mãos são combinados apenas nas experiências que precisam de relações ou ações.

## Desempenho

O detector de objetos não precisa trabalhar na mesma frequência da renderização. O perfil selecionado controla o intervalo aproximado:

- Economia: cerca de 3 análises por segundo.
- Equilibrado: cerca de 5 a 8 análises por segundo.
- Precisão: cerca de 8 a 10 análises por segundo.
- DS Turbo: até aproximadamente 11 a 15 análises por segundo, conforme o equipamento.

As caixas continuam sendo desenhadas em até 60 FPS, mesmo quando novas detecções chegam em frequência menor.

## Limitações

- A contagem é aproximada quando pessoas ou objetos ficam escondidos.
- Boné, tênis, roupas específicas e componentes de hardware exigirão modelos personalizados em versões futuras.
- Abraço e aperto de mãos são classificados como prováveis, pois uma webcam comum não confirma contato físico ou profundidade real.
- Cores variam com iluminação, reflexos e balanço de branco da câmera.
- O Shape Scanner funciona melhor com uma forma escura sobre fundo claro e sem muitos objetos ao redor.

## Privacidade

O projeto não grava vídeo nem envia imagens para um servidor do HoloMotion. O processamento ocorre no navegador. Apenas resultados derivados, como categoria, confiança, pontuação e missão concluída, podem ser salvos localmente.
