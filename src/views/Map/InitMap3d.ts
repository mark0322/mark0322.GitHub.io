import * as THREE from 'three';
import gsap from "gsap";

import type { FeatureCollection, MultiPolygonCoord, LineStringCoord, PointCoord } from '@/types/geo';

import { Base } from '@/three/base';
import { GeometryThree } from '@/three/utils/GeometryThree';

export default class InitMap3D extends Base {
  private lineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });
  private meshMaterial = new THREE.MeshLambertMaterial({ color: 0x3399ee, side: THREE.DoubleSide });

  g = new THREE.Group();

  constructor(dom: HTMLDivElement) {
    super(dom);

    // this.addHelper(false);
    this.scene.add(this.g);
    
    this.camera.position.set(2, 2, 8);
    // this.controls.minDistance = 4;

    this.addLight();
    // this.drawMap('/map3d/shandong.json', true);
  }

  clearMap() {
    this.disposeChildren(this.g);
  }

  async drawMap(url = '/map3d/world.json', is3D = false, { extrudeHeight } = { extrudeHeight: 2 }) {
    // const g = new THREE.Group();

    this.fileLoader.setResponseType('json');
    const { features } = await this.fileLoader.loadAsync(url) as unknown as FeatureCollection<MultiPolygonCoord>;

    features.forEach(feature => {
      let { type, coordinates } = feature.geometry;

      // 将 Polygon 统一处理成 MultiPolygon 格式，以便后续统一操作
      if (type === 'Polygon') {
        coordinates = [coordinates] as unknown as MultiPolygonCoord;
      }

      coordinates.forEach((coordinate) => {
        const shape = GeometryThree.createShape(coordinate[0] as PointCoord[])
        const linePoints = coordinate[0].flatMap(([x, y]) => [x, y, 0])
        const line = GeometryThree.createLine(linePoints, this.lineMaterial)
        line.position.z += 0.001
        this.g.add(line);

        let geometry: THREE.BufferGeometry;

        if (is3D) {
          line.position.z = -0.001;
          const line2 = line.clone();
          line2.position.z = extrudeHeight + 0.001;
          this.g.add(line2);

          geometry = new THREE.ExtrudeGeometry(shape, {
            depth: extrudeHeight,
            bevelEnabled: false
          });
        } else {
          geometry = new THREE.ShapeGeometry(shape);
        }
        const mesh = new THREE.Mesh(geometry, this.meshMaterial);
        this.g.add(mesh);
      })
    })

   // ----- 通过包围盒，获取 map 的中心点 和 相机的z值 -----
   const box3 = new THREE.Box3()
   box3.setFromObject(this.g)

   const v3Center = new THREE.Vector3()
   box3.getCenter(v3Center)
   const v3Size = new THREE.Vector3()
   box3.getSize(v3Size)

   this.controls.target.set(v3Center.x, v3Center.y, 0)
   this.camera.position.set(v3Center.x, v3Center.y, v3Size.x)
   // ----- 通过包围盒，获取 map 的中心点 和 相机的z值 -----
  }

  private addLight() {
    // 平行光1
    const directionalLight = new THREE.DirectionalLight(16777215, 0.6);
    directionalLight.position.set(400, 200, 300);
    this.scene.add(directionalLight);
    // 平行光2
    const directionalLight2 = new THREE.DirectionalLight(16777215, 0.6);
    directionalLight2.position.set(-400, -200, -300);
    this.scene.add(directionalLight2);
    //环境光
    const ambient = new THREE.AmbientLight(16777215, 0.75);
    this.scene.add(ambient);
  }
}
