<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['system:role:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['system:role:create']" plain type="primary" @click="handleCreate">
          <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
        </el-button>
        <el-button v-permissions="['system:role:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="system:role" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #status="{ row }">
        <template v-if="row.roleCode !== 'admin' && ['0', '1'].includes(row.status)">
          <el-switch v-permissions="['system:role:update']" v-model="row.status" size="small" inline-prompt active-value="1" inactive-value="0" @click="handleChangeStatus(row)" />
        </template>
      </template>
      <template #action="{ row }">
        <template v-if="row.roleCode !== 'admin'">
          <el-link v-permissions="['system:role:update']" type="primary" @click="handleEdit(row)">修改</el-link>
          <el-link v-permissions="['system:role:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
          <el-link v-permissions="['system:role:update']" type="primary" @click="handleAuth(row)">授权</el-link>
          <el-link v-permissions="['system:role:update']" type="primary" @click="handleDataScope(row)">数据权限</el-link>
        </template>
      </template>
    </ProTable>

    <ProPagination :total v-model:current-page="queryParams.pageNo" v-model:page-size="queryParams.pageSize" @pagination="getList" />

    <!-- 角色新增/编辑弹窗 -->
    <RoleDialog ref="roleDialogRef" @getList="getList" />
    <!-- 角色权限分配抽屉 -->
    <AuthPermission ref="authPermissionRef" @getList="getList" />
    <!-- 角色数据权限分配弹窗 -->
    <DataScopeDialog ref="dataScopeDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import RoleDialog from './components/RoleDialog.vue'
import { RoleRequest } from '@/api/system/role.request'
import AuthPermission from './components/AuthPermission.vue'
import DataScopeDialog from './components/DataScopeDialog.vue'
import type { Role, ProSearchItem, ProTableColumn } from '@/types'

const list = ref<Role.RoleItem[]>([])
const multipleSelection = ref<Role.RoleItem[]>([])
const total = ref(0)
const loading = ref(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const roleDialogRef = useTemplateRef('roleDialogRef')
const authPermissionRef = useTemplateRef('authPermissionRef')
const dataScopeDialogRef = useTemplateRef('dataScopeDialogRef')
const queryParams = ref<Role.RoleQuery>({ pageNo: 1, pageSize: 10 })

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const { sys_normal_disable } = useDict('sys_normal_disable')

const items: ProSearchItem[] = [
  { type: 'input', prop: 'roleCode', label: '角色编码' },
  { type: 'input', prop: 'roleName', label: '角色名称' },
  { type: 'select', prop: 'status', label: '角色状态', options: sys_normal_disable },
]
const columns: ProTableColumn<Role.RoleItem>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'roleCode', label: '角色编码', showOverflowTooltip: true, minWidth: 100 },
  { align: 'center', prop: 'roleName', label: '角色名称', showOverflowTooltip: true, minWidth: 110 },
  { align: 'center', prop: 'roleSort', label: '排序', width: 72 },
  { align: 'center', label: '状态', slot: 'status', width: 80 },
  { align: 'center', prop: 'remark', label: '备注', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'createTime', label: '创建时间', minWidth: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 220 },
]

async function getList() {
  try {
    loading.value = true
    const data = await RoleRequest.findList(queryParams.value)
    list.value = data.records
    total.value = data.total
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getList errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(row: Role.RoleItem[]) {
  multipleSelection.value = row
}

function handleQuery() {
  if (loading.value) return TipModal.msgWarning('正在查询中，请勿重复操作')
  queryParams.value.pageNo = 1
  multipleSelection.value = []
  tableRef.value?.clearSelection()
  getList()
}

function resetQuery() {
  handleQuery()
}

function handleCreate() {
  roleDialogRef.value?.open()
}

function handleEdit(row: Role.RoleItem) {
  roleDialogRef.value?.open(row)
}

/** 打开权限分配抽屉 */
function handleAuth(row: Role.RoleItem) {
  authPermissionRef.value?.open(row)
}

/** 打开数据权限分配弹窗 */
function handleDataScope(row: Role.RoleItem) {
  dataScopeDialogRef.value?.open(row)
}

/** 切换角色状态（取消或失败时回滚开关） */
async function handleChangeStatus(row: Role.RoleItem) {
  // @click 先于 change 派发，此时 v-model 可能尚未翻转，显式计算目标值，不依赖切换时序
  const targetStatus = row.status === '1' ? '0' : '1'
  const actionText = targetStatus === '1' ? '启用' : '停用'
  try {
    const { cancel } = await TipModal.confirm(`确认要${actionText}「${row.roleName}」角色吗？`)
    if (cancel) throw new Error('cancel')
    await RoleRequest.changeStatus({ id: row.id, status: targetStatus })
    row.status = targetStatus
    TipModal.msgSuccess(`${actionText}成功`)
  } catch (error: unknown) {
    row.status = targetStatus === '1' ? '0' : '1' // 回滚（含组件自动翻转与接口失败两种情况）
    if (error instanceof Error && error.message === 'cancel') return TipModal.msg('操作取消')
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleChangeStatus errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

async function handleDelete(row?: Role.RoleItem) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((i) => i.id).join(',')
    await RoleRequest.delete({ ids })
    if (list.value.length <= 1) queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    await getList()
    TipModal.msgSuccess('删除成功')
    if (!row) {
      multipleSelection.value = []
      tableRef.value?.clearSelection()
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDelete errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

onMounted(getList)
</script>

<style lang="scss" scoped></style>
