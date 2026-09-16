<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['system:dict:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['system:dict:create']" plain type="primary" @click="handleCreate">
          <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
        </el-button>
        <el-button v-permissions="['system:dict:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
        <el-button v-permissions="['system:dict:refresh']" plain type="warning" :loading="refreshLoading" @click="handleClearCache">
          <template #icon><SvgIcon name="Refresh" /></template><span>刷新缓存</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="system:dict" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #status="{ row }">
        <DictTag :options="sys_normal_disable" :value="row.status" />
      </template>
      <template #action="{ row }">
        <el-link v-permissions="['system:dict:update']" type="primary" @click="handleEdit(row)">修改</el-link>
        <el-link type="primary" @click="handleDictData(row)">列表</el-link>
        <el-link v-permissions="['system:dict:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model.trim="form.dictName" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-input v-model.trim="form.dictType" placeholder="字母开头，仅含字母、数字与下划线" />
        </el-form-item>
        <el-form-item label="字典状态" prop="status">
          <el-radio-group v-model="form.status" :options="sys_normal_disable" />
        </el-form-item>
        <el-form-item label="字典备注" prop="remark">
          <el-input v-model.trim="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import { DictRequest } from '@/api/system/dict.request'
import { useDict, resetDictCache } from '@/hooks/useDict'
import type { Dict, ProSearchItem, ProTableColumn } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const list = ref<Dict.TypeItem[]>([])
const multipleSelection = ref<Dict.TypeItem[]>([])
const total = ref(0)
const loading = ref(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const queryParams = ref<Dict.TypeQuery>({ pageNo: 1, pageSize: 10 })

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const visible = ref(false)
const dialogTitle = ref('新增字典')
const formRef = useTemplateRef('formRef')
const form = ref<Dict.TypeForm>({ status: '1' })
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const isEdit = computed(() => !!form.value.id)

const { sys_normal_disable } = useDict('sys_normal_disable')
const refreshLoading = ref(false)

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'dictName', label: '字典名称' },
  { type: 'input', prop: 'dictType', label: '字典类型' },
  { type: 'select', prop: 'status', label: '状态', options: sys_normal_disable.value },
])
const columns: ProTableColumn<Dict.TypeItem>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'dictName', label: '字典名称', showOverflowTooltip: true, minWidth: 90 },
  { align: 'center', prop: 'dictType', label: '字典类型', showOverflowTooltip: true, minWidth: 180 },
  { align: 'center', prop: 'status', label: '状态', slot: 'status' },
  { align: 'center', prop: 'remark', label: '备注', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'createTime', label: '创建时间', minWidth: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 150 },
]

const rules = {
  dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  dictType: [
    { required: true, message: '字典类型不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '字典类型须以字母开头，仅含字母、数字与下划线', trigger: 'blur' },
  ],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

async function getList() {
  try {
    loading.value = true
    const data = await DictRequest.findTypeList(queryParams.value)
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

function handleSelectionChange(row: Dict.TypeItem[]) {
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
  form.value = { status: '1' }
  dialogTitle.value = '新增字典'
  visible.value = true
}

async function handleEdit(row: Dict.TypeItem) {
  try {
    const data = await DictRequest.findTypeDetail({ id: row.id })
    form.value = { ...data }
    dialogTitle.value = '修改字典'
    visible.value = true
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleEdit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

function handleDictData(row: Dict.TypeItem) {
  router.push({ path: '/system/dict/data', query: { dictType: row.dictType } })
}

async function handleClearCache() {
  try {
    refreshLoading.value = true
    await DictRequest.clearCache()
    resetDictCache()
    TipModal.msgSuccess('字典缓存刷新成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleClearCache errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    refreshLoading.value = false
  }
}

async function handleDelete(row?: Dict.TypeItem) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((i) => i.id).join(',')
    await DictRequest.deleteType({ ids })
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

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return
    if (isEdit.value) await DictRequest.updateType(form.value)
    else await DictRequest.createType(form.value)
    closeDialog()
    await getList()
    TipModal.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

function closeDialog() {
  visible.value = false
  formRef.value?.resetFields()
}

onMounted(getList)
</script>

<style lang="scss" scoped>
/** 表单 label 问号提示（参考若依 QuestionFilled 模式，纯 CSS 圆圈实现） */
.label-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 4px;
  border-radius: 50%;
  background-color: var(--el-text-color-placeholder);
  color: var(--el-color-white);
  font-size: 12px;
  line-height: 1;
  cursor: help;
  transform: translateY(-1px);
}
</style>
