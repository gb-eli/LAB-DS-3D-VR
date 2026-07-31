const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const normalizeText = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
const FINGER_NAMES = Object.freeze(["Polegar", "Indicador", "Médio", "Anelar", "Mínimo"]);
const DEFAULT_WORDS = Object.freeze(["LIBRAS", "ALUNO", "AULA", "ESCOLA", "TECNOLOGIA", "BRASIL"]);

const letter = (id, {
  hint,
  pattern = [null, null, null, null, null],
  types = [],
  orientations = [],
  curvatures = [],
  palmFacings = [],
  touches = [],
  thumbClosest = null,
  crossed = false,
  indexBent = false,
  dynamic = null,
  confidence = "experimental"
} = {}) => Object.freeze({
  id,
  title: `Letra ${id}`,
  hint,
  pattern: Object.freeze(pattern),
  types: Object.freeze(types),
  orientations: Object.freeze(orientations),
  curvatures: Object.freeze(curvatures),
  palmFacings: Object.freeze(palmFacings),
  touches: Object.freeze(touches),
  thumbClosest,
  crossed,
  indexBent,
  dynamic,
  confidence
});

/*
 * As regras abaixo são aproximações geométricas para treinamento introdutório.
 * Elas não substituem ensino de Libras, avaliação de fluência ou validação humana.
 * Letras muito semelhantes recebem status experimental e podem ser confirmadas
 * manualmente pelo professor no painel de controles.
 */
const LETTERS = Object.freeze([
  letter("A", { hint: "Feche os dedos e mantenha o polegar apoiado ao lado da mão.", pattern: [null, false, false, false, false], types: ["fist"], curvatures: ["folded"], confidence: "guided" }),
  letter("B", { hint: "Mantenha os quatro dedos unidos e estendidos, com a mão em pé.", pattern: [false, true, true, true, true], orientations: ["vertical_up"], curvatures: ["flat"], confidence: "guided" }),
  letter("C", { hint: "Curve a mão de lado, deixando um espaço arredondado como a letra C.", curvatures: ["curved"], orientations: ["horizontal_left", "horizontal_right", "diagonal"], confidence: "guided" }),
  letter("D", { hint: "Estenda o indicador e aproxime o polegar do dedo médio.", pattern: [true, true, false, false, false], orientations: ["vertical_up", "diagonal"], touches: ["middle"], confidence: "experimental" }),
  letter("E", { hint: "Dobre os quatro dedos em direção à palma, mantendo a mão compacta.", pattern: [null, false, false, false, false], curvatures: ["curved", "folded"], confidence: "experimental" }),
  letter("F", { hint: "Encoste indicador e polegar e mantenha os outros três dedos estendidos.", pattern: [true, false, true, true, true], types: ["ok"], touches: ["index"], confidence: "guided" }),
  letter("G", { hint: "Estenda polegar e indicador com a mão deitada para o lado.", pattern: [true, true, false, false, false], orientations: ["horizontal_left", "horizontal_right"], confidence: "experimental" }),
  letter("H", { hint: "Use indicador e médio juntos e faça o pequeno movimento indicado na tela.", pattern: [false, true, true, false, false], orientations: ["horizontal_left", "horizontal_right", "diagonal"], confidence: "experimental" }),
  letter("I", { hint: "Mantenha somente o dedo mínimo estendido.", pattern: [false, false, false, false, true], confidence: "guided" }),
  letter("J", { hint: "Com o dedo mínimo estendido, desenhe um J no ar.", pattern: [false, false, false, false, true], dynamic: "J", confidence: "dynamic" }),
  letter("K", { hint: "Estenda indicador e médio e mantenha o polegar aberto entre eles.", pattern: [true, true, true, false, false], orientations: ["vertical_up", "diagonal"], confidence: "experimental" }),
  letter("L", { hint: "Estenda polegar e indicador formando um ângulo de L.", pattern: [true, true, false, false, false], orientations: ["vertical_up", "diagonal"], confidence: "guided" }),
  letter("M", { hint: "Dobre os dedos sobre o polegar, com o polegar próximo ao anelar.", pattern: [false, false, false, false, false], thumbClosest: "ring", curvatures: ["folded", "curved"], confidence: "experimental" }),
  letter("N", { hint: "Dobre os dedos sobre o polegar, com o polegar próximo ao dedo médio.", pattern: [false, false, false, false, false], thumbClosest: "middle", curvatures: ["folded", "curved"], confidence: "experimental" }),
  letter("O", { hint: "Aproxime as pontas dos dedos formando um contorno arredondado.", curvatures: ["curved"], touches: ["index", "middle"], confidence: "experimental" }),
  letter("P", { hint: "Use a configuração de K apontando a mão para baixo.", pattern: [true, true, true, false, false], orientations: ["vertical_down", "diagonal"], confidence: "experimental" }),
  letter("Q", { hint: "Estenda polegar e indicador e aponte a mão para baixo.", pattern: [true, true, false, false, false], orientations: ["vertical_down", "diagonal"], confidence: "experimental" }),
  letter("R", { hint: "Cruze indicador e médio, mantendo os demais dedos dobrados.", pattern: [false, true, true, false, false], crossed: true, confidence: "experimental" }),
  letter("S", { hint: "Feche a mão mantendo o polegar visível na parte frontal.", pattern: [null, false, false, false, false], types: ["fist"], palmFacings: ["front", "back"], confidence: "experimental" }),
  letter("T", { hint: "Feche os dedos e posicione o polegar entre indicador e médio.", pattern: [false, false, false, false, false], thumbClosest: "index", confidence: "experimental" }),
  letter("U", { hint: "Mantenha indicador e médio estendidos e unidos, com a mão em pé.", pattern: [false, true, true, false, false], orientations: ["vertical_up"], confidence: "guided" }),
  letter("V", { hint: "Estenda indicador e médio separados, mantendo os demais fechados.", pattern: [false, true, true, false, false], types: ["peace"], confidence: "guided" }),
  letter("W", { hint: "Estenda indicador, médio e anelar.", pattern: [false, true, true, true, false], confidence: "guided" }),
  letter("X", { hint: "Mantenha o indicador dobrado como um gancho e os demais dedos fechados.", pattern: [false, false, false, false, false], indexBent: true, confidence: "experimental" }),
  letter("Y", { hint: "Estenda polegar e dedo mínimo, mantendo os dedos centrais fechados.", pattern: [true, false, false, false, true], confidence: "guided" }),
  letter("Z", { hint: "Com o indicador estendido, desenhe um Z no ar.", pattern: [false, true, false, false, false], dynamic: "Z", confidence: "dynamic" })
]);

