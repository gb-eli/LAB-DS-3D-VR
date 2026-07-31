# Desempenho e perfis — 4.5.1

## Princípio

A renderização, a câmera e a inteligência visual possuem frequências diferentes. O sistema não executa todos os modelos na frequência gráfica e não mantém sensores desnecessários ativos.

## Perfis

| Perfil | Alvo gráfico | Prioridade |
|---|---:|---|
| Economia | 35 FPS | consumo e compatibilidade |
| Desempenho | 60 FPS | resposta e estabilidade |
| Equilibrado | 50 FPS | uso geral |
| Qualidade | 45 FPS | efeitos e modelos |
| Precisão | 45 FPS | mãos, dedos e sensores |
| DS Turbo | 60 FPS | notebook potente |
| DS Ultra | até 120 FPS | telas de alta frequência e GPU forte |
| Experimental 240 | até 240 FPS | teste, limitado pela tela |
| Automático | adaptativo | benchmark e estabilidade |

O alvo efetivo nunca ultrapassa a frequência medida da tela.

## DS Ultra

Quando suportado:

- câmera solicitada em até 1920 × 1080 e 60 FPS;
- processamento visual ampliado;
- maior pixel ratio;
- orçamento maior de partículas;
- até três módulos recentes mantidos temporariamente;
- renderização com alvo de até 120 FPS.

O perfil não mantém corpo, face, objetos e mãos ligados ao mesmo tempo sem necessidade.

## Performance Manager

O gerenciador utiliza:

- média móvel de FPS;
- percentil inferior;
- detecção de travamentos;
- histerese;
- cinco níveis de redução;
- recuperação gradual;
- frequência real da tela;
- resultado do benchmark;
- capacidade exposta pelo navegador.

Ordem de redução:

1. efeitos decorativos;
2. partículas;
3. sombras e pós-processamento;
4. pixel ratio;
5. resolução gráfica;
6. sensores auxiliares;
7. modo emergencial.

O sensor principal da atividade é preservado pelo maior tempo possível.

## Câmera

A versão 4.5.1 remove o antigo limite máximo fixo de 30 FPS. A plataforma passa a solicitar o valor escolhido ou recomendado. O valor real deve ser conferido em `MediaStreamTrack.getSettings()`.

## GPU

WebGL é criado com preferência de alto desempenho. A Central mostra o renderizador exposto e testa WebGPU. O sistema operacional continua responsável por escolher a GPU.

## Benchmark

O benchmark recomenda um perfil a partir de:

- CPU sintética;
- Canvas;
- WebGL;
- frequência da tela;
- núcleos lógicos;
- memória aproximada;
- WebGPU;
- armazenamento;
- modo de economia de dados.

A nota é interna ao HoloMotion e não representa desempenho absoluto de jogos nativos.

## Monitoramento disponível

- FPS e tempo de quadro;
- frequência de renderização alvo;
- tempos de inferência;
- resolução ativa;
- renderizador WebGL;
- adaptador WebGPU;
- heap JavaScript quando exposto;
- espaço usado e disponível;
- módulos e sensores ativos.

O navegador não fornece uso global confiável de CPU, GPU, VRAM ou temperatura. Esses valores não são simulados.
