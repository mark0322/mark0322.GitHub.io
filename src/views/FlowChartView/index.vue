<template>
  <div class="full">
    <div class="full" ref="refEl"></div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, type Ref } from "vue";
import InitThree, { useThree } from './three/index';
import { defer, get } from 'lodash-es';
import {RESTORE_END} from './three/constants';
import type { Point, Device } from '@/types';
import { flyLineData } from './three/config';

const refEl = ref<HTMLDivElement>();
const oThree = useThree(refEl as Ref<HTMLDivElement>);

// console.log('oThree.value', oThree.value)
onMounted(() => {

  oThree.value?.drawFlylinesByMode(flyLineData.stationDischarge)
})



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
