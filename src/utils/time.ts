import { timeFormat } from "d3";
/**
 * 输入 new Date() 对象，返回格式化后的时间字符串
 */
export const getDateTime = timeFormat("%Y-%m-%d %H:%M");
export const getTime = timeFormat("%H:%M");
export const getDate = timeFormat("%Y-%m-%d");