const LETTER_MAP = new Map(LETTERS.map((item) => [item.id, item]));
const SEQUENCES = Object.freeze([
  Object.freeze(["A", "B", "C", "L"]),
  Object.freeze(["V", "I", "D", "A"]),
  Object.freeze(["M", "A", "O"]),
  Object.freeze(["L", "I", "B", "R", "A", "S"]),
  Object.freeze(["J", "O", "G", "O"]),
  Object.freeze(["A", "L", "U", "N", "O"])
]);

const DIFFICULTIES = Object.freeze({
  guided: { id: "guided", threshold: 0.6, holdMs: 520, mismatchMs: 1200 },
  standard: { id: "standard", threshold: 0.7, holdMs: 720, mismatchMs: 1000 },
  precision: { id: "precision", threshold: 0.8, holdMs: 920, mismatchMs: 850 }
});

function comparePattern(expected = [], actual = []) {
  const details = expected.map((value, index) => ({
    finger: FINGER_NAMES[index],
    expected: value == null ? "livre" : value ? "estendido" : "dobrado",
    actual: actual[index] ? "estendido" : "dobrado",
    ok: value == null || Boolean(actual[index]) === value
  }));
  const relevant = details.filter((item, index) => expected[index] != null);
  return { score: relevant.length ? relevant.filter((item) => item.ok).length / relevant.length : 1, details };
}

function listMatch(actual, expected = []) {
  return expected.length ? (expected.includes(actual) ? 1 : 0) : 1;
}

