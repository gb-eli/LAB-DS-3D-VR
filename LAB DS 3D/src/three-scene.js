import * as THREE from "three";
import { QUALITY_PROFILES } from "./config.js";
import { BLOCK_TYPES, getBlockReaction } from "./holo-blocks.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class HoloScene {
  constructor(canvas, { quality = "balanced", onGrab = () => {}, onRelease = () => {}, onExplorerSelect = () => {}, onBlocksAction = () => {} } = {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.onGrab = onGrab;
    this.onRelease = onRelease;
    this.onExplorerSelect = onExplorerSelect;
    this.onBlocksAction = onBlocksAction;
    this.visualTheme = "neon";
    this.mode = "sandbox";
    this.enabled = true;
    this.autoRotate = true;
    this.grabbed = false;
    this.hovered = false;
    this.explorerHovered = false;
    this.lastGrabGesture = false;
    this.initialTwoHandDistance = null;
    this.initialScale = 1;
    this.lastHandRoll = null;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.intersection = new THREE.Vector3();
    this.clock = new THREE.Clock();
    this.mouseDown = false;
    this.objectType = "cube";
    this.lastRenderAt = 0;
    this.renderFpsOverride = 0;
    this.targetScaleVector = new THREE.Vector3(1, 1, 1);
    this.dynamicPixelRatioScale = 1;
    this.performanceLevel = 0;
    this.particleBudgetScale = 1;
    this.faceState = { jawOpen: 0, smile: 0, blink: 0, browUp: 0, headRoll: 0, headYaw: 0, headPitch: 0 };
    this.explorerId = "solar-system";
    this.explorerExploded = false;
    this.explorerAutoAnimate = true;
    this.explorerParts = [];
    this.explorerAnimated = [];
    this.explorerHovered = false;
    this.explorerHoveredPart = null;
    this.explorerFocusedPartId = null;
    this.explorerSimulation = { pressure: 45, temperature: 55, viscosity: 45 };
    this.blocksMaterial = "earth";
    this.blocksTool = "place";
    this.blocks = new Map();
    this.blocksLastGesture = false;
    this.blocksInitialDistance = null;
    this.blocksInitialScale = 1;
    this.blocksLastRoll = null;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    this.camera.position.set(0, 0.55, 8.2);

    this.createEnvironment();
    this.createObject();
    this.createExplorerScene();
    this.createBlocksScene();
    this.createFaceReactor();
    this.createParticles();
    this.bindPointer();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.resize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createEnvironment() {
    this.scene.add(new THREE.HemisphereLight(0x93efff, 0x09041b, 1.15));
    const key = new THREE.PointLight(0x00d9ff, 16, 24, 2);
    key.position.set(4, 4, 5);
    this.scene.add(key);
    const fill = new THREE.PointLight(0x8b5cf6, 12, 20, 2);
    fill.position.set(-5, -2, 4);
    this.scene.add(fill);

    this.grid = new THREE.GridHelper(18, 32, 0x00d9ff, 0x16455b);
    this.grid.position.set(0, -2.4, -1.6);
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.2;
    this.scene.add(this.grid);

    const ringGeometry = new THREE.TorusGeometry(2.25, 0.014, 6, 96);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.28 });
    this.rings = [];
    for (let index = 0; index < 3; index += 1) {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());
      ring.scale.setScalar(0.72 + index * 0.27);
      ring.rotation.set(Math.PI / 2 + index * 0.4, index * 0.6, 0);
      this.rings.push(ring);
      this.scene.add(ring);
    }
  }

  geometryFor(type) {
    if (type === "sphere") return new THREE.IcosahedronGeometry(1.25, 2);
    if (type === "pyramid") return new THREE.ConeGeometry(1.35, 2.2, 4, 1);
    if (type === "torus") return new THREE.TorusKnotGeometry(0.9, 0.32, 72, 10);
    if (type === "cylinder") return new THREE.CylinderGeometry(1.05, 1.05, 2.15, 28, 1);
    return new THREE.BoxGeometry(1.9, 1.9, 1.9, 3, 3, 3);
  }

  disposeGroup(group) {
    if (!group) return;
    group.traverse((item) => {
      item.geometry?.dispose?.();
      if (Array.isArray(item.material)) item.material.forEach((material) => material.dispose?.());
      else item.material?.dispose?.();
    });
    this.scene.remove(group);
  }

  createObject() {
    const previous = this.objectGroup ? {
      position: this.objectGroup.position.clone(),
      rotation: this.objectGroup.rotation.clone(),
      scale: this.objectGroup.scale.x
    } : null;
    this.disposeGroup(this.objectGroup);
    this.objectGroup = new THREE.Group();
    const geometry = this.geometryFor(this.objectType);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: this.currentColor || 0x00d9ff,
      emissive: this.currentColor || 0x003849,
      emissiveIntensity: 0.72,
      roughness: 0.22,
      metalness: 0.36,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide
    });
    this.core = new THREE.Mesh(geometry, this.coreMaterial);
    this.objectGroup.add(this.core);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 18),
      new THREE.LineBasicMaterial({ color: 0xc8fbff, transparent: true, opacity: 0.88 })
    );
    edges.scale.setScalar(1.035);
    this.objectGroup.add(edges);
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.54, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.38 })
    );
    inner.name = "inner";
    this.objectGroup.add(inner);
    this.scene.add(this.objectGroup);
    if (previous) {
      this.objectGroup.position.copy(previous.position);
      this.objectGroup.rotation.copy(previous.rotation);
      this.objectGroup.scale.setScalar(previous.scale);
    }
  }

  explorerMaterial(color = 0x00e5ff, opacity = 0.72, options = {}) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: options.emissive ?? color,
      emissiveIntensity: options.emissiveIntensity ?? 0.28,
      roughness: options.roughness ?? 0.28,
      metalness: options.metalness ?? 0.34,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      wireframe: Boolean(options.wireframe)
    });
  }

  registerExplorerPart(part, explode = new THREE.Vector3(), partId = null) {
    part.userData.basePosition = part.position.clone();
    part.userData.baseScale = part.scale.clone();
    part.userData.explodeVector = explode.clone();
    if (partId) {
      part.userData.partId = partId;
      part.traverse?.((child) => { if (!child.userData.partId) child.userData.partId = partId; });
    }
    this.explorerParts.push(part);
    return part;
  }

  resolveExplorerPart(object) {
    let current = object;
    while (current && current !== this.explorerGroup) {
      if (current.userData?.partId) return current;
      current = current.parent;
    }
    return null;
  }

  createExplorerScene() {
    this.explorerGroup = new THREE.Group();
    this.explorerGroup.visible = false;
    this.scene.add(this.explorerGroup);
    this.setExplorerExhibit(this.explorerId);
  }

  clearExplorerExhibit() {
    if (!this.explorerModel) return;
    this.disposeGroup(this.explorerModel);
    this.explorerModel = null;
    this.explorerParts = [];
    this.explorerAnimated = [];
  }

  addExplorerEdges(mesh, color = 0xc8fbff, opacity = 0.72) {
    if (!mesh.geometry) return;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 20),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    );
    edges.scale.setScalar(1.01);
    mesh.add(edges);
  }

  buildSolarSystem(root) {
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 20), this.explorerMaterial(0xfbbf24, 0.94, { emissiveIntensity: 1.25, roughness: 0.18 }));
    root.add(sun);
    this.registerExplorerPart(sun, new THREE.Vector3(0, 0.35, 0), "sun");
    this.explorerAnimated.push({ object: sun, type: "spin", speed: 0.22 });
    const radii = [1.08, 1.36, 1.65, 2.0, 2.42, 2.78, 3.12, 3.43];
    const sizes = [0.1, 0.15, 0.16, 0.13, 0.34, 0.29, 0.23, 0.22];
    const colors = [0xb9a48d, 0xeab676, 0x38bdf8, 0xef4444, 0xf59e0b, 0xfacc15, 0x67e8f9, 0x60a5fa];
    const planetIds = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
    radii.forEach((radius, index) => {
      const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.008, 4, 90),
        new THREE.MeshBasicMaterial({ color: 0x75e7ff, transparent: true, opacity: 0.22 })
      );
      orbit.rotation.x = Math.PI / 2;
      root.add(orbit);
      const pivot = new THREE.Group();
      const planet = new THREE.Mesh(new THREE.SphereGeometry(sizes[index], 18, 12), this.explorerMaterial(colors[index], 0.88, { emissiveIntensity: 0.18 }));
      planet.position.x = radius;
      pivot.rotation.x = (index % 3 - 1) * 0.04;
      pivot.add(planet);
      root.add(pivot);
      this.explorerAnimated.push({ object: pivot, type: "orbit", speed: 0.15 + (8 - index) * 0.045 });
      this.registerExplorerPart(pivot, new THREE.Vector3(Math.cos(index) * 0.45, (index - 3.5) * 0.08, Math.sin(index) * 0.45), planetIds[index]);
      if (index === 5) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(sizes[index] * 1.75, 0.025, 5, 40), new THREE.MeshBasicMaterial({ color: 0xffefb0, transparent: true, opacity: 0.65 }));
        ring.rotation.x = Math.PI / 2.35;
        planet.add(ring);
      }
    });
    root.rotation.x = -0.16;
    root.scale.setScalar(0.92);
  }

  buildEarthMoon(root) {
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1.45, 40, 28), this.explorerMaterial(0x0ea5e9, 0.86, { emissive: 0x063b59, emissiveIntensity: 0.52, roughness: 0.42 }));
    root.add(earth);
    this.registerExplorerPart(earth, new THREE.Vector3(-0.25, 0.2, 0), "earth");
    this.addExplorerEdges(earth, 0xa7f3ff, 0.28);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.58, 24, 18), new THREE.MeshBasicMaterial({ color: 0x67e8f9, wireframe: true, transparent: true, opacity: 0.16 }));
    root.add(atmosphere);
    this.registerExplorerPart(atmosphere, new THREE.Vector3(0, 0.4, 0), "atmosphere");
    const equator = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.014, 5, 96), new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5 }));
    equator.rotation.x = Math.PI / 2;
    root.add(equator);
    this.registerExplorerPart(equator, new THREE.Vector3(0, 0.1, 0.4), "equator");
    const moonPivot = new THREE.Group();
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16), this.explorerMaterial(0xcbd5e1, 0.88, { emissiveIntensity: 0.12, roughness: 0.74 }));
    moon.position.set(2.55, 0.28, 0);
    moonPivot.add(moon);
    root.add(moonPivot);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.012, 4, 96), new THREE.MeshBasicMaterial({ color: 0xb6f4ff, transparent: true, opacity: 0.28 }));
    orbit.rotation.x = Math.PI / 2;
    root.add(orbit);
    this.explorerAnimated.push({ object: earth, type: "spin", speed: 0.28 }, { object: atmosphere, type: "spinReverse", speed: 0.12 }, { object: moonPivot, type: "orbit", speed: 0.2 });
    this.registerExplorerPart(moonPivot, new THREE.Vector3(0.8, 0.3, 0), "moon");
    root.rotation.z = -0.2;
  }

  buildMotherboard(root) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.16, 3.2), this.explorerMaterial(0x059669, 0.62, { roughness: 0.5 }));
    board.rotation.x = -0.12;
    root.add(board);
    this.addExplorerEdges(board, 0x9fffd8, 0.48);
    const makePart = (geometry, color, position, explode, partId) => {
      const mesh = new THREE.Mesh(geometry, this.explorerMaterial(color, 0.82));
      mesh.position.copy(position);
      root.add(mesh);
      this.addExplorerEdges(mesh, 0xe8fff8, 0.62);
      return this.registerExplorerPart(mesh, explode, partId);
    };
    makePart(new THREE.BoxGeometry(1.15, 0.32, 1.15), 0x38bdf8, new THREE.Vector3(-0.75, 0.28, 0.25), new THREE.Vector3(-0.7, 0.75, 0.2), "cpu");
    for (let i = 0; i < 4; i += 1) makePart(new THREE.BoxGeometry(0.16, 0.42, 1.65), 0xa78bfa, new THREE.Vector3(0.55 + i * 0.27, 0.31, -0.32), new THREE.Vector3(0.2 + i * 0.12, 0.85, -0.35), "ram");
    for (let i = 0; i < 3; i += 1) makePart(new THREE.BoxGeometry(1.85, 0.18, 0.15), 0xf8fafc, new THREE.Vector3(0.45, 0.26, 0.75 + i * 0.31), new THREE.Vector3(0.55, 0.65, 0.45 + i * 0.15), i === 0 ? "pcie" : "storage");
    const chipset = makePart(new THREE.CylinderGeometry(0.44, 0.44, 0.24, 24), 0xf59e0b, new THREE.Vector3(-0.65, 0.28, -0.95), new THREE.Vector3(-0.5, 0.7, -0.6), "chipset");
    chipset.rotation.x = Math.PI / 2;
    const fan = makePart(new THREE.CylinderGeometry(0.62, 0.62, 0.25, 32), 0x0f172a, new THREE.Vector3(-1.82, 0.32, -0.45), new THREE.Vector3(-0.85, 0.8, -0.3), "cooler");
    fan.rotation.x = Math.PI / 2;
    this.explorerAnimated.push({ object: fan, type: "spinZ", speed: 1.8 });
    root.rotation.x = -0.7;
    root.rotation.z = 0.04;
    root.scale.setScalar(0.92);
  }

  buildDrone(root) {
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 1), this.explorerMaterial(0x2563eb, 0.82, { emissiveIntensity: 0.48 }));
    root.add(body);
    this.registerExplorerPart(body, new THREE.Vector3(0, 0.45, 0), "drone-body");
    this.addExplorerEdges(body);
    const camera = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 12), this.explorerMaterial(0x0f172a, 0.92, { emissive: 0x22d3ee, emissiveIntensity: 0.7 }));
    camera.position.set(0, -0.34, 0.66);
    root.add(camera);
    this.registerExplorerPart(camera, new THREE.Vector3(0, -0.8, 0.65), "drone-camera");
    const coords = [[1,0,1],[-1,0,1],[-1,0,-1],[1,0,-1]];
    coords.forEach((coord, index) => {
      const arm = new THREE.Group();
      arm.position.set(coord[0] * 1.35, 0, coord[2] * 1.35);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 0.18), this.explorerMaterial(index % 2 ? 0x38bdf8 : 0xa78bfa, 0.78));
      beam.rotation.y = Math.atan2(coord[2], coord[0]);
      arm.add(beam);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.24, 22), this.explorerMaterial(0x111827, 0.9, { emissive: 0x0891b2, emissiveIntensity: 0.55 }));
      arm.add(motor);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.035, 0.11), new THREE.MeshBasicMaterial({ color: 0xbdf7ff, transparent: true, opacity: 0.72 }));
      rotor.position.y = 0.2;
      arm.add(rotor);
      root.add(arm);
      this.registerExplorerPart(arm, new THREE.Vector3(coord[0] * 0.85, 0.35, coord[2] * 0.85), `motor-${index + 1}`);
      rotor.userData.partId = `rotor-${index + 1}`;
      this.explorerAnimated.push({ object: rotor, type: "spinY", speed: index % 2 ? -4.6 : 4.6 });
    });
    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.25, 0.9), this.explorerMaterial(0x22c55e, 0.82));
    battery.position.set(0, -0.55, -0.2); root.add(battery); this.registerExplorerPart(battery, new THREE.Vector3(0, -0.65, -0.4), "battery");
    root.rotation.x = -0.2;
  }

  buildRobot(root) {
    const material = (color) => this.explorerMaterial(color, 0.8, { emissiveIntensity: 0.38 });
    const add = (geometry, color, position, explode, partId) => {
      const mesh = new THREE.Mesh(geometry, material(color));
      mesh.position.copy(position);
      root.add(mesh);
      this.addExplorerEdges(mesh);
      return this.registerExplorerPart(mesh, explode, partId);
    };
    add(new THREE.BoxGeometry(1.35, 1.55, 0.72), 0x4f46e5, new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.3, 0), "robot-body");
    const core = add(new THREE.SphereGeometry(0.28, 18, 14), 0x22d3ee, new THREE.Vector3(0, 0.48, 0.4), new THREE.Vector3(0, 0.25, 0.8), "robot-core");
    this.explorerAnimated.push({ object: core, type: "pulse", speed: 1.7 });
    add(new THREE.BoxGeometry(0.88, 0.72, 0.72), 0x60a5fa, new THREE.Vector3(0, 1.65, 0), new THREE.Vector3(0, 0.9, 0), "robot-head");
    [-1, 1].forEach((side) => {
      add(new THREE.CapsuleGeometry(0.2, 1.05, 6, 10), 0x8b5cf6, new THREE.Vector3(side * 1.05, 0.45, 0), new THREE.Vector3(side * 0.8, 0.3, 0), "robot-arm");
      add(new THREE.SphereGeometry(0.26, 16, 10), 0x22d3ee, new THREE.Vector3(side * 1.05, -0.32, 0), new THREE.Vector3(side * 0.95, -0.45, 0), "robot-hand");
      add(new THREE.CapsuleGeometry(0.24, 1.15, 6, 10), 0x3b82f6, new THREE.Vector3(side * 0.46, -1.25, 0), new THREE.Vector3(side * 0.42, -0.9, 0), "robot-leg");
    });
    root.scale.setScalar(0.92);
  }

  buildVolcano(root) {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(2.45, 3.35, 48, 4, true), this.explorerMaterial(0x7c2d12, 0.72, { roughness: 0.7 }));
    mountain.position.y = -0.35;
    root.add(mountain);
    this.registerExplorerPart(mountain, new THREE.Vector3(0, 0, -0.25), "volcano-shell");
    this.addExplorerEdges(mountain, 0xfda4af, 0.32);
    const magma = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.72, 2.65, 20), this.explorerMaterial(0xfb3c14, 0.9, { emissiveIntensity: 1.1, roughness: 0.2 }));
    magma.position.y = -0.15;
    root.add(magma);
    this.registerExplorerPart(magma, new THREE.Vector3(0, 0.9, 0.65), "magma-conduit");
    const chamber = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 16), this.explorerMaterial(0xff5a1f, 0.88, { emissiveIntensity: 1.25 }));
    chamber.scale.y = 0.58;
    chamber.position.y = -1.65;
    root.add(chamber);
    this.registerExplorerPart(chamber, new THREE.Vector3(0, -0.7, 0), "magma-chamber");
    const crater = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.12, 8, 36), new THREE.MeshBasicMaterial({ color: 0xffa07a, transparent: true, opacity: 0.82 }));
    crater.rotation.x = Math.PI / 2;
    crater.position.y = 1.36;
    root.add(crater);
    this.registerExplorerPart(crater, new THREE.Vector3(0, 0.45, 0), "crater");
    this.explorerAnimated.push({ object: magma, type: "pulse", speed: 2.1 }, { object: chamber, type: "pulse", speed: 1.5 });
    const smokePositions = new Float32Array(90);
    for (let i = 0; i < 30; i += 1) {
      smokePositions[i * 3] = (Math.random() - 0.5) * 0.55;
      smokePositions[i * 3 + 1] = 1.5 + Math.random() * 2.2;
      smokePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.55;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
    const smoke = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfca5a5, size: 0.09, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending }));
    root.add(smoke);
    this.explorerAnimated.push({ object: smoke, type: "rise", speed: 0.18 });
  }

  buildCave(root) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 3.4), this.explorerMaterial(0x312e81, 0.48, { roughness: 0.82 }));
    floor.position.y = -1.3;
    root.add(floor);
    this.registerExplorerPart(floor, new THREE.Vector3(0, -0.2, 0), "cave-gallery");
    const entry = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.18, 8, 32), this.explorerMaterial(0x6366f1, 0.55)); entry.position.set(-1.85, 0, 0); entry.rotation.y = Math.PI / 2; root.add(entry); this.registerExplorerPart(entry, new THREE.Vector3(-0.55, 0, 0), "cave-entry");
    const stalactite = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.2, 8), this.explorerMaterial(0x818cf8, 0.7)); stalactite.position.set(0.7, 0.85, 0); stalactite.rotation.z = Math.PI; root.add(stalactite); this.registerExplorerPart(stalactite, new THREE.Vector3(0.2, 0.45, 0), "stalactite");
    for (let i = 0; i < 22; i += 1) {
      const angle = (i / 22) * Math.PI * 2;
      const radius = 1.7 + (i % 3) * 0.18;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (i % 4) * 0.08, 0), this.explorerMaterial(0x4338ca, 0.58, { roughness: 0.9 }));
      rock.position.set(Math.cos(angle) * radius, Math.sin(angle) * 1.15 - 0.05, Math.sin(angle * 2) * 0.6);
      rock.scale.set(1, 1.35, 0.8);
      root.add(rock);
    }
    const crystalColors = [0x22d3ee, 0xa78bfa, 0xf472b6];
    for (let i = 0; i < 9; i += 1) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.18 + (i % 3) * 0.06, 0.9 + (i % 4) * 0.2, 6), this.explorerMaterial(crystalColors[i % crystalColors.length], 0.82, { emissiveIntensity: 0.75, roughness: 0.18 }));
      crystal.position.set(-1.5 + (i % 5) * 0.75, -0.74, -0.55 + Math.floor(i / 5) * 1.1);
      root.add(crystal);
      this.registerExplorerPart(crystal, new THREE.Vector3((i % 5 - 2) * 0.18, 0.45, (Math.floor(i / 5) - 0.5) * 0.4), `crystal-${i + 1}`);
      this.explorerAnimated.push({ object: crystal, type: "pulse", speed: 1.1 + i * 0.05 });
    }
    root.rotation.x = -0.28;
  }

  buildWorldMap(root) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(5.1, 3.05, 0.12), this.explorerMaterial(0x0f766e, 0.42, { roughness: 0.6 }));
    root.add(panel);
    this.addExplorerEdges(panel, 0x99f6e4, 0.56);
    const shapes = [
      [-1.45, 0.45, 0.8, 1.25], [-0.75, -0.72, 0.55, 0.92], [0.2, 0.42, 0.5, 0.85], [0.72, -0.3, 0.58, 1.2], [1.45, 0.48, 1.2, 0.78], [1.78, -0.88, 0.48, 0.34]
    ];
    const regionIds = ["americas", "south-america", "europe", "africa", "asia", "oceania"];
    shapes.forEach((item, index) => {
      const land = new THREE.Mesh(new THREE.BoxGeometry(item[2], item[3], 0.18), this.explorerMaterial(index % 2 ? 0x2dd4bf : 0x22d3ee, 0.75));
      land.position.set(item[0], item[1], 0.14);
      land.rotation.z = (index - 2) * 0.08;
      root.add(land);
      this.registerExplorerPart(land, new THREE.Vector3(item[0] * 0.22, item[1] * 0.25, 0.7), regionIds[index]);
    });
    for (let i = 0; i < 7; i += 1) {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshBasicMaterial({ color: 0xf0fdfa, transparent: true, opacity: 0.9 }));
      marker.position.set(-2 + i * 0.66, Math.sin(i * 1.4) * 0.75, 0.32);
      root.add(marker);
      this.explorerAnimated.push({ object: marker, type: "pulse", speed: 1.4 + i * 0.12 });
    }
    root.rotation.x = -0.12;
  }

  buildLandmarks(root) {
    const tower = new THREE.Group();
    const legMat = this.explorerMaterial(0xf59e0b, 0.72, { metalness: 0.7 });
    [-1, 1].forEach((side) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.1, 0.18), legMat.clone());
      leg.position.set(side * 0.55, 0, 0);
      leg.rotation.z = side * -0.19;
      tower.add(leg);
    });
    for (let i = 0; i < 5; i += 1) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2 - i * 0.17, 0.08, 0.16), legMat.clone());
      beam.position.y = -1.2 + i * 0.58;
      tower.add(beam);
    }
    tower.position.set(-1.55, 0.1, 0);
    tower.scale.setScalar(0.8);
    root.add(tower);
    this.registerExplorerPart(tower, new THREE.Vector3(-0.8, 0.2, 0), "tower");
    const pyramid = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.75, 4), this.explorerMaterial(0xfbbf24, 0.66, { roughness: 0.55 }));
    pyramid.position.set(0.55, -0.65, 0.1);
    root.add(pyramid);
    this.addExplorerEdges(pyramid);
    this.registerExplorerPart(pyramid, new THREE.Vector3(0.4, -0.2, 0.5), "pyramid");
    const arch = new THREE.Group();
    const archMat = this.explorerMaterial(0xf97316, 0.68, { roughness: 0.62 });
    [-1, 1].forEach((side) => {
      const column = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.8, 0.48), archMat.clone());
      column.position.x = side * 0.62;
      arch.add(column);
    });
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.4, 0.5), archMat.clone());
    top.position.y = 0.88;
    arch.add(top);
    arch.position.set(1.75, -0.28, 0);
    root.add(arch);
    this.registerExplorerPart(arch, new THREE.Vector3(0.85, 0.2, -0.2), "arch");
    root.rotation.x = -0.18;
  }

  setExplorerExhibit(id) {
    this.cancelInteraction();
    this.explorerId = id || "solar-system";
    if (this.explorerModel) {
      this.explorerGroup.remove(this.explorerModel);
      this.explorerModel.traverse((item) => {
        item.geometry?.dispose?.();
        if (Array.isArray(item.material)) item.material.forEach((material) => material.dispose?.());
        else item.material?.dispose?.();
      });
    }
    this.explorerParts = [];
    this.explorerAnimated = [];
    this.explorerModel = new THREE.Group();
    this.explorerGroup.add(this.explorerModel);
    const builders = {
      "solar-system": "buildSolarSystem",
      "earth-moon": "buildEarthMoon",
      motherboard: "buildMotherboard",
      drone: "buildDrone",
      robot: "buildRobot",
      volcano: "buildVolcano",
      cave: "buildCave",
      "world-map": "buildWorldMap",
      landmarks: "buildLandmarks"
    };
    const builder = builders[this.explorerId] || "buildSolarSystem";
    this[builder](this.explorerModel);
    this.explorerModel.userData.baseScale = this.explorerModel.scale.clone();
    this.explorerExploded = false;
    this.explorerFocusedPartId = null;
    this.resetExplorer();
  }

  setExplorerFocus(partId = null) {
    this.explorerFocusedPartId = partId || null;
  }

  setExplorerSimulation(values = {}) {
    this.explorerSimulation = { ...this.explorerSimulation, ...values };
  }

  getExplorerPartAtPointer() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.explorerGroup ? this.raycaster.intersectObject(this.explorerGroup, true) : [];
    const parts = intersections.map((hit) => this.resolveExplorerPart(hit.object)).filter(Boolean);
    if (this.explorerFocusedPartId) {
      const expected = parts.find((part) => part.userData.partId === this.explorerFocusedPartId);
      if (expected) return expected;
    }
    return parts[0] || null;
  }

  setExplorerExploded(enabled) {
    this.explorerExploded = Boolean(enabled);
  }

  setExplorerAnimation(enabled) {
    this.explorerAutoAnimate = Boolean(enabled);
  }

  resetExplorer() {
    if (!this.explorerGroup) return;
    this.explorerGroup.position.set(0, 0, 0);
    this.explorerGroup.rotation.set(0, 0, 0);
    this.explorerGroup.scale.setScalar(1);
    this.explorerModel?.rotation.set(0, 0, 0);
    this.explorerParts.forEach((part) => part.position.copy(part.userData.basePosition || new THREE.Vector3()));
  }

  setExplorerHandInteraction({ x, y, gesture, twoHandDistance = null, roll = null, consumed = false }) {
    if (!this.enabled || this.mode !== "explorer" || consumed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    this.pointer.set(x * 2 - 1, -(y * 2 - 1));
    this.explorerHovered = this.raycastObject();
    const grabbing = ["pinch", "fist", "ok"].includes(gesture?.type);
    if (grabbing && !this.lastGrabGesture && this.explorerHovered) {
      this.grabbed = true;
      this.lastHandRoll = roll;
      const part = this.getExplorerPartAtPointer();
      if (part?.userData?.partId) this.onExplorerSelect(part.userData.partId);
      this.onGrab();
    }
    if (this.grabbed && grabbing) {
      this.moveObjectToPointer();
      if (Number.isFinite(roll) && Number.isFinite(this.lastHandRoll)) {
        let delta = roll - this.lastHandRoll;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        this.explorerGroup.rotation.z += clamp(delta, -0.18, 0.18);
      }
      this.lastHandRoll = roll;
    }
    if (!grabbing && this.lastGrabGesture && this.grabbed) {
      this.grabbed = false;
      this.lastHandRoll = null;
      this.onRelease();
    }
    this.lastGrabGesture = grabbing;
    if (twoHandDistance && twoHandDistance > 0.03) {
      if (!this.initialTwoHandDistance) {
        this.initialTwoHandDistance = twoHandDistance;
        this.initialScale = this.explorerGroup.scale.x;
      }
      const nextScale = clamp(this.initialScale * (twoHandDistance / this.initialTwoHandDistance), 0.35, 2.7);
      this.explorerGroup.scale.setScalar(nextScale);
    } else this.initialTwoHandDistance = null;
    const motion = gesture?.motion?.type;
    if (motion === "rotate_cw") this.explorerGroup.rotation.z -= 0.35;
    if (motion === "rotate_ccw") this.explorerGroup.rotation.z += 0.35;
  }


  createBlocksScene() {
    this.blocksGroup = new THREE.Group();
    this.blocksGroup.visible = false;
    this.scene.add(this.blocksGroup);
    this.blocksPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(7.8, 0.16, 5.4),
      new THREE.MeshStandardMaterial({ color: 0x071827, emissive: 0x003849, emissiveIntensity: .25, roughness: .68, metalness: .28, transparent: true, opacity: .66 })
    );
    base.position.set(0, -2.05, -.42);
    base.rotation.x = -.08;
    base.userData.blocksBase = true;
    this.blocksGroup.add(base);
    this.blocksCursor = new THREE.Mesh(
      new THREE.BoxGeometry(.7, .7, .7),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: .62 })
    );
    this.blocksCursor.visible = false;
    this.blocksGroup.add(this.blocksCursor);
  }

  blockKey(x, y, z = 0) { return `${x}:${y}:${z}`; }

  blockMaterial(type) {
    const info = BLOCK_TYPES[type] || BLOCK_TYPES.earth;
    const material = new THREE.MeshStandardMaterial({
      color: info.color,
      emissive: info.emissive || info.color,
      emissiveIntensity: info.animated === "pulse" ? .82 : info.animated ? .38 : .16,
      roughness: info.roughness ?? .72,
      metalness: info.metalness ?? .08,
      transparent: info.opacity < 1,
      opacity: info.opacity ?? 1,
      depthWrite: (info.opacity ?? 1) > .72,
      side: THREE.DoubleSide
    });
    material.userData.blockType = type;
    material.userData.baseOpacity = info.opacity ?? 1;
    return material;
  }

  createBlockMesh(type, x, y, z = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.68, .68, .68, 2, 2, 2), this.blockMaterial(type));
    mesh.position.set(x * .71, -1.68 + y * .71, z * .71);
    mesh.userData = { blockType: type, grid: { x, y, z }, baseY: mesh.position.y };
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 18),
      new THREE.LineBasicMaterial({ color: type === "lava" ? 0xffd166 : type === "water" ? 0xb9f4ff : 0xd8fbff, transparent: true, opacity: .38 })
    );
    edges.userData.blockEdges = true;
    mesh.add(edges);
    return mesh;
  }

  adjacentBlock(x, y, z = 0) {
    const offsets = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx,dy] of offsets) {
      const key = this.blockKey(x+dx,y+dy,z);
      const block = this.blocks.get(key);
      if (block) return block;
    }
    return null;
  }

  placeBlock(type = this.blocksMaterial, x = 0, y = 0, z = 0, { silent = false } = {}) {
    x = clamp(Math.round(x), -5, 5); y = clamp(Math.round(y), 0, 5); z = clamp(Math.round(z), -1, 1);
    const key = this.blockKey(x,y,z);
    if (this.blocks.has(key)) return null;
    const neighbor = this.adjacentBlock(x,y,z);
    const reaction = neighbor ? getBlockReaction(type, neighbor.userData.blockType) : null;
    let finalType = type;
    if (reaction) {
      finalType = reaction.result;
      const n = neighbor.userData.grid;
      this.removeBlock(n.x,n.y,n.z,{silent:true});
    }
    const mesh = this.createBlockMesh(finalType,x,y,z);
    this.blocks.set(key,mesh); this.blocksGroup.add(mesh);
    if (!silent) this.onBlocksAction({ action: reaction ? "reaction" : "place", material: finalType, requestedMaterial: type, reaction, key, count: this.blocks.size });
    return mesh;
  }

  removeBlock(x, y, z = 0, { silent = false } = {}) {
    const key=this.blockKey(x,y,z); const mesh=this.blocks.get(key); if(!mesh) return false;
    this.blocks.delete(key); this.disposeGroup(mesh); this.blocksGroup.remove(mesh);
    if(!silent) this.onBlocksAction({action:"remove",material:mesh.userData.blockType,key,count:this.blocks.size});
    return true;
  }

  clearBlocks() {
    [...this.blocks.values()].forEach((mesh)=>{ this.blocksGroup.remove(mesh); mesh.traverse((item)=>{item.geometry?.dispose?.();item.material?.dispose?.();}); });
    this.blocks.clear(); this.onBlocksAction({action:"clear",count:0});
  }

  seedBlocks() {
    this.clearBlocks();
    for(let x=-3;x<=3;x+=1) this.placeBlock(x===0?"grass":"earth",x,0,0,{silent:true});
    this.placeBlock("water",-2,1,0,{silent:true}); this.placeBlock("lava",2,1,0,{silent:true});
    this.placeBlock("crystal",0,1,0,{silent:true});
    this.onBlocksAction({action:"seed",count:this.blocks.size});
  }

  setBlocksEnabled(enabled) { if(this.blocksGroup) this.blocksGroup.visible=Boolean(enabled)&&this.mode==="blocks"; }
  setBlocksMaterial(type) { if(BLOCK_TYPES[type]) this.blocksMaterial=type; if(this.blocksCursor?.material) this.blocksCursor.material.color.set(BLOCK_TYPES[this.blocksMaterial].color); }
  setBlocksTool(tool) { if(["place","remove","inspect"].includes(tool)) this.blocksTool=tool; }
  getBlocksSnapshot() { return { count:this.blocks.size, material:this.blocksMaterial, tool:this.blocksTool, scale:this.blocksGroup?.scale.x||1 }; }
  resetBlocks() { this.blocksGroup.position.set(0,0,0);this.blocksGroup.rotation.set(-.08,0,0);this.blocksGroup.scale.setScalar(1); }

  blocksGridAtPointer() {
    this.raycaster.setFromCamera(this.pointer,this.camera);
    if(!this.raycaster.ray.intersectPlane(this.blocksPlane,this.intersection)) return null;
    return {x:clamp(Math.round(this.intersection.x/.71),-5,5),y:clamp(Math.round((this.intersection.y+1.68)/.71),0,5),z:0};
  }

  blockAtPointer() {
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects([...this.blocks.values()],true);
    if(!hits.length) return null;
    let current=hits[0].object; while(current&&current.parent!==this.blocksGroup&&!current.userData?.grid) current=current.parent;
    return current?.userData?.grid?current:null;
  }

  performBlocksAction() {
    const block=this.blockAtPointer();
    if(this.blocksTool==="remove") { if(block){const g=block.userData.grid;this.removeBlock(g.x,g.y,g.z);} return; }
    if(this.blocksTool==="inspect") { if(block){const material=block.userData.blockType;this.onBlocksAction({action:"inspect",material,materialInfo:BLOCK_TYPES[material],key:this.blockKey(block.userData.grid.x,block.userData.grid.y,block.userData.grid.z),count:this.blocks.size});} return; }
    const grid=this.blocksGridAtPointer(); if(grid)this.placeBlock(this.blocksMaterial,grid.x,grid.y,grid.z);
  }

  setBlocksHandInteraction({active=true,x,y,gesture,twoHandDistance=null,roll=null}={}) {
    if(!this.enabled||this.mode!=="blocks") return;
    if(!active||!Number.isFinite(x)||!Number.isFinite(y)){this.blocksCursor.visible=false;this.blocksLastGesture=false;return;}
    this.pointer.set(x*2-1,-(y*2-1));
    const grid=this.blocksGridAtPointer();
    if(grid){this.blocksCursor.visible=true;this.blocksCursor.position.set(grid.x*.71,-1.68+grid.y*.71,grid.z*.71);}
    const acting=["pinch","fist","ok"].includes(gesture?.type);
    if(acting&&!this.blocksLastGesture) this.performBlocksAction();
    this.blocksLastGesture=acting;
    if(twoHandDistance&&twoHandDistance>.035){
      if(!this.blocksInitialDistance){this.blocksInitialDistance=twoHandDistance;this.blocksInitialScale=this.blocksGroup.scale.x;}
      this.blocksGroup.scale.setScalar(clamp(this.blocksInitialScale*(twoHandDistance/this.blocksInitialDistance),.55,2.1));
    } else this.blocksInitialDistance=null;
    if(Number.isFinite(roll)&&Number.isFinite(this.blocksLastRoll)) this.blocksGroup.rotation.z+=clamp(roll-this.blocksLastRoll,-.08,.08);
    this.blocksLastRoll=roll;
  }

  setVisualTheme(theme="neon") {
    const themes={
      neon:{primary:0x00e5ff,secondary:0x8b5cf6,particle:0x7defff,exposure:1.02},
      cosmic:{primary:0xc084fc,secondary:0x22d3ee,particle:0xf0abfc,exposure:1.14},
      matrix:{primary:0x22c55e,secondary:0x0ea5e9,particle:0x86efac,exposure:.96},
      amber:{primary:0xf59e0b,secondary:0xef4444,particle:0xfde68a,exposure:1.05},
      minimal:{primary:0x94a3b8,secondary:0x38bdf8,particle:0xcbd5e1,exposure:.9}
    };
    const selected=themes[theme]||themes.neon; this.visualTheme=theme;
    this.renderer.toneMappingExposure=selected.exposure;
    this.rings?.forEach((ring,index)=>ring.material.color.set(index%2?selected.secondary:selected.primary));
    if(this.particles?.material)this.particles.material.color.set(selected.particle);
    if(this.grid?.material)this.grid.material.color?.set?.(selected.secondary);
  }

  createFaceReactor() {
    this.faceGroup = new THREE.Group();
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x004d61,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.72,
      roughness: 0.08,
      metalness: 0.48
    });
    this.faceOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 4), orbMaterial);
    this.faceGroup.add(this.faceOrb);
    this.faceWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.62, 2),
      new THREE.MeshBasicMaterial({ color: 0xbffaff, wireframe: true, transparent: true, opacity: 0.2 })
    );
    this.faceGroup.add(this.faceWire);
    this.faceRings = [];
    for (let index = 0; index < 4; index += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.9 + index * 0.22, 0.018, 5, 90),
        new THREE.MeshBasicMaterial({ color: index % 2 ? 0xff4fd8 : 0x00e5ff, transparent: true, opacity: 0.34 })
      );
      ring.rotation.set(index * 0.42, Math.PI / 2 + index * 0.28, 0);
      this.faceRings.push(ring);
      this.faceGroup.add(ring);
    }
    this.faceGroup.visible = false;
    this.scene.add(this.faceGroup);
  }

  createParticles() {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }
    const count = QUALITY_PROFILES[this.quality]?.particles || 170;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const radius = 3 + Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 7;
      positions[index * 3 + 2] = Math.sin(angle) * radius - 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x7defff,
      size: this.quality === "high" ? 0.03 : 0.024,
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.totalCount = count;
    this.scene.add(this.particles);
    this.applyParticleBudget();
  }

  bindPointer() {
    const updatePointer = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this.canvas.addEventListener("pointerdown", (event) => {
      if (!this.enabled || !["sandbox", "explorer", "blocks"].includes(this.mode)) return;
      updatePointer(event);
      this.mouseDown = true;
      this.canvas.setPointerCapture?.(event.pointerId);
      if (this.mode === "blocks") { this.performBlocksAction(); return; }
      if (this.raycastObject()) {
        this.grabbed = true;
        if (this.mode === "explorer") {
          const part = this.getExplorerPartAtPointer();
          if (part?.userData?.partId) this.onExplorerSelect(part.userData.partId);
        }
        this.onGrab();
      }
    });
    this.canvas.addEventListener("pointermove", (event) => {
      updatePointer(event);
      if (this.mouseDown && this.grabbed) this.moveObjectToPointer();
    });
    const end = () => {
      if (this.grabbed) this.onRelease();
      this.mouseDown = false;
      this.grabbed = false;
    };
    this.canvas.addEventListener("pointerup", end);
    this.canvas.addEventListener("pointercancel", end);
    this.canvas.addEventListener("wheel", (event) => {
      if (!this.enabled || !["sandbox", "explorer", "blocks"].includes(this.mode)) return;
      event.preventDefault();
      const active = this.mode === "explorer" ? this.explorerGroup : this.mode === "blocks" ? this.blocksGroup : this.objectGroup;
      const scale = clamp(active.scale.x - event.deltaY * 0.0012, 0.35, 2.7);
      active.scale.setScalar(scale);
    }, { passive: false });
  }

  raycastObject() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const target = this.mode === "explorer" ? this.explorerGroup : this.core;
    const intersections = target ? this.raycaster.intersectObject(target, this.mode === "explorer") : [];
    if (this.mode === "explorer") this.explorerHoveredPart = intersections.length ? this.resolveExplorerPart(intersections[0].object) : null;
    return Boolean(intersections.length);
  }

  moveObjectToPointer() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection)) {
      const active = this.mode === "explorer" ? this.explorerGroup : this.objectGroup;
      if (!active) return;
      active.position.x = clamp(this.intersection.x, -4.1, 4.1);
      active.position.y = clamp(this.intersection.y, -2.1, 2.5);
    }
  }

  setHandInteraction({ x, y, gesture, twoHandDistance = null, roll = null, consumed = false }) {
    if (!this.enabled || this.mode !== "sandbox" || consumed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    this.pointer.set(x * 2 - 1, -(y * 2 - 1));
    this.hovered = this.raycastObject();
    const grabbing = ["pinch", "fist", "ok"].includes(gesture?.type);
    if (grabbing && !this.lastGrabGesture && this.hovered) {
      this.grabbed = true;
      this.lastHandRoll = roll;
      this.onGrab();
    }
    if (this.grabbed && grabbing) {
      this.moveObjectToPointer();
      if (Number.isFinite(roll) && Number.isFinite(this.lastHandRoll)) {
        let delta = roll - this.lastHandRoll;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        this.objectGroup.rotation.z += clamp(delta, -0.18, 0.18);
      }
      this.lastHandRoll = roll;
    }
    if (!grabbing && this.lastGrabGesture && this.grabbed) {
      this.grabbed = false;
      this.lastHandRoll = null;
      this.onRelease();
    }
    this.lastGrabGesture = grabbing;

    if (twoHandDistance && twoHandDistance > 0.03) {
      if (!this.initialTwoHandDistance) {
        this.initialTwoHandDistance = twoHandDistance;
        this.initialScale = this.objectGroup.scale.x;
      }
      const nextScale = clamp(this.initialScale * (twoHandDistance / this.initialTwoHandDistance), 0.45, 2.4);
      this.objectGroup.scale.setScalar(nextScale);
    } else this.initialTwoHandDistance = null;

    const motion = gesture?.motion?.type;
    if (motion === "rotate_cw") this.objectGroup.rotation.z -= 0.35;
    if (motion === "rotate_ccw") this.objectGroup.rotation.z += 0.35;
  }

  updateFace(metrics = {}) {
    this.faceState = { ...this.faceState, ...metrics, blink: Math.max(metrics.blinkLeft || 0, metrics.blinkRight || 0) };
  }

  cancelInteraction() {
    if (this.grabbed) this.onRelease();
    this.grabbed = false;
    this.hovered = false;
    this.explorerHovered = false;
    this.lastGrabGesture = false;
    this.initialTwoHandDistance = null;
    this.lastHandRoll = null;
  }

  setMode(mode) {
    this.cancelInteraction();
    this.mode = mode;
    this.enabled = mode === "sandbox" || mode === "explorer" || mode === "blocks" || mode === "face";
    this.objectGroup.visible = mode === "sandbox";
    this.explorerGroup.visible = mode === "explorer";
    this.blocksGroup.visible = mode === "blocks";
    this.faceGroup.visible = mode === "face";
    this.rings.forEach((ring) => { ring.visible = mode === "sandbox" || mode === "explorer" || mode === "blocks"; });
    this.grid.visible = this.enabled;
    this.applyParticleBudget();
    this.canvas.style.pointerEvents = ["sandbox", "explorer", "blocks"].includes(mode) ? "auto" : "none";
    if (!this.enabled) this.renderer.clear();
  }

  setObjectType(type) {
    if (!['cube', 'sphere', 'pyramid', 'torus', 'cylinder'].includes(type) || type === this.objectType) return;
    this.objectType = type;
    this.createObject();
  }

  setColor(color) {
    this.currentColor = new THREE.Color(color);
    if (!this.coreMaterial) return;
    this.coreMaterial.color.copy(this.currentColor);
    this.coreMaterial.emissive.copy(this.currentColor).multiplyScalar(0.32);
  }

  cycleColor(direction = 1) {
    const colors = ["#00e5ff", "#a855f7", "#22c55e", "#f97316", "#ff4fd8"];
    const current = `#${(this.currentColor || new THREE.Color("#00e5ff")).getHexString()}`;
    let index = colors.findIndex((color) => color.toLowerCase() === current.toLowerCase());
    index = (index + direction + colors.length) % colors.length;
    this.setColor(colors[index]);
    return colors[index];
  }

  setAutoRotate(enabled) {
    this.autoRotate = Boolean(enabled);
  }

  reset() {
    if (this.mode === "explorer") {
      this.resetExplorer();
      return;
    }
    this.objectGroup.position.set(0, 0, 0);
    this.objectGroup.rotation.set(0, 0, 0);
    this.objectGroup.scale.setScalar(1);
  }

  setDynamicPixelRatioScale(scale) {
    this.dynamicPixelRatioScale = clamp(scale, 0.58, 1);
    this.resize();
  }

  applyParticleBudget() {
    if (!this.particles?.geometry) return;
    const total = this.particles.userData.totalCount || this.particles.geometry.getAttribute("position")?.count || 0;
    const visible = Math.max(0, Math.floor(total * this.particleBudgetScale));
    this.particles.geometry.setDrawRange(0, visible);
    this.particles.visible = this.enabled && visible > 0;
  }

  setPerformanceLevel(level = 0) {
    this.performanceLevel = clamp(Math.round(level), 0, 4);
    const particleScales = [1, .72, .42, .2, .08];
    const ringOpacity = [1, .82, .58, .34, .18][this.performanceLevel];
    this.particleBudgetScale = particleScales[this.performanceLevel];
    this.applyParticleBudget();
    this.rings?.forEach((ring) => { ring.material.opacity = .28 * ringOpacity; });
    this.grid.material.opacity = .2 * Math.max(.48, ringOpacity);
    this.blocks?.forEach?.((mesh)=>mesh.children.filter((item)=>item.userData?.blockEdges).forEach((edges)=>{edges.visible=this.performanceLevel<3;}));
  }

  setRenderTargetFps(fps = 0) {
    const value = Number(fps);
    this.renderFpsOverride = Number.isFinite(value) && value >= 24 ? Math.min(240, value) : 0;
  }

  setQuality(quality) {
    this.quality = quality;
    this.createParticles();
    this.setPerformanceLevel(this.performanceLevel);
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const base = QUALITY_PROFILES[this.quality]?.pixelRatio || 1.1;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, base * this.dynamicPixelRatioScale));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  animate(now) {
    requestAnimationFrame(this.animate);
    if (!this.enabled || document.hidden) return;
    const profile = QUALITY_PROFILES[this.quality];
    const frameInterval = 1000 / (this.renderFpsOverride || profile?.renderFps || 45);
    if (now - this.lastRenderAt < frameInterval) return;
    this.lastRenderAt = now;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    if (this.mode === "sandbox") {
      if (this.autoRotate && !this.grabbed) {
        this.objectGroup.rotation.y += delta * 0.42;
        this.objectGroup.rotation.x += delta * 0.16;
      }
      const inner = this.objectGroup.getObjectByName("inner");
      if (inner) {
        inner.rotation.x -= delta * 0.65;
        inner.rotation.y += delta * 0.85;
      }
      const targetScale = this.grabbed ? 1.045 : this.hovered ? 1.025 : 1;
      this.targetScaleVector.setScalar(targetScale);
      this.core.scale.lerp(this.targetScaleVector, 0.12);
    } else if (this.mode === "explorer") {
      if (this.explorerAutoAnimate && !this.grabbed) this.explorerGroup.rotation.y += delta * 0.22;
      this.explorerParts.forEach((part) => {
        const base = part.userData.basePosition || new THREE.Vector3();
        const explode = part.userData.explodeVector || new THREE.Vector3();
        const target = base.clone().add(this.explorerExploded ? explode : new THREE.Vector3());
        part.position.lerp(target, 0.095);
        const baseScale = part.userData.baseScale || new THREE.Vector3(1, 1, 1);
        const focused = Boolean(this.explorerFocusedPartId && part.userData.partId === this.explorerFocusedPartId);
        const hovered = part === this.explorerHoveredPart;
        const scale = focused ? 1.16 + Math.sin(elapsed * 3.2) * 0.035 : hovered ? 1.07 : 1;
        part.scale.lerp(this.targetScaleVector.copy(baseScale).multiplyScalar(scale), 0.12);
      });
      const volcanoPressure = this.explorerId === "volcano" ? 0.55 + (this.explorerSimulation.pressure || 0) / 70 : 1;
      const volcanoTemperature = this.explorerId === "volcano" ? 0.65 + (this.explorerSimulation.temperature || 0) / 80 : 1;
      this.explorerAnimated.forEach((item, index) => {
        if (!this.explorerAutoAnimate) return;
        const activitySpeed = this.explorerId === "volcano" ? volcanoPressure : 1;
        if (item.type === "orbit") item.object.rotation.y += delta * item.speed * activitySpeed;
        if (item.type === "spin") item.object.rotation.y += delta * item.speed * activitySpeed;
        if (item.type === "spinReverse") item.object.rotation.y -= delta * item.speed * activitySpeed;
        if (item.type === "spinY") item.object.rotation.y += delta * item.speed * activitySpeed;
        if (item.type === "spinZ") item.object.rotation.z += delta * item.speed * activitySpeed;
        if (item.type === "pulse") {
          const scale = 1 + Math.sin(elapsed * item.speed * activitySpeed + index) * 0.06 * volcanoTemperature;
          item.object.scale.setScalar(scale);
        }
        if (item.type === "rise") {
          item.object.position.y = Math.sin(elapsed * item.speed) * 0.18;
          item.object.rotation.y += delta * 0.08;
        }
      });
      const hoverScale = this.grabbed ? 1.035 : this.explorerHovered ? 1.018 : 1;
      if (this.explorerModel) {
        const base = this.explorerModel.userData.baseScale || new THREE.Vector3(1, 1, 1);
        this.targetScaleVector.copy(base).multiplyScalar(hoverScale);
        this.explorerModel.scale.lerp(this.targetScaleVector, 0.1);
      }
    } else if (this.mode === "blocks") {
      this.blocks.forEach((block,index)=>{
        const info=BLOCK_TYPES[block.userData.blockType];
        if(info?.animated==="pulse"){block.material.emissiveIntensity=.65+Math.sin(elapsed*3+index)*.22;}
        if(info?.animated==="wave"){block.position.y=block.userData.baseY+Math.sin(elapsed*2.1+index*.7)*.018;block.material.opacity=(info.opacity||.58)+Math.sin(elapsed*2+index)*.035;}
        if(info?.animated==="shimmer"){block.rotation.y+=delta*.12;block.material.emissiveIntensity=.28+Math.sin(elapsed*2.8+index)*.16;}
      });
      if(this.blocksCursor?.visible){this.blocksCursor.rotation.x+=delta*.55;this.blocksCursor.rotation.y+=delta*.75;}
    } else if (this.mode === "face") {
      const state = this.faceState;
      const scale = 1 + (state.jawOpen || 0) * 0.45 + (state.browUp || 0) * 0.08;
      this.faceOrb.scale.lerp(this.targetScaleVector.setScalar(scale), 0.15);
      this.faceGroup.rotation.z += ((state.headRoll || 0) - this.faceGroup.rotation.z) * 0.12;
      this.faceGroup.rotation.x += ((state.headPitch || 0) - this.faceGroup.rotation.x) * 0.11;
      const yawTarget = (state.headYaw || 0) + Math.sin(elapsed * 0.38) * 0.035;
      this.faceGroup.rotation.y += (yawTarget - this.faceGroup.rotation.y) * 0.11;
      this.faceWire.rotation.z += delta * (0.08 + (state.smile || 0) * 0.22);
      const hue = 0.52 + (state.smile || 0) * 0.28;
      this.faceOrb.material.color.setHSL(hue % 1, 0.85, 0.55);
      this.faceOrb.material.emissive.copy(this.faceOrb.material.color).multiplyScalar(0.35 + (state.blink || 0) * 0.8);
      this.faceOrb.material.emissiveIntensity = 1 + (state.blink || 0) * 2.4;
      this.faceWire.rotation.x -= delta * 0.35;
      this.faceWire.rotation.y += delta * 0.5;
      this.faceRings.forEach((ring, index) => {
        ring.rotation.z += delta * (0.16 + index * 0.05) * (index % 2 ? -1 : 1);
        ring.material.opacity = 0.22 + (state.jawOpen || 0) * 0.28 + Math.sin(elapsed * 1.8 + index) * 0.05;
      });
    }

    this.rings.forEach((ring, index) => {
      ring.rotation.z += delta * (0.08 + index * 0.05) * (index % 2 ? -1 : 1);
      ring.material.opacity = 0.2 + Math.sin(elapsed * 1.6 + index) * 0.06;
    });
    this.particles.rotation.y += delta * 0.012;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver?.disconnect();
    this.disposeGroup(this.objectGroup);
    this.disposeGroup(this.explorerGroup);
    this.disposeGroup(this.blocksGroup);
    this.disposeGroup(this.faceGroup);
    this.renderer.dispose();
  }
}
