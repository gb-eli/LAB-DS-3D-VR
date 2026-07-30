# Relatório de qualidade — HoloMotion 4.3.0

## Validações automatizadas

- 39 de 39 testes aprovados;
- 28 módulos JavaScript validados;
- 217 identificadores de interface conferidos;
- nenhum ID duplicado;
- CSS com chaves balanceadas;
- validação de sintaxe de todos os módulos JavaScript;
- conferência de IDs e referências locais;
- manifesto PWA válido;
- app shell do Service Worker íntegro;
- versões semânticas consistentes;
- catálogo A–Z sem letras duplicadas;
- normalização de palavras com acentos;
- avaliação de configuração da letra L;
- preferência de mão esquerda/direita;
- exigência de trajetória para a letra Z;
- progressão do modo palavra;
- feedback de dedo divergente;
- APK Android e checksum preservados.

## Revisão de arquitetura

- o Libras Lab utiliza somente o rastreador das mãos;
- a avaliação é separada da renderização;
- regras e dados do alfabeto ficam em módulo testável;
- maestria e preferências são salvas localmente;
- nenhuma imagem da câmera é armazenada;
- confirmação do professor evita depender de classificações frágeis.

## Limitações do ambiente de validação

O Chromium headless disponível não concluiu a captura local dentro do limite do ambiente. A interface foi verificada estruturalmente por HTML, CSS e IDs, mas o teste visual definitivo precisa ser realizado após a publicação.

## Limitações

- as regras A–Z são aproximações geométricas experimentais;
- letras semelhantes podem receber pontuação parecida;
- J e Z dependem de iluminação e taxa de atualização;
- uma webcam comum não substitui avaliação humana;
- o módulo não traduz Libras e não avalia fluência;
- revisão com profissionais e comunidade surda é necessária antes de uso como referência definitiva.

## Teste físico recomendado

1. publicar no GitHub Pages;
2. testar mão direita e esquerda;
3. testar os três níveis de precisão;
4. formar palavras como AULA, ALUNO e LIBRAS;
5. testar J e Z em câmera de 30 FPS;
6. verificar o painel de dedos no desktop;
7. verificar o resumo no celular;
8. registrar letras com falsos positivos para calibração futura.
