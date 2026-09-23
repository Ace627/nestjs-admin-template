<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['system:menu:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['system:menu:create']" plain type="primary" @click="handleCreate()">
          <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
        </el-button>
        <el-button plain type="info" @click="toggleExpandAll">
          <template #icon><SvgIcon name="Sort" /></template><span>{{ isExpandAll ? '折叠' : '展开' }}</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="system:menu" @refresh="getList" />
    </div>

    <ProTable v-if="refreshTable" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" row-key="id" :default-expand-all="isExpandAll">
      <template #menuName="{ row }">
        <SvgIcon v-if="row.icon" :name="row.icon" class="mr-4px" />
        <span>{{ row.menuName }}</span>
      </template>
      <template #menuType="{ row }">
        <el-tag v-if="row.menuType === 'M'" type="primary">目录</el-tag>
        <el-tag v-else-if="row.menuType === 'C'" type="success">菜单</el-tag>
        <el-tag v-else type="warning">按钮</el-tag>
      </template>
      <template #visible="{ row }">
        <DictTag v-if="row.menuType !== 'F'" :options="sys_menu_visible" :value="row.visible" />
      </template>
      <template #status="{ row }">
        <DictTag :options="sys_normal_disable" :value="row.status" />
      </template>
      <template #action="{ row }">
        <el-link v-permissions="['system:menu:create']" type="primary" @click="handleCreate(row)">新增下级</el-link>
        <el-link v-permissions="['system:menu:update']" type="primary" @click="handleEdit(row)">修改</el-link>
        <el-link v-permissions="['system:menu:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <!-- 菜单新增/编辑弹窗 -->
    <MenuDialog ref="menuDialogRef" @getList="getList" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import MenuDialog from './components/MenuDialog.vue'
import { MenuRequest } from '@/api/system/menu.request'
import type { Menu, ProSearchItem, ProTableColumn } from '@/types'

const menuDialogRef = useTemplateRef('menuDialogRef')
const list = ref<Menu.MenuItem[]>([])
const loading = ref(false)
/** 树表默认是否展开（default-expand-all 仅首次渲染生效，需销毁重建表格） */
const isExpandAll = ref(false)
const refreshTable = ref(true)
/** 菜单树查询参数（树表不分页） */
const queryParams = ref<Menu.MenuQuery>({})

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
]

const { sys_normal_disable, sys_menu_visible } = useDict('sys_normal_disable', 'sys_menu_visible')

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'menuName', label: '菜单名称' },
  { type: 'select', prop: 'menuType', label: '菜单类型', options: menuTypeOptions },
  { type: 'select', prop: 'status', label: '菜单状态', options: sys_normal_disable.value },
])
const columns: ProTableColumn<Menu.MenuItem>[] = [
  { align: 'left', label: '菜单名称', slot: 'menuName', minWidth: 180 },
  { align: 'center', label: '菜单类型', slot: 'menuType', width: 90 },
  { align: 'center', prop: 'menuSort', label: '显示排序', width: 90 },
  { align: 'center', prop: 'permission', label: '权限字符', showOverflowTooltip: true, minWidth: 180 },
  { align: 'center', prop: 'path', label: '路由地址', showOverflowTooltip: true, minWidth: 140 },
  { align: 'center', prop: 'component', label: '组件路径', showOverflowTooltip: true, minWidth: 160 },
  { align: 'center', label: '显示状态', slot: 'visible', width: 88 },
  { align: 'center', label: '菜单状态', slot: 'status', width: 88 },
  { align: 'center', prop: 'updateTime', label: '最近更新', minWidth: 170 },
  { align: 'center', label: '操作', slot: 'action', width: 180, fixed: 'right' },
]

async function getList() {
  try {
    loading.value = true
    list.value = await MenuRequest.findList(queryParams.value)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getList errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  getList()
}

function resetQuery() {
  queryParams.value = {}
  getList()
}

function handleCreate(row?: Menu.MenuItem) {
  menuDialogRef.value?.open('create', row)
}

function handleEdit(row: Menu.MenuItem) {
  menuDialogRef.value?.open('update', row)
}

async function handleDelete(row: Menu.MenuItem) {
  try {
    const { cancel } = await TipModal.confirm(`确定要删除「${row.menuName}」吗？`)
    if (cancel) return TipModal.msg('操作取消')
    await MenuRequest.delete({ ids: row.id })
    await getList()
    TipModal.msgSuccess('删除成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDelete errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 切换树表展开/折叠（default-expand-all 仅首次渲染生效，需销毁重建） */
function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => (refreshTable.value = true))
}

onMounted(getList)
</script>

<style lang="scss" scoped></style>
