<template>
  <div class="full relative">
    <div class="full" ref="refEl"></div>
  </div>
</template>

<script setup lang='ts'>
import { useThree } from "./index"
import { ref, type Ref } from "vue"

const refEl = ref<HTMLDivElement>()
const three = useThree(refEl as Ref<HTMLDivElement>);

</script>