function touchScore(gesture, touches = []) {
  if (!touches.length) return 1;
  return touches.filter((finger) => Boolean(gesture?.touches?.[finger])).length / touches.length;
}

function buildFeedback(letterInfo, gesture, components, fingerDetails, handMismatch) {
  if (!gesture) return "Posicione uma mão inteira dentro do enquadramento.";
  if (handMismatch) return `Use a mão ${handMismatch === "left" ? "esquerda" : "direita"} ou altere a preferência.`;
  const wrongFinger = fingerDetails.find((item) => !item.ok);
  if (wrongFinger) return `${wrongFinger.finger}: deixe ${wrongFinger.expected}.`;
  const failed = components.find((component) => component.score < 0.6);
  if (failed?.id === "orientation") return "Ajuste a orientação da mão conforme a instrução.";
  if (failed?.id === "curvature") return "Ajuste a curvatura dos dedos.";
  if (failed?.id === "touch") return "Aproxime as pontas dos dedos indicadas.";
  if (failed?.id === "crossed") return "Cruze indicador e médio com mais clareza.";
  if (failed?.id === "dynamic") return `Complete o movimento da letra ${letterInfo.id} no ar.`;
  if (failed?.id === "palm") return "Gire a palma para a direção indicada.";
  return "Boa configuração. Mantenha a mão estável para confirmar.";
}

export function evaluateLibrasLetter(letterInfo, gesture, {
  handPreference = "auto",
  difficulty = "standard"
} = {}) {
  const settings = DIFFICULTIES[difficulty] || DIFFICULTIES.standard;
  if (!gesture) return {
    score: 0,
    matched: false,
    threshold: settings.threshold,
    feedback: "Posicione uma mão inteira dentro do enquadramento.",
    components: [],
    fingers: []
  };

  const handedness = String(gesture.handedness || "").toLowerCase();
  const handMismatch = handPreference !== "auto" && !handedness.includes(handPreference);
  const pattern = comparePattern(letterInfo.pattern, gesture.extended || []);
  const components = [
    { id: "pattern", label: "Configuração", score: pattern.score, weight: 0.44 },
    { id: "type", label: "Gesto-base", score: listMatch(gesture.type, letterInfo.types), weight: letterInfo.types.length ? 0.12 : 0 },
    { id: "orientation", label: "Orientação", score: listMatch(gesture.orientation?.type, letterInfo.orientations), weight: letterInfo.orientations.length ? 0.12 : 0 },
    { id: "curvature", label: "Curvatura", score: listMatch(gesture.curvature?.type, letterInfo.curvatures), weight: letterInfo.curvatures.length ? 0.1 : 0 },
    { id: "palm", label: "Palma", score: listMatch(gesture.palmFacing?.type, letterInfo.palmFacings), weight: letterInfo.palmFacings.length ? 0.07 : 0 },
    { id: "touch", label: "Contato", score: touchScore(gesture, letterInfo.touches), weight: letterInfo.touches.length ? 0.12 : 0 },
    { id: "closest", label: "Polegar", score: letterInfo.thumbClosest ? (gesture.thumbClosest === letterInfo.thumbClosest ? 1 : 0) : 1, weight: letterInfo.thumbClosest ? 0.08 : 0 },
    { id: "crossed", label: "Cruzamento", score: letterInfo.crossed ? (gesture.crossedIndexMiddle ? 1 : 0) : 1, weight: letterInfo.crossed ? 0.11 : 0 },
    { id: "bent", label: "Indicador", score: letterInfo.indexBent ? (gesture.indexBent ? 1 : 0) : 1, weight: letterInfo.indexBent ? 0.1 : 0 },
    { id: "dynamic", label: "Movimento", score: letterInfo.dynamic ? (gesture.dynamicLetter === letterInfo.dynamic ? 1 : 0) : 1, weight: letterInfo.dynamic ? 0.27 : 0 }
  ].filter((component) => component.weight > 0);

  const weightTotal = components.reduce((sum, component) => sum + component.weight, 0) || 1;
  let score = components.reduce((sum, component) => sum + component.score * component.weight, 0) / weightTotal;
  if (handMismatch) score = 0;
  const dynamicReady = !letterInfo.dynamic || gesture.dynamicLetter === letterInfo.dynamic;
  const matched = !handMismatch && dynamicReady && score >= settings.threshold;
  return {
    score,
    matched,
    threshold: settings.threshold,
    handMismatch: handMismatch ? handPreference : null,
    feedback: buildFeedback(letterInfo, gesture, components, pattern.details, handMismatch ? handPreference : null),
    components,
    fingers: pattern.details
  };
}

