<template>
  <svg class="svg-icon" :style="styles" focusable="false">
    <use :href="`#icon-${name}`"></use>
  </svg>
</template>

<script setup lang="ts">
defineOptions({ name: 'SvgIcon' })
import { isString } from '@/utils'
import type { CSSProperties } from 'vue'
import type { SvgIconProps } from './types'

const props = withDefaults(defineProps<SvgIconProps>(), {
  // color: 'currentColor',
  size: '1em',
})

/** 动态计算需要绑定的行内样式 */
const styles = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    fontSize: isString(props.size) ? props.size : `${props.size}px`,
  }
  if (props.color) style.color = props.color
  return style
})
</script>

<style lang="scss" scoped>
.svg-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.2em;
  fill: currentColor;
  overflow: hidden;
  outline: none;
}
</style>
