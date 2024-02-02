<template>
  <div class="full relative map-3d">
    <div class="absolute top-4 left-8">
      <a-radio-group v-model:value="switchMap">
        <a-radio-button value="world">全球</a-radio-button>
        <a-radio-button value="china">中国</a-radio-button>
        <a-radio-button value="shandong">山东</a-radio-button>
      </a-radio-group>
      <a-switch checkedChildren="3D" unCheckedChildren="2D" v-model:checked="is3D" />
    </div>
    <div class="full" ref="refEl"></div>
  </div>
</template>

<script setup lang='ts'>
import { useThree } from "./index"
import { ref, watch, type Ref } from "vue"

const refEl = ref<HTMLDivElement>()
const oThree = useThree(refEl as Ref<HTMLDivElement>);

function drawMap() {
  oThree.value?.clearMap();
  oThree.value?.drawMap(`/map3d/${switchMap.value}.json`, is3D.value, {extrudeHeight: 1});
  // if (switchMap.value === 'world') {
  //   oThree.value?.drawMap(`/map3d/${switchMap.value}.json`, is3D.value, {extrudeHeight: 10});
  // } else if (switchMap.value = 'china') {
  //   oThree.value?.drawMap(`/map3d/${switchMap.value}.json`, is3D.value, {extrudeHeight: 5});
  // } else {
  //   oThree.value?.drawMap(`/map3d/${switchMap.value}.json`, is3D.value, {extrudeHeight: 1});
  // }
}

// 初始化
watch(oThree, () => {
  drawMap();
});

const switchMap = ref('shandong');
const is3D = ref(true);
watch([switchMap, is3D], () => {
  drawMap();
});
</script>


<style>
.earth-3d .ant-switch-inner {
  background-color: #00aaaa;
}
</style>