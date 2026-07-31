# Arquitetura modular — 4.5.0

## Inicialização leve

O portal carrega somente interface, catálogo, configurações, versionamento e bootstrap. Three.js, MediaPipe, modelos, jogos, Holo Explorer, Vision Scanner e Holo Assembly permanecem sob demanda.

## Núcleo de hardware

- `hardware-manager.js`: mídia, GPU, WebGPU, memória, armazenamento e sensores físicos;
- `benchmark-engine.js`: frequência da tela, CPU sintética, Canvas e WebGL;
- `performance-manager.js`: perfil, orçamento, alvo gráfico e adaptação;
- `vision.js`: câmera selecionada e restrições dinâmicas;
- `audio.js`: saída de áudio selecionável quando suportada.

## Ciclo dos laboratórios

```text
load → start → pause/resume → stop → dispose
```

Ao sair, o módulo deve remover eventos, cancelar animações, encerrar Workers e liberar recursos gráficos.

## Separação de frequências

- renderização: `requestAnimationFrame`, limitada pela tela;
- mãos: frequência própria;
- corpo: frequência própria;
- rosto: somente quando solicitado;
- objetos: detector em frequência reduzida;
- câmera: conforme dispositivo e seleção.

## Cache

- núcleo leve na instalação;
- módulos no cache conforme uso;
- bibliotecas e modelos externos em cache separado;
- pacotes offline por solicitação.
