import { Base } from './base'
import * as THREE from 'three'
import gsap from "gsap"
import { RESTORE_END, FLYWIRE_ANIMATE, GUN_ANIMATE, SOCKET_ANIMATE } from './constants'
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";
import { MeshLine, MeshLineMaterial } from 'three.meshline'
import { pipelinePoints, devices, flyLineData, gunFlyline, socketFlyline } from './config'
import { type Flywire } from './flyLine_config'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { times, clamp } from 'lodash-es'


export default class Init extends Base {
  cameraInitialPos = new THREE.Vector3(0, 12.7, 17.5);
  materialFlyLine: MeshLineMaterial;
  groupFlyline = new THREE.Group(); // 除 插座 / 充电枪 之外的的 飞线 group
  groupGunFlyline = new THREE.Group(); // 充电枪 group
  groupSocketFlyline = new THREE.Group(); // 插座 group

  constructor(dom: HTMLDivElement) {
    super(dom);
    // 初始化摄像机位置
    this.camera.position.copy(this.cameraInitialPos.clone())
    this.controls.target.set(0, 12.7, 0);

    // this.addHelper() // 绘制 宽度50，高度 25 的背景网格 + 坐标系
    // this.showPointsText()

    this.configOrbitControls() 

    this.drawPipeLine()
    this.drawDevices()

    this.flylineStuff();
  }

  /**
   * 飞线 相关代码
   */
  flylineStuff() {
    this.scene.add(this.groupFlyline);
    this.scene.add(this.groupGunFlyline);
    this.scene.add(this.groupSocketFlyline);

    // 飞线的 material
    this.materialFlyLine = new MeshLineMaterial({
      lineWidth: 0.5,
      transparent: true,
      useMap: 1,
      map: this.textureLoader.load(new URL('../assets/glow.png', import.meta.url).href),
      // color: 'red',
      // opacity: .5,
      depthTest: false,
      depthWrite: false,
    });

    // TODO：需 数据驱动
    //  绘制 指定模式的 飞线
    // this.drawFlylinesByMode(flyLineData.peakLoadShiftingDischarge)
  }

  /**
   * 充电枪的飞线动画
   * @param map 
   */
  drawGunFlyline(map = ['leftGun', 'rightGun']) {
    // 清空 之前的数据
    this.animate.remove(GUN_ANIMATE);
    this.disposeChildren(this.groupGunFlyline);

    // 绘制 充电枪 / 插座 飞线动画
    map.forEach(target => {
      this.drawFlyline(gunFlyline[target], GUN_ANIMATE, this.groupGunFlyline);
    });
  }

  /**
   * 插座的 飞线动画
   */
  drawSocketFlyline(map = ['leftSocket', 'rightSocket']) {
    // 清空 之前的数据
    this.animate.remove(SOCKET_ANIMATE);
    this.disposeChildren(this.groupSocketFlyline);

    // 绘制 充电枪 / 插座 飞线动画
    map.forEach(target => {
      this.drawFlyline(socketFlyline[target], SOCKET_ANIMATE, this.groupSocketFlyline);
    });
  }

  /**
   * 根据 “每一类 模式” 绘制对应的飞线
   * @param data 
   */
  drawFlylinesByMode(data: Record<string, Flywire>) {
    // 清空 之前的数据
    this.animate.remove(FLYWIRE_ANIMATE);
    this.disposeChildren(this.groupFlyline);

    // 绘制 充电枪 / 插座 飞线动画
    Object.values(data)
      .forEach(data => {
        this.drawFlyline(data, FLYWIRE_ANIMATE, this.groupFlyline);
      });
  }

  /**
   * 根据 一个 `Flywire` 的数据，绘制飞线
   * @param data 
   */
  drawFlyline(data: Flywire, animateType: string, g: THREE.Group ) {
    const { length, step, repeat = 1, totalPoints = 500, isGrow = true } = data;

    times(repeat, (num) => {
      let i = (totalPoints / repeat) * num - (isGrow ? length : 0);

      const points = data.points.map(d => new THREE.Vector2(...d));
      const v2Points = new THREE.Path(points).getSpacedPoints(totalPoints);
      const geometry = new THREE.BufferGeometry();

      const line = new MeshLine();

      const meshLine = new THREE.Mesh(line, this.materialFlyLine);
      g.add(meshLine);

      this.animate.add(animateType, () => {
        i += step;
        if (i > v2Points.length) {
          i = isGrow ? -length : 0;
        }

        // 使用 clamp 原因： slice 参数不能是负数
        const drawPoints = v2Points.slice(clamp(i, 0, totalPoints), clamp(i + length, 0, totalPoints));
        geometry.setFromPoints(drawPoints);

        line.setGeometry(geometry);
      });
    });
  }

  // 绘制 设备 
  drawDevices() {
    const g = new THREE.Group();
    this.scene.add(g);

    devices.forEach(device => {
      const css3dObj = new CSS3DObject(device.createElement());
      if (!device.autoPointerEvents) {
        css3dObj.element.style.pointerEvents = 'none';
      }
      css3dObj.position.copy(new THREE.Vector3(...device.coord, 0));
      css3dObj.scale.setScalar(0.04)
      g.add(css3dObj);
    });
  }

  // 显示坐标
  showPointsText() {
    this.openCSS2DRenderer()
    const g = new THREE.Group();
    this.scene.add(g);
    g.translateY(.7)

    pipelinePoints.forEach((coords: THREE.Vector3[]) => {
      coords.forEach(pos => {
        g.add(this.createLabel_CSS2D(`${pos.x},${pos.y}`, pos, {color: 'red'}))
      })
    })
  }

  // 绘制走线 “管道”
  drawPipeLine() {
    const g = new THREE.Group();
    this.scene.add(g);

    const material = new MeshLineMaterial({
      lineWidth: .5,
      transparent: true,
      useMap: 1,
      map: this.textureLoader.load(new URL('../assets/pipe.png', import.meta.url).href),
    });

    pipelinePoints.forEach((d: THREE.Vector3[]) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(d);
      const line = new MeshLine();
      line.setGeometry(geometry);

      g.add(new THREE.Mesh(line, material));
    })
  }

  /**
   * 复位
   */
  onRestore() {
    gsap.to(this.controls.target, {
      x: 0,
      y: 12.5,
      z: 0,
      duration: 0.75,
      onComplete: () => {
        this.$emit(RESTORE_END)
      }
    })

    gsap.to(this.camera.position, {
      x: this.cameraInitialPos.x,
      y: this.cameraInitialPos.y,
      z: this.cameraInitialPos.z,
      duration: 0.7
    })
  }

  /**
   * 配置 放大/平移 视图
   */
  configOrbitControls() {
    this.controls.enableRotate = false

    this.controls.minDistance = 5;
    this.controls.maxDistance = 25;

    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
  }

  /**
   * 释放内存
   */
  clear() {
    this.dispose()
  }
}

/**
 * 执行本 hooks 函数， 绘制 3D 场景
 */
export function useThree(el: Ref<HTMLDivElement>) {
  const oThree = ref<Init>();

  onMounted(() => {
    oThree.value = new Init(el.value!);
  });
  onBeforeUnmount(() => {
    oThree.value?.clear()
  });
  return oThree
}
