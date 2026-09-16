<template>
  <div class="app-content flex h-full gap-16px" :class="{ 'flex-col': appStore.isMobile }">
    <!-- 左侧部门树 -->
    <el-card shadow="never" class="dept-tree-card w-240px shrink-0" :class="{ 'is-mobile': appStore.isMobile }" body-class="h-full">
      <DeptTree ref="deptTreeRef" @node-click="handleDeptClick" />
    </el-card>

    <!-- 右侧用户列表 -->
    <div class="flex flex-col flex-1 min-w-0">
      <ProSearch v-show="showSearch" v-permissions="['system:user:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

      <div class="mb-16px flex items-center justify-between">
        <div>
          <el-button v-permissions="['system:user:create']" plain type="primary" @click="handleCreate">
            <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
          </el-button>
          <el-button v-permissions="['system:user:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
            <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
          </el-button>
        </div>
        <RightToolbar
          v-model:show-search="showSearch"
          v-model:hidden-column-keys="hiddenColumnKeys"
          :columns="columns"
          storage-key="system:user"
          @refresh="getList"
        />
      </div>

      <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
        <template #gender="{ row }">
          <DictTag :options="sys_user_sex" :value="row.gender" />
        </template>
        <template #status="{ row }">
          <DictTag :options="sys_normal_disable" :value="row.status" />
        </template>
        <template #action="{ row }">
          <el-link v-permissions="['system:user:update']" type="primary" @click="handleEdit(row)">修改</el-link>
          <el-link v-permissions="['system:user:update']" type="primary" @click="handleResetPwd(row)">重置密码</el-link>
          <el-link v-permissions="['system:user:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
        </template>
      </ProTable>

      <ProPagination :total v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </div>

    <!-- 用户新增/编辑弹窗 -->
    <UserDialog ref="userDialogRef" @getList="getList" />
    <!-- 重置密码弹窗 -->
    <ResetPwdDialog ref="resetPwdDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import { useDict } from '@/hooks/useDict'
import DeptTree from './components/DeptTree.vue'
import UserDialog from './components/UserDialog.vue'
import { UserRequest } from '@/api/system/user.request'
import ResetPwdDialog from './components/ResetPwdDialog.vue'
import type { User, ProSearchItem, ProTableColumn } from '@/types'

const list = ref<User.SysUser[]>([])
const multipleSelection = ref<User.SysUser[]>([])
const total = ref(0)
const loading = ref(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const userDialogRef = useTemplateRef('userDialogRef')
const resetPwdDialogRef = useTemplateRef('resetPwdDialogRef')
const deptTreeRef = useTemplateRef('deptTreeRef')
const queryParams = ref<User.UserQuery>({ pageNo: 1, pageSize: 10 })
const appStore = useAppStore()

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'username', label: '用户账号' },
  { type: 'input', prop: 'nickname', label: '用户昵称' },
  { type: 'input', prop: 'phone', label: '手机号码' },
  { type: 'select', prop: 'status', label: '用户状态', options: sys_normal_disable.value },
])
const columns: ProTableColumn<User.SysUser>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'username', label: '用户账号', showOverflowTooltip: true, minWidth: 100 },
  { align: 'center', prop: 'nickname', label: '用户昵称', showOverflowTooltip: true, minWidth: 90 },
  { align: 'center', prop: 'phone', label: '手机号码', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'email', label: '用户邮箱', showOverflowTooltip: true, minWidth: 170 },
  { align: 'center', prop: 'gender', label: '性别', slot: 'gender', width: 80 },
  { align: 'center', prop: 'status', label: '状态', slot: 'status', width: 80 },
  { align: 'center', prop: 'createTime', label: '创建时间', minWidth: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 190 },
]

async function getList() {
  try {
    loading.value = true
    const data = await UserRequest.findList(queryParams.value)
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

function handleSelectionChange(row: User.SysUser[]) {
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
  delete queryParams.value.deptId
  deptTreeRef.value?.clearSelected()
  handleQuery()
}

/** 点击部门树节点：按该部门及其子孙部门过滤；传空表示查全部 */
function handleDeptClick(deptId: string) {
  if (deptId) queryParams.value.deptId = deptId
  else delete queryParams.value.deptId
  handleQuery()
}

function handleCreate() {
  userDialogRef.value?.open()
}

function handleEdit(row: User.SysUser) {
  userDialogRef.value?.open(row)
}

function handleResetPwd(row: User.SysUser) {
  resetPwdDialogRef.value?.open(row)
}

async function handleDelete(row?: User.SysUser) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((i) => i.id).join(',')
    await UserRequest.delete({ ids })
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

<style lang="scss" scoped>
.dept-tree-card {
  display: flex;
  flex-direction: column;
  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  &.is-mobile {
    width: 100%;
    max-height: 240px;
  }
}
</style>
