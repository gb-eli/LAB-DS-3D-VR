# Relatório de qualidade — HoloMotion Lab DS 3.2

Data da revisão: 30 de julho de 2026.

## Validações automatizadas

- 15 testes aprovados;
- 18 módulos JavaScript com sintaxe válida;
- 129 IDs de interface verificados;
- nenhum ID duplicado;
- versões semânticas validadas;
- consistência entre catálogo, `package.json`, histórico e Service Worker;
- referências locais do HTML verificadas;
- manifesto PWA válido;
- todos os arquivos do cache inicial presentes;
- APK registrado e existente;
- tamanho do APK conferido automaticamente;
- SHA-256 do APK conferido automaticamente;
- filtros Web, Android e offline testados;
- teste de coleta por mão fechada aprovado;
- teste de pontuação para duas pessoas aprovado.

## Revisão da loja de aplicativos

A nova aba foi revisada nos seguintes pontos:

- acesso pelo topo, tela inicial e configurações;
- separação visual entre Web e Android;
- filtros horizontais com rolagem no mobile;
- busca textual;
- cards para aplicativos disponíveis e planejados;
- detalhes de plataforma, versão, requisitos, tamanho e pacote;
- checksum copiável;
- botão de download somente para APK real;
- aplicativos planejados sem links falsos;
- lista e detalhes com rolagem independente no desktop;
- fluxo vertical único no celular;
- módulo da loja independente do Three.js e do MediaPipe.

As capturas estão em:

- `docs/screenshots/app-store-desktop.png`;
- `docs/screenshots/app-store-mobile.png`.

## Limitações do ambiente de teste

O ambiente de construção não oferece webcam real. A validação definitiva de câmera, GPU, MediaPipe, iluminação, FPS e sensibilidade precisa ser realizada após a publicação em um celular e em um computador com webcam.

A navegação headless para um servidor local foi bloqueada pelo ambiente. A revisão visual da loja foi realizada com o HTML e CSS reais em uma página de teste isolada, usando os mesmos componentes e breakpoints. A lógica dinâmica foi coberta pelos testes automatizados.

## Roteiro recomendado após publicar

1. Abrir `?store=android` e confirmar que a loja inicia filtrada.
2. Baixar o APK e conferir o nome `LabVirtualDS-VR-v0.3.3.apk`.
3. Comparar o SHA-256 do arquivo baixado com o exibido na loja.
4. Instalar o APK em um aparelho Android de teste.
5. Abrir os filtros Web, Offline, Hologramas e Sensores.
6. Selecionar um laboratório Web e iniciar pela câmera ou modo demonstração.
7. Verificar a loja em orientação vertical e horizontal no celular.
8. Confirmar que aplicativos planejados não possuem botão de download ativo.
9. Abrir a tela de versões e conferir `HoloMotion 3.2.0` e `Aplicativos VR 1.0.0`.
10. Reabrir a página e confirmar o cache `holomotion-v3.2.0`.

```bash
npm test
npm run check
npm run validate
```
