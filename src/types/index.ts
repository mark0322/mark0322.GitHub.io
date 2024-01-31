export type MeshStandard = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>
export type MeshBasic = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>
export type Mesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material>


// 一次性接线图相关 type
/**
 * 点位信息
 */
export type Point = {
  deviceCode: string;
  deviceName: string;
  id: number;
  productId: number;
  productType: string;
  productTypeName: string;
  storageId: number;
  emsPointList: Device[];
  /**
   * deviceStatus 1使用中  0不在线 2故障
   */
  deviceStatus: number;
};

/**
 * 设备信息
 */
export type Device = {
  deviceId: number;
  pointAlarmLevel: string;
  pointCode: string;
  pointLevel: number;
  pointName: string;
  pointUnit: string;
  pointValue: number;
}