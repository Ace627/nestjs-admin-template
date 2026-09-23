<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['system:dept:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['system:dept:create']" plain type="primary" @click="handleCreate()">
          <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
        </el-button>
        <el-button plain type="info" @click="toggleExpandAll">
          <template #icon><SvgIcon name="Sort" /></template><span>{{ isExpandAll ? '折叠' : '展开' }}</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="system:dept" @refresh="getList" />
    </div>

    <ProTable v-if="refreshTable" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" row-key="id" :default-expand-all="isExpandAll">
      <template #deptName="{ row }">
        <span class="dept-name">
          <SvgIcon :name="row.children?.length ? 'Company' : 'Dept'" :class="row.children?.length ? 'dept-name__icon' : 'dept-name__icon--leaf'" />
          <span>{{ row.deptName }}</span>
        </span>
        <DictTag v-if="row.status === '0'" :options="sys_normal_disable" :value="row.status" class="ml-6px" />
      </template>
      <template #status="{ row }">
        <DictTag :options="sys_normal_disable" :value="row.status" />
      </template>
      <template #action="{ row }">
        <el-link v-permissions="['system:dept:create']" type="primary" @click="handleCreate(row)">新增下级</el-link>
        <el-link v-permissions="['system:dept:update']" type="primary" @click="handleEdit(row)">修改</el-link>
        <el-link v-if="row.parentId !== '0'" v-permissions="['system:dept:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <!-- 部门新增/编辑弹窗 -->
    <DeptDialog ref="deptDialogRef" @getList="getList" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import DeptDialog from './components/DeptDialog.vue'
import { DeptRequest } from '@/api/system/dept.request'
import type { Dept, ProSearchItem, ProTableColumn } from '@/types'

const deptDialogRef = useTemplateRef('deptDialogRef')
const list = ref<Dept.DeptItem[]>([])
const loading = ref(false)
/** 树表默认是否展开（default-expand-all 仅首次渲染生效，需销毁重建表格） */
const isExpandAll = ref(false)
const refreshTable = ref(true)
/** 部门树查询参数（树表不分页） */
const queryParams = ref<Dept.DeptQuery>({})

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const { sys_normal_disable } = useDict('sys_normal_disable')

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'deptName', label: '部门名称' },
  { type: 'select', prop: 'status', label: '部门状态', options: sys_normal_disable.value },
])
const columns: ProTableColumn<Dept.DeptItem>[] = [
  { align: 'left', label: '部门名称', slot: 'deptName', minWidth: 200 },
  { align: 'center', prop: 'leader', label: '负责人', minWidth: 90 },
  { align: 'center', prop: 'phone', label: '联系电话', minWidth: 120 },
  { align: 'center', prop: 'deptSort', label: '显示排序', width: 90 },
  { align: 'center', label: '状态', slot: 'status', width: 80 },
  { align: 'center', prop: 'createTime', label: '创建时间', minWidth: 170 },
  { align: 'center', label: '操作', slot: 'action', width: 180, fixed: 'right' },
]

async function getList() {
  try {
    loading.value = true
    list.value = await DeptRequest.findList(queryParams.value)
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

function handleCreate(row?: Dept.DeptItem) {
  deptDialogRef.value?.open('create', row)
}

function handleEdit(row: Dept.DeptItem) {
  deptDialogRef.value?.open('update', row)
}

async function handleDelete(row: Dept.DeptItem) {
  try {
    const { cancel } = await TipModal.confirm(`确定要删除「${row.deptName}」吗？`)
    if (cancel) return TipModal.msg('操作取消')
    await DeptRequest.delete({ ids: row.id })
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

<style lang="scss" scoped>
.dept-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;

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
}
</style>
