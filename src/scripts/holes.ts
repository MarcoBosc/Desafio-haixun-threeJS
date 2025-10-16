import * as THREE from 'three';
import { Panel } from '@scripts/types';
import { getHoleCount } from '@scripts/utils/rules';

type Axis = 'x' | 'y' | 'z';

const EPS = 1e-3;

// Ferragem VB
const COLOR_CONTACT = 0x00ff00; // Verde: Contato
const COLOR_ORIGINAL = 0xff0000; // Vermelho: Original

const PILOT_DIAM = 5;    // 5⌀
const PILOT_DEPTH = 10;  // 10mm

const BARREL_DIAM = 20;  // 20⌀
const BARREL_DEPTH = 13; // 13mm

export function applyHolesToShelf(scene: THREE.Scene, panels: Panel[]): void {
  for (let i = 0; i < panels.length; i++) {
    for (let j = i + 1; j < panels.length; j++) {
      const info = getContactInfo(panels[i], panels[j]);
      if (!info) continue;
      createHolesBetween(scene, panels[i], panels[j], info);
    }
  }
}

function getBox(panel: Panel): THREE.Box3 {
  return new THREE.Box3().setFromObject(panel.mesh);
}

function nearlyEqual(a: number, b: number, eps = EPS) {
  return Math.abs(a - b) <= eps;
}

function intervalOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  const start = Math.max(aMin, bMin);
  const end = Math.min(aMax, bMax);
  const length = Math.max(0, end - start);
  return { start, end, length };
}

function getContactInfo(a: Panel, b: Panel) {
  const boxA = getBox(a);
  const boxB = getBox(b);

  // Tenta contato com cada face no eixo
  const axes: Axis[] = ['x', 'y', 'z'];
  for (const axis of axes) {
    const minA = boxA.min[axis];
    const maxA = boxA.max[axis];
    const minB = boxB.min[axis];
    const maxB = boxB.max[axis];

    // Verifica se as faces se encontram nesse eixo
    let normalSign: 1 | -1 = 0 as 1 | -1;
    let plane = 0;

    if (nearlyEqual(maxA, minB)) {
      normalSign = +1; 
      plane = maxA;
    } else if (nearlyEqual(minA, maxB)) {
      normalSign = -1; 
      plane = minA;
    } else {
      continue;
    }

    // Checa sobreposição nas duas direções do plano
    const otherAxes = axes.filter(ax => ax !== axis) as Axis[];
    const uAxis = otherAxes[0];
    const vAxis = otherAxes[1];

    const uOv = intervalOverlap(boxA.min[uAxis], boxA.max[uAxis], boxB.min[uAxis], boxB.max[uAxis]);
    const vOv = intervalOverlap(boxA.min[vAxis], boxA.max[vAxis], boxB.min[vAxis], boxB.max[vAxis]);

    if (uOv.length > EPS && vOv.length > EPS) {
      return {
        axis,            
        normalSign,
        plane,
        uAxis, vAxis,
        uStart: uOv.start, uEnd: uOv.end,
        vStart: vOv.start, vEnd: vOv.end
      };
    }
  }

  return null;
}

function computeHoleCountByLength(length: number): number {
  const n = getHoleCount(length);
  if (typeof n === 'number' && n > 0) return n;

  // Fallback: ~1 furo a cada 500mm, iniciando com 2
  return Math.max(2, Math.floor(length / 500) + 2);
}

