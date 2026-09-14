<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="旧登录密码" prop="oldPassword">
      <el-input v-model.trim="form.oldPassword" type="password" show-password placeholder="请输入旧密码" />
    </el-form-item>
    <el-form-item label="新登录密码" prop="newPassword">
      <el-input v-model.trim="form.newPassword" type="password" show-password placeholder="请输入新密码" />
    </el-form-item>
    <el-form-item label="确认新密码" prop="repeatPassword">
      <el-input v-model.trim="form.repeatPassword" type="password" show-password placeholder="请再次输入新密码" />
    </el-form-item>
    <el-form-item>
      <el-button v-permissions="['system:user:update']" type="primary" class="w-120px" :loading="submitting" @click="handleSubmit">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
defineOptions({ name: 'UpdatePassword' })
import { sleep, TipModal } from '@/utils'
import { UserRequest } from '@/api/system/user.request'
import type { FormRules } from 'element-plus'
import type { User } from '@/types'

const userStore = useUserStore()

const formRef = useTemplateRef('formRef')
const form = ref<User.UpdatePasswordParams>({ oldPassword: '', newPassword: '', repeatPassword: '' })
const submitting = ref(false)

const rules: FormRules<User.UpdatePasswordParams> = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  repeatPassword: [{ required: true, message: '请再次输入新密码', trigger: 'blur' }],
}

/** 提交前参数校验，返回错误提示（空串表示通过） */
function validateParams() {
  const { oldPassword, newPassword, repeatPassword } = form.value
  if (newPassword !== repeatPassword) return '两次输入的新密码不一致'
  if (oldPassword === newPassword) return '新密码不可与旧密码一样'
  return ''
}

/** 修改密码成功后强制重新登录 */
async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return
    const errMsg = validateParams()
    if (errMsg) return TipModal.msgError(errMsg)
    submitting.value = true
    const message = await UserRequest.updatePassword(form.value)
    TipModal.msgSuccess(message || '密码修改成功')
    await sleep(1000)
    TipModal.msgWarning('即将跳转登录页面，请稍后')
    await sleep(1000)
    await userStore.logout()
    window.location.reload()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped></style>
