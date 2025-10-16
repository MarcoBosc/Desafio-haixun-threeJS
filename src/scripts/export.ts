import * as THREE from 'three';
import { ExportPeca } from '@scripts/types/PanelExport';

/**
 * Monta o objeto de exportação com todas as peças e suas furações.
 * Requer:
 *  - Peças com userData: { isPanel: true, numeracao, medidas, (name opcional) }
 *  - Furos com userData: { isHoleMarker: true, panelNumeracao, diametro, profundidade, localPosition? }
 */
export function buildExportData(scene: THREE.Scene): { pecas: ExportPeca[] } {
  const pecas: ExportPeca[] = [];
  const byNum = new Map<number, ExportPeca>();
  const meshByNum = new Map<number, THREE.Mesh>();

  // 1) Coletar peças
  scene.traverse((obj) => {
    const u = (obj as any).userData;
    if (u?.isPanel === true) {
      const numeracao: number = u.numeracao ?? 0;
      const nome: string = (obj as THREE.Object3D).name || u.panelName || `Peça ${numeracao}`;
      const medidas = {
        comprimento: u.medidas?.comprimento ?? 0,
        largura: u.medidas?.largura ?? 0,
        espessura: u.medidas?.espessura ?? 0,
      };

      const rec: ExportPeca = {
        numeracao,
        nome,
        medidas,
        furacoes: [],
      };

      pecas.push(rec);
      byNum.set(numeracao, rec);
      meshByNum.set(numeracao, obj as THREE.Mesh);
    }
  });

  // 2) Coletar furações e anexar à peça correspondente
  scene.traverse((obj) => {
    const u = (obj as any).userData;
    if (u?.isHoleMarker === true && Number.isFinite(u.panelNumeracao)) {
      const alvo = byNum.get(u.panelNumeracao as number);
      if (!alvo) return;

      // Preferir posição local salva; senão, converter world->local
      let pos = u.localPosition as { x: number; y: number; z: number } | undefined;
      if (!pos) {
        const panelMesh = meshByNum.get(u.panelNumeracao as number);
        if (panelMesh) {
          const worldPos = (obj as THREE.Object3D).getWorldPosition(new THREE.Vector3());
          const localPos = panelMesh.worldToLocal(worldPos.clone());
          pos = { x: localPos.x, y: localPos.y, z: localPos.z };
        } else {
          pos = { x: 0, y: 0, z: 0 };
        }
      }

      alvo.furacoes.push({
        diametro: u.diametro ?? 0,
        profundidade: u.profundidade ?? 0,
        posicao: pos,
      });
    }
  });

  return { pecas };
}

/**
 * Gera e baixa o arquivo .json das peças.
 */
export function exportShelfJSON(scene: THREE.Scene, filename = `estante-${Date.now()}.json`): void {
  const data = buildExportData(scene);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}