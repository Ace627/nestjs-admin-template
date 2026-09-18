<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['system:dict:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery">
      <template #dictType="{ model, item }">
        <el-select v-model="model[item.prop]" placeholder="请选择字典类型" clearable @change="handleQuery">
          <el-option v-for="t in typeOptions" :key="t.id" :label="t.dictName" :value="t.dictType" />
        </el-select>
      </template>
    </ProSearch>

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['system:dict:create']" plain type="primary" @click="handleCreate" :disabled="!queryParams.dictType">
          <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
        </el-button>
        <el-button v-permissions="['system:dict:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
        <el-button plain type="warning" @click="handleClose">
          <template #icon><SvgIcon name="Close" /></template> <span>关闭</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="system:dict-data" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #dictLabel="{ row }">
        <el-tag v-if="row.listClass" :type="row.listClass">{{ row.dictLabel }}</el-tag>
        <span v-else>{{ row.dictLabel }}</span>
      </template>
      <template #status="{ row }">
        <DictTag :options="sys_normal_disable" :value="row.status" />
      </template>
      <template #action="{ row }">
        <el-link v-permissions="['system:dict:update']" type="primary" @click="handleEdit(row)">修改</el-link>
        <el-link v-permissions="['system:dict:delete']" type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="visible" :title="dialogTitle" :width="dialogWidth">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="字典类型" prop="dictType">
          <el-select v-model="form.dictType" placeholder="请选择" style="width: 100%" disabled>
            <el-option v-for="t in typeOptions" :key="t.id" :label="t.dictName" :value="t.dictType" />
          </el-select>
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input v-model.trim="form.dictLabel" placeholder="请输入字典标签" />
        </el-form-item>
        <el-form-item label="字典键值" prop="dictValue">
          <el-input v-model.trim="form.dictValue" placeholder="请输入字典键值" />
        </el-form-item>
        <el-form-item label="字典排序" prop="dictSort">
          <el-input-number v-model="form.dictSort" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="回显样式" prop="listClass">
          <el-select v-model="form.listClass" clearable>
            <el-option v-for="o in listClassOptions" :key="o.value" :label="o.label + '(' + o.value + ')'" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status" :options="sys_normal_disable" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
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
import { useDict } from '@/hooks/useDict'
import { DictRequest } from '@/api/system/dict.request'
import type { Dict, ProSearchItem, ProTableColumn } from '@/types'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const list = ref<Dict.DataItem[]>([])
const multipleSelection = ref<Dict.DataItem[]>([])
const total = ref(0)
const loading = ref(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const queryParams = ref<Dict.DataQuery>({ pageNo: 1, pageSize: 10 })
const typeOptions = ref<Dict.TypeItem[]>([])

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const visible = ref(false)
const dialogTitle = ref('新增字典数据')
const formRef = useTemplateRef('formRef')
const form = ref<Dict.DataForm>({ status: '1', dictSort: 1 })
const isEdit = computed(() => !!form.value.id)

const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))

// 数据标签回显样式（对齐云禾）
const listClassOptions = [
  { value: 'primary', label: '主要' },
  { value: 'success', label: '成功' },
  { value: 'info', label: '信息' },
  { value: 'warning', label: '警告' },
  { value: 'danger', label: '危险' },
]

const { sys_normal_disable } = useDict('sys_normal_disable')

const items = computed<ProSearchItem[]>(() => [
  { label: '字典类型', prop: 'dictType', type: 'select' },
  { label: '字典标签', prop: 'dictLabel', type: 'input' },
  { label: '字典状态', prop: 'status', type: 'select', options: sys_normal_disable.value },
])
const columns: ProTableColumn<Dict.DataItem>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', slot: 'dictLabel', label: '字典标签', showOverflowTooltip: true },
  { align: 'center', prop: 'dictValue', label: '字典键值', showOverflowTooltip: true },
  { align: 'center', prop: 'dictSort', label: '排序' },
  { align: 'center', prop: 'status', label: '状态', slot: 'status' },
  { align: 'center', prop: 'remark', label: '备注', showOverflowTooltip: true, width: 120 },
  { align: 'center', prop: 'createTime', label: '创建时间', width: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', minWidth: 120 },
]

const rules = {
  dictType: [{ required: true, message: '字典类型不能为空', trigger: 'change' }],
  dictLabel: [{ required: true, message: '字典标签不能为空', trigger: 'blur' }],
  dictValue: [{ required: true, message: '字典键值不能为空', trigger: 'blur' }],
  dictSort: [{ required: true, message: '字典排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

async function getTypeOptions() {
  try {
    const data = await DictRequest.findTypeList({ pageNo: 1, pageSize: 100 })
    typeOptions.value = data.records
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getTypeOptions errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

function handleClose() {
  router.replace({ path: '/system/dict' })
}

async function getList() {
  if (!queryParams.value.dictType) {
    list.value = []
    total.value = 0
    loading.value = false
    return
  }
  try {
    loading.value = true
    const data = await DictRequest.findDataList(queryParams.value)
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

function handleSelectionChange(row: Dict.DataItem[]) {
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
  queryParams.value.dictType = route.query.dictType as string
  handleQuery()
}

async function handleCreate() {
  form.value = { dictType: queryParams.value.dictType, dictSort: 1, status: '1' }
  dialogTitle.value = '新增字典数据'
  visible.value = true
}

async function handleEdit(row: Dict.DataItem) {
  try {
    const data = await DictRequest.findDataDetail({ id: row.id })
    form.value = { ...data }
    dialogTitle.value = '修改字典数据'
    visible.value = true
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleEdit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

async function handleDelete(row?: Dict.DataItem) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((i) => i.id).join(',')
    await DictRequest.deleteData({ ids })
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
    await formRef.value?.validate()
    if (isEdit.value) await DictRequest.updateData(form.value)
    else await DictRequest.createData(form.value)
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

onMounted(async () => {
  await getTypeOptions()
  if (route.query.dictType) {
    queryParams.value.dictType = route.query.dictType as string
    getList()
  }
})
</script>

<style lang="scss" scoped></style>
