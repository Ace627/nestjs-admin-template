<template>
  <template v-if="dictItem">
    <!-- 配置了回显样式：el-tag 渲染 -->
    <el-tag v-if="tagType" :type="tagType">{{ dictItem.label }}</el-tag>
    <!-- 未配置回显样式：纯文本 -->
    <span v-else>{{ dictItem.label }}</span>
  </template>
  <!-- 字典未配置或值无匹配：兜底显示原始值 -->
  <span v-else>{{ value || '-' }}</span>
</template>

<script setup lang="ts">
defineOptions({ name: 'DictTag' })
import type { DictSelectItem } from '@/hooks/useDict'

/** el-tag 支持的回显样式（dict 数据 listClass 字段取值须在此范围内） */
type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

const props = defineProps<{
  /** 字典选项列表（useDict 返回值） */
  options: DictSelectItem[]
  /** 当前字典值 */
  value?: string
}>()

const dictItem = computed(() => props.options.find((item) => item.dictValue === props.value))
const tagType = computed(() => dictItem.value?.listClass as TagType | undefined)
</script>
