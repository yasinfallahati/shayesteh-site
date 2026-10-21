// Hero WebGL scene: a gold torus-knot core, a wireframe shell, two identical
// satellites (one per product, so neither is favoured) and a dust field.
// Returns null when WebGL is unavailable so the static hero stays in place.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const GOLD = 0xc8a96a;
const IVORY = 0xf5f1e8;
const LERP = 0.08; // per 1/60 s; converted to a framerate-independent factor below

export function initHero(canvas, { mobile }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !mobile,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }

  const hero = canvas.parentElement;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Metals need an environment map or they render as black blobs.
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key);

  const core = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.9, 0.28, mobile ? 128 : 220, mobile ? 18 : 32),
    new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.2 }),
  );
  scene.add(core);

  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.1, 1)),
    new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.16 }),
  );
  scene.add(shell);

  // Same geometry and material on both: they are mirror images, never ranked.
  const satGeo = new THREE.SphereGeometry(0.34, 48, 32);
  const satMat = new THREE.MeshStandardMaterial({ color: IVORY, metalness: 0.9, roughness: 0.18 });
  const satA = new THREE.Mesh(satGeo, satMat);
  const satB = new THREE.Mesh(satGeo, satMat);
  scene.add(satA, satB);

  const count = mobile ? 600 : 2000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.6 + Math.random() * 2.2;
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    positions[i * 3] = r * s * Math.cos(t);
    positions[i * 3 + 1] = r * u * 0.7;
    positions[i * 3 + 2] = r * s * Math.sin(t);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: GOLD,
      size: 0.022,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(dust);

  const state = { p: 0, pT: 0, x: 0, y: 0, xT: 0, yT: 0 };
  const onProgress = (e) => { state.pT = e.detail; };
  const finePointer = !mobile && matchMedia('(pointer: fine)').matches;
  const onPointer = (e) => {
    const r = hero.getBoundingClientRect();
    state.xT = ((e.clientX - r.left) / r.width - 0.5) * 2;
    state.yT = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  document.addEventListener('hero:progress', onProgress);
  if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true });

  // On desktop the object sits left of centre, opposite the RTL text column.
  const layout = () => {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const shift = !mobile && w > 900 ? w * 0.3 : 0;
    camera.setViewOffset(w, h, shift, 0, w, h);
    camera.updateProjectionMatrix();
  };
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(hero);

  const clock = new THREE.Clock();
  const frame = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const k = 1 - Math.pow(1 - LERP, dt * 60);
    state.p += (state.pT - state.p) * k;
    state.x += (state.xT - state.x) * k;
    state.y += (state.yT - state.y) * k;

    core.rotation.x = t * 0.18 + state.p * 1.4;
    core.rotation.y = t * 0.12 + state.y * 0.25;
    shell.rotation.y = -t * 0.05 + state.x * 0.2;
    shell.rotation.x = state.p * 0.6;
    dust.rotation.y = t * 0.025;

    const a = t * 0.35;
    satA.position.set(Math.cos(a) * 1.5, Math.sin(a * 0.5) * 0.35, Math.sin(a) * 1.5);
    satB.position.copy(satA.position).negate();

    camera.position.z = 7 - state.p * 1.6;
    camera.position.x = state.x * 0.25;
    camera.position.y = -state.y * 0.15;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  };

  // Render only while the hero is on screen. Observe the hero, not the canvas:
  // the canvas is display:none until body.gl is set.
  const stop = () => renderer.setAnimationLoop(null);
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) renderer.setAnimationLoop(frame);
    else stop();
  });
  io.observe(hero);
  document.body.classList.add('gl');

  // On context loss, drop back to the static hero instead of a blank canvas.
  const onLost = (e) => {
    e.preventDefault();
    stop();
    document.body.classList.remove('gl');
  };
  canvas.addEventListener('webglcontextlost', onLost);

  return {
    dispose() {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('hero:progress', onProgress);
      window.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('webglcontextlost', onLost);
      renderer.dispose();
    },
  };
}
