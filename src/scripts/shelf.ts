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

  // Helper: metadados para exportação
  function setPanelMeta(
    mesh: THREE.Mesh,
    numeracao: number,
    nome: string,
    medidas: { comprimento: number; largura: number; espessura: number }
  ) {
    mesh.name = nome;
    (mesh as any).userData.isPanel = true;
    (mesh as any).userData.numeracao = numeracao;     // usado pelo export.ts
    (mesh as any).userData.panelName = nome;
    (mesh as any).userData.medidas = medidas;          // { comprimento, largura, espessura }
  }

  // === Laterais ===
  const sideGeom = new THREE.BoxGeometry(thickness, height, depth);
  const left = new THREE.Mesh(sideGeom, material);
  const right = left.clone();

  left.position.set(-(width / 2 - thickness / 2), 0, 0);
  right.position.set(width / 2 - thickness / 2, 0, 0);

  // Metadados das laterais
  setPanelMeta(left, 1, 'Lateral Esquerda', {
    comprimento: height,
    largura: depth,
    espessura: thickness
  });
  setPanelMeta(right, 2, 'Lateral Direita', {
    comprimento: height,
    largura: depth,
    espessura: thickness
  });

  cabinet.add(left, right);

  // Use peças em contato por face: tampo/base entre as laterais
  const shelfWidthRaw = width - 2 * thickness;
  const shelfWidth = Math.max(1, shelfWidthRaw); 
  // === Tampo e base ===
  const topGeom = new THREE.BoxGeometry(shelfWidth, thickness, depth);
  const top = new THREE.Mesh(topGeom, material);
  top.position.set(0, height / 2 - thickness / 2, 0);
  setPanelMeta(top, 3, 'Tampo', {
    comprimento: shelfWidth,
    largura: depth,
    espessura: thickness
  });

  const base = top.clone();
  base.position.set(0, -height / 2 + thickness / 2, 0);
  setPanelMeta(base, 4, 'Base', {
    comprimento: shelfWidth,
    largura: depth,
    espessura: thickness
  });

  cabinet.add(top, base);

  // === Prateleira central ===
  const shelfGeom = new THREE.BoxGeometry(shelfWidth, thickness, depth);
  const shelf = new THREE.Mesh(shelfGeom, material);
  shelf.position.set(0, 0, 0);
  setPanelMeta(shelf, 5, 'Prateleira', {
    comprimento: shelfWidth,
    largura: depth,
    espessura: thickness
  });
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