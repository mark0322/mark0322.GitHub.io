// 电池组 -> 充电枪
export const batteries_to_gun: Flywire = {
  points: [
    [13, 11],
    [13, 25],
    [-17, 25],
    [-17, 13.25]
  ],
  length: 80, // 飞线长度
  step: 1.2, // 每一步移动的点数
  repeat: 4, // 重复几次 飞线
}

// 电池组 -> nothing
// 仅维持母线电压供电，不流向任何设备
export const batteries_to_nothing: Flywire = {
  points: [
    [13, 11],
    [13, 25],
    [-25, 25]
  ],
  length: 70, // 飞线长度
  step: 1, // 每一步移动的点数
  repeat: 4, // 重复几次 飞线
}

// PCS -> 负载
export const pcs_to_load: Flywire = {
  points: [
    [-2, 25],
    [-2, 12.75],
    [1.5, 12.75],
    [1.5, 9.5],
    [-2, 9.5]
  ],
  length: 150, // 飞线长度
  step: 2, // 每一步移动的点数
  repeat: 2
}

// UPS -> 消防系统
export const ups_to_fireSystem: Flywire = {
  isGrow: false,
  points: [
    [1.5, 9.5],
    [4.5, 9.5],
    [4.5, 4.5]
  ],
  length: 300, // 飞线长度
  step: 2 // 每一步移动的点数
}

// UPS -> EMS
export const ups_to_ems: Flywire = {
  // isGrow: false,
  points: [
    [4.5, 7.75],
    [7.75, 7.75],
    [7.75, 4.5]
  ],
  length: 300, // 飞线长度
  step: 3.2 // 每一步移动的点数
}

// UPS -> BAU
export const ups_to_bau: Flywire = {
  // isGrow: false,
  points: [
    [4.5, 7.75],
    [1.25, 7.75],
    [1.25, 4.5]
  ],
  length: 300, // 飞线长度
  step: 3.2 // 每一步移动的点数
}

// 电池组 -> pcs
export const batteries_to_pcs: Flywire = {
  points: [
    [13, 11],
    [13, 25],
    [-2, 25],
    [-2, 24]
  ],
  length: 120, // 飞线长度
  step: 1.5, // 每一步移动的点数
  repeat: 3, // 重复几次 飞线
}

// knm1 -> pcs
export const knm1_to_pcs: Flywire = {
  points: [
    // [13, 16],
    [20.5, 12.75],
    [13, 12.75],
    [13, 25],
    [-2, 25],
    [-2, 24]
  ],
  length: 130, // 飞线长度
  step: 2, // 每一步移动的点数
  repeat: 3, // 重复几次 飞线
}

// 市电 -> 电池组
export const electricity_to_batteries: Flywire = {
  points: [
    [-12, 4],
    [-7, 4],
    [-7, 12.75],
    [-2, 12.75],
    [-2, 25],
    [13, 25],
    [13, 11],
  ],
  length: 75, // 飞线长度
  step: 1.3, // 每一步移动的点数
  repeat: 4, // 重复几次 飞线
}

// 中间拐角 -> 负载
export const middleCorner_to_load: Flywire = {
  points: [
    [-2, 12.75],
    [1.5, 12.75],
    [1.5, 9.5],
    [-2, 9.5]
  ],
  length: 300, // 飞线长度
  step: 4, // 每一步移动的点数
  repeat: 1
}

// 电表 -> 市电
export const middleCorner_to_electricity: Flywire = {
  points: [
    [-2, 12.75],
    [-7, 12.75],
    [-7, 4],
    [-12, 4]
  ],
  length: 200, // 飞线长度
  step: 2.5, // 每一步移动的点数
  repeat: 2
}



// 绘制飞线：
export type Flywire = {
  points: [number, number][]; // 飞线的 关键点位信息
  /**
   * 飞线长度
   * 即长度 转为 `length / totalPoints`
   */
  length: number;
  step: number; // 每一步移动的点数
  /**
   * 飞线总长度
   * @default 500
   */
  totalPoints?: number;
  /**
   * 重复几次 飞线
   * @default 1
   */
  repeat?: number;

  /**
   * 电流动画的初始状态 是否 “由小到大” “生长”出来
   * @default true
   */
  isGrow?: boolean;
}