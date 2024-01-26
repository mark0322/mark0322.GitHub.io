import * as THREE from 'three';
import { onUnmounted } from 'vue';
import { VIEW_ALL_BATTERIES, VIEW_DEVICE_DETAIL } from './constants';
import { eventBus } from '@/utils/eventBus';
import { 
  batteries_to_gun,
  pcs_to_load,
  ups_to_fireSystem,
  ups_to_ems,
  ups_to_bau,
  batteries_to_pcs,
  knm1_to_pcs,
  batteries_to_nothing,
  electricity_to_batteries,
  middleCorner_to_load,
  middleCorner_to_electricity,
  type Flywire 
} from './flyLine_config'


/**
 * 通过 配置 绘制 一次性接线图的 所有内容
 */

// 各类 模式的飞线数据
export const flyLineData: Record<string, Record<string, Flywire>> = {
  // 车载桩 放电模式
  // '车载充电桩放电'
  stationDischarge: {
    batteries_to_gun, // 电池组 -> 充电枪
    pcs_to_load, // 中间竖线 至 负载
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau // 至 BAU
  },
  // 外部充电桩 充电模式
  // '外部充电桩充电'
  externalStationCharge: {
    knm1_to_pcs,
    pcs_to_load,
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau // 至 BAU
  },
  // 运输模式：
  // '运输'
  transport: {
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau // 至 BAU
  },
  // 待机模式
  // '待机'
  standby: {
    batteries_to_nothing,
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau // 至 BAU
  },
  // 待机模式 - 休眠
  // ??
  standbyHibernate: {
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
  },
  // 待机模式 - UPS充电
  // ??
  standbyUpsCharge: {
    batteries_to_pcs,
    pcs_to_load, // 中间竖线 至 负载
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau // 至 BAU
  },
  // 市电 充电模式
  // '市电充电'
  electriCityCharge: {
    electricity_to_batteries, // 中间竖线 至 负载
    middleCorner_to_load,
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau // 至 BAU
  },
  // 应急 电源 模式
  // '应急电源'
  emergencySupply: {
    batteries_to_gun,
    pcs_to_load, // 中间竖线 至 负载
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau, // 至 BAU
    middleCorner_to_electricity
  },
  // 削峰填谷 - 充电
  // ?? '削峰填谷'
  peakLoadShiftingCharge: {
    electricity_to_batteries, // 中间竖线 至 负载
    middleCorner_to_load,
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau // 至 BAU
  },
  // 削峰填谷 - 放电
  // ?? '削峰填谷'
  peakLoadShiftingDischarge: {
    // batteries_to_gun,
    batteries_to_pcs,
    pcs_to_load, // 中间竖线 至 负载
    ups_to_fireSystem, // 至 消防系统
    ups_to_ems, // 至 EMS
    ups_to_bau, // 至 BAU
    middleCorner_to_electricity
  },
  // 停机模式 - 无动画
  // '停机'
  shutdown: {}
}

// 左右 插座 的 飞线动画
export const socketFlyline: Record<string, Flywire> = {
  leftSocket: {
    points: [
      [18, 20.5],
      [20.5, 20.5],
      [20.5, 12.75],
      [13, 12.75],
      [13, 11]
    ],
    length: 150,
    step: 2,
    repeat: 2
  },
  rightSocket: {
    points: [
      [23, 20.5],
      [20.5, 20.5],
      [20.5, 12.75],
      [13, 12.75],
      [13, 11]
    ],
    length: 150,
    step: 2,
    repeat: 2
  }
}

// 左右 枪 的 飞线动画
export const gunFlyline: Record<string, Flywire> = {
  leftGun: {
    points: [
      [-17, 14],
      [-17, 13],
      [-20, 13]
    ],
    length: 500,
    step: 5,
    // repeat: 2
  },
  rightGun: {
    points: [
      [-17, 14],
      [-17, 13],
      [-14, 13]
    ],
    length: 500,
    step: 5,
    // repeat: 2
  },
}

// 绘制 “管道” 的数据
export type Coords2D = [number, number][];
type Points = Coords2D[];
export const pipelinePoints: THREE.Vector3[][] = ([
  [
    [-25, 25],
    [25, 25]
  ],
  // left
  [
    [-17, 24.75],
    [-17, 13.25]
  ],
  [
    [-20, 13],
    [-14, 13]
  ],
  // middle
  [
    [-2, 24.75],
    [-2, 13]
  ],
  [
    [-12, 4],
    [-7.25, 4]
  ],
  [
    [-7, 3.75],
    [-7, 12.5]
  ],
  [
    [-7.25, 12.75],
    [1.75, 12.75]
  ],
  [
    [1.5, 12.5],
    [1.5, 9.75]
  ],
  [
    [-1.75, 9.5],
    [4.75, 9.5]
  ],
  [
    [4.5, 9.25],
    [4.5, 4.5]
  ],
  [
    [1, 7.75],
    [8, 7.75]
  ],
  [
    [1.25, 7.5],
    [1.25, 4.5]
  ],
  [
    [7.75, 7.5],
    [7.75, 4.5]
  ],
  // right
  [
    [13, 24.75],
    [13, 11],
  ],
  [
    [13.25, 12.75],
    [20.25, 12.75],
  ],
  [
    [20.5, 12.5],
    [20.5, 20.25],
  ],
  [
    [18, 20.5],
    [23, 20.5],
  ],
] as Points).map(coords => coords.map(d => new THREE.Vector3(...d, 0)));




