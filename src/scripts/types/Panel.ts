import * as THREE from 'three';

export interface Panel {
  mesh: THREE.Mesh;
  width: number;
  height: number;
  depth: number;
  position: THREE.Vector3;
}
