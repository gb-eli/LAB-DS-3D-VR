export const LAZY_MODULES = {
  blocks: {
    entry: './holo-blocks.js',
    exportName: 'HoloBlocks',
    weight: 'heavy',
    sensors: ['hand'],
    label: 'Holo Blocks'
  },
  explorer: {
    entry: './explorer-advanced.js',
    exportName: 'ExplorerAdvanced',
    weight: 'heavy',
    sensors: ['hand'],
    label: 'Holo Explorer Advanced'
  },
  checklist: {
    entry: './motion-checklist-game.js',
    exportName: 'MotionChecklistGame',
    weight: 'medium',
    sensors: ['hand', 'pose', 'face'],
    label: 'Motion Checklist'
  },
  simon: {
    entry: './simon-motion-game.js',
    exportName: 'SimonMotionGame',
    weight: 'light',
    sensors: ['hand', 'pose'],
    label: 'Simon Motion'
  },
  reflex: {
    entry: './reflex-game.js',
    exportName: 'ReflexGame',
    weight: 'light',
    sensors: ['hand', 'pose'],
    label: 'Reflex Challenge'
  },
  marathon: {
    entry: './marathon-game.js',
    exportName: 'MarathonGame',
    weight: 'medium',
    sensors: ['hand', 'pose'],
    label: 'Gesture Marathon'
  },
  defender: {
    entry: './defender-game.js',
    exportName: 'DefenderGame',
    weight: 'medium',
    sensors: ['hand', 'pose'],
    label: 'Holo Defender'
  },
  assembly: {
    entry: './assembly-game.js',
    exportName: 'AssemblyGame',
    weight: 'medium',
    sensors: ['hand'],
    label: 'Holo Assembly'
  },
  depth: {
    entry: './depth-trainer-game.js',
    exportName: 'DepthTrainerGame',
    weight: 'light',
    sensors: ['hand'],
    label: 'Depth Trainer'
  },
  scanner: {
    entry: './vision-scanner.js',
    exportName: 'VisionScanner',
    weight: 'heavy',
    sensors: ['objects', 'hand', 'pose'],
    label: 'Vision Scanner'
  }
};

export class ModuleLoader {
  constructor({ onState = () => {} } = {}) {
    this.cache = new Map();
    this.instances = new Map();
    this.onState = onState;
    this.activeId = null;
  }

  has(id) { return Boolean(LAZY_MODULES[id]); }
  get(id) { return this.instances.get(id) || null; }
  get active() { return this.activeId ? this.instances.get(this.activeId) || null : null; }

  async load(id, context = {}) {
    const meta = LAZY_MODULES[id];
    if (!meta) return null;
    if (this.instances.has(id)) return this.instances.get(id);
    this.onState({ id, state: 'loading', meta });
    let imported = this.cache.get(id);
    if (!imported) {
      imported = import(meta.entry);
      this.cache.set(id, imported);
    }
    const module = await imported;
    const Constructor = module[meta.exportName];
    if (typeof Constructor !== 'function') throw new Error(`Módulo ${id} sem exportação ${meta.exportName}`);
    const instance = new Constructor(context);
    this.instances.set(id, instance);
    this.onState({ id, state: 'ready', meta });
    return instance;
  }

  async activate(id, context = {}) {
    if (this.activeId && this.activeId !== id) await this.deactivate(this.activeId, { dispose: false });
    const instance = await this.load(id, context);
    this.activeId = id;
    await instance?.start?.(context);
    this.onState({ id, state: 'active', meta: LAZY_MODULES[id] });
    return instance;
  }

  async deactivate(id = this.activeId, { dispose = false } = {}) {
    if (!id) return;
    const instance = this.instances.get(id);
    await instance?.stop?.();
    if (dispose) {
      await instance?.dispose?.();
      this.instances.delete(id);
      this.cache.delete(id);
    }
    if (this.activeId === id) this.activeId = null;
    this.onState({ id, state: dispose ? 'unloaded' : 'paused', meta: LAZY_MODULES[id] });
  }

  async disposeAll() {
    for (const id of [...this.instances.keys()]) await this.deactivate(id, { dispose: true });
  }

  snapshot() {
    return Object.entries(LAZY_MODULES).map(([id, meta]) => ({
      id,
      ...meta,
      loaded: this.instances.has(id),
      active: this.activeId === id
    }));
  }
}