function createHolesBetween(
  scene: THREE.Scene,
  a: Panel,
  b: Panel,
  info: {
    axis: Axis;
    normalSign: 1 | -1;
    plane: number;
    uAxis: Axis;
    vAxis: Axis;
    uStart: number; uEnd: number;
    vStart: number; vEnd: number;
  }
) {
  // Escolhe a maior distância na superfície de contato para distribuir os holes
  const uLen = info.uEnd - info.uStart;
  const vLen = info.vEnd - info.vStart;

  const primary = uLen >= vLen ? 'u' : 'v';
  const alongStart = primary === 'u' ? info.uStart : info.vStart;
  const alongEnd = primary === 'u' ? info.uEnd : info.vEnd;
  const alongLen = alongEnd - alongStart;

  // Eixo lateral para o pino verde (perpendicular ao tambor vermelho)
  const sideAxis: Axis = primary === 'u' ? info.vAxis : info.uAxis;

  // Centro na direção perpendicular (a menor das duas)
  const perpCenter = primary === 'u'
    ? (info.vStart + info.vEnd) / 2
    : (info.uStart + info.uEnd) / 2;

  const count = computeHoleCountByLength(alongLen);

  // Vetores base
  const n = axisToVector(info.axis, info.normalSign); // normal do plano de contato (de A para B)
  const s = axisToVector(sideAxis, +1);               // direção lateral para o pino verde
  const FACE_EPS = 0.1;

  // Distribui furos com margens (i/(count+1))
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const along = alongStart + t * alongLen;

    // Posição base no plano de contato (coords globais)
    const base = new THREE.Vector3();
    base[info.uAxis] = primary === 'u' ? along : perpCenter;
    base[info.vAxis] = primary === 'v' ? along : perpCenter;
    base[info.axis] = info.plane;

    // Tambor vermelho (20⌀ x 13mm) — peça “fixada” (B), alinhado à normal
    const barrelPos = base.clone().addScaledVector(n, BARREL_DEPTH / 2 + FACE_EPS);
    const barrel = createHoleMarker(barrelPos, BARREL_DIAM / 2, BARREL_DEPTH, COLOR_ORIGINAL, n);

    // Metadados para export (posição local na peça B)
    const barrelLocal = b.mesh.worldToLocal(barrelPos.clone());
    (barrel as any).userData = {
      ...(barrel as any).userData,
      isHoleMarker: true,
      tipo: 'barrel',
      diametro: BARREL_DIAM,
      profundidade: BARREL_DEPTH,
      panelNumeracao: (b.mesh as any).userData?.numeracao,
      localPosition: { x: barrelLocal.x, y: barrelLocal.y, z: barrelLocal.z }
    };
    scene.add(barrel);

    // Pino verde (5⌀ x 10mm) — peça de contato (A), perpendicular ao tambor
    const pilotSideOffset = BARREL_DIAM / 2 + PILOT_DEPTH / 2;
    const pilotPos = base.clone()
      .addScaledVector(s, pilotSideOffset)
      .addScaledVector(n, -FACE_EPS);
    const pilot = createHoleMarker(pilotPos, PILOT_DIAM / 2, PILOT_DEPTH, COLOR_CONTACT, s);

    // Metadados para export (posição local na peça A)
    const pilotLocal = a.mesh.worldToLocal(pilotPos.clone());
    (pilot as any).userData = {
      ...(pilot as any).userData,
      isHoleMarker: true,
      tipo: 'pilot',
      diametro: PILOT_DIAM,
      profundidade: PILOT_DEPTH,
      panelNumeracao: (a.mesh as any).userData?.numeracao,
      localPosition: { x: pilotLocal.x, y: pilotLocal.y, z: pilotLocal.z }
    };
    scene.add(pilot);
  }
}

function axisToVector(axis: Axis, sign: 1 | -1): THREE.Vector3 {
  if (axis === 'x') return new THREE.Vector3(sign, 0, 0);
  if (axis === 'y') return new THREE.Vector3(0, sign, 0);
  return new THREE.Vector3(0, 0, sign);
}

function createHoleMarker(
  position: THREE.Vector3,
  radius: number,
  depth: number,
  color: number,
  normal: THREE.Vector3
): THREE.Mesh {
  const geom = new THREE.CylinderGeometry(radius, radius, depth, 24);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);

  // Orienta o cilindro (default no eixo Y) para alinhar com a direção fornecida
  const from = new THREE.Vector3(0, 1, 0); // eixo do cilindro
  const to = normal.clone().normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(from, to);
  mesh.quaternion.copy(quat);

  mesh.position.copy(position);

  // Marcar como marcador de furo para limpeza/identificação
  mesh.userData.isHoleMarker = true;

  return mesh;
}