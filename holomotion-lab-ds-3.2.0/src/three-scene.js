import * as THREE from "three";
import { QUALITY_PROFILES } from "./config.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class HoloScene {
  constructor(canvas, { quality = "balanced", onGrab = () => {}, onRelease = () => {} } = {}) {
    this.canvas = canvas;
    this.quality = quality;
    this.onGrab = onGrab;
    this.onRelease = onRelease;
    this.mode = "sandbox";
    this.enabled = true;
    this.autoRotate = true;
    this.grabbed = false;
    this.hovered = false;
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
    this.targetScaleVector = new THREE.Vector3(1, 1, 1);
    this.dynamicPixelRatioScale = 1;
    this.faceState = { jawOpen: 0, smile: 0, blink: 0, browUp: 0, headRoll: 0 };

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
    this.scene.add(this.particles);
  }

  bindPointer() {
    const updatePointer = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    this.canvas.addEventListener("pointerdown", (event) => {
      if (!this.enabled || this.mode !== "sandbox") return;
      updatePointer(event);
      this.mouseDown = true;
      this.canvas.setPointerCapture?.(event.pointerId);
      if (this.raycastObject()) {
        this.grabbed = true;
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
      if (!this.enabled || this.mode !== "sandbox") return;
      event.preventDefault();
      const scale = clamp(this.objectGroup.scale.x - event.deltaY * 0.0012, 0.45, 2.4);
      this.objectGroup.scale.setScalar(scale);
    }, { passive: false });
  }

  raycastObject() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObject(this.core, false).length > 0;
  }

  moveObjectToPointer() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersection)) {
      this.objectGroup.position.x = clamp(this.intersection.x, -4.1, 4.1);
      this.objectGroup.position.y = clamp(this.intersection.y, -2.1, 2.5);
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
    this.lastGrabGesture = false;
    this.initialTwoHandDistance = null;
    this.lastHandRoll = null;
  }

  setMode(mode) {
    this.mode = mode;
    this.enabled = mode === "sandbox" || mode === "face";
    this.objectGroup.visible = mode === "sandbox";
    this.faceGroup.visible = mode === "face";
    this.rings.forEach((ring) => { ring.visible = mode === "sandbox"; });
    this.grid.visible = this.enabled;
    this.particles.visible = this.enabled;
    this.canvas.style.pointerEvents = mode === "sandbox" ? "auto" : "none";
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
    this.objectGroup.position.set(0, 0, 0);
    this.objectGroup.rotation.set(0, 0, 0);
    this.objectGroup.scale.setScalar(1);
  }

  setDynamicPixelRatioScale(scale) {
    this.dynamicPixelRatioScale = clamp(scale, 0.65, 1);
    this.resize();
  }

  setQuality(quality) {
    this.quality = quality;
    this.createParticles();
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
    const frameInterval = 1000 / (profile?.renderFps || 45);
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
    } else if (this.mode === "face") {
      const state = this.faceState;
      const scale = 1 + (state.jawOpen || 0) * 0.45 + (state.browUp || 0) * 0.08;
      this.faceOrb.scale.lerp(this.targetScaleVector.setScalar(scale), 0.15);
      this.faceGroup.rotation.z += ((state.headRoll || 0) - this.faceGroup.rotation.z) * 0.12;
      this.faceGroup.rotation.y += delta * (0.18 + (state.smile || 0) * 0.65);
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
    this.disposeGroup(this.faceGroup);
    this.renderer.dispose();
  }
}
