# Profundidade estimada, tutorial e acessibilidade — 4.4.4

## Profundidade estimada

O navegador recebe coordenadas aproximadas das mãos, mas uma webcam comum não mede distância como um Kinect. O `HandDepthEstimator` combina:

- escala aparente da palma;
- coordenada espacial estimada;
- suavização temporal;
- histerese entre zonas;
- calibração automática.

As zonas são:

- **LONGE**;
- **MÉDIO**;
- **PERTO**.

A histerese evita que a classificação oscile quando a mão está próxima da fronteira entre duas zonas.

## Modos do Holo Assembly

### Desligado

Ignora a profundidade e valida apenas a posição 2D.

### Assistido

Mostra a zona atual, orienta o aluno e concede bônus, mas não impede o encaixe.

### Espacial

Compara a profundidade da peça e do destino. O encaixe só é aceito quando posição e profundidade aproximada estão compatíveis.

## Depth Trainer

O módulo `depth-trainer-game.js` é carregado sob demanda e não utiliza Three.js. Ele solicita uma sequência de zonas e valida a permanência da mão.

O jogo trabalha com:

- tempo de sustentação;
- pontuação;
- combo;
- precisão;
- XP;
- feedback visual.

## Tutorial animado

O `TutorialDirector` fornece uma estrutura reutilizável de etapas com:

- demonstração por mão fantasma;
- instrução curta;
- checklist contextual;
- tempo mínimo de validação;
- repetir, voltar, avançar e pausar;
- compatibilidade com movimento reduzido.

## Acessibilidade

O `AccessibilityManager` oferece cinco presets:

1. Padrão;
2. Sala de aula;
3. Alto contraste;
4. Texto grande;
5. Movimento reduzido.

As preferências são salvas localmente. O sistema utiliza:

- anúncios ARIA;
- alto contraste;
- textos maiores;
- redução de animações;
- rótulos e formas além de cores;
- áudio opcional;
- botões com áreas maiores em telas móveis.

## Limitações

- Profundidade é aproximada.
- Roupas, iluminação, distância e câmera podem alterar a escala percebida.
- Oclusão dos dedos prejudica a pinça.
- É recomendado realizar uma calibração curta antes do modo espacial.
