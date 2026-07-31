const check = (id, label, test, hint) => ({ id, label, test, hint });

export const MOTION_COMMANDS = [
  { id: 'open', icon: '✋', title: 'Mão aberta', category: 'MÃOS', hold: 650, xp: 10, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão inteira.'),
    check('palm', 'Palma visível', ({ gestures }) => gestures?.[0]?.palmFacing?.type === 'palm', 'Vire a palma para a câmera.'),
    check('shape', 'Todos os dedos abertos', ({ gestures }) => gestures?.[0]?.type === 'open', 'Afaste os dedos.'),
    check('stable', 'Movimento estabilizado', ({ gestures }) => (gestures?.[0]?.confidence || 0) > .55, 'Mantenha a mão parada.')
  ]},
  { id: 'fist', icon: '✊', title: 'Mão fechada', category: 'MÃOS', hold: 650, xp: 10, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('curve', 'Dedos dobrados', ({ gestures }) => gestures?.[0]?.curvature?.type === 'folded', 'Dobre todos os dedos.'),
    check('shape', 'Punho reconhecido', ({ gestures }) => gestures?.[0]?.type === 'fist', 'Feche o polegar sobre os dedos.')
  ]},
  { id: 'pinch', icon: '⌁', title: 'Pinça', category: 'MÃOS', hold: 700, xp: 12, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('thumb', 'Polegar identificado', ({ gestures }) => Boolean(gestures?.[0]?.metrics?.thumbIndexDistance != null), 'Deixe o polegar visível.'),
    check('contact', 'Polegar e indicador unidos', ({ gestures }) => gestures?.[0]?.type === 'pinch' || gestures?.[0]?.type === 'ok', 'Encoste as pontas dos dedos.'),
    check('stable', 'Pinça mantida', ({ gestures }) => (gestures?.[0]?.confidence || 0) > .45, 'Mantenha por um instante.')
  ]},
  { id: 'point', icon: '☝', title: 'Apontar', category: 'MÃOS', hold: 650, xp: 10, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('index', 'Indicador estendido', ({ gestures }) => gestures?.[0]?.type === 'point', 'Estenda somente o indicador.'),
    check('orientation', 'Mão orientada', ({ gestures }) => !['vertical_down'].includes(gestures?.[0]?.orientation?.type), 'Mantenha a mão para cima ou lateral.')
  ]},
  { id: 'thumbs_up', icon: '👍', title: 'Positivo', category: 'MÃOS', hold: 700, xp: 12, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('shape', 'Polegar para cima', ({ gestures }) => gestures?.[0]?.type === 'thumbs_up', 'Feche os dedos e levante o polegar.'),
    check('orientation', 'Orientação vertical', ({ gestures }) => gestures?.[0]?.orientation?.type === 'vertical_up', 'Mantenha o polegar apontado para cima.')
  ]},
  { id: 'thumbs_down', icon: '👎', title: 'Negativo', category: 'MÃOS', hold: 700, xp: 12, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('shape', 'Polegar para baixo', ({ gestures }) => gestures?.[0]?.type === 'thumbs_down', 'Feche os dedos e aponte o polegar para baixo.'),
    check('orientation', 'Orientação invertida', ({ gestures }) => gestures?.[0]?.orientation?.type === 'vertical_down', 'Vire a mão para baixo.')
  ]},
  { id: 'ok', icon: '👌', title: 'OK', category: 'MÃOS', hold: 750, xp: 14, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('contact', 'Polegar e indicador em círculo', ({ gestures }) => gestures?.[0]?.type === 'ok', 'Una polegar e indicador.'),
    check('others', 'Outros dedos estendidos', ({ gestures }) => gestures?.[0]?.metrics?.extendedCount >= 2, 'Abra os demais dedos.')
  ]},
  { id: 'peace', icon: '✌', title: 'Vitória', category: 'MÃOS', hold: 700, xp: 12, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('shape', 'Indicador e médio abertos', ({ gestures }) => gestures?.[0]?.type === 'peace', 'Abra indicador e médio.'),
    check('stable', 'Gesto mantido', ({ gestures }) => (gestures?.[0]?.confidence || 0) > .5, 'Mantenha o gesto.')
  ]},
  { id: 'wave', icon: '👋', title: 'Acenar', category: 'MOVIMENTO', hold: 500, xp: 16, checks: [
    check('hand', 'Mão aberta detectada', ({ gestures }) => gestures?.[0]?.type === 'open', 'Abra a mão.'),
    check('motion', 'Movimento lateral', ({ gestures }) => ['swipe_left','swipe_right','wave'].includes(gestures?.[0]?.motion?.type), 'Movimente para os lados.'),
    check('repeat', 'Trajetória suficiente', ({ gestures }) => Math.abs(gestures?.[0]?.motion?.velocityX || 0) > .28, 'Faça um movimento um pouco maior.')
  ]},
  { id: 'push', icon: '⟿', title: 'Empurrar', category: 'MOVIMENTO', hold: 450, xp: 18, checks: [
    check('palm', 'Palma aberta', ({ gestures }) => gestures?.[0]?.type === 'open', 'Abra a palma.'),
    check('motion', 'Movimento para frente', ({ gestures }) => gestures?.[0]?.motion?.type === 'push', 'Empurre a mão na direção da câmera.')
  ]},
  { id: 'pull', icon: '⤌', title: 'Puxar', category: 'MOVIMENTO', hold: 450, xp: 18, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('motion', 'Movimento de aproximação', ({ gestures }) => gestures?.[0]?.motion?.type === 'pull', 'Puxe a mão em sua direção.')
  ]},
  { id: 'rotate', icon: '⟳', title: 'Girar o punho', category: 'MOVIMENTO', hold: 500, xp: 18, checks: [
    check('hand', 'Mão detectada', ({ gestures }) => Boolean(gestures?.[0]), 'Mostre a mão.'),
    check('motion', 'Rotação detectada', ({ gestures }) => gestures?.[0]?.motion?.type === 'rotate', 'Gire lentamente o punho.')
  ]},
  { id: 'arms_open', icon: '↔', title: 'Braços abertos', category: 'CORPO', hold: 850, xp: 16, checks: [
    check('body', 'Corpo detectado', ({ body }) => body?.detected, 'Afaste-se para mostrar o corpo.'),
    check('shoulders', 'Ombros visíveis', ({ body }) => (body?.metrics?.visible || 0) >= 20, 'Mantenha tronco e braços visíveis.'),
    check('pose', 'Braços totalmente abertos', ({ body }) => body?.actions?.has('arms_open'), 'Estenda os braços para os lados.')
  ]},
  { id: 'hands_up', icon: '🙌', title: 'Mãos ao alto', category: 'CORPO', hold: 850, xp: 16, checks: [
    check('body', 'Corpo detectado', ({ body }) => body?.detected, 'Mostre o tronco.'),
    check('hands', 'Duas mãos visíveis', ({ body }) => body?.actions?.has('hands_up'), 'Levante as duas mãos acima da cabeça.')
  ]},
  { id: 'squat', icon: '▼', title: 'Agachamento', category: 'CORPO', hold: 750, xp: 20, checks: [
    check('body', 'Corpo inteiro detectado', ({ body }) => body?.detected && (body?.metrics?.visible || 0) >= 24, 'Afaste-se para mostrar pernas e pés.'),
    check('knees', 'Joelhos flexionados', ({ body }) => body?.actions?.has('squat'), 'Abaixe o quadril e dobre os joelhos.'),
    check('stable', 'Posição sustentada', ({ body }) => body?.actions?.has('squat'), 'Mantenha por um instante.')
  ]},
  { id: 'jump', icon: '↟', title: 'Pular', category: 'CORPO', hold: 300, xp: 24, checks: [
    check('body', 'Corpo inteiro detectado', ({ body }) => body?.detected, 'Mostre corpo e pernas.'),
    check('prep', 'Movimento vertical identificado', ({ body }) => body?.events?.has('jump') || body?.actions?.has('jump'), 'Flexione e pule.'),
    check('event', 'Pulo confirmado', ({ body }) => body?.events?.has('jump'), 'Retorne ao chão para confirmar.')
  ]},
  { id: 'clap', icon: '👏', title: 'Bater palmas', category: 'CORPO', hold: 300, xp: 20, checks: [
    check('body', 'Braços detectados', ({ body }) => body?.detected, 'Mostre braços e mãos.'),
    check('close', 'Mãos aproximadas', ({ body }) => body?.actions?.has('hands_together') || body?.events?.has('clap'), 'Aproxime as mãos.'),
    check('event', 'Palma confirmada', ({ body }) => body?.events?.has('clap'), 'Bata as palmas uma vez.')
  ]},
  { id: 'lean_left', icon: '↙', title: 'Inclinar à esquerda', category: 'CORPO', hold: 750, xp: 14, checks: [
    check('body', 'Tronco detectado', ({ body }) => body?.detected, 'Mostre o tronco.'),
    check('pose', 'Inclinação à esquerda', ({ body }) => body?.actions?.has('lean_left'), 'Incline o tronco para a esquerda.')
  ]},
  { id: 'lean_right', icon: '↘', title: 'Inclinar à direita', category: 'CORPO', hold: 750, xp: 14, checks: [
    check('body', 'Tronco detectado', ({ body }) => body?.detected, 'Mostre o tronco.'),
    check('pose', 'Inclinação à direita', ({ body }) => body?.actions?.has('lean_right'), 'Incline o tronco para a direita.')
  ]},
  { id: 'smile', icon: '☺', title: 'Sorrir', category: 'ROSTO', hold: 700, xp: 12, checks: [
    check('face', 'Rosto detectado', ({ face }) => face?.detected, 'Centralize o rosto.'),
    check('eyes', 'Olhos e boca mapeados', ({ face }) => (face?.landmarkCount || 0) > 100, 'Use iluminação frontal.'),
    check('expression', 'Sorriso reconhecido', ({ face }) => (face?.smile || 0) > .38, 'Sorria um pouco mais.')
  ]}
];

// Variações adicionais usadas por desafios e sequências sem manter todos os sensores ativos.
export const EXTENDED_COMMAND_IDS = [
  'open','fist','pinch','point','thumbs_up','thumbs_down','ok','peace','wave','push','pull','rotate',
  'arms_open','hands_up','squat','jump','clap','lean_left','lean_right','smile',
  'swipe_left','swipe_right','swipe_up','swipe_down','heart','zoom_in','zoom_out','portal_open','portal_close',
  'right_arm_up','left_arm_up','arms_crossed','balance','knee_up','defense','head_left','head_right','blink','mouth_open',
  'palm_front','hand_back','hand_vertical','hand_horizontal','hand_side','grab','release','throw','shield','energy_charge','energy_release'
];

export function evaluateMotion(command, context) {
  const results = command.checks.map((item) => ({ ...item, ok: Boolean(item.test(context)) }));
  return {
    command,
    results,
    completed: results.every((item) => item.ok),
    ratio: results.filter((item) => item.ok).length / Math.max(1, results.length),
    hint: results.find((item) => !item.ok)?.hint || 'Movimento validado.'
  };
}

export function findMotion(id) { return MOTION_COMMANDS.find((item) => item.id === id) || MOTION_COMMANDS[0]; }
