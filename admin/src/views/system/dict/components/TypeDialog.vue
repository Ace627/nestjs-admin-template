<template>
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
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'DictTypeDialog' })
import { TipModal } from '@/utils'
import { DictRequest } from '@/api/system/dict.request'
import { useDict } from '@/hooks/useDict'
import type { Dict } from '@/types'
import type { FormRules } from 'element-plus'

const emit = defineEmits<{ success: [form: Dict.TypeForm] }>()

const appStore = useAppStore()
const visible = ref(false)
const formRef = useTemplateRef('formRef')
const form = ref<Dict.TypeForm>({})
const isEdit = computed(() => !!form.value.id)
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isEdit.value ? '修改字典' : '新增字典'))

const { sys_normal_disable } = useDict('sys_normal_disable')

const rules: FormRules<Dict.TypeForm> = {
  dictName: [{ required: true, message: '字典名称不能为空', trigger: 'blur' }],
  dictType: [
    { required: true, message: '字典类型不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '字典类型须以字母开头，仅含字母、数字与下划线', trigger: 'blur' },
  ],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

/** 打开弹窗（传 record 为编辑模式，不传为新增模式） */
async function open(record?: Dict.TypeItem) {
  visible.value = true
  if (record?.id) {
    form.value = { ...(await DictRequest.findTypeDetail({ id: record.id })) }
  } else {
    form.value = { status: '1' }
  }
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    if (isEdit.value) await DictRequest.updateType(form.value)
    else await DictRequest.createType(form.value)
    visible.value = false
    emit('success', { ...form.value })
    TipModal.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

defineExpose({ open })
</script>
