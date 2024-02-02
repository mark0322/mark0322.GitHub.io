
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue"

import InitMap3d from './InitMap3d';


/**
 * 执行本 hooks 函数， 绘制 3D 场景
 */
export function useThree(el: Ref<HTMLDivElement>) {
  const oThree = ref<InitMap3d>();

  onMounted(() => {
    oThree.value = new InitMap3d(el.value!);
  });
  onBeforeUnmount(() => {
    oThree.value?.dispose()
  });
  return oThree
}


