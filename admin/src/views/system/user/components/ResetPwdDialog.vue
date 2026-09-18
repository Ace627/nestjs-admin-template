<template>
  <el-dialog v-model="visible" title="重置密码" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="用户账号" prop="username">
        <el-input :model-value="form.username" disabled />
      </el-form-item>
      <el-form-item label="新密码" prop="password">
        <el-input v-model.trim="form.password" type="password" placeholder="请输入新密码" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="repeatPassword">
        <el-input v-model.trim="form.repeatPassword" type="password" placeholder="请再次输入新密码" show-password />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'ResetPwdDialog' })
import { TipModal } from '@/utils'
import type { User } from '@/types'
import { UserRequest } from '@/api/system/user.request'
import type { FormRules } from 'element-plus'

const appStore = useAppStore()
const visible = ref(false)
const submitting = ref(false)
const formRef = useTemplateRef('formRef')
const form = ref<{ username: string; password: string; repeatPassword: string }>({ username: '', password: '', repeatPassword: '' })
const dialogWidth = computed(() => (appStore.isDesktop ? '480px' : 'calc(100% - 32px)'))

const rules: FormRules = {
  password: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度为 5~20 位', trigger: 'blur' },
  ],
  repeatPassword: [
    { required: true, message: '确认密码不能为空', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== form.value.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

/** 打开弹窗并回填目标用户账号 */
function open(record: User.SysUser) {
  form.value = { username: record.username, password: '', repeatPassword: '' }
  visible.value = true
}

function closeDialog() {
  visible.value = false
  formRef.value?.resetFields()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    const { cancel } = await TipModal.confirm(`重置后「${form.value.username}」的登录状态将全部失效，确定要重置密码吗？`)
    if (cancel) return TipModal.msg('操作取消')
    submitting.value = true
    await UserRequest.resetPassword({ username: form.value.username, password: form.value.password })
    closeDialog()
    TipModal.msgSuccess('密码重置成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>

<style lang="scss" scoped></style>
