import * as THREE from 'three';
import gsap from "gsap";
import Delaunator from 'delaunator';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { get } from 'lodash-es';
import { max, scaleSqrt } from 'd3';

import type {ScalePower} from 'd3';
import type { FeatureCollection, MultiPolygonCoord, LineStringCoord, PointCoord } from '@/types/geo';
import type { MeshStandard, Mesh} from '@/types';

import { Base } from '@/three/base';
import { GeometryThree } from '@/three/utils/GeometryThree';
import { gps2xyz } from '@/utils/geography';
import { createGridByEdge, pointInPolygon } from '@/utils/geometry';
import { CountryColor } from './enum';

export default class InitEarth3D extends Base {
  private r!: number; // 地球的半径
  private label!: CSS2DObject;
  private edgeLineMaterial = new THREE.LineBasicMaterial({ color: 0x00aaaa });
  private solidEarthBGMaterial = new THREE.MeshLambertMaterial({ color: 0x111111, side: THREE.DoubleSide }); // solid(实色) 地球bg材质
  private realEarthBGMaterial!: THREE.MeshBasicMaterial; // real(🌏) 地球bg材质
  private earthBG!: THREE.Mesh;
  private atmosphere!: THREE.Mesh; // 大气层
  private countriesMesh: Mesh[] = []; // 所有国家的 mesh
  private scaleBar = new THREE.Vector3(1, 1, 0); // bar 的生长动画，由 scaleZ 决定
  private scaleH!: ScalePower<number, number, never>;
  private annualGDPList!: {gdp: string; name: string; year: string}[];
  private gBars!: THREE.Group; // 所有 gdp bar 的 group

  public gdpBarControler!: {show: () => Promise<undefined>; hide: () => Promise<undefined>;};

  constructor(dom: HTMLDivElement) {
    super(dom);
    this.addLight()
    
    this.initCountryNameLabel();
    
    // 地球半径
    const r = this.r = 3;
    this.loadGeojson('/earth3d/countriesWithGDPAndCenter.json')
      .then(features => {
        // 绘制 地球
        this.drawEarth(r, features);

        // 绘制 gdp - bar
        this.gdpBarControler = this.drawGDPBars(r, features)
      });

    this.bindEvent();

    this.fetchAnnualGDPList();

    this.initSkyBox();


    this.camera.position.set(-1.748, 4.13, -6.624);
    this.controls.minDistance = 4;
  }
  // 场景天空盒 - CubeTextureLoader
  private initSkyBox() {
    const textureCubeLoader = new THREE.CubeTextureLoader().setPath('/earth3d/skybox_galaxy/')
    const textureCube = textureCubeLoader.load([
      'px.jpg',
      'nx.jpg',
      'py.jpg',
      'ny.jpg',
      'pz.jpg',
      'nz.jpg',
    ]);

    this.scene.background = textureCube;
    this.scene.environment = textureCube;
  }

  /**
   * 
   * @param year 
   */
  public changeGDPBarsByYear(year: number) {
    const gdpListForYear = this.annualGDPList.filter(d => d.year === year.toString());

    this.gBars.children.forEach(meshBar => {
      const gdpItem = gdpListForYear.find(d => d.name === meshBar.userData?.data?.name);

      if (gdpItem) {
        meshBar.visible = true;
        const gdp = +gdpItem.gdp;
        const h = this.scaleH(gdp);

        const maxH = meshBar.userData.maxH;
        (meshBar as Mesh).scale.z = this.scaleBar.z = h / maxH;
      
      } else {
        meshBar.visible = false;
      }
    });
  }

  /**
   * 获取 各国每年的 GPD 数据，以供 `changeGDPBarsByYear` 使用
   */
  private fetchAnnualGDPList() {
    this.fileLoader.setResponseType('json');
    this.fileLoader.load('/earth3d/gdp.json', (res: any) => {
      this.annualGDPList = res;
    });
  }

