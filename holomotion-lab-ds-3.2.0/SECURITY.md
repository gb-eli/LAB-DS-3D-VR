# Segurança e privacidade

O HoloMotion Lab DS 3.0 funciona sem backend. Não inclua tokens, senhas, chaves de API ou dados pessoais no repositório público.

## Câmera

A câmera é solicitada somente após ação explícita. Os quadros são processados em memória e não são gravados, enviados ou convertidos em fotografias pelo projeto.

Ao sair, ocultar a página ou desligar a câmera, as trilhas de vídeo são encerradas.

## Microfone e localização

A aplicação não solicita microfone nem localização. A página define uma política de permissões que bloqueia esses recursos.

## Dados locais

Somente preferências, recordes e configurações são armazenados no navegador. A versão dos dados permite migração segura entre atualizações. O usuário pode apagar tudo limpando os dados do site.

## Ambiente escolar

- informe claramente a finalidade da câmera;
- mantenha supervisão durante atividades corporais;
- deixe o espaço livre de mesas, cabos e objetos;
- não publique nomes, imagens ou resultados identificáveis em issues públicas;
- use o modo demonstração quando a câmera não puder ser autorizada;
- avalie as políticas institucionais das dependências externas.

## Dependências externas

Three.js, MediaPipe, arquivos WASM e modelos são baixados de servidores externos no primeiro acesso e depois podem ser mantidos em cache. Uma distribuição institucional pode hospedar cópias locais dessas dependências, respeitando suas licenças.

## Relato de problemas

Ao publicar uma versão própria, configure um canal institucional privado para relatos de falhas, privacidade e vulnerabilidades. Evite incluir imagens de alunos ou informações pessoais nos relatórios.


## Distribuição de APKs

- Os APKs são arquivos estáticos e não são executados pelo navegador.
- O download só começa mediante ação explícita do usuário.
- Cada APK disponível deve possuir tamanho e SHA-256 registrados em `src/app-catalog.js`.
- O script de validação interrompe a publicação quando o arquivo, tamanho ou checksum divergem.
- O Android pode exigir autorização para instalar aplicativos externos. Essa autorização deve ser concedida apenas para arquivos obtidos do repositório oficial do projeto.
- Aplicativos planejados não podem exibir botões de download até que um APK real e validado seja incluído.
