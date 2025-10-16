import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createShelf } from '@scripts/shelf';
import { exportShelfJSON } from '@scripts/export';

// ====== Container e Renderer ======
const container: HTMLElement | null = document.getElementById('shelf-container');
if (!container) throw new Error('Container não encontrado!');

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
container.appendChild(renderer.domElement);

// ====== Scene e Câmera ======
const scene: THREE.Scene = new THREE.Scene();
scene.background = new THREE.Color(0xececec);

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, 1, 1, 10000);

// ====== OrbitControls ======
const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// ====== Material ======
const woodMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b5a2b,
  metalness: 0.25,
  roughness: 0.8
});

// ====== Helpers de UI ======
type Dims = { W: number; P: number; H: number; E: number };

const widthInput = document.getElementById('width') as HTMLInputElement | null;
const depthInput = document.getElementById('depth') as HTMLInputElement | null;
const heightInput = document.getElementById('height') as HTMLInputElement | null;
const thicknessInput = document.getElementById('thickness') as HTMLInputElement | null;
const updateBtn = document.getElementById('update-shelf') as HTMLButtonElement | null;
const exportBtn = document.getElementById('export-shelf') as HTMLButtonElement | null;
const infoEl = document.getElementById('info') as HTMLElement | null;

function readNumber(input: HTMLInputElement | null, fallback: number): number {
  if (!input) return fallback;
  const v = input.valueAsNumber;
  return Number.isFinite(v) ? v : fallback; // sem min/max
}

function getDimsFromInputs(): Dims {
  // Fallbacks com os valores iniciais dos inputs no HTML
  const W = readNumber(widthInput, 800);
  const P = readNumber(depthInput, 500);
  const H = readNumber(heightInput, 1600);
  const E = readNumber(thicknessInput, 18);
  return { W, P, H, E };
}

// Evita shelfWidth negativo (width - 2*thickness) e valores inválidos
function sanitizeDims(d: Dims): Dims {
  const W = Math.max(1, d.W || 1);
  const P = Math.max(1, d.P || 1);
  const H = Math.max(1, d.H || 1);
  let E = Math.max(1, d.E || 1);
  // Garante que (W - 2*E) >= 1mm
  const eMaxByW = Math.max(1, W / 2 - 0.5);
  E = Math.min(E, eMaxByW);
  return { W, P, H, E };
}

function positionCamera(d: Dims) {
  camera.position.set(d.W * 1.5, d.H * 0.8, d.P * 3.5);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
}

function updateInfo(d: Dims) {
  if (!infoEl) return;
  infoEl.textContent = `Armário: ${d.W}×${d.P}×${d.H} mm — espessura: ${d.E} mm — arraste para rotacionar`;
}

// ====== Limpeza e rebuild ======
let cabinet: THREE.Group | null = null;

function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((o: THREE.Object3D) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose?.();
    }
    const mat = (mesh as any).material;
    if (Array.isArray(mat)) {
      mat.forEach(m => m?.dispose?.());
    } else {
      mat?.dispose?.();
    }
  });
}

function removeHoleMarkers() {
  const toRemove: THREE.Object3D[] = [];
  scene.traverse(o => {
    if ((o as any).userData?.isHoleMarker) toRemove.push(o);
  });
  for (const o of toRemove) {
    scene.remove(o);
    disposeObject3D(o);
  }
}

function rebuildShelf() {
  // Ler e sanitizar dimensões atuais
  const raw = getDimsFromInputs();
  const dims = sanitizeDims(raw);

  // Refletir dimensões saneadas nos inputs
  if (widthInput) widthInput.value = String(dims.W);
  if (depthInput) depthInput.value = String(dims.P);
  if (heightInput) heightInput.value = String(dims.H);
  if (thicknessInput) thicknessInput.value = String(dims.E);

  // Remover furos antigos
  removeHoleMarkers();

  // Remover e liberar o armário anterior
  if (cabinet) {
    scene.remove(cabinet);
    disposeObject3D(cabinet);
    cabinet = null;
  }

  // Criar e adicionar novo armário
  cabinet = createShelf(dims.W, dims.P, dims.H, dims.E, woodMaterial, scene);
  scene.add(cabinet);

  // Ajustar câmera e atualizar infos
  positionCamera(dims);
  updateInfo(dims);
}

// ====== Iluminação ======
const amb: THREE.AmbientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(amb);

const dir: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
dir.position.set(500, 1000, 500);
scene.add(dir);

// ====== Responsividade ======
function updateRendererSize(): void {
  if (!container) return;
  const width: number = container.clientWidth;
  const height: number = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', updateRendererSize);
updateRendererSize();

// ====== Inicialização ======
rebuildShelf();

// Atualizar ao clicar no botão
if (updateBtn) {
  updateBtn.addEventListener('click', () => {
    rebuildShelf();
  });
}

// Exportar JSON ao clicar no botão
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    exportShelfJSON(scene);
  });
}

// ====== Render loop ======
function animate(): void {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();