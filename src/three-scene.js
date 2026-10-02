import * as THREE from 'three';

// A rotating 3D "neural network" — nodes in space connected by edges when close
// enough to each other. Reacts to mouse position (camera parallax) and is a genuine
// WebGL/3D scene (real perspective, real depth, real lighting) rather than a flat
// 2D canvas trick.
export function initNeuralScene(canvas, container) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const group = new THREE.Group();
  scene.add(group);

  // ---- Nodes ----
  const NODE_COUNT = 46;
  const RADIUS = 6.4;
  const positions = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    // distribute roughly within a sphere volume
    const v = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize().multiplyScalar(RADIUS * (0.35 + Math.random() * 0.65));
    positions.push(v);
  }

  const palette = [0xb983ff, 0xff9ecd, 0x6ff0e0, 0x8e5ce0];

  // glow sprite texture for points, generated procedurally (no external assets)
  function makeGlowTexture() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
  const glowTex = makeGlowTexture();

  const nodeGeo = new THREE.BufferGeometry();
  const nodeArr = new Float32Array(NODE_COUNT * 3);
  const colorArr = new Float32Array(NODE_COUNT * 3);
  positions.forEach((p, i) => {
    nodeArr[i * 3] = p.x; nodeArr[i * 3 + 1] = p.y; nodeArr[i * 3 + 2] = p.z;
    const c = new THREE.Color(palette[i % palette.length]);
    colorArr[i * 3] = c.r; colorArr[i * 3 + 1] = c.g; colorArr[i * 3 + 2] = c.b;
  });
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodeArr, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

  const nodeMat = new THREE.PointsMaterial({
    size: 0.34,
    map: glowTex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(nodeGeo, nodeMat);
  group.add(points);

  // ---- Edges (connect nearby nodes) ----
  const EDGE_THRESHOLD = 4.6;
  const edgeVerts = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      if (positions[i].distanceTo(positions[j]) < EDGE_THRESHOLD) {
        edgeVerts.push(positions[i].x, positions[i].y, positions[i].z);
        edgeVerts.push(positions[j].x, positions[j].y, positions[j].z);
      }
    }
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xb983ff, transparent: true, opacity: 0.18 });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  group.add(edges);

  // subtle ambient point light for depth cues (mostly cosmetic since materials are unlit-ish)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // ---- Interaction: mouse parallax ----
  let targetRotX = 0, targetRotY = 0;
  let curRotX = 0, curRotY = 0;
  window.addEventListener('mousemove', (e) => {
    const r = container.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    targetRotY = nx * 0.5;
    targetRotX = -ny * 0.3;
  });

  function resize() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let autoRotate = 0;
  function animate() {
    autoRotate += 0.0018;
    curRotX += (targetRotX - curRotX) * 0.04;
    curRotY += (targetRotY - curRotY) * 0.04;
    group.rotation.x = curRotX + Math.sin(autoRotate * 0.6) * 0.08;
    group.rotation.y = autoRotate + curRotY;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  return { renderer, camera, scene, group };
}

// A single glowing wireframe icosahedron that slowly tumbles in 3D and tilts
// toward the mouse — used as a smaller 3D accent elsewhere on the page (e.g. Contact).
export function initFloatingShape(canvas, container, colorHex = 0xb983ff) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 6.5);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const geo = new THREE.IcosahedronGeometry(2.1, 1);
  const wire = new THREE.WireframeGeometry(geo);
  const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.55 });
  const mesh = new THREE.LineSegments(wire, mat);
  scene.add(mesh);

  const innerMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.04 });
  const inner = new THREE.Mesh(geo, innerMat);
  scene.add(inner);

  let targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0, t = 0;
  window.addEventListener('mousemove', (e) => {
    const r = container.getBoundingClientRect();
    if (e.clientY < r.top - 200 || e.clientY > r.bottom + 200) return;
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    targetRotY = nx * 0.6;
    targetRotX = -ny * 0.4;
  });

  function resize() {
    const w = container.offsetWidth || 200;
    const h = container.offsetHeight || 200;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function animate() {
    t += 0.004;
    curRotX += (targetRotX - curRotX) * 0.05;
    curRotY += (targetRotY - curRotY) * 0.05;
    mesh.rotation.x = t * 0.5 + curRotX;
    mesh.rotation.y = t + curRotY;
    inner.rotation.copy(mesh.rotation);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  return { renderer, camera, scene, mesh };
}
