# HoloMotion Lab DS 4.3.0

Plataforma educacional holográfica e corporal executada integralmente no navegador. Pode ser publicada diretamente no GitHub Pages e não depende de backend, banco de dados remoto ou chave de API.

## Novidade principal: Libras Lab 0.3 Beta

A versão 4.3.0 amplia o treinador experimental do alfabeto manual com:

- catálogo A–Z;
- modo Aprender;
- desafio aleatório;
- sequências de letras;
- soletração de palavras de até 12 caracteres;
- preferência por mão direita, esquerda ou detecção automática;
- níveis Guiado, Padrão e Precisão;
- feedback individual de polegar, indicador, médio, anelar e mínimo;
- análise de orientação, curvatura, contatos entre dedos e posição da palma;
- detecção temporal experimental para as letras J e Z;
- pontuação, sequência de acertos, tentativas e maestria local por letra;
- confirmação manual pelo professor quando o sensor não consegue distinguir configurações parecidas.

O módulo é uma ferramenta introdutória de datilologia. Não traduz Libras, não avalia fluência e não substitui ensino por profissionais ou validação com a comunidade surda.

## Como usar o Libras Lab

1. Abra **Libras** na barra inferior.
2. Posicione uma mão inteira na câmera.
3. Escolha a atividade, a mão e o nível de precisão.
4. Reproduza a configuração exibida.
5. Observe o diagnóstico dos dedos e ajuste a orientação.
6. Para J e Z, faça o movimento no ar usando o dedo indicado.
7. Quando a diferenciação automática não for segura, use **Confirmar com professor**.

No modo **Soletrar palavra**, digite uma palavra sem números. A plataforma normaliza acentos e apresenta cada letra em sequência.

## Módulos preservados

- Holo Explorer com nove exposições 3D;
- Academia de Movimentos;
- Sequência Corporal;
- Aura Cósmica;
- Body Challenge;
- Dance Mirror;
- Alongamento Interativo;
- Sabre de Energia;
- Holo Sandbox;
- Shape Catch;
- Holo Draw;
- Pose Mirror;
- Gesture Lab;
- Face Reactor;
- Central de Apps VR e APK Android offline.

## Tecnologias

- HTML, CSS e JavaScript ES Modules;
- Three.js;
- MediaPipe Tasks Vision;
- Canvas 2D;
- Web Workers;
- IndexedDB e LocalStorage;
- Service Worker e Cache Storage;
- GitHub Actions e GitHub Pages.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Envie todo o conteúdo para o branch `main` do repositório.
3. Preserve `.github/workflows/deploy-pages.yml` e `.nojekyll`.
4. Abra **Settings → Pages**.
5. Em **Build and deployment**, selecione **GitHub Actions**.
6. Aguarde o workflow executar os testes e publicar.

O endereço terá o formato:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

## Funcionamento offline

O núcleo da aplicação entra no cache PWA. Three.js e MediaPipe são obtidos da CDN no primeiro acesso e armazenados no cache de execução quando o navegador permite. O primeiro carregamento em um equipamento novo exige internet.

O APK Android distribuído pela Central de Apps funciona offline depois da instalação.

## Privacidade

- vídeo, fotografias e áudio não são gravados;
- localização não é solicitada;
- a câmera é processada localmente;
- preferências, maestria e recordes permanecem no navegador;
- a câmera é interrompida ao sair ou ocultar a página.

## Desempenho

- **Econômica:** celulares e Chromebooks mais simples;
- **Equilibrada:** configuração recomendada;
- **Precisão:** computadores com GPU e câmera melhores.

O Libras Lab executa apenas o sensor de mãos. Corpo e rosto permanecem pausados para concentrar processamento nos 21 pontos da mão e nas trajetórias dos dedos.

## Validação

Execute localmente:

```bash
npm run validate
```

A validação verifica sintaxe, arquivos do cache, IDs, manifesto, versões, catálogo de aplicativos, APK e testes automatizados.

## Documentação adicional

- `docs/LIBRAS_LAB.md`: funcionamento, limites e validação pedagógica;
- `docs/HOLO_EXPLORER.md`: catálogo e interações 3D;
- `docs/QA.md`: validações e limitações;
- `docs/ROADMAP.md`: próximas versões;
- `docs/VERSIONING.md`: padrão de versionamento;
- `docs/APPS_VR.md`: distribuição Web e Android.
