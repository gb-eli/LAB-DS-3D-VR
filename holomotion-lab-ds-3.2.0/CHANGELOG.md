# Histórico de versões

## 3.2.0 — 2026-07-30

### Aplicativos VR e distribuição Android

- nova aba **Apps VR** com aparência de loja 3D;
- separação entre ferramentas Web e aplicativos Android;
- filtros por plataforma, offline, hologramas, sensores e jogos;
- detalhes de versão, requisitos, tamanho, pacote e checksum;
- APK `Lab Virtual DS VR 360 v0.3.3` incluído no repositório;
- download direto pelo GitHub Pages;
- aplicativos futuros identificados como planejados, sem downloads falsos;
- catálogo central em `src/app-catalog.js`;
- interface da loja isolada em `src/store-ui.js`, sem depender do motor 3D;
- verificação automatizada do tamanho e SHA-256 do APK;
- revisão responsiva em desktop e mobile.

## 3.1.0 — 2026-07-30

### Versionamento e organização

- catálogo central para aplicação, sensores, laboratórios, interface e PWA;
- versão geral discreta na barra superior;
- versões compactas próximas aos laboratórios e sensores;
- versão e resumo do módulo ativo no painel de controles;
- janela com resumo, módulos, tecnologias, histórico e créditos;
- informações secundárias ocultadas no mobile para não poluir a experiência;
- três testes automatizados para consistência do versionamento;
- workflow oficial do GitHub Pages incluído no pacote.

## 3.0.0 — 2026-07-29

### Reconstrução do motor

- novo scheduler adaptativo para mãos, corpo e rosto;
- uma inferência pesada por ciclo;
- Worker de visão com `ImageBitmap` e `OffscreenCanvas`;
- fallback para thread principal;
- proteção contra inicializações simultâneas de rosto e corpo;
- GPU com fallback automático para CPU;
- sensor facial carregado somente no modo correspondente;
- alternância entre uma e duas pessoas sem recarregar a aplicação.

### Reconhecimento

- mão aberta, fechada, pinça, apontar, vitória, positivo, negativo e OK;
- orientação vertical, horizontal, invertida e diagonal;
- mão plana, curva ou dobrada;
- palma, dorso ou mão de lado usando coordenadas 3D estimadas;
- movimentos de deslizar, empurrar, puxar e girar;
- 21 pontos por mão, 33 por corpo e 478 por rosto;
- análise de sorriso, boca, piscadas, sobrancelhas e inclinação da cabeça;
- estabilidade temporal e sensibilidade proporcional ao tamanho da palma.

### Experiências

- novo Gesture Lab com treinamento guiado;
- novo Face Reactor;
- Shape Catch com modo para duas pessoas;
- novos cilindro e controles bimanual no Sandbox;
- comandos laterais no Sandbox e Holo Draw;
- cursor com clique por pinça, mão fechada, OK ou permanência.

### Interface

- interface reconstruída com campo visual protegido;
- HUD compacto e informações contextuais;
- barra de modos inferior;
- painéis recolhíveis de controles e sensores;
- layout mobile em folhas deslizantes;
- status compacto da câmera em telas estreitas;
- revisão ortográfica, hierarquia visual e acessibilidade;
- suporte a movimento reduzido e áreas seguras.

### Qualidade

- oito testes automatizados;
- verificação de 15 módulos e 99 IDs;
- validação do manifesto e cache inicial;
- revisão visual desktop e mobile;
- workflow do GitHub Pages bloqueia publicação quando os testes falham.

## 2.0.0 — 2026-07-29

- tarefas de mãos e corpo alternadas;
- classificação geométrica local;
- correção do espelhamento e das colisões do Shape Catch;
- perfis gráficos e adaptação básica;
- clique por gesto e desenho por pinça.
