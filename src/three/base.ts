import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Animate } from './Animate'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
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

    this.openCSS3DRenderer()
  }

  // 开启 css3D 渲染器
  openCSS3DRenderer() {
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

  // temp
  box(size = 0.5, color = 0xffffff) {
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

  // 开启 css2D 渲染器（单例模式）
  openCSS2DRenderer() {
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
  createLabel_CSS2D(text: string, pos = new THREE.Vector3(), options = {}) {

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


    return label
  }

  disposeFn(obj: { dispose?: () => void }) {
    if (typeof obj.dispose === 'function') {
      obj.dispose()
    }
  }

  // 清空释放 parent 下所有 内存
  disposeChildren(parent: THREE.Group | THREE.Scene) {
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
  onResize = () => {
    this.w = this.dom.offsetWidth
    this.h = this.dom.offsetHeight

    this.camera.aspect = this.w / this.h

    // 更新摄像头的 投影矩阵
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.w, this.h)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.css3DRenderer.setSize(this.w, this.h);
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
  addHelper() {
    // 坐标轴
    const axesHelper = new THREE.AxesHelper(2000)
    axesHelper.position.z = 0.05
    this.scene.add(axesHelper)

    // grid
    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.rotateX(Math.PI / 2);
    this.scene.add(gridHelper);
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
