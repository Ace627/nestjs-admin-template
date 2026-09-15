<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" width="480px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="目录名称" prop="fileName">
        <el-input v-model.trim="form.fileName" placeholder="请输入目录名称" maxlength="255" @keyup.enter="handleSubmit" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'FolderDialog' })
import { TipModal } from '@/utils'
import type { File } from '@/types'
import { FileRequest } from '@/api/system/file.request'

const emit = defineEmits<{ success: [] }>()

const visible = ref(false)
const isEdit = ref(false)
const form = ref<File.FolderForm>({})
const formRef = useTemplateRef('formRef')

const dialogTitle = computed(() => (isEdit.value ? '重命名目录' : '新建目录'))

const rules = {
  fileName: [{ required: true, message: '目录名称不能为空', trigger: 'blur' }],
}

/** 打开弹窗：mode=create 需传 parentId；mode=rename 需传目录节点 */
function open(mode: 'create' | 'rename', parentId?: string, node?: File.TreeItem) {
  isEdit.value = mode === 'rename'
  form.value = isEdit.value ? { id: node?.id, fileName: node?.fileName } : { parentId, fileName: '' }
  visible.value = true
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return
    if (isEdit.value) await FileRequest.updateFolder(form.value)
    else await FileRequest.createFolder(form.value)
    closeDialog()
    emit('success')
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

defineExpose({ open })
</script>
