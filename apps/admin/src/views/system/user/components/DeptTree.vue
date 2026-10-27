<template>
  <div class="h-full flex flex-col">
    <div class="mb-12px flex items-center justify-between">
      <div class="flex items-center gap-4px">
        <SvgIcon name="Dept" />
        <span class="font-bold">组织机构</span>
      </div>
      <div class="flex items-center gap-8px">
        <el-tooltip :content="isExpandAll ? '收起全部' : '展开全部'" placement="top">
          <SvgIcon :name="isExpandAll ? 'ArrowUp' : 'ArrowDown'" class="cursor-pointer" @click="toggleExpandAll" />
        </el-tooltip>
        <el-tooltip content="刷新" placement="top">
          <SvgIcon name="Refresh" class="cursor-pointer" @click="handleRefresh" />
        </el-tooltip>
      </div>
    </div>
    <el-input v-model="filterText" placeholder="请输入部门名称" clearable>
      <template #prefix><SvgIcon name="Search" /></template>
    </el-input>
    <el-tree
      ref="treeRef"
      class="dept-tree mt-12px flex-1 overflow-auto"
      :data="treeData"
      :props="{ label: 'deptName', children: 'children' }"
      node-key="id"
      highlight-current
      default-expand-all
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="dept-node">
          <SvgIcon :name="data.children?.length ? 'Company' : 'Dept'" :class="data.children?.length ? 'dept-node__icon' : 'dept-node__icon--leaf'" />
          <span class="dept-node__label">{{ node.label }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import type { Dept } from '@/types'
import { DeptRequest } from '@/api/system/dept.request'
import type { TreeNodeData, TreeStoreNodesMap } from 'element-plus'

const emit = defineEmits<{ nodeClick: [deptId: string] }>()
const treeData = ref<Dept.DeptItem[]>([])
const filterText = ref('')
const isExpandAll = ref(true)
const treeRef = useTemplateRef('treeRef')
let lastClickedId = ''

watch(filterText, (keyword) => treeRef.value?.filter(keyword))

function filterNode(value: string, data: TreeNodeData) {
  if (!value) return true
  return String(data.deptName).includes(value)
}

/** 点击节点按部门过滤；再次点击当前节点取消过滤 */
function handleNodeClick(data: Dept.DeptItem) {
  if (data.id === lastClickedId) {
    treeRef.value?.setCurrentKey(null)
    lastClickedId = ''
    emit('nodeClick', '')
    return
  }
  lastClickedId = data.id
  emit('nodeClick', data.id)
}

/** 展开/收起全部节点（遍历 el-tree 内部节点表置 expanded） */
function toggleExpandAll() {
  isExpandAll.value = !isExpandAll.value
  const nodesMap: TreeStoreNodesMap | undefined = treeRef.value?.store.nodesMap
  if (!nodesMap) return
  Object.values(nodesMap).forEach((node) => (node.expanded = isExpandAll.value))
}

/** 刷新部门树并保持当前展开状态 */
async function handleRefresh() {
  try {
    treeData.value = await DeptRequest.findTree()
    const nodesMap: TreeStoreNodesMap | undefined = treeRef.value?.store.nodesMap
    if (nodesMap) Object.values(nodesMap).forEach((node) => (node.expanded = isExpandAll.value))
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleRefresh errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 取消树选中高亮（供父组件重置查询时调用） */
function clearSelected() {
  treeRef.value?.setCurrentKey(null)
  lastClickedId = ''
}

async function getTree() {
  try {
    treeData.value = await DeptRequest.findTree()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getTree errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

onMounted(getTree)

defineExpose({ clearSelected })
</script>

<style lang="scss" scoped>
.dept-tree {
  --el-tree-node-content-height: 32px;
  --el-tree-node-hover-bg-color: var(--el-color-primary-light-9);

  :deep(.el-tree-node__content) {
    border-radius: 6px;
    margin-bottom: 2px;
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: var(--el-color-primary-light-9);

    .dept-node__label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

.dept-node {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;

  &__icon {
    flex-shrink: 0;
    font-size: 15px;
    color: var(--el-color-warning);
  }

  &__icon--leaf {
    flex-shrink: 0;
    font-size: 15px;
    color: var(--el-color-info);
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }
}
</style>
