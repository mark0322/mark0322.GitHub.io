<template>
  <div class="full relative earth-3d">
    <div class="fixed bottom-8 right-4 z-10">
      <a-switch v-model:checked="isReal" checked-children="线框地球" un-checked-children="仿真地球" />
      <br>
      <a-switch v-model:checked="isShowGDP" checked-children="隐藏GDP" un-checked-children="显示GDP" />
    </div>
    <div class="fixed top-8 w-11/12 flex ml-8" v-if="isShowGDPlider">
      <span class="text-sm text-white flex items-center">GDP-{{ year }}年</span>
      <a-slider v-model:value="year" :min="1966" :max="2018" class="flex-1" />
    </div>
    <div class="full" ref="refEl"></div>
  </div>
</template>

<script setup lang='ts'>
import { useThree } from "./index"
import { ref, watch, type Ref } from "vue"

const refEl = ref<HTMLDivElement>()
const oThree = useThree(refEl as Ref<HTMLDivElement>);

const isShowGDPlider = ref(false);
const isReal = useRealOrSolid()
const year = useChangeYear();
const isShowGDP = useToggleGDP();

// -----
function useRealOrSolid() {
  const isReal = ref(false);
  watch(isReal, () => {
    oThree.value?.switchRealOrSolidEarthBG(isReal.value)
  });
  return isReal;
}

function useToggleGDP() {
  const isShowGDP = ref(false)
  watch(isShowGDP, () => {
    // oThree.value?.gdpBarControler?.[isShowGDP.value ? 'show' : 'hide']()
    if (isShowGDP.value) {
      oThree.value?.gdpBarControler?.show()
        .then(() => {
          // 渐入动画 结束
          year.value = 2018;
          isShowGDPlider.value = true;
        });
    } else {
      oThree.value?.gdpBarControler?.hide()
        .then(() => {
          // 渐出动画 结束
          isShowGDPlider.value = false;
        })
    }

  })
  return isShowGDP;
}

function useChangeYear() {
  const year = ref(2018);
  watch(year, () => {
    oThree.value?.changeGDPBarsByYear(year.value);
  })
  return year;
}




</script>


<style>
.earth-3d .ant-switch-inner {
  background-color: #00aaaa;
}
</style>