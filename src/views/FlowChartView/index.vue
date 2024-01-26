<template>
  <div class="full relative">
    <div class="absolute top-4 left-8">
      <a-radio-group v-model:value="radio">
        <a-radio-button value="电源充电">电源充电</a-radio-button>
        <a-radio-button value="设备故障">设备故障</a-radio-button>
        <a-radio-button value="充电枪充电">充电枪充电</a-radio-button>
      </a-radio-group>
    </div>
    <RestoreBTN v-show="isShow" @click="restore" />
    <div class="full" ref="refEl"></div>
  </div>
</template>

<script lang="ts" setup>
import RestoreBTN from './components/RestoreBTN.vue'
import { onMounted, ref, watch, type Ref, watchEffect } from "vue";
import InitThree, { useThree } from './three/index';
import { defer, get } from 'lodash-es';
import {RESTORE_END} from './three/constants';
import { flyLineData, socketFlyline, gunFlyline } from './three/config';

const refEl = ref<HTMLDivElement>();
const oThree = useThree(refEl as Ref<HTMLDivElement>);
const {isShow, restore} = useRestore(oThree as Ref<InitThree>);
const {radio} = useInitAnimate();




// -----------
// 初始动画
function useInitAnimate() {
  const radio = ref<keyof typeof map>('电源充电');
  const map = {
    电源充电() {
      // 插座激活
      oThree.value?.drawFlylinesByMode(flyLineData.standby)
      oThree.value?.drawGunFlyline([]);
      oThree.value?.drawSocketFlyline();
      gunAnimate(3)
      socketAnimate(1)
    },
    设备故障() {
      // 枪故障、插座故障
      oThree.value?.drawFlylinesByMode(flyLineData.standbyUpsCharge)
      oThree.value?.drawGunFlyline([]);
      oThree.value?.drawSocketFlyline([]);
      gunAnimate(2)
      socketAnimate(2)
    },
    充电枪充电() {
      // 枪激活
      oThree.value?.drawFlylinesByMode(flyLineData.emergencySupply);
      // oThree.value?.drawFlylinesByMode(gunFlyline.leftGun)
      oThree.value?.drawGunFlyline();
      oThree.value?.drawSocketFlyline([]);
      gunAnimate(1)
      socketAnimate(3)
    }
  }

  onMounted(() => {
    setTimeout(() => {
      map.电源充电()
    })
  })

  watch(
    [radio],
    () => {
      map[radio.value]()
    }
  );

  /**
   * 枪 icon 效果
   * @param status 1工作中；2故障；3不在线
   */
  function gunAnimate(status: (1 | 2 | 3)) {
    if (status) {
      [ 'gunLeft', 'gunRight'].forEach(key => {
        const dom = document.querySelector(`.${key}`) as HTMLDivElement;
        if (!dom) return;

        const openDom = dom.querySelector(`.active`) as HTMLDivElement;
        if (!openDom) return;
        const closeDom = dom.querySelector(`.deactive`) as HTMLDivElement;
        if (!closeDom) return;
        const erorrDom = dom.querySelector('.error-icon') as HTMLDivElement;
        if (!erorrDom) return;

        const gunWork = () => {
          openDom.style.display = 'block';
          closeDom.style.display = 'none';
          erorrDom.style.display = 'none';
        }

        const gunNotWork = () => {
          openDom.style.display = 'none';
          closeDom.style.display = 'block';
          erorrDom.style.display = 'none';
        }

        const gunError = () => {
          openDom.style.display = 'none';
          closeDom.style.display = 'block';
          erorrDom.style.display = 'block';
        }

        if (status === 1) { // 枪工作中
          gunWork()
        } else if (status === 2) { // 枪 故障
          gunError()
        } else if (status === 3) { // 枪 不在线
          gunNotWork()
        }
      })
    }



  }

  /**
   * 
   * @param status 1工作中；2故障；3不在线
   */
  function socketAnimate(status: (1 | 2 | 3)) {
    if (status) {
      [ 'socket-left', 'socket-right'].forEach(key => {
        const dom = document.querySelector(`.${key}`) as HTMLDivElement;
        if (!dom) return;

        const openDom = dom.querySelector(`.active`) as HTMLDivElement;
        if (!openDom) return;
        const closeDom = dom.querySelector(`.deactive`) as HTMLDivElement;
        if (!closeDom) return;
        const erorrDom = dom.querySelector('.error-icon') as HTMLDivElement;
        if (!erorrDom) return;

        const gunWork = () => {
          openDom.style.display = 'block';
          closeDom.style.display = 'none';
          erorrDom.style.display = 'none';
        }

        const gunNotWork = () => {
          openDom.style.display = 'none';
          closeDom.style.display = 'block';
          erorrDom.style.display = 'none';
        }

        const gunError = () => {
          openDom.style.display = 'none';
          closeDom.style.display = 'block';
          erorrDom.style.display = 'block';
        }

        if (status === 1) { // 枪工作中
          gunWork()
        } else if (status === 2) { // 枪 故障
          gunError()
        } else if (status === 3) { // 枪 不在线
          gunNotWork()
        }
      })
    }



  }

  return {
    radio,
    map
  }
}

/**
 * 一次性接线图 恢复原位
 */
 function useRestore(oThree: Ref<InitThree>) {
  // btn 按钮的 显示与否
  // 触发 controls 则，显示 isShow
  const isShow = ref(false);

  onMounted(() => {
    defer(() => {
      oThree.value?.controls.addEventListener('change', () => {
        isShow.value = true;
      });
      // restore 动画结束，隐藏 btn
      oThree.value?.$on(RESTORE_END, () => {
        isShow.value = false;
      });
    });
  });

  // 执行本函数，则 一次性接线图 恢复原位
  const restore = () => {
    oThree.value?.onRestore()
  };
    
  return {
    isShow,
    restore
  }
}



interface Mode {
  id: number; 
  modeName: string;
}

interface EMSPoint {
  pointCode: string;
  pointValue: number | string;
}


</script>

<style scoped>
.full {
  width: 100%;
  height: 100%;
}
.wrap {
  width: calc(100vw);
  height: calc(100vh - 4rem - 12px);
}
</style>
