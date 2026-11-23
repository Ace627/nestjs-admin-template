<template>
  <el-dialog v-model="visible" title="重命名文件" :close-on-click-modal="false" width="480px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="文件名称" prop="baseName">
        <el-input v-model.trim="form.baseName" placeholder="请输入文件名" :maxlength="255 - fileExt.length" @keyup.enter="handleSubmit">
          <template v-if="fileExt" #append>{{ fileExt }}</template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'FileRenameDialog' })
import { TipModal } from '@/utils'
import type { File } from '@/types'
import { FileRequest } from '@/api/system/file.request'

const emit = defineEmits<{ success: [] }>()

const visible = ref(false)
const form = reactive({ id: '', baseName: '' })
/** 扩展名不可修改：拆出来固定展示在输入框后缀，提交时原样拼回 */
const fileExt = ref('')
const formRef = useTemplateRef('formRef')

const rules = {
  baseName: [{ required: true, message: '文件名称不能为空', trigger: 'blur' }],
}

/** 打开弹窗：预填当前文件名，并剥离扩展名单独锁定 */
function open(row: File.Item) {
  form.id = row.id
  fileExt.value = row.fileExt ?? ''
  const hasLockedExt = fileExt.value && row.fileName.toLowerCase().endsWith(fileExt.value.toLowerCase())
  form.baseName = hasLockedExt ? row.fileName.slice(0, -fileExt.value.length) : row.fileName
  visible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    await FileRequest.updateFile({ id: form.id, fileName: `${form.baseName}${fileExt.value}` })
    closeDialog()
    emit('success')
    TipModal.msgSuccess('修改成功')
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

defineExpose({ open })
</script>

<style lang="scss" scoped></style>
