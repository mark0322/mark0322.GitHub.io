import * as THREE from 'three'


export class GeometryThree {
  /**
   * 计算 target 的包围盒信息
   * @returns {{center: THREE.Vector3, size: THREE.Vector3, box3: THREE.Box3}}
   */
  static computeBox3(target: THREE.Object3D) {
    const box3 = new THREE.Box3()
    box3.setFromObject(target)

    const center = new THREE.Vector3()
    box3.getCenter(center)
    const size = new THREE.Vector3()
    box3.getSize(size)

    return {
      center,
      size,
      box3
    };
  }

  /**
   * 根据 给定的 points 和 材质 绘制 line
   * @param points 
   * @param material 
   * @returns 
   */
  static drawLine(points: number[], material = new THREE.LineBasicMaterial({ color: 0x3399eee })) {
    const pointsBuffer = new Float32Array(points);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pointsBuffer, 3));
    return new THREE.Line(geometry, material);
  }
}