function chooseGesture(gestures = [], handPreference = "auto") {
  if (!gestures.length) return null;
  if (handPreference === "auto") return gestures.slice().sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
  return gestures.find((gesture) => String(gesture.handedness || "").toLowerCase().includes(handPreference)) || gestures[0];
}

function randomItem(items, previous = null) {
  if (!items.length) return null;
  const alternatives = items.filter((item) => item !== previous);
  return (alternatives.length ? alternatives : items)[Math.floor(Math.random() * (alternatives.length || items.length))];
}

export class LibrasGame {
  constructor({
    onLetter = () => {},
    onProgress = () => {},
    onSuccess = () => {},
    onSequence = () => {},
    onStats = () => {}
  } = {}) {
    this.onLetter = onLetter;
    this.onProgress = onProgress;
    this.onSuccess = onSuccess;
    this.onSequence = onSequence;
    this.onStats = onStats;
    this.active = false;
    this.mode = "learn";
    this.handPreference = "auto";
    this.difficulty = "standard";
    this.index = 0;
    this.sequence = [];
    this.sequenceIndex = 0;
    this.word = "LIBRAS";
    this.holdStartedAt = 0;
    this.mismatchStartedAt = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.attempts = 0;
    this.hits = 0;
  }

  get letter() {
    const id = ["sequence", "word"].includes(this.mode) ? this.sequence[this.sequenceIndex] : LETTERS[this.index]?.id;
    return LETTER_MAP.get(id) || LETTERS[0];
  }

  get settings() { return DIFFICULTIES[this.difficulty] || DIFFICULTIES.standard; }
  get accuracy() { return this.attempts ? Math.round(this.hits / this.attempts * 100) : 100; }

  configure({ mode, handPreference, difficulty, word } = {}) {
    if (["learn", "challenge", "sequence", "word"].includes(mode)) this.mode = mode;
    if (["auto", "left", "right"].includes(handPreference)) this.handPreference = handPreference;
    if (DIFFICULTIES[difficulty]) this.difficulty = difficulty;
    if (word != null) this.word = normalizeText(word).slice(0, 12) || "LIBRAS";
  }

  start(options = {}) {
    this.configure(options);
    this.active = true;
    this.index = this.mode === "challenge" ? Math.floor(Math.random() * LETTERS.length) : 0;
    this.sequenceIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.attempts = 0;
    this.hits = 0;
    this.holdStartedAt = 0;
    this.mismatchStartedAt = 0;
    this.sequence = this.createSequence();
    this.emitTarget();
    this.emitStats();
  }

  stop() {
    this.active = false;
    this.holdStartedAt = 0;
    this.mismatchStartedAt = 0;
  }

  createSequence() {
    if (this.mode === "word") return [...this.word].filter((id) => LETTER_MAP.has(id));
    if (this.mode === "sequence") return [...randomItem(SEQUENCES)];
    return [];
  }

  emitTarget({ completed = false } = {}) {
    if (["sequence", "word"].includes(this.mode)) {
      this.onSequence({ sequence: this.sequence, index: this.sequenceIndex, completed, mode: this.mode });
    } else this.onSequence({ sequence: [], index: 0, completed: false, mode: this.mode });
    this.onLetter(this.letter, this.mode, {
      handPreference: this.handPreference,
      difficulty: this.difficulty,
      index: this.index,
      sequenceIndex: this.sequenceIndex,
      sequenceLength: this.sequence.length
    });
  }

  emitStats() {
    this.onStats({
      score: this.score,
      streak: this.streak,
      bestStreak: this.bestStreak,
      attempts: this.attempts,
      hits: this.hits,
      accuracy: this.accuracy,
      mode: this.mode
    });
  }

