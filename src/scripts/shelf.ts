import * as THREE from 'three';
import { applyHolesToShelf } from '@scripts/holes';
import { Panel } from '@scripts/types';

export function createShelf(
  width: number,
  depth: number,
  height: number,
  thickness: number,
  material: THREE.Material,
  scene: THREE.Scene
): THREE.Group {
  const cabinet = new THREE.Group();

  // === Laterais ===
  const sideGeom = new THREE.BoxGeometry(thickness, height, depth);
  const left = new THREE.Mesh(sideGeom, material);
  const right = left.clone();

  left.position.set(-(width / 2 - thickness / 2), 0, 0);
  right.position.set(width / 2 - thickness / 2, 0, 0);

  cabinet.add(left, right);

  // Use peças em contato por face: tampo/base entre as laterais
  const shelfWidth = width - 2 * thickness;

  // === Tampo e base ===
  const topGeom = new THREE.BoxGeometry(shelfWidth, thickness, depth);
  const top = new THREE.Mesh(topGeom, material);
  top.position.set(0, height / 2 - thickness / 2, 0);

  const base = top.clone();
  base.position.set(0, -height / 2 + thickness / 2, 0);

  cabinet.add(top, base);

  // === Prateleira central ===
  // const shelfWidth = width - 2 * thickness; // já calculado acima
  const shelfGeom = new THREE.BoxGeometry(shelfWidth, thickness, depth);
  const shelf = new THREE.Mesh(shelfGeom, material);
  shelf.position.set(0, 0, 0);
  cabinet.add(shelf);

  // === Registrar painéis ===
  const panels: Panel[] = [
    { mesh: left, width: thickness, height, depth, position: left.position },
    { mesh: right, width: thickness, height, depth, position: right.position },
    { mesh: top, width: shelfWidth, height: thickness, depth, position: top.position },
    { mesh: base, width: shelfWidth, height: thickness, depth, position: base.position },
    { mesh: shelf, width: shelfWidth, height: thickness, depth, position: shelf.position }
  ];

  // === Aplicar furos ===
  applyHolesToShelf(scene, panels);

  return cabinet;
}