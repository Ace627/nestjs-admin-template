<template>
  <el-dialog v-model="visible" title="移动到" :close-on-click-modal="false" width="420px">
    <el-tree
      ref="treeRef"
      class="max-h-320px overflow-auto"
      :data="treeData"
      :props="{ label: 'fileName', children: 'children' }"
      node-key="id"
      highlight-current
      default-expand-all
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
    >
      <template #default="{ data }">
        <div class="flex items-center gap-4px">
          <SvgIcon name="Resource" />
          <span>{{ data.fileName }}</span>
        </div>
      </template>
    </el-tree>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'FileMoveDialog' })
import { TipModal } from '@/utils'
import type { File } from '@/types'
import { FileRequest } from '@/api/system/file.request'

const emit = defineEmits<{ success: [] }>()

/** 根节点虚拟 ID（与后端 DEFAULT_PARENT_ID 一致） */
const ROOT_ID = '0'

const visible = ref(false)
const moveIds = ref('')
const targetParentId = ref(ROOT_ID)
const rawTree = ref<File.TreeItem[]>([])
const treeRef = useTemplateRef('treeRef')

/** 树顶补一个根目录节点供选择 */
const treeData = computed(() => [{ id: ROOT_ID, fileName: '根目录', children: rawTree.value }])

/** 打开弹窗：ids 为逗号拼接的待移动 ID，currentParentId 用于默认选中当前所在目录 */
async function open(ids: string, currentParentId?: string) {
  moveIds.value = ids
  targetParentId.value = currentParentId || ROOT_ID
  visible.value = true
  try {
    rawTree.value = await FileRequest.findFolderTree()
    await nextTick()
    treeRef.value?.setCurrentKey(targetParentId.value)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('open errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

function handleNodeClick(data: File.TreeItem) {
  targetParentId.value = data.id
}

async function handleSubmit() {
  try {
    await FileRequest.move({ ids: moveIds.value, targetParentId: targetParentId.value })
    closeDialog()
    emit('success')
    TipModal.msgSuccess('移动成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

function closeDialog() {
  visible.value = false
}

defineExpose({ open })
</script>