  nextLetter() {
    this.holdStartedAt = 0;
    this.mismatchStartedAt = 0;
    let completed = false;
    if (["sequence", "word"].includes(this.mode)) {
      this.sequenceIndex += 1;
      if (this.sequenceIndex >= this.sequence.length) {
        completed = true;
        this.score += this.mode === "word" ? 500 : 300;
        if (this.mode === "sequence") this.sequence = [...randomItem(SEQUENCES, this.sequence.join(""))];
        this.sequenceIndex = 0;
      }
    } else if (this.mode === "challenge") {
      const current = this.letter.id;
      this.index = LETTERS.findIndex((item) => item.id === randomItem(LETTERS.map((entry) => entry.id), current));
    } else this.index = (this.index + 1) % LETTERS.length;
    this.emitTarget({ completed });
    this.emitStats();
  }

  previousLetter() {
    if (["sequence", "word"].includes(this.mode)) this.sequenceIndex = Math.max(0, this.sequenceIndex - 1);
    else this.index = (this.index - 1 + LETTERS.length) % LETTERS.length;
    this.holdStartedAt = 0;
    this.emitTarget();
  }

  setWord(value) {
    this.word = normalizeText(value).slice(0, 12) || "LIBRAS";
    if (this.mode === "word") {
      this.sequence = this.createSequence();
      this.sequenceIndex = 0;
      this.emitTarget();
    }
    return this.word;
  }

  manualConfirm(now = performance.now()) {
    if (!this.active) return;
    this.completeCurrent({ manual: true, evaluation: { score: 1, feedback: "Confirmado pelo professor." }, now });
  }

  completeCurrent({ manual = false, evaluation, now }) {
    this.attempts += 1;
    this.hits += 1;
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    const precisionBonus = Math.round((evaluation?.score || 0) * 50);
    this.score += 100 + precisionBonus + Math.min(100, this.streak * 5);
    this.onSuccess({
      letter: this.letter,
      score: this.score,
      mode: this.mode,
      manual,
      accuracy: this.accuracy,
      streak: this.streak,
      evaluation,
      now
    });
    this.holdStartedAt = 0;
    this.mismatchStartedAt = 0;
    this.nextLetter();
  }

  update({ gestures = [] } = {}, now = performance.now()) {
    if (!this.active) return;
    const gesture = chooseGesture(gestures, this.handPreference);
    const evaluation = evaluateLibrasLetter(this.letter, gesture, {
      handPreference: this.handPreference,
      difficulty: this.difficulty
    });

    if (!evaluation.matched) {
      this.holdStartedAt = 0;
      if (gesture && evaluation.score > 0.25) {
        if (!this.mismatchStartedAt) this.mismatchStartedAt = now;
        if (now - this.mismatchStartedAt >= this.settings.mismatchMs) {
          this.attempts += 1;
          this.streak = 0;
          this.mismatchStartedAt = now;
          this.emitStats();
        }
      } else this.mismatchStartedAt = 0;
      this.onProgress({ progress: 0, score: this.score, letter: this.letter, gesture, evaluation, accuracy: this.accuracy, streak: this.streak });
      return;
    }

    this.mismatchStartedAt = 0;
    if (!this.holdStartedAt) this.holdStartedAt = now;
    const progress = clamp((now - this.holdStartedAt) / this.settings.holdMs);
    this.onProgress({ progress, score: this.score, letter: this.letter, gesture, evaluation, accuracy: this.accuracy, streak: this.streak });
    if (progress < 1) return;
    this.completeCurrent({ manual: false, evaluation, now });
  }
}

export {
  LETTERS as LIBRAS_LETTERS,
  LETTER_MAP as LIBRAS_LETTER_MAP,
  SEQUENCES as LIBRAS_SEQUENCES,
  DEFAULT_WORDS as LIBRAS_DEFAULT_WORDS,
  DIFFICULTIES as LIBRAS_DIFFICULTIES,
  FINGER_NAMES as LIBRAS_FINGER_NAMES,
  normalizeText as normalizeLibrasWord
};
