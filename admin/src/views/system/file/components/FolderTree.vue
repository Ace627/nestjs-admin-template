<template>
  <div class="h-full flex flex-col">
    <div class="mb-12px flex items-center justify-between">
      <div class="flex items-center gap-4px">
        <SvgIcon name="Resource" />
        <span class="font-bold">目录结构</span>
      </div>
      <div class="flex items-center gap-8px">
        <el-tooltip content="返回根目录" placement="top">
          <SvgIcon name="FileManagement" class="cursor-pointer" @click="handleBackRoot" />
        </el-tooltip>
        <el-tooltip content="新建根目录" placement="top">
          <SvgIcon v-permissions="['system:file:create']" name="Plus" class="cursor-pointer" @click="emit('create', '0')" />
        </el-tooltip>
        <el-tooltip content="刷新" placement="top">
          <SvgIcon name="Refresh" class="cursor-pointer" @click="getTree" />
        </el-tooltip>
      </div>
    </div>
    <el-input v-model="filterText" placeholder="请输入目录名称" clearable>
      <template #prefix><SvgIcon name="Search" /></template>
    </el-input>
    <el-tree
      ref="treeRef"
      class="mt-12px flex-1 overflow-auto"
      :data="treeData"
      :props="{ label: 'fileName', children: 'children' }"
      node-key="id"
      highlight-current
      default-expand-all
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      @node-click="handleNodeClick"
    >
      <template #default="{ data }">
        <div class="group flex w-full items-center justify-between overflow-hidden">
          <span class="truncate">{{ data.fileName }}</span>
          <span class="hidden shrink-0 group-hover:inline-flex items-center gap-4px">
            <SvgIcon v-permissions="['system:file:create']" name="Plus" title="新建子目录" class="cursor-pointer text-14px" @click.stop="emit('create', data.id)" />
            <SvgIcon v-permissions="['system:file:update']" name="Edit" title="重命名" class="cursor-pointer text-14px" @click.stop="emit('rename', data)" />
            <SvgIcon v-permissions="['system:file:delete']" name="Delete" title="删除" class="cursor-pointer text-14px" @click.stop="emit('remove', data)" />
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import type { TreeNodeData } from 'element-plus'
import type { File } from '@/types'
import { FileRequest } from '@/api/system/file.request'

defineOptions({ name: 'FolderTree' })

/** 根节点虚拟 ID（与后端 DEFAULT_PARENT_ID 一致），仅作为回根目录的事件值 */
const ROOT_ID = '0'

const emit = defineEmits<{ nodeClick: [folderId: string]; create: [parentId: string]; rename: [node: File.TreeItem]; remove: [node: File.TreeItem] }>()

const treeData = ref<File.TreeItem[]>([])
const filterText = ref('')
const treeRef = useTemplateRef('treeRef')
let lastClickedId = ''

watch(filterText, (val) => treeRef.value?.filter(val))

function filterNode(value: string, data: TreeNodeData) {
  if (!value) return true
  return String(data.fileName).includes(value)
}

/** 点击节点按目录过滤；再次点击当前节点取消过滤（回到根目录直属内容） */
function handleNodeClick(data: File.TreeItem) {
  if (data.id === lastClickedId) {
    treeRef.value?.setCurrentKey(null)
    lastClickedId = ''
    emit('nodeClick', ROOT_ID)
    return
  }
  lastClickedId = data.id
  emit('nodeClick', data.id)
}

/** 返回根目录（清选中并查询根级内容） */
function handleBackRoot() {
  clearSelected()
  emit('nodeClick', ROOT_ID)
}

/** 刷新目录树并保持当前展开状态 */
async function getTree() {
  try {
    treeData.value = await FileRequest.findFolderTree()
    Object.values(treeRef.value?.store.nodesMap ?? {}).forEach((node) => (node.expanded = true))
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getTree errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 取消树选中高亮（当前目录被删除时由父组件调用） */
function clearSelected() {
  treeRef.value?.setCurrentKey(null)
  lastClickedId = ''
}

/** 设置树选中高亮（从列表进入目录时由父组件调用，保持与当前目录同步） */
function setSelected(folderId: string) {
  treeRef.value?.setCurrentKey(folderId)
  lastClickedId = folderId
}

onMounted(getTree)

defineExpose({ getTree, clearSelected, setSelected })
</script>
