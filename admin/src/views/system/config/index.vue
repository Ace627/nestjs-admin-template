<template>
  <div class="app-content flex flex-col h-full">
    <ProSearch v-show="showSearch" v-permissions="['system:config:query']" :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px flex items-center justify-between">
      <div>
        <el-button v-permissions="['system:config:create']" plain type="primary" @click="handleCreate">
          <template #icon><SvgIcon name="Plus" /></template><span>新增</span>
        </el-button>
        <el-button v-permissions="['system:config:delete']" plain type="danger" @click="handleDelete()" :disabled="!isMultiple">
          <template #icon><SvgIcon name="Delete" /></template><span>批量删除</span>
        </el-button>
        <el-button v-permissions="['system:config:refresh']" plain type="warning" :loading="refreshLoading" @click="handleClearCache">
          <template #icon><SvgIcon name="Refresh" /></template><span>刷新缓存</span>
        </el-button>
      </div>
      <RightToolbar v-model:show-search="showSearch" v-model:hidden-column-keys="hiddenColumnKeys" :columns="columns" storage-key="system:config" @refresh="getList" />
    </div>

    <ProTable ref="tableRef" v-loading="loading" :data="list" :columns="columns" :hidden-column-keys="hiddenColumnKeys" @selection-change="handleSelectionChange">
      <template #configValue="{ row }">
        <span class="break-all">{{ row.configValue }}</span>
      </template>
      <template #configType="{ row }">
        <el-tag :type="row.configType === 'Y' ? 'danger' : 'info'">{{ row.configType === 'Y' ? '内置' : '非内置' }}</el-tag>
      </template>
      <template #action="{ row }">
        <el-link v-permissions="['system:config:update']" type="primary" @click="handleEdit(row)">修改</el-link>
        <el-link v-permissions="['system:config:delete']" :type="row.configType === 'Y' ? 'info' : 'primary'" :disabled="row.configType === 'Y'" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <ProPagination :total v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model.trim="form.configName" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model.trim="form.configKey" placeholder="字母开头，仅含字母、数字、点与下划线" :disabled="isBuiltin && isEdit" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input v-model.trim="form.configValue" placeholder="请输入参数键值" />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType" :disabled="isBuiltin && isEdit">
            <el-radio value="Y">内置</el-radio>
            <el-radio value="N">非内置</el-radio>
          </el-radio-group>
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
defineOptions({ name: 'Config' })
import { TipModal } from '@/utils'
import { ConfigRequest } from '@/api/system/config.request'
import type { Config, ProSearchItem, ProTableColumn } from '@/types'

const appStore = useAppStore()
const list = ref<Config.Item[]>([])
const multipleSelection = ref<Config.Item[]>([])
const total = ref(0)
const loading = ref(true)
const isMultiple = computed(() => multipleSelection.value.length > 0)
const tableRef = useTemplateRef('tableRef')
const queryParams = ref<Config.Query>({ pageNo: 1, pageSize: 10 })

/** 搜索区域显隐（RightToolbar v-model 控制） */
const showSearch = ref(true)
/** 隐藏列 key 数组（RightToolbar v-model 控制） */
const hiddenColumnKeys = ref<string[]>([])

const visible = ref(false)
const dialogTitle = ref('新增参数')
const formRef = useTemplateRef('formRef')
const form = ref<Config.Form>({ configType: 'N' })
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const isEdit = computed(() => !!form.value.id)
/** 内置参数：键名/内置标识不可改，不可删除 */
const isBuiltin = computed(() => form.value.configType === 'Y')

const configTypeOptions = [
  { label: '内置', value: 'Y' },
  { label: '非内置', value: 'N' },
]

const refreshLoading = ref(false)

const items = computed<ProSearchItem[]>(() => [
  { type: 'input', prop: 'configName', label: '参数名称' },
  { type: 'input', prop: 'configKey', label: '参数键名' },
  { type: 'select', prop: 'configType', label: '系统内置', options: configTypeOptions },
])
const columns: ProTableColumn<Config.Item>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'configName', label: '参数名称', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'configKey', label: '参数键名', showOverflowTooltip: true, minWidth: 180 },
  { align: 'center', prop: 'configValue', label: '参数键值', slot: 'configValue', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'configType', label: '系统内置', slot: 'configType', width: 90 },
  { align: 'center', prop: 'remark', label: '备注', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'createTime', label: '创建时间', minWidth: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 130 },
]

const rules = {
  configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
  configKey: [
    { required: true, message: '参数键名不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_.]*$/, message: '参数键名须以字母开头，仅含字母、数字、点与下划线', trigger: 'blur' },
  ],
  configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }],
}

async function getList() {
  try {
    loading.value = true
    const data = await ConfigRequest.findList(queryParams.value)
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

function handleSelectionChange(row: Config.Item[]) {
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
  form.value = { configType: 'N' }
  dialogTitle.value = '新增参数'
  visible.value = true
}

async function handleEdit(row: Config.Item) {
  try {
    const data = await ConfigRequest.findDetail({ id: row.id })
    form.value = { ...data }
    dialogTitle.value = '修改参数'
    visible.value = true
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleEdit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

async function handleClearCache() {
  try {
    refreshLoading.value = true
    await ConfigRequest.clearCache()
    TipModal.msgSuccess('参数缓存刷新成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleClearCache errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    refreshLoading.value = false
  }
}

async function handleDelete(row?: Config.Item) {
  try {
    const { cancel } = await TipModal.confirm('确定要删除选中的数据吗？')
    if (cancel) return TipModal.msg('操作取消')
    const ids = row ? row.id : multipleSelection.value.map((i) => i.id).join(',')
    await ConfigRequest.delete({ ids })
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
    if (isEdit.value) await ConfigRequest.update(form.value)
    else await ConfigRequest.create(form.value)
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
