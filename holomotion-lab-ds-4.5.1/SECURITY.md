# Segurança e privacidade — HoloMotion Lab DS 4.5.1

- Câmera, microfone e sensores só são ativados após ação e permissão do usuário.
- Vídeo e áudio não são gravados nem enviados pelo código do projeto.
- Preferências de dispositivos, benchmark e configurações ficam localmente no navegador.
- O benchmark não executa código nativo nem altera configurações do sistema.
- A página não consegue ligar a GPU dedicada, alterar drivers ou ler porcentagens globais de CPU/GPU.
- Os sensores físicos dependem das permissões e APIs do navegador.
- O usuário pode interromper câmera, microfone, sensores e limpar os dados locais.
- Dependências externas mantêm suas próprias políticas e licenças.
