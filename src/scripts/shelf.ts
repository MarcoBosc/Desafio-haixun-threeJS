import * as THREE from 'three';

/**
 * Cria um armário 3D (estante) baseado nas dimensões fornecidas.
 * @param width Largura total do armário (mm)
 * @param depth Profundidade total do armário (mm)
 * @param height Altura total do armário (mm)
 * @param thickness Espessura das chapas (mm)
 * @param material Material usado para o armário
 * @returns THREE.Group com o armário completo
 */
export function createShelf(
  width: number,
  depth: number,
  height: number,
  thickness: number,
  material: THREE.Material
): THREE.Group {

  const cabinet: THREE.Group = new THREE.Group();

  // Laterais
  const sideGeom: THREE.BoxGeometry = new THREE.BoxGeometry(thickness, height, depth);
  const left: THREE.Mesh<THREE.BoxGeometry, THREE.Material> = new THREE.Mesh(sideGeom, material);
  const right: THREE.Mesh<THREE.BoxGeometry, THREE.Material> = left.clone() as THREE.Mesh<THREE.BoxGeometry, THREE.Material>;
  left.position.set(-(width / 2 - thickness / 2), 0, 0);
  right.position.set(width / 2 - thickness / 2, 0, 0);
  cabinet.add(left, right);

  // Tampo e base
  const topGeom: THREE.BoxGeometry = new THREE.BoxGeometry(width, thickness, depth);
  const top: THREE.Mesh<THREE.BoxGeometry, THREE.Material> = new THREE.Mesh(topGeom, material);
  top.position.set(0, height / 2 - thickness / 2, 0);

  const base: THREE.Mesh<THREE.BoxGeometry, THREE.Material> = top.clone() as THREE.Mesh<THREE.BoxGeometry, THREE.Material>;
  base.position.set(0, -height / 2 + thickness / 2, 0);
  cabinet.add(top, base);

  // Prateleira central
  const shelfWidth: number = width - 2 * thickness;
  const shelfGeom: THREE.BoxGeometry = new THREE.BoxGeometry(shelfWidth, thickness, depth);
  const shelf: THREE.Mesh<THREE.BoxGeometry, THREE.Material> = new THREE.Mesh(shelfGeom, material);
  shelf.position.set(0, 0, 0);
  cabinet.add(shelf);

  return cabinet;
}