// 绘制 “设备” 的数据
type Device = {
  coord: [number, number];
  name?: string;
  icon?: string;
  className?: string; // 最外层 div 的 className
  createElement: () => HTMLElement;

  /**
   * 该 div 是否启用 pointerEvents="auto"
   * 即 该 div 默认无法点击
   * 
   * @default false
   */
  autoPointerEvents?: boolean;
}
const errorIcon = new URL('../assets/error.png', import.meta.url).href;

/**
 * 根据 sign 在 store 中获取数据
 * @param sign 
 */
const bindClickEvent = (div: HTMLDivElement, sign: string) => {
  const bindFn = () => {
    eventBus.$emit(VIEW_DEVICE_DETAIL, sign);
  }

  div.addEventListener('click', bindFn)

  onUnmounted(() => {
    div.removeEventListener('click', bindFn)
  })
}

export const devices: Device[] = [
  { // 电池组
    coord: [13, 10],
    name: '电池组',
    className: 'bau',
    icon: new URL('../assets/电池组.png', import.meta.url).href,
    // autoPointerEvents: true,
    createElement() {
      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="">
          <img class="error-icon hidden absolute -top-6 -right-4" src="${errorIcon}" />
          <img src="${this.icon}" />
          <span class="text-white">${this.name}</span>
        </div>
      `;

      // bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 查看全部
    coord: [13, 8],
    name: '查看全部',
    createElement() {
      const bindFn = () => {
        eventBus.$emit(VIEW_ALL_BATTERIES);
      }

      const div = document.createElement('div');
      div.innerHTML = `
        <div class="text-white bg-primary px-3 py-1 rounded-2xl pointer-events-auto">查看全部</div>
      `;

      div.addEventListener('click', bindFn)

      onUnmounted(() => {
        div.removeEventListener('click', bindFn)
      })
      return div;
    }
  },
  { // 充电枪 - right
    coord: [-13.5, 13],
    name: '充电枪2',
    className: 'gunRight',
    autoPointerEvents: true,
    createElement() {
      const activeIcon = new URL('../assets/充电枪_active.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/充电枪_deactive.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="">
          <img class="error-icon hidden absolute -top-6 -right-4" src="${errorIcon}" />
          <img src="${activeIcon}" class="active w-10 h-12" style="display: none" />
          <img src="${deactiveIcon}" class="deactive w-10 h-12" />
          <span class="text-white">${this.name}</span>
        </div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 充电枪 - left
    coord: [-20.5, 13],
    name: '充电枪1',
    className: 'gunLeft',
    autoPointerEvents: true,
    createElement() {
      const activeIcon = new URL('../assets/充电枪_active.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/充电枪_deactive.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="">
          <img class="error-icon hidden absolute -top-6 -right-4" src="${errorIcon}" />
          <img src="${activeIcon}" class="active w-10 h-12" style="display: none" />
          <img src="${deactiveIcon}" class="deactive w-10 h-12" />
          <span class="text-white">${this.name}</span>
        </div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 车载充电桩
    coord: [-17, 19],
    name: '车载充电桩',
    className: '',
    createElement() {
      const icon = new URL('../assets/DC_DC充电桩.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-12">
          <img class="error-icon hidden absolute -top-6 right-14" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;
      return div;
    }
  },
  { // PCS
    coord: [-3.25, 23],
    name: 'PCS',
    className: 'pcs',
    autoPointerEvents: true,
    createElement() {
      const icon = new URL('../assets/PCS_AC_DC.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-12">
          <img class="error-icon hidden absolute -top-8 right-2" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 右 - 电表
    coord: [-2, 20],
    name: '电表',
    className: 'meterRight',
    autoPointerEvents: true,
    createElement() {
      const icon = new URL('../assets/电表.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-2" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 交流总开关 qf1
    coord: [-1.1, 17],
    name: '交流总开关',
    className: 'qf1',
    createElement() {
      const activeIcon = new URL('../assets/QF_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/QF_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-12" src="${errorIcon}" />
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;
      return div;
    }
  },
  { // 市电接触器 km2
    coord: [-6.6, 13.25],
    name: '市电接触器',
    className: 'km2',
    createElement() {
      const activeIcon = new URL('../assets/KMKN_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/KMKN_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-8" src="${errorIcon}" />
          <div class="text-white -translate-x-7">${this.name}</div>
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
        </div>
      `;
      return div;
    }
  },
  { // 负载总开关 qf3
    coord: [2, 13.25],
    name: '负载总开关',
    className: 'qf3',
    createElement() {
      const activeIcon = new URL('../assets/QF_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/QF_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-8" src="${errorIcon}" />
          <div class="text-white -translate-x-7">${this.name}</div>
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
        </div>
      `;
      return div;
    }
  },
  { // 市电总开关 qf4
    coord: [-6.1, 9.5],
    name: '市电总开关',
    className: 'qf4',
    createElement() {
      const activeIcon = new URL('../assets/QF_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/QF_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-12" src="${errorIcon}" />
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;
      return div;
    }
  },
  { // KN/M1 km5
    coord: [13.25, 16.5],
    name: 'KN/M1',
    className: 'km5',
    createElement() {
      const activeIcon = new URL('../assets/KMKN_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/KMKN_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5">
          <img class="error-icon hidden absolute -top-10 right-4" src="${errorIcon}" />
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;
      return div;
    }
  },
  { // KN/M2 km6
    coord: [20.75, 16.5],
    name: 'KN/M2',
    className: 'km6',
    createElement() {
      const activeIcon = new URL('../assets/KMKN_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/KMKN_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5">
          <img class="error-icon hidden absolute -top-10 right-4" src="${errorIcon}" />
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;
      return div;
    }
  },
  { // socket-left
    coord: [17.5, 21],
    name: '快充插座',
    className: 'socket-left',
    createElement() {
      const activeIcon = new URL('../assets/socket_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/socket_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-4" src="${errorIcon}" />
          <div class="text-white -translate-x-5">${this.name}</div>
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
        </div>
      `;
      return div;
    }
  },
  { // socket-right
    coord: [23.5, 21],
    name: '快充插座',
    className: 'socket-right',
    createElement() {
      const activeIcon = new URL('../assets/socket_work.png', import.meta.url).href;
      const deactiveIcon = new URL('../assets/socket_nowork.png', import.meta.url).href;

      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-4" src="${errorIcon}" />
          <div class="text-white -translate-x-5">${this.name}</div>
          <img src="${activeIcon}" class="active" style="display: none" />
          <img src="${deactiveIcon}" class="deactive" />
        </div>
      `;
      return div;
    }
  },
  { // DC/DC
    coord: [13.2, 20.5],
    name: 'DC/DC',
    className: 'dcdc',
    autoPointerEvents: true,
    createElement() {
      const icon = new URL('../assets/DC_DC.png', import.meta.url).href;
      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5">
          <img class="error-icon hidden absolute -top-8 right-6" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ml-1">${this.name}</span>
        </div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 负载
    coord: [-1.25, 9.5],
    name: '负载',
    createElement() {
      const div = document.createElement('div');
      div.innerHTML = `
        <img class="error-icon hidden absolute -top-8 -right-6" src="${errorIcon}" />
        <div class="text-white text-lg">${this.name}</div>
      `;
      return div;
    }
  },
  { // UPS
    coord: [4.5, 9.5],
    name: 'UPS',
    className: 'ups',
    autoPointerEvents: true,
    createElement() {
      const div = document.createElement('div');
      div.innerHTML = `
        <img class="error-icon hidden absolute -top-7 -right-4" src="${errorIcon}" />
        <div class="text-white text-lg">${this.name}</div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 市电
    coord: [-13, 4],
    name: '市电',
    createElement() {
      const icon = new URL('../assets/市电.png', import.meta.url).href;
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="flex center-y translate-x-5 flex-col">
          <img class="error-icon hidden absolute -top-4 -right-0" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white" style="transform: translateY(-15px)">${this.name}</span>
        </div>
      `;
      return div;
    }
  },
  { // 电表
    coord: [-8, 3.5],
    name: '电表',
    className: 'meterLeft',
    autoPointerEvents: true,
    createElement() {
      const icon = new URL('../assets/电表.png', import.meta.url).href;
      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5 flex-col">
          <img class="error-icon hidden absolute -top-10 -right-6" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ">${this.name}</span>
        </div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // BAU
    coord: [0.5, 3.5],
    name: 'BAU',
    className: 'bau',
    autoPointerEvents: true,
    createElement() {
      const icon = new URL('../assets/BAU.png', import.meta.url).href;
      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5 flex-col">
          <img class="error-icon hidden absolute -top-8 -right-4" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ">${this.name}</span>
        </div>
      `;

      bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // 消防系统
    coord: [3.7, 3.5],
    name: '消防系统',
    className: 'fireControl',
    // autoPointerEvents: true,
    createElement() {
      const icon = new URL('../assets/消防系统.png', import.meta.url).href;
      const div = document.createElement('div');
      div.className = this.className!;
      div.innerHTML = `
        <div class="flex center-y translate-x-5 flex-col">
          <img class="error-icon hidden absolute -top-8 -right-4" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ">${this.name}</span>
        </div>
      `;

      // bindClickEvent(div, this.className!);
      return div;
    }
  },
  { // EMS
    coord: [7, 3.5],
    name: 'EMS',
    createElement() {
      const icon = new URL('../assets/EMS.png', import.meta.url).href;
      const div = document.createElement('div');
      div.innerHTML = `
        <div class="flex center-y translate-x-5 flex-col">
          <img class="error-icon hidden absolute -top-8 -right-4" src="${errorIcon}" />
          <img src="${icon}"/>
          <span class="text-white ">${this.name}</span>
        </div>
      `;
      return div;
    }
  }
];
