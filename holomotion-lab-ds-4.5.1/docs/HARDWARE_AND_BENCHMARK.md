# Central de hardware e benchmark — 4.5.1

## Objetivo

A Central de hardware prepara o HoloMotion para o equipamento real antes de ativar câmera, inteligência visual ou renderização 3D. Tudo é executado no navegador, sem servidor e sem envio dos resultados.

## Dispositivos de mídia

Depois que o usuário concede permissão, a plataforma pode enumerar e selecionar:

- câmeras disponíveis;
- microfones disponíveis;
- saídas de áudio quando `setSinkId()` é suportado;
- resolução desejada da câmera;
- frequência solicitada da câmera.

A escolha fica salva localmente. Ao trocar a câmera durante uma experiência, o fluxo atual é encerrado e reiniciado com as novas restrições.

### Limitações

- Os nomes dos dispositivos geralmente só aparecem depois da primeira autorização.
- A resolução e o FPS pedidos são metas; o navegador e o driver podem entregar valores diferentes.
- A troca de saída de som não é suportada igualmente por todos os navegadores.

## Sensores físicos

A central verifica a presença das APIs para:

- movimento e orientação do dispositivo;
- acelerômetro;
- giroscópio;
- magnetômetro;
- proximidade;
- luz ambiente;
- orientação absoluta e relativa.

A presença da API não garante que o aparelho possua o sensor, que o navegador libere o dado ou que a página tenha permissão. Celulares normalmente oferecem mais possibilidades que notebooks.

## GPU e aceleração

O diagnóstico solicita um contexto WebGL com `powerPreference: "high-performance"` e mostra, quando permitido:

- renderizador ativo;
- fornecedor;
- versão WebGL;
- tamanho máximo de textura;
- limite de renderbuffer;
- amostras disponíveis no WebGL 2;
- disponibilidade e adaptador WebGPU.

O navegador não permite que uma página escolha diretamente entre a GPU integrada e a NVIDIA. O HoloMotion pode solicitar alto desempenho, detectar o renderizador exposto e orientar o usuário, mas a decisão final pertence ao sistema operacional, navegador e driver.

### Notebook com NVIDIA

Para favorecer a GPU dedicada no Windows:

1. Abra **Configurações > Sistema > Tela > Gráficos**.
2. Adicione o navegador utilizado.
3. Em **Opções**, escolha **Alto desempenho**.
4. Reinicie completamente o navegador.
5. Abra a Central de hardware e confirme o renderizador ativo.
6. Verifique se a aceleração de hardware do navegador está habilitada.

## Benchmark local

O benchmark utiliza testes curtos e não destrutivos:

- frequência real aproximada da tela por `requestAnimationFrame`;
- cálculo sintético de CPU;
- desenho Canvas 2D;
- renderização WebGL 2 com instâncias;
- capacidade de memória exposta pelo navegador;
- espaço de armazenamento e suporte gráfico.

O resultado produz:

- nota geral de 0 a 100;
- notas parciais;
- perfil recomendado;
- alvo de renderização limitado pela frequência real da tela.

O benchmark serve para comparar perfis dentro do HoloMotion. Ele não substitui ferramentas profissionais e não mede diretamente desempenho de jogos nativos.

## FPS

Renderização, câmera e inteligência visual têm frequências independentes:

- a renderização pode alcançar 60, 120 ou mais FPS somente em uma tela compatível;
- a câmera depende dos modos oferecidos pelo dispositivo;
- as inferências de mãos, corpo, rosto e objetos trabalham em frequências menores;
- interpolação visual mantém animações suaves entre inferências.

O modo Experimental 240 nunca força 240 Hz. Ele apenas permite essa meta, que é limitada pela tela, navegador e sistema.

## Dados exibidos

A central pode mostrar:

- núcleos lógicos;
- memória aproximada via `deviceMemory`;
- heap JavaScript quando exposto;
- armazenamento usado e disponível;
- frequência estimada da tela;
- renderizador WebGL;
- adaptador WebGPU;
- dispositivos e sensores disponíveis.

Por segurança e limitações das APIs Web, a página não recebe uso real total de CPU, GPU, VRAM, temperatura ou velocidade do SSD. A interface informa esses limites em vez de apresentar números simulados.