  /**
   * 以 柱状图 显示 国家的 GDP
   */
  private drawGDPBars(r = 3, features: FeatureCollection<MultiPolygonCoord>['features']) {
    const g = this.gBars = new THREE.Group();
    g.visible = false;
    this.scene.add(g);

    const matBar = new THREE.MeshLambertMaterial({
      vertexColors: true
    });

    const maxGDP = max(features, d => d.properties.gdp)!;
    const maxH = 2;

    // 指数比例尺，将 gdp 的值 映射至 柱子高度
    this.scaleH = scaleSqrt([0, maxGDP], [0, maxH]);

    const color1 = new THREE.Color(0x00aaaa);
    const color2 = new THREE.Color(0x44eeee);

    // 过滤出 包含 gdp 和 center 的国家，以便绘制 bars
    features.filter(feature => (feature.properties.gdp > 0) && Array.isArray(feature.properties.center))
      .forEach(feature => {
        const {gdp, center} = feature.properties;

        const h = this.scaleH(gdp);
        const geoBar = new THREE.BoxGeometry(.04, .04, h);

        // bar 使用 顶点颜色
        const color = color1.clone().lerp(color2, h / maxH);
        const colorArr = [];//几何体所有顶点颜色数据
        const pos = geoBar.attributes.position;
        for (let j = 0; j < pos.count; j++) {// pos.count表示几何体geometry顶点数量
          // 不同高度柱子颜色明暗不同，同一个柱子从下到上颜色不同
          if (pos.getZ(j) < 0) {//柱子几何体底部顶点对应颜色
            colorArr.push(color.r * 0.1, color.g * 0.1, color.b * 0.1);
          } else {//柱子几何体顶部顶点对应颜色
            colorArr.push(color.r * 1, color.g * 1, color.b * 1);
          }
        }
        //设置几何体 顶点颜色数据
        geoBar.attributes.color = new THREE.BufferAttribute(new Float32Array(colorArr), 3);

        const meshBar = new THREE.Mesh(geoBar, matBar);
        const [x, y, z] = gps2xyz(r, ...center);
        meshBar.position.set(x, y, z);
        meshBar.geometry.translate(0, 0, h / 2)
        // 目标旋转角
        const targetRotate = new THREE.Vector3(x, y, z).normalize();
        // 初始旋转角
        const initRotate = new THREE.Vector3(0, 0, 1);
        meshBar.quaternion.setFromUnitVectors(initRotate, targetRotate);

        g.add(meshBar);

        meshBar.userData.data = feature.properties;
        meshBar.userData.maxH = h;
      });

    let oGsap: gsap.core.Tween;
    return {
      show: (duration = 1.5) => {
        return new Promise<undefined>((resolve) => {
          if (oGsap) {
            oGsap.paused(true);
          }
    
          oGsap = gsap.to(this.scaleBar, {
            z: 1,
            duration,
            ease: 'Power1.easeInOut',
            onUpdate: () => {
              g.children.forEach(mesh => {
                mesh.scale.copy(this.scaleBar);
              })
            },
            onStart: () => {
              g.visible = true;
            },
            onComplete: () => {
              resolve(undefined);
            }
          });
        })
      },
      hide: (duration = 1.5) => {
        return new Promise<undefined>((resolve) => {
          if (oGsap) {
            oGsap.paused(true)
          }
  
          oGsap = gsap.to(this.scaleBar, {
            z: 0,
            duration,
            ease: 'Power1.easeInOut',
            onUpdate: () => {
              g.children.forEach(mesh => {
                mesh.scale.copy(this.scaleBar);
              })
            },
            onComplete: () => {
              g.visible = false;
              resolve(undefined);
            }
          })
        })
      }
    }
  }

  private onDblClick = (() => {
    let selectedMesh: MeshStandard;

    return (event: MouseEvent) => {
      // 取消上一次 被选中的 country mesh
      if (selectedMesh) {
        selectedMesh.material.color = new THREE.Color(CountryColor.normal);
      }

      // 每次点击，先隐藏 label
      this.label.visible = false;

      const { offsetX: x, offsetY: y } = event;
      const target = this.rayCast([x, y], this.countriesMesh);

      if (target.length > 0) {
        selectedMesh = target[0].object as MeshStandard;
        selectedMesh.material.color = new THREE.Color(CountryColor.selected);
  
        const targetProps = get(target[0], 'object.userData.properties', {});

        const labelPos = new THREE.Vector3();
        if (Array.isArray(targetProps.center)) {
          const [lon, lat] = targetProps.center;
          labelPos.set(...gps2xyz(this.r, lon, lat));
        } else {
          const {center} = GeometryThree.computeBox3(selectedMesh)
          labelPos.copy(center);
        }
        this.label.visible = true;
        this.label.position.copy(labelPos);
        this.label.element.innerText = targetProps.name || '--';
      }
    }
  })();

  private bindEvent() {
    this.dom.addEventListener('dblclick', this.onDblClick);
  }

  public removeEvent() {
    this.dom.removeEventListener('dblclick', this.onDblClick);
  }

