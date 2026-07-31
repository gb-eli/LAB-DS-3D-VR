export const BLOCK_TYPES = Object.freeze({
  earth: { id: "earth", label: "Terra", icon: "▦", color: "#7c5a38", emissive: "#2d1f12", opacity: 0.96, roughness: 0.9, category: "natural" },
  grass: { id: "grass", label: "Grama", icon: "▤", color: "#4ade80", emissive: "#123d24", opacity: 0.96, roughness: 0.86, category: "natural" },
  stone: { id: "stone", label: "Pedra", icon: "▧", color: "#94a3b8", emissive: "#1e293b", opacity: 0.97, roughness: 0.82, category: "mineral" },
  sand: { id: "sand", label: "Areia", icon: "░", color: "#f4d58d", emissive: "#59451b", opacity: 0.94, roughness: 0.94, category: "natural" },
  water: { id: "water", label: "Água", icon: "≈", color: "#38bdf8", emissive: "#075985", opacity: 0.58, roughness: 0.16, category: "fluid", animated: "wave" },
  lava: { id: "lava", label: "Lava", icon: "♨", color: "#fb4b0b", emissive: "#ff2200", opacity: 0.88, roughness: 0.34, category: "fluid", animated: "pulse" },
  mud: { id: "mud", label: "Lama", icon: "▥", color: "#6b4f32", emissive: "#2a1d12", opacity: 0.94, roughness: 0.98, category: "natural" },
  ice: { id: "ice", label: "Gelo", icon: "❄", color: "#bae6fd", emissive: "#0ea5e9", opacity: 0.62, roughness: 0.08, category: "crystal", animated: "shimmer" },
  crystal: { id: "crystal", label: "Cristal", icon: "✦", color: "#c084fc", emissive: "#7e22ce", opacity: 0.72, roughness: 0.12, category: "crystal", animated: "shimmer" },
  metal: { id: "metal", label: "Metal", icon: "▣", color: "#cbd5e1", emissive: "#334155", opacity: 0.98, roughness: 0.24, metalness: 0.92, category: "technology" },
  wood: { id: "wood", label: "Madeira", icon: "▥", color: "#a16207", emissive: "#422006", opacity: 0.98, roughness: 0.88, category: "natural" },
  obsidian: { id: "obsidian", label: "Obsidiana", icon: "◆", color: "#231942", emissive: "#581c87", opacity: 0.98, roughness: 0.38, category: "mineral", unlocked: false }
});

const recipeKey = (a, b) => [a, b].sort().join("+");
export const BLOCK_REACTIONS = Object.freeze({
  [recipeKey("lava", "water")]: { result: "obsidian", label: "Água + lava formaram obsidiana", xp: 30, effect: "steam" },
  [recipeKey("earth", "water")]: { result: "mud", label: "Terra + água formaram lama", xp: 18, effect: "splash" },
  [recipeKey("ice", "lava")]: { result: "stone", label: "Gelo resfriou a lava e formou pedra", xp: 24, effect: "steam" },
  [recipeKey("sand", "lava")]: { result: "crystal", label: "Areia aquecida formou cristal holográfico", xp: 28, effect: "spark" }
});

export const BLOCK_TOOLS = Object.freeze({
  place: { id: "place", label: "Construir", icon: "+" },
  remove: { id: "remove", label: "Remover", icon: "−" },
  inspect: { id: "inspect", label: "Inspecionar", icon: "⌕" }
});

export function getBlockReaction(first, second) {
  return BLOCK_REACTIONS[recipeKey(first, second)] || null;
}

export class HoloBlocks {
  constructor({ scene = null, callbacks = {} } = {}) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.active = false;
    this.material = "earth";
    this.tool = "place";
    this.score = 0;
    this.combo = 0;
    this.actions = 0;
    this.reactions = 0;
    this.lastGestureActive = false;
  }

  start({ scene = this.scene, material = this.material, tool = this.tool } = {}) {
    this.scene = scene || this.scene;
    this.active = true;
    this.setMaterial(material);
    this.setTool(tool);
    this.scene?.setBlocksEnabled?.(true);
    if ((this.scene?.getBlocksSnapshot?.().count || 0) === 0) this.scene?.seedBlocks?.();
    this.emit();
    return this.snapshot();
  }

  stop() {
    this.active = false;
    this.lastGestureActive = false;
    this.scene?.setBlocksEnabled?.(false);
  }

  dispose() { this.stop(); }

  setMaterial(material) {
    if (!BLOCK_TYPES[material]) return this.material;
    this.material = material;
    this.scene?.setBlocksMaterial?.(material);
    this.emit();
    return material;
  }

  setTool(tool) {
    if (!BLOCK_TOOLS[tool]) return this.tool;
    this.tool = tool;
    this.scene?.setBlocksTool?.(tool);
    this.emit();
    return tool;
  }

  seed() { this.scene?.seedBlocks?.(); }
  clear() { this.scene?.clearBlocks?.(); this.score = 0; this.combo = 0; this.emit(); }
  resetView() { this.scene?.resetBlocks?.(); }

  handleSceneAction(payload = {}) {
    if (!this.active) return;
    this.actions += 1;
    if (payload.action === "place") { this.score += 8 + this.combo * 2; this.combo = Math.min(12, this.combo + 1); }
    else if (payload.action === "remove") { this.score += 3; this.combo = 0; }
    else if (payload.action === "reaction") {
      this.reactions += 1;
      this.score += payload.reaction?.xp || 20;
      this.combo = Math.min(12, this.combo + 2);
      this.callbacks.onReaction?.(payload);
      this.callbacks.onXp?.(payload.reaction?.xp || 20, payload.reaction?.label || "Reação de blocos");
    } else if (payload.action === "inspect") this.callbacks.onInspect?.(payload);
    this.callbacks.onAction?.({ ...payload, score: this.score, combo: this.combo });
    this.emit();
  }

  update({ gestures = [] } = {}) {
    if (!this.active || !this.scene) return;
    const primary = gestures[0];
    const secondary = gestures[1];
    if (!primary) { this.scene.setBlocksHandInteraction?.({ active: false }); this.lastGestureActive = false; return; }
    const point = primary.landmarks?.[8] || primary.point || primary.cursor;
    if (!point) return;
    let twoHandDistance = null;
    const secondPoint = secondary?.landmarks?.[8] || secondary?.point || secondary?.cursor;
    if (secondPoint) twoHandDistance = Math.hypot(point.x - secondPoint.x, point.y - secondPoint.y);
    this.scene.setBlocksHandInteraction?.({
      active: true,
      x: point.x,
      y: point.y,
      gesture: primary,
      twoHandDistance,
      roll: primary.orientation?.roll
    });
  }

  emit() { this.callbacks.onState?.(this.snapshot()); }

  snapshot() {
    const scene = this.scene?.getBlocksSnapshot?.() || { count: 0, material: this.material, tool: this.tool };
    return { active: this.active, material: this.material, materialInfo: BLOCK_TYPES[this.material], tool: this.tool, toolInfo: BLOCK_TOOLS[this.tool], score: this.score, combo: this.combo, actions: this.actions, reactions: this.reactions, ...scene };
  }
}
