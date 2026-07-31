# Segurança e privacidade

O HoloMotion Lab DS 4.1.0 funciona sem backend. Não inclua tokens, senhas, chaves de API ou dados pessoais no repositório público.

## Câmera

A câmera é solicitada somente após ação explícita. Os quadros são processados em memória e não são gravados, enviados ou convertidos em fotografias pelo projeto.

Ao sair, ocultar a página ou desligar a câmera, as trilhas de vídeo são encerradas.

## Microfone e localização

A aplicação não solicita microfone nem localização. A página define uma política de permissões que bloqueia esses recursos.

## Dados locais

Somente preferências, calibrações, recordes e configurações são armazenados no navegador. O esquema v4 permite migrar dados das versões anteriores. O usuário pode apagar tudo limpando os dados do site.

## Reconhecimento corporal e facial

- os resultados servem a atividades educativas e recreativas;
- não são medições médicas, biométricas ou de identidade;
- direção dos olhos, profundidade, postura e expressões são estimativas;
- nenhuma identificação facial é realizada;
- não armazene landmarks ou resultados associados ao nome do aluno sem política institucional específica.

## Ambiente escolar

- informe a finalidade da câmera;
- mantenha supervisão durante atividades corporais;
- deixe o espaço livre de mesas, cabos e objetos;
- evite saltos quando o espaço não for seguro;
- não publique nomes, imagens ou resultados identificáveis em issues públicas;
- use o modo demonstração quando a câmera não puder ser autorizada;
- avalie as políticas institucionais das dependências externas.

## Dependências externas

Three.js, MediaPipe, arquivos WASM e modelos são baixados de servidores externos no primeiro acesso e podem ser mantidos em cache. Uma distribuição institucional pode hospedar cópias locais dessas dependências, respeitando as licenças.

## Distribuição de APKs

- APKs são arquivos estáticos e não são executados pelo navegador;
- o download começa somente após ação do usuário;
- cada APK disponível deve possuir tamanho e SHA-256 no catálogo;
- a validação interrompe a publicação quando arquivo, tamanho ou checksum divergem;
- o Android pode solicitar autorização para instalar aplicativos externos;
- instale somente arquivos obtidos do repositório oficial;
- aplicativos planejados não podem apresentar download ativo.

## Relato de problemas

Configure um canal institucional privado para falhas, privacidade e vulnerabilidades. Não anexe fotos de alunos ou informações pessoais aos relatos públicos.
