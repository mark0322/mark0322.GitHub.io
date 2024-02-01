import { Base } from '@/three/base';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { FeatureCollection, MultiPolygonCoord, LineStringCoord, PointCoord } from '@/types/geo';
import { lon2xyz } from '@/utils/geography';
import Delaunator from 'delaunator';
import { createGridByEdge, pointInPolygon } from '@/utils/geometry';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EarthBGType } from './enum';


export default class InitEarth3D extends Base {
  label!: CSS2DObject;
  R!: number; // 地球的 半径
  edgeLineMaterial = new THREE.LineBasicMaterial({ color: 43690 });
  countryMeshMaterial = new THREE.MeshPhongMaterial({ color: 0x002222 });
  matEarthBg = new THREE.MeshLambertMaterial({ color: 0x111111 }); // 地球背景(底色：黑 / 底图)
  atmosphere!: THREE.Mesh; // 大气层

  constructor(dom: HTMLDivElement) {
    super(dom);
    this.addLight()
    this.camera.position.set(0, 0, 6);

    this.initCountryNameLabel();


    this.loadGeojson('/earth3d/countriesWithGDPAndCenter.json')
      .then(features => {

        // 绘制 地球
        this.drawEarth(3, features);
      });
  }

  /**
   * 绘制：
   *  1. 国家的边界线
   *  2. 绘制国家的 mesh
   *  3. 绘制地球的 mesh
   * @param r 
   * @param features 
   */
  drawEarth(r = 3, features: FeatureCollection<MultiPolygonCoord>['features']) {
    this.R = r;

    features.forEach(feature => {
      let { type, coordinates } = feature.geometry;

      // 将 Polygon 统一处理成 MultiPolygon 格式，以便后续统一操作
      if (type === 'Polygon') {
        coordinates = [coordinates] as unknown as MultiPolygonCoord;
      }

      // 1. 绘制国家边界 edgeLine
      this.drawCountryEdgeLine(coordinates, r);

      // 2. 绘制国家的 mesh
      const mesh = this.drawCountryMesh(coordinates, r);
      mesh.userData.properties = feature.properties;
      mesh.name = feature.properties.name;
    });

    // 3. 绘制地球的 bg
    this.drawEarthBgWithGlow(r);

    // 4. 绘制流动的大气层 
    this.drawAtmosphere(r)
  }

  /**
   * 模拟 流动的 大气层
   */
  private drawAtmosphere(r: number) {
    const texture = this.textureLoader.load('/earth3d/大气.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const geometry = new THREE.SphereGeometry(r + 0.001);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.3,
      depthTest: false
    });

    this.animate.add(() => {
      texture.offset.x -= 0.0001;
      texture.offset.y += 0.00005;
    });

    this.atmosphere = new THREE.Mesh(geometry, material);
    this.atmosphere.visible = false;
    this.scene.add(this.atmosphere);
  }

  /**
   * 绘制地球实心底色 + 外部辉光
   * @param r 
   */
  private drawEarthBgWithGlow(r: number) {
    // 地球（纯色、黑色）壳子
    const geoEarthBg = new THREE.SphereGeometry(r - 0.005, 50, 50);
    const earthBg = new THREE.Mesh(geoEarthBg, this.matEarthBg);
    this.matEarthBg.userData.type = EarthBGType.SOLID;

    // ----- 使用精灵图 制作 地球光晕 -----
    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.textureLoader.load('/earth3d/地球光圈.png'),
      transparent: true,
      opacity: 0.5,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(r * 2.95, r * 2.95, 1)
    earthBg.add(sprite);

    this.scene.add(earthBg)

    return earthBg;
  }

  /**
   * 绘制国家的mesh
   */
  private drawCountryMesh(multiPolygon: MultiPolygonCoord, r: number) {
    const geometries: THREE.BufferGeometry[] = [];

    multiPolygon.forEach(polygon => {
      polygon.forEach(lineStringCoord => {
        // 1、获取 mesh 的所有点
        // 在 polygon 内部生成 grid
        const gridList = createGridByEdge(lineStringCoord);
        // polygon边缘点 + 内部grid点 混合至一起
        const totalPoints = [...gridList, ...lineStringCoord]

        // 2、计算出 triangle
        const delaunator = Delaunator.from(totalPoints);
        const indexArr = delaunator.triangles;
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints(totalPoints.map((point2d) => {
          return new THREE.Vector3(...lon2xyz(r, ...point2d));
        }));

        // 3、目的：除去 polygon 外围的 mesh 三角
        const usefulIndexArr = []; // 
        // 去除 polygon 外围的 mesh 三角
        for (let i = 0;i < indexArr.length; i += 3) {
          // p1,p2,p3 三个 Coord2D 点，组成一个 mesh三角形
          const p1 = totalPoints[indexArr[i]]; // `indexArr[i]` 为三角形的一个顶点
          const p2 = totalPoints[indexArr[i + 1]];
          const p3 = totalPoints[indexArr[i + 2]];
    
          // mesh 三角的 重心
          const centroid: PointCoord = [(p1[0] + p2[0] + p3[0]) / 3, (p1[1] + p2[1] + p3[1]) / 3];
    
          // 只有 mesh 三角的 重心 在 polygon 内，其 索引才会被保留
          if (pointInPolygon(centroid, lineStringCoord)) {
            // 三角形顶点为 逆时针方向（threejs 中为正面）
            usefulIndexArr.push(indexArr[i + 2], indexArr[i + 1], indexArr[i]);
          }
        }

        geometry.index = new THREE.BufferAttribute(new Uint16Array(usefulIndexArr), 1);

        // 以 点位信息生成的 geometry 需计算法线
        // 否则 除了基础材质，都无法在光照下显示颜色
        geometry.computeVertexNormals();
        geometries.push(geometry);
      });
    });

    const geometry = mergeGeometries(geometries);
    const material = this.countryMeshMaterial;

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    return mesh;
  }

  /**
   * 绘制国家边界线
   */
  private drawCountryEdgeLine(multiPolygon: MultiPolygonCoord, r: number) {
    const lineGroup = new THREE.Group();
    lineGroup.name = '国家的边线';
    this.scene.add(lineGroup);

    multiPolygon.forEach(polygon => {
      polygon.forEach(lineStringCoord => {
        const point3dList = lineStringCoord.flatMap((point2d) => {
          return lon2xyz(r + 0.0001, ...point2d);
        });

        lineGroup.add(this.drawLine(point3dList, this.edgeLineMaterial));
      });
    });

    return lineGroup;
  }

  private initCountryNameLabel() {
    this.label = this.createLabel_CSS2D('');
    this.label.visible = false;
    this.scene.add(this.label);
  }

  /**
   * 加载 geojson 数据
   * @param url
   * @returns {Promise<FeatureCollection['features']>}
   */
  async loadGeojson(url: string) {
    this.fileLoader.setResponseType('json');
    const { features } = await this.fileLoader.loadAsync(url) as unknown as FeatureCollection<MultiPolygonCoord>;
    return features;
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
    const ambient = new THREE.AmbientLight(16777215, 0.6);
    this.scene.add(ambient);
  }
}
