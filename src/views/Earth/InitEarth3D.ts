import { Base } from '@/three/base';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { FeatureCollection, MultiPolygonCoord, LineStringCoord } from '@/types/geo';
import { lon2xyz } from '@/utils/geography';


export default class InitEarth3D extends Base {
  label!: CSS2DObject;
  R!: number; // 地球的 半径
  edgeLineMaterial = new THREE.LineBasicMaterial({ color: 43690 });

  constructor(dom: HTMLDivElement) {
    super(dom);
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
    });
  }

  /**
   * 绘制国家的mesh
   */
  drawCountryMesh() {

  }

  /**
   * 绘制国家边界线
   */
  drawCountryEdgeLine(multiPolygon: MultiPolygonCoord, r: number) {
    const lineGroup = new THREE.Group();
    lineGroup.name = '国家的边线';
    this.scene.add(lineGroup);

    multiPolygon.forEach(polygon => {
      polygon.forEach(lineStringCoord => {
        const point3dList = lineStringCoord.flatMap((point2d) => {
          return lon2xyz(this.R, ...point2d);
        });

        lineGroup.add(this.drawLine(point3dList, this.edgeLineMaterial));
      });
    });

    return lineGroup;
  }

  /**
   * 根据 给定的 points 和 材质 绘制 line
   * @param points 
   * @param material 
   * @returns 
   */
  drawLine(points: number[], material = new THREE.LineBasicMaterial({ color: 0x3399eee })) {
    const pointsBuffer = new Float32Array(points);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pointsBuffer, 3));
    return new THREE.Line(geometry, material);
  }

  initCountryNameLabel() {
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
    const { features } = await this.fileLoader.loadAsync(url) as unknown as FeatureCollection;
    return features;
  }

  addLight() {
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
