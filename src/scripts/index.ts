import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createShelf } from '@scripts/shelf';

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

function clampNum(v: number, min?: number, max?: number) {
  let x = v;
  if (!Number.isFinite(x)) x = v || 0;
  if (min !== undefined) x = Math.max(x, Number(min));
  if (max !== undefined) x = Math.min(x, Number(max));
  return x;
}

function readNumber(input: HTMLInputElement | null, fallback: number): number {
  if (!input) return fallback;
  const v = input.valueAsNumber;
  const min = input.min !== '' ? Number(input.min) : undefined;
  const max = input.max !== '' ? Number(input.max) : undefined;
  return clampNum(Number.isFinite(v) ? v : fallback, min, max);
}

function getDimsFromInputs(): Dims {
  // Fallbacks batem com os valores iniciais dos inputs no HTML
  const W = readNumber(widthInput, 800);
  const P = readNumber(depthInput, 500);
  const H = readNumber(heightInput, 1600);
  const E = readNumber(thicknessInput, 18);
  return { W, P, H, E };
}

function positionCamera(d: Dims) {
  camera.position.set(d.W * 1.5, d.H * 0.8, d.P * 3.5);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
}

// ====== Limpeza e rebuild ======
let cabinet: THREE.Group | null = null;

function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((o: THREE.Object3D) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose?.();
    }
    // material pode ser array
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
  // Ler dimensões atuais
  const dims = getDimsFromInputs();

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

  // Ajustar câmera
  positionCamera(dims);
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
// Renderizar inicialmente com os valores já presentes nos inputs
rebuildShelf();

// Atualizar ao clicar no botão
if (updateBtn) {
  updateBtn.addEventListener('click', () => {
    rebuildShelf();
  });
}

// ====== Render loop ======
function animate(): void {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();