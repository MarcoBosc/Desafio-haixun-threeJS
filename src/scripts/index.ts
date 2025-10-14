import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createShelf } from '@scripts/shelf';

// ====== DIMENSÕES INICIAIS (mm) ======
const W: number = 800; // Largura
const P: number = 500; // Profundidade
const H: number = 1600; // Altura
const E: number = 18;   // Espessura

// ====== Container e Renderer ======
const container: HTMLElement | null = document.getElementById('shelf-container');
if (!container) throw new Error('Container não encontrado!');

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
container.appendChild(renderer.domElement);

// ====== Scene e Câmera ======
const scene: THREE.Scene = new THREE.Scene();
scene.background = new THREE.Color(0xececec);

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
camera.position.set(W * 1.5, H * 0.8, P * 3.5);
camera.lookAt(0, H / 2, 0);

// ====== OrbitControls ======
const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// ====== Helpers ======
const axes: THREE.AxesHelper = new THREE.AxesHelper(300);
scene.add(axes);

const grid: THREE.GridHelper = new THREE.GridHelper(1200, 24, 0x999999, 0xdddddd);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

// ====== Material ======
const woodMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b5a2b,
  metalness: 0.25,
  roughness: 0.8
});

// ====== Criar o armário ======
const cabinet: THREE.Group = createShelf(W, P, H, E, woodMaterial);
scene.add(cabinet);

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

// ====== Render loop ======
function animate(): void {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();