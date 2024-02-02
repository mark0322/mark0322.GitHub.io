import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Animate } from './Animate'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import Emitter from '@/utils/Emitter'

const defaultOptions: Options = {
  openRender: true,
  antialias: true,
  preserveDrawingBuffer: false,
  logarithmicDepthBuffer: false,
  limitFPS: Infinity
}

export class Base extends Emitter {
  private animateId!: number
  private options: Options
  private deltaFPS = 0 // 限制 刷新率时刷用
  private isOpenCss2D = false
  private isOpenCss3D = false

  dom!: HTMLDivElement
  renderer!: THREE.WebGLRenderer
  camera!: THREE.PerspectiveCamera
  controls!: OrbitControls
  w!: number
  h!: number

  scene = new THREE.Scene()
  clock = new THREE.Clock()
  textureLoader = new THREE.TextureLoader()
  fileLoader = new THREE.FileLoader()
  animate = new Animate()

  css3DRenderer!: CSS3DRenderer;
  css2DRenderer!: CSS2DRenderer;

  constructor(dom: HTMLDivElement, options: Options = {}) {
    super()
    // 初始默认值
    this.options = Object.assign(defaultOptions, options)

    this.init(dom)

    window.addEventListener('resize', this.onResize);
  }


  // temp
  protected box(size = 0.5, color = 0xffffff) {
    const geometry = new THREE.BoxGeometry(size, size, size)
    const material = new THREE.MeshBasicMaterial({ color })
    return new THREE.Mesh(geometry, material)
  }

  // temp
  showCameraPos() {
    setInterval(() => {
      const cameraPos = this.camera.position
      console.log('cameraPos', cameraPos)
    }, 1000)
  }


  // 开启 css2D 渲染器（单例模式）
  private openCSS2DRenderer() {
    if (this.isOpenCss2D) return

    this.isOpenCss2D = true

    // 创建一个CSS2渲染器CSS2DRenderer
    const labelRenderer = new CSS2DRenderer()

    labelRenderer.setSize(this.dom.offsetWidth, this.dom.offsetHeight)
    labelRenderer.domElement.style.position = 'absolute'
    // 避免renderer.domElement影响HTMl标签定位，设置top为0px
    labelRenderer.domElement.style.top = '0px'
    labelRenderer.domElement.style.left = '0px'

    //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
    labelRenderer.domElement.style.pointerEvents = 'none'

    this.dom.appendChild(labelRenderer.domElement)

    this.css2DRenderer = labelRenderer;

    this.animate.add(() => {
      labelRenderer.render(this.scene, this.camera)
    })
  }

  /**
   * 创建 CSS2D Label
   * @param text 
   * @param pos 默认值 (0, 0, 0)
   * @param options 默认值 {
      padding: '5px 10px',
      color: '#fff',
      fontSize: '16px',
      position: 'absolute',
      backgroundColor: 'rgba(25,25,25,0.5)',
      borderRadius: '5px',
    } 
    * @returns 
  */
  protected createLabel_CSS2D(text: string, pos = new THREE.Vector3(), options = {}) {

    options = Object.assign(
      {
        color: '#fff',
        fontSize: '16px',
        position: 'absolute',
      },
      options
    )

    const div = document.createElement('div')
    div.innerText = text

    Object.entries(options).forEach(([k, v]) => {
      ;(div.style as CSSStyleDeclaration & { [k: string]: any })[k] = v
    })

    const label = new CSS2DObject(div)
    label.position.copy(pos)

    this.openCSS2DRenderer()

    return label
  }

  // 开启 css3D 渲染器
  private openCSS3DRenderer() {
    if (this.isOpenCss3D) return

    this.isOpenCss3D = true

    const labelRenderer = new CSS3DRenderer()

    labelRenderer.setSize(this.dom.offsetWidth, this.dom.offsetHeight)
    labelRenderer.domElement.style.position = 'absolute'
    // 避免renderer.domElement影响HTMl标签定位，设置top为0px
    labelRenderer.domElement.style.top = '0px'
    labelRenderer.domElement.style.left = '0px'

    //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
    labelRenderer.domElement.style.pointerEvents = 'none'

    this.dom.appendChild(labelRenderer.domElement)

    this.animate.add(() => {
      labelRenderer.render(this.scene, this.camera)
    })

    this.css3DRenderer = labelRenderer;
  }

  /**
   * 创建 CSS3D Label
   * @param text 
   * @param pos 默认值 (0, 0, 0)
   * @param cssOptions 默认值 {
      padding: '5px 10px',
      color: '#fff',
      fontSize: '16px',
      position: 'absolute',
      backgroundColor: 'rgba(25,25,25,0.5)',
      borderRadius: '5px',
    } 
    * @param { scale, rotateX }
    * @returns {CSS3DObject}
  */
  protected createLabel_CSS3D(text: string, pos = new THREE.Vector3(), cssOptions = {}, {scale, rotateX} = {scale: 1, rotateX: Math.PI}) {
    cssOptions = Object.assign({
      padding: '5px 10px',
      color: '#fff',
      fontSize: '16px',
      position: 'absolute',
      backgroundColor: 'rgba(25,25,25,0.5)',
      borderRadius: '5px',
      pointerEvents: 'none' //避免HTML标签遮挡三维场景的鼠标事件
    }, cssOptions);

    const div = document.createElement('div');
    div.innerText = text;

    Object.entries(cssOptions)
      .forEach(([k, v]) => {
        (div.style as CSSStyleDeclaration & { [k: string]: any })[k] = v;
      });

    const label = new CSS3DObject(div);
    label.scale.setScalar(scale)
    label.rotateX(rotateX);
    label.position.copy(pos);

    this.openCSS3DRenderer()

    return label;
  }

  /**
   * 根据 相对 画布的坐标，获取 meshList 中的 Mesh
   * @param param0 
   * @param meshList 
   */
  protected rayCast([x, y]: [number, number], meshList: THREE.Object3D[]) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    pointer.x = ( x / this.dom.offsetWidth ) * 2 - 1;
    pointer.y = - ( y / this.dom.offsetHeight ) * 2 + 1;

    raycaster.setFromCamera(pointer, this.camera);

    return raycaster.intersectObjects(meshList);
  }

  protected disposeFn(obj: { dispose?: () => void }) {
    if (typeof obj.dispose === 'function') {
      obj.dispose()
    }
  }

  // 清空释放 parent 下所有 内存
  protected disposeChildren(parent: THREE.Group | THREE.Scene) {
    parent.traverse((ele) => {
      const obj = ele as THREE.Mesh<THREE.BufferGeometry, THREE.Material> & { dispose?: () => void }

      // light etc...
      this.disposeFn(obj)

      if (obj.geometry) {
        this.disposeFn(obj.geometry)
      }
      if (obj.material) {
        this.disposeFn(obj.material)
      }
    });

    parent.children = []
  }

  /**
   * 组件/路由 被销毁时
   * 需要 执行本函数，主动释放 所有被占用的 内存
   */
  dispose() {
    // 清空 animate 的内存
    (this.animate as unknown) = null as unknown;

    window.removeEventListener('resize', this.onResize);

    // this.camera.dispose()  // TODO：相机无法被 dispose？
    cancelAnimationFrame(this.animateId)

    this.renderer.dispose()
    this.renderer.forceContextLoss()

    this.controls.dispose()

    this.disposeChildren(this.scene)
    this.scene.clear()
  }

  // 屏幕 宽高 自适应
  private onResize = () => {
    this.w = this.dom.offsetWidth
    this.h = this.dom.offsetHeight

    this.camera.aspect = this.w / this.h

    // 更新摄像头的 投影矩阵
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.w, this.h)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.css3DRenderer && this.css3DRenderer.setSize(this.w, this.h);
    this.css2DRenderer && this.css2DRenderer.setSize(this.w, this.h);
  }

  private init(dom: HTMLDivElement) {
    const { antialias, preserveDrawingBuffer, logarithmicDepthBuffer } = this.options

    this.dom = dom
    this.w = dom.offsetWidth
    this.h = dom.offsetHeight

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias,
      preserveDrawingBuffer, // 可以将显示内存，以图片保存
      logarithmicDepthBuffer // 深度缓冲区 数据以`对数`形式保存，其比默认的 `线性` 保存能更好地避免深度冲突
    })
    this.renderer.setSize(this.w, this.h)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    dom.appendChild(this.renderer.domElement)

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.w / this.h, 1, 100000)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this._animate(0)
  }

  /**
   *
   * @param time 从 `new Base()` 开始以毫秒 计时
   */
  private _animate = (time: number) => {
    this.animateId = requestAnimationFrame(this._animate)

    // 是否 限制 刷新率
    const fps = this.options.limitFPS!
    if (fps < Infinity) {
      this.deltaFPS += this.clock.getDelta()
      if (this.deltaFPS < 1 / fps) {
        return
      }
      this.deltaFPS = 0
    }

    // 执行 this.animate 中的回调函数
    Object.values(this.animate.oType).forEach((fns) => {
      fns.forEach((fn) => fn(time))
    })

    // 更新 轨道控制器 - OrbitControls
    this.controls.update()

    // 是否开启 渲染器
    if (this.options.openRender) {
      this.renderer.render(this.scene, this.camera)
    }
  }

  // temp
  addHelper(isShowGrid = true) {
    // 坐标轴
    const axesHelper = new THREE.AxesHelper(2000)
    axesHelper.position.z = 0.05
    this.scene.add(axesHelper)

    // grid
    if (isShowGrid) {
      const gridHelper = new THREE.GridHelper(50, 50);
      gridHelper.rotateX(Math.PI / 2);
      this.scene.add(gridHelper);
    }
  }

  /**
   * 创建一个 PlaneMesh，其内部的文字为 canvas 而成
   * @param text 
   * @returns {THREE.Mesh & { updateText: (text: string) => void }} `updateText`函数的作用：更新 canvas 内的文本
   */
  protected createLabel_CanvasMesh(text = '') {
    const canvasEle = document.createElement('canvas');
    const ctx = canvasEle.getContext('2d') as CanvasRenderingContext2D;

    // 设置字体样式
    ctx.font = "30px Arial";
    // 设置文本对齐方式
    ctx.textAlign = "center"; 
    ctx.textBaseline = 'middle';
    // 设置填充颜色
    ctx.fillStyle = "#eeeeee";
    ctx.fillText(text, 150, 75);

    const canvasTexture = new THREE.CanvasTexture(canvasEle);

    const material = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      color: 0xffffff,
      transparent: true,
      // side: THREE.DoubleSide,
      depthTest: false,
      // depthWrite: false
    });

    const geometry = new THREE.PlaneGeometry(3, 1.5);
    const mesh = new THREE.Mesh(geometry, material);

    function updateText(text: string) {
      const ctx = mesh.material.map?.image?.getContext('2d') as CanvasRenderingContext2D;

      ctx.clearRect(0, 0, 300, 150);
      ctx.fillText(text, 150, 75);
      canvasTexture.needsUpdate = true;
    }

    const result = mesh as MeshCanvasText;
    result.updateText = updateText;
    return result;
  }

  /**
   * 摄像机 朝向 target物体，并返回 target 的 中心点/大小/包围盒
   * @param target 要看向的 物体
   * @returns {THREE.Box3}
   */
  protected lookAt(target: THREE.Object3D) {
    const box3 = new THREE.Box3()
    box3.setFromObject(target)
  
    const v3Center = new THREE.Vector3()
    box3.getCenter(v3Center)
    const v3Size = new THREE.Vector3()
    box3.getSize(v3Size)
  
    this.controls.target.set(v3Center.x, v3Center.y, v3Center.z);
    this.camera.lookAt(v3Center)

    return {
      center: v3Center,
      size: v3Size,
      box3
    };
  }

  /**
   * 使用 Stats，显示 帧速率
   */
  async showFps() {
    const {default: Stats} = await import('three/addons/libs/stats.module.js')

    const stats = new Stats();

    this.animate.add(() => {
      stats.update();
    });

    this.dom.appendChild(stats.dom)
  }
}


type Options = Partial<{
  /**
   * 限制刷新率 上限
   * @default Infinity  即不作限制
   */
  limitFPS: number

  /**
   * 是否 在浏览器 渲染每一帧时 执行 renderer.render(scene, camera);
   * @default true
   */
  openRender: boolean

  /**
   * 抗锯齿
   * @default false
   */
  antialias: boolean

  /**
   * 是否可执行 `保存图片` 功能
   * @default false
   */
  preserveDrawingBuffer: boolean

  /**
   * 深度空间，是否设为 对数（更精确，以 环节深度冲突）
   * @default false
   */
  logarithmicDepthBuffer: boolean
}>

interface MeshCanvasText extends THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  /**
   * 更新 canvas 中的文字
   * @param text 要被更新的文字
   * @returns 
   */
  updateText: (text: string) => void 
}