# Modelos locais opcionais

A distribuição padrão usa URLs fixadas dos modelos oficiais:

- `hand_landmarker.task`;
- `pose_landmarker_lite.task`;
- `face_landmarker.task`.

Para hospedar os modelos no próprio GitHub Pages, coloque os arquivos `.task` nesta pasta e altere `handModel`, `poseModel` e `faceModel` em `src/config.js` para caminhos relativos.

Depois, inclua os caminhos no cache do `sw.js` e valide o tamanho total do repositório.