  /**
   * 将地球在 real(🌏)  和 solid(实色) 间切换
   */
  public switchRealOrSolidEarthBG(isReal: boolean) {
    this.atmosphere.visible = isReal;

    // country mesh 的透明度
    this.countriesMesh.forEach(mesh => {
      mesh.material.opacity = isReal
        ? 0.2
        : 1;
    });


    // 地球背景切换
    this.earthBG.material = isReal
      ? this.realEarthBGMaterial
      : this.solidEarthBGMaterial;

    // 国家边界线颜色切换
    this.edgeLineMaterial.color = isReal 
      ? new THREE.Color(0xffffff)
      : new THREE.Color(0x00aaaa);
  }

  /**
   * 绘制：
   *  1. 国家的边界线
   *  2. 绘制国家的 mesh
   *  3. 绘制地球的 mesh
   * @param r 
   * @param features 
   */
  private drawEarth(r = 3, features: FeatureCollection<MultiPolygonCoord>['features']) {
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
      this.countriesMesh.push(mesh);
    });

    // 3. 绘制地球的 bg
    this.earthBG = this.drawEarthBgWithGlow(r);

    // 4. 绘制流动的大气层 
    this.atmosphere = this.drawAtmosphere(r)

    // 5. 以 动画圆点 绘制 国家的首都
    this.drawCapitalPoint(r, features);
  }

  /**
   * 圆点动画，给 首都 打点
   * @param r 
   * @param features 
   */
  private drawCapitalPoint(r: number, features: FeatureCollection<MultiPolygonCoord>['features']) {
    const g = new THREE.Group();
    g.name = 'CapitalsPoint';
    this.scene.add(g);

    const createPointMark = GeometryThree.createTexturePlaneFactory('/pointRing.png', {});

    features.forEach(feature => {
      const center = feature.properties.center;
      if (Array.isArray(center)) {
        const [x, y, z] = gps2xyz(r, center[0], center[1]);
        const pointMark = createPointMark(0.05, new THREE.Vector3(x, y, z));
        g.add(pointMark);

        // ----- 将 圆环标记 角度调整，以贴合在 🌏 上 -----
        const vTo = new THREE.Vector3(x, y, z).normalize();
        // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
        const vFrom = new THREE.Vector3(0, 0, 1);
        // 求 从 from 旋转到 to ，需要旋转的角度，设置给 pointMark
        pointMark.quaternion.setFromUnitVectors(vFrom, vTo);
        // ----- 将 圆环标记 角度调整，以贴合在 🌏 上 -----
      }
    });

    let scale = {value: 0.02};
    gsap.to(scale, {
      duration: 3,
      ease: 'Power1.easeInOut',
      value: 0.15,
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        g.children.forEach(mesh => {
          mesh.scale.set(scale.value, scale.value, 1);
        })
      }
    });

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
      opacity: 0.45,
      depthTest: false
    });

    this.animate.add(() => {
      texture.offset.x -= 0.0001;
      texture.offset.y += 0.00005;
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    this.scene.add(mesh);

    return mesh;
  }

  /**
   * 绘制地球实心底色 + 外部辉光
   * @param r 
   */
  private drawEarthBgWithGlow(r: number) {
    this.realEarthBGMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: 0xffffff,
      map: this.textureLoader.load('/earth3d/earth.jpg')
    })
    // 地球（纯色、黑色）壳子
    const geoEarthBg = new THREE.SphereGeometry(r - 0.005, 50, 50);
    const earthBg = new THREE.Mesh(geoEarthBg, this.solidEarthBGMaterial);

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
          return new THREE.Vector3(...gps2xyz(r, ...point2d));
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
    const material = new THREE.MeshPhongMaterial({ 
      color: CountryColor.normal, 
      transparent: true
    });

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
          return gps2xyz(r + 0.0001, ...point2d);
        });

        lineGroup.add(GeometryThree.createLine(point3dList, this.edgeLineMaterial));
      });
    });

    return lineGroup;
  }

  private initCountryNameLabel() {
    this.label = this.createLabel_CSS2D('', new THREE.Vector3(), {
      padding: '5px 10px',
      backgroundColor: 'rgba(25,25,25,0.5)',
      borderRadius: '5px',
    });
    this.label.visible = false;
    this.scene.add(this.label);
  }

  /**
   * 加载 geojson 数据
   * @param url
   * @returns {Promise<FeatureCollection['features']>}
   */
  public async loadGeojson(url: string) {
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
    const ambient = new THREE.AmbientLight(16777215, 0.75);
    this.scene.add(ambient);
  }
}
