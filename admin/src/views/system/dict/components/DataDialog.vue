<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="字典类型">
        <el-input :model-value="dictType" disabled />
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
          <el-option v-for="option in listClassOptions" :key="option.value" :label="option.label + '(' + option.value + ')'" :value="option.value" />
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
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'DictDataDialog' })
import { TipModal } from '@/utils'
import { DictRequest } from '@/api/system/dict.request'
import { useDict } from '@/hooks/useDict'
import type { Dict } from '@/types'
import type { FormRules } from 'element-plus'

const props = defineProps<{ dictType?: string }>()
const emit = defineEmits<{ success: [] }>()

const appStore = useAppStore()
const visible = ref(false)
const formRef = useTemplateRef('formRef')
const form = ref<Dict.DataForm>({})
const isEdit = computed(() => !!form.value.id)
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isEdit.value ? '修改字典数据' : '新增字典数据'))

const { sys_normal_disable } = useDict('sys_normal_disable')

// 数据标签回显样式
const listClassOptions = [
  { value: 'primary', label: '主要' },
  { value: 'success', label: '成功' },
  { value: 'info', label: '信息' },
  { value: 'warning', label: '警告' },
  { value: 'danger', label: '危险' },
]

const rules: FormRules<Dict.DataForm> = {
  dictLabel: [{ required: true, message: '字典标签不能为空', trigger: 'blur' }],
  dictValue: [{ required: true, message: '字典键值不能为空', trigger: 'blur' }],
  dictSort: [{ required: true, message: '字典排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

/** 打开弹窗（传 record 为编辑模式，不传为新增模式） */
async function open(record?: Dict.DataItem) {
  visible.value = true
  if (record?.id) {
    form.value = { ...(await DictRequest.findDataDetail({ id: record.id })) }
  } else {
    form.value = { dictSort: 1, status: '1' }
  }
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    form.value.dictType = props.dictType
    if (isEdit.value) await DictRequest.updateData(form.value)
    else await DictRequest.createData(form.value)
    visible.value = false
    emit('success')
    TipModal.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

defineExpose({ open })
</script>
