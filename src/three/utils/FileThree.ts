import * as THREE from 'three'

export class FileThree {
  /**
   *  加载 gltf模型，以 Promise实例对象的形式返回
   * @param url 
   * @returns {Promise}
   */
  static async loadGLTF(url: string) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    return new GLTFLoader().loadAsync(url); // 返回的是一个 promise
  }

  /**
   * 将 场景导出为 `glb` 格式的文件
   * @param fileName 
   */
  static async exportGltf(scene: THREE.Scene,fileName = 'file') {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

    const gltfExporter = new GLTFExporter()

    gltfExporter.parse(
      scene, 
      (result) => {
        const link = document.createElement('a')
        const blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' })
        link.href = URL.createObjectURL(blob)
        link.download = `${fileName}.glb`
        link.click()
      }, 
      (err) => {
        console.error(`导出失败！${err}`)
      }, 
      { binary: true }
    )
  }


  /**
   * 保存画布保存在 图片
   * 注：渲染器必须开启：preserveDrawingBuffer: true
   */
  static saveAsPNG(canvas: HTMLCanvasElement, imgName = 'img') {
    // 创建一个超链接元素，用来下载保存数据的文件
    const link = document.createElement('a');

    // 通过超链接herf属性，设置要保存到文件中的数据
    link.href = canvas.toDataURL("image/png");
    link.download = `${imgName}.png`; //下载文件名
    link.click();
  }
}