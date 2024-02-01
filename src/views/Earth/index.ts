
import gsap from "gsap"
import { onBeforeUnmount, onMounted, ref, type Ref } from "vue"

import InitEarth3D from './InitEarth3D';


/**
 * 执行本 hooks 函数， 绘制 3D 场景
 */
export function useThree(el: Ref<HTMLDivElement>) {
  const oThree = ref<InitEarth3D>();

  onMounted(() => {
    oThree.value = new InitEarth3D(el.value!);
  });
  onBeforeUnmount(() => {
    oThree.value?.dispose()
    oThree.value?.removeEvent()
  });
  return oThree
}


