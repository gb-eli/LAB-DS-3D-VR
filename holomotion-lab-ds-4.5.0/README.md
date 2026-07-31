# HoloMotion Lab DS 4.5.0 — Performance Engine e Inteligência de Hardware

Plataforma educacional de visão computacional, movimentos corporais, hologramas e jogos gestuais executada integralmente no navegador. A versão 4.5.0 preserva todos os laboratórios da 4.4.4 e inicia a fase de otimização orientada pelos testes realizados com os alunos.

## Principais novidades

### Central de hardware

- seleção da câmera quando há mais de uma disponível;
- seleção do microfone;
- seleção da saída de áudio em navegadores compatíveis;
- escolha de resolução e FPS solicitados para a câmera;
- visualização da câmera, configurações e capacidades entregues pelo navegador;
- teste de nível do microfone;
- teste de movimento, orientação e sensores físicos disponíveis;
- renderizador WebGL ativo e diagnóstico WebGPU;
- núcleos lógicos, memória aproximada, heap JavaScript e armazenamento;
- orientação para favorecer a GPU NVIDIA no Windows.

### Benchmark HoloMotion

Teste local e curto de:

- frequência da tela;
- CPU sintética;
- Canvas 2D;
- WebGL 2;
- memória e armazenamento;
- capacidade gráfica.

O resultado recomenda automaticamente um perfil de uso. Não são enviados dados para servidor.

### Perfis ampliados

- Automático;
- Desempenho máximo;
- Equilibrado;
- Qualidade gráfica;
- Precisão dos sensores;
- Economia de energia;
- DS Turbo;
- **DS Ultra**, com alvo de até 120 FPS;
- **Experimental 240**, limitado pela frequência real da tela.

A renderização, a câmera e as inferências permanecem independentes. Uma tela de 60 Hz não exibe 120 ou 240 quadros diferentes por segundo, mesmo que o perfil permita essas metas.

### Correções de desempenho

- removido o limite fixo de 30 FPS nas restrições da câmera;
- resolução e FPS da câmera agora respeitam o dispositivo selecionado e o perfil;
- o Three.js solicita GPU de alto desempenho;
- o alvo gráfico é limitado pela frequência medida da tela;
- DS Ultra utiliza resolução e orçamento gráfico próprios;
- o Performance Manager recebe dados do benchmark para ajustar o perfil;
- módulos continuam carregados somente quando necessários;
- sensores não utilizados permanecem pausados.

## Limitações reais do navegador

Uma página Web não pode:

- ligar diretamente a RTX ou escolher a GPU no lugar do Windows;
- acessar porcentagens confiáveis de CPU, GPU ou VRAM;
- medir temperatura completa do computador;
- garantir o FPS solicitado pela câmera;
- ultrapassar a frequência física da tela.

O HoloMotion solicita alto desempenho, identifica o renderizador exposto e orienta a configuração do sistema. Consulte [Central de hardware e benchmark](docs/HARDWARE_AND_BENCHMARK.md).

## Recursos preservados

- Motion Academy Pro e checklist de gestos;
- Libras Lab experimental A–Z;
- Holo Explorer Advanced;
- Holo Assembly com oito kits;
- Vision Scanner;
- jogos corporais, dança, alongamento e sabre;
- avatar, rosto, mãos e esqueleto corporal;
- XP, níveis e recordes locais;
- Apps VR e APK Android offline;
- PWA, cache progressivo e funcionamento sem backend.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Envie todos os arquivos para o repositório, incluindo `.github`, `.nojekyll`, `tests` e `scripts`.
3. Abra **Settings > Pages**.
4. Escolha **GitHub Actions** em Build and deployment.
5. Envie para o branch `main`.

O workflow executa a validação antes da publicação.

## Teste recomendado depois da publicação

1. Abra **Hardware e sensores**.
2. Autorize câmera e microfone.
3. Escolha a câmera correta.
4. Execute o benchmark completo.
5. Confira o renderizador ativo.
6. Aplique o perfil recomendado.
7. Teste primeiro Gesture Academy, Avatar e Holo Explorer.
8. Compare Automático, DS Turbo e DS Ultra.
9. Registre FPS, latência e qualidade do rastreamento.

## Estrutura técnica

```text
HTML + CSS + JavaScript ES Modules
Three.js / WebGL 2
MediaPipe Tasks Vision
Web Workers
Canvas 2D
Service Worker / Cache Storage
IndexedDB / LocalStorage
MediaDevices / Web Audio
WebGPU e Generic Sensor API quando disponíveis
```

## Documentação

- [Hardware e benchmark](docs/HARDWARE_AND_BENCHMARK.md)
- [Desempenho](docs/PERFORMANCE.md)
- [Arquitetura modular](docs/MODULES.md)
- [Profundidade e acessibilidade](docs/DEPTH_AND_ACCESSIBILITY.md)
- [Holo Assembly](docs/HOLO_ASSEMBLY.md)
- [Holo Explorer](docs/HOLO_EXPLORER.md)
- [Vision Scanner](docs/VISION_SCANNER.md)
- [Libras Lab](docs/LIBRAS_LAB.md)
- [Qualidade](docs/QA.md)
- [Histórico](CHANGELOG.md)
