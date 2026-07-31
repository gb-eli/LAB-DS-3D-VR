const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number(value) || 0));

export const GESTURE_PRESENTATION = Object.freeze({
  open: { icon: "✋", title: "Mão aberta", hint: "Abra todos os dedos e mostre a palma." },
  fist: { icon: "✊", title: "Mão fechada", hint: "Feche os dedos e mantenha o polegar junto ao punho." },
  pinch: { icon: "🤏", title: "Pinça", hint: "Encoste a ponta do indicador no polegar." },
  point: { icon: "☝", title: "Apontar", hint: "Mantenha apenas o indicador estendido." },
  peace: { icon: "✌", title: "Vitória", hint: "Estenda indicador e dedo médio." },
  thumbs_up: { icon: "👍", title: "Positivo", hint: "Feche os quatro dedos e levante somente o polegar." },
  thumbs_down: { icon: "👎", title: "Negativo", hint: "Feche os quatro dedos e aponte somente o polegar para baixo." },
  ok: { icon: "👌", title: "OK", hint: "Forme um círculo com indicador e polegar e abra os outros dedos." },
  palm_front: { icon: "🖐", title: "Palma frontal", hint: "Mostre a palma aberta diretamente para a câmera." },
  vertical: { icon: "↕", title: "Mão em pé", hint: "Mantenha a mão aberta na orientação vertical." },
  horizontal: { icon: "↔", title: "Mão deitada", hint: "Mantenha a mão aberta na orientação horizontal." },
  swipe: { icon: "⇆", title: "Deslizar para o lado", hint: "Com a mão aberta, faça um movimento lateral rápido." },
  swipe_vertical: { icon: "⇅", title: "Deslizar para cima ou baixo", hint: "Com a mão aberta, faça um movimento vertical rápido." },
  rotate: { icon: "⟳", title: "Girar o punho", hint: "Gire a mão aberta como um comando holográfico." },
  push: { icon: "⤴", title: "Empurrar", hint: "Mostre a palma e aproxime a mão da câmera." },
  pull: { icon: "⤵", title: "Puxar", hint: "Mostre a palma e afaste a mão da câmera." },
  unknown: { icon: "◎", title: "Rastreando", hint: "Mantenha a mão inteira dentro da imagem." }
});

export function gesturePresentation(id) {
  return GESTURE_PRESENTATION[id] || GESTURE_PRESENTATION.unknown;
}

function fingerChecklist(gesture, expected) {
  const extended = gesture?.extended || [];
  const names = ["Polegar", "Indicador", "Médio", "Anelar", "Mínimo"];
  return names.map((label, index) => ({
    id: `finger-${index}`,
    label: `${label} ${expected[index] ? "estendido" : "recolhido"}`,
    passed: Boolean(gesture) && Boolean(extended[index]) === Boolean(expected[index]),
    weight: index === 0 ? 0.8 : 1
  }));
}

function challengeRequirements(challengeId, gesture) {
  switch (challengeId) {
    case "open": return fingerChecklist(gesture, [true, true, true, true, true]);
    case "fist": return fingerChecklist(gesture, [false, false, false, false, false]);
    case "point": return fingerChecklist(gesture, [false, true, false, false, false]);
    case "peace": return fingerChecklist(gesture, [false, true, true, false, false]);
    case "thumbs_up": return fingerChecklist(gesture, [true, false, false, false, false]).concat({ id: "thumb-direction", label: "Polegar apontado para cima", passed: gesture?.thumbDirection === "up", weight: 1.3 });
    case "thumbs_down": return fingerChecklist(gesture, [true, false, false, false, false]).concat({ id: "thumb-direction", label: "Polegar apontado para baixo", passed: gesture?.thumbDirection === "down", weight: 1.3 });
    case "ok": return fingerChecklist(gesture, [true, false, true, true, true]).concat({ id: "pinch-contact", label: "Indicador encostado no polegar", passed: Boolean(gesture?.touches?.index), weight: 1.4 });
    case "pinch": return [{ id: "pinch-contact", label: "Indicador próximo do polegar", passed: Boolean(gesture?.touches?.index) || (gesture?.pinchRatio ?? 9) < 0.58, weight: 2 }];
    case "palm_front": return [{ id: "palm-front", label: "Palma voltada para a câmera", passed: gesture?.palmFacing?.type === "front", weight: 2 }];
    case "vertical": return [{ id: "vertical", label: "Mão na orientação vertical", passed: gesture?.orientation?.type === "vertical_up", weight: 2 }];
    case "horizontal": return [{ id: "horizontal", label: "Mão na orientação horizontal", passed: gesture?.orientation?.type?.startsWith("horizontal"), weight: 2 }];
    case "swipe": return [{ id: "swipe", label: "Movimento lateral detectado", passed: ["swipe_left", "swipe_right"].includes(gesture?.motion?.type), weight: 2 }];
    case "swipe_vertical": return [{ id: "swipe-vertical", label: "Movimento vertical detectado", passed: ["swipe_up", "swipe_down"].includes(gesture?.motion?.type), weight: 2 }];
    case "rotate": return [{ id: "rotate", label: "Rotação do punho detectada", passed: ["rotate_cw", "rotate_ccw"].includes(gesture?.motion?.type), weight: 2 }];
    case "push": return [{ id: "push", label: "Aproximação da mão detectada", passed: gesture?.motion?.type === "push", weight: 2 }];
    case "pull": return [{ id: "pull", label: "Afastamento da mão detectado", passed: gesture?.motion?.type === "pull", weight: 2 }];
    default: return [];
  }
}

export function assessGestureChallenge(challenge, gesture, { holdProgress = 0 } = {}) {
  const detected = Boolean(gesture && gesture.type !== "unknown");
  const directMatch = Boolean(challenge?.matches?.(gesture));
  const requirements = challengeRequirements(challenge?.id, gesture);
  const baseItems = [
    { id: "detected", label: "Mão detectada", passed: detected, weight: 1.2 },
    { id: "confidence", label: "Confiança mínima", passed: (gesture?.confidence || 0) >= (challenge?.minimumConfidence || 0.6), weight: 1.2 },
    ...requirements,
    { id: "stable", label: challenge?.instant ? "Movimento confirmado" : "Gesto estabilizado", passed: challenge?.instant ? directMatch : (gesture?.heldFor || 0) >= 180, weight: 1 }
  ];
  const totalWeight = baseItems.reduce((sum, item) => sum + (item.weight || 1), 0) || 1;
  const passedWeight = baseItems.reduce((sum, item) => sum + (item.passed ? (item.weight || 1) : 0), 0);
  const geometry = clamp(passedWeight / totalWeight);
  const confidence = clamp(gesture?.confidence || 0);
  const typeScore = directMatch ? 1 : challenge?.id === gesture?.type ? 0.92 : 0;
  const stability = challenge?.instant ? (directMatch ? 1 : 0) : clamp(Math.max(holdProgress, (gesture?.heldFor || 0) / Math.max(400, challenge?.hold || 700)));
  const precision = Math.round(clamp(geometry * 0.42 + confidence * 0.28 + typeScore * 0.2 + stability * 0.1) * 100);
  const alternatives = gesture?.alternatives || [];
  return {
    detected,
    directMatch,
    precision,
    geometry: Math.round(geometry * 100),
    confidence: Math.round(confidence * 100),
    stability: Math.round(stability * 100),
    checklist: baseItems,
    detectedLabel: gesture?.label || "RASTREANDO",
    detectedType: gesture?.type || "unknown",
    alternative: alternatives[1]?.type || null,
    alternativeScore: Math.round((alternatives[1]?.score || 0) * 100)
  };
}
