<template>
  <div class="full relative earth-3d">
    <div class="fixed bottom-8 right-4 z-10">
      <a-switch v-model:checked="isReal" checked-children="线框地球" un-checked-children="仿真地球" />
      <br>
      <a-switch v-model:checked="isShowGDP" checked-children="隐藏GDP" un-checked-children="显示GDP" />
    </div>
    <div class="full" ref="refEl"></div>
  </div>
</template>

<script setup lang='ts'>
import { useThree } from "./index"
import { ref, watch, type Ref } from "vue"

const refEl = ref<HTMLDivElement>()
const oThree = useThree(refEl as Ref<HTMLDivElement>);

const isReal = useRealOrSolid()
const isShowGDP = ref(false)

// ----
function useRealOrSolid() {
  const isReal = ref(false);
  watch(isReal, () => {
    oThree.value?.switchRealOrSolidEarthBG(isReal.value)
  });
  return isReal;
}




</script>


<style>
.earth-3d .ant-switch-inner {
  background-color: #00aaaa;
}
</style>