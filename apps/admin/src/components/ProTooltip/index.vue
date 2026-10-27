<template>
  <!-- 透传所有 el-tooltip 属性，完全兼容原生用法 -->
  <el-tooltip v-bind="$attrs" :show-after="320" :disabled>
    <!-- 触发元素插槽，和原生一致 -->
    <slot>{{ displayText }}</slot>
    <!-- 自定义内容插槽，处理换行和宽度 -->
    <template #content>
      <div class="pro-tooltip-content" :style="{ maxWidth: contentMaxWidth }">
        <!-- 优先使用 content 插槽，其次支持原生 content 属性 -->
        <slot name="content"> {{ props.content }} </slot>
      </div>
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
defineOptions({ name: 'ProTooltip' })

const props = defineProps({
  /** 提示框宽度 */
  width: { type: [String, Number], default: 320 },
  /** 透传 el-tooltip 的 content 属性，兼容原生用法 */
  content: { type: String, default: '' },
  /** 触发文字最大显示字数（超出自动...），0 表示不截断 */
  length: { type: Number, default: 0 },
  /** 省略符号 */
  ellipsis: { type: String, default: '...' },
})

// 计算：显示的截取文字
const displayText = computed(() => {
  const text = props.content || ''
  if (!props.length || text.length <= props.length) return text
  return text.slice(0, props.length) + props.ellipsis
})

/** 是否禁用提示框：无 content 或截断场景下文字未超限时禁用 */
const disabled = computed(() => {
  const text = props.content || ''
  if (!text) return true
  return props.length > 0 && text.length <= props.length
})

const contentMaxWidth = computed(() => {
  return typeof props.width === 'number' ? `${props.width}px` : props.width
})
</script>

<style lang="scss" scoped>
/* 核心样式：自动换行 + 阅读优化 */
.pro-tooltip-content {
  text-align: justify;
  white-space: pre-wrap; /* 保留文本换行，超过宽度自动折行 */
  word-break: break-word; /* 长英文/数字自动换行，避免溢出 */
  line-height: 1.5; /* 行高优化，提升可读性 */
}
</style>
