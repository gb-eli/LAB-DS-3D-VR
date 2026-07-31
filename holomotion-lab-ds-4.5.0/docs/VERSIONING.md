# Versionamento do HoloMotion Lab DS

A plataforma utiliza versionamento semântico:

```text
MAJOR.MINOR.PATCH
```

- **MAJOR:** reconstruções estruturais ou incompatíveis;
- **MINOR:** novos módulos e funções;
- **PATCH:** correções, desempenho, precisão, gráficos e textos.

## Versão atual

- HoloMotion Lab DS: 4.4.3;
- Vision Core: 4.4.3;
- Hand Tracking: 2.8.0;
- Performance Manager: 1.2.0;
- Module Loader: 1.3.0;
- Holo Assembly: 1.0.0;
- Adaptive Calibration: 1.0.0.

As versões de cada módulo são independentes. Uma correção exclusiva no Holo Assembly não precisa alterar a versão do Libras Lab ou do Vision Scanner.

O catálogo central está em `src/versioning.js`.
