<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
    <el-form-item label="用户昵称" prop="nickname">
      <el-input v-model="form.nickname" maxlength="20" />
    </el-form-item>
    <el-form-item label="真实姓名" prop="realname">
      <el-input v-model="form.realname" maxlength="20" />
    </el-form-item>
    <el-form-item label="用户年龄" prop="age">
      <el-input-number v-model="form.age" :min="1" :max="120" controls-position="right" placeholder="请输入年龄" style="width: 100%" />
    </el-form-item>
    <el-form-item label="手机号码" prop="phone">
      <el-input v-model="form.phone" maxlength="11" />
    </el-form-item>
    <el-form-item label="用户邮箱" prop="email">
      <el-input v-model="form.email" maxlength="50" />
    </el-form-item>
    <el-form-item label="用户性别" prop="gender">
      <el-radio-group v-model="form.gender" :options="sys_user_sex" />
    </el-form-item>
    <el-form-item>
      <el-button v-permissions="['system:user:update']" type="primary" class="w-120px" :loading="submitting" @click="handleSubmit">保存</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
defineOptions({ name: 'UserInfo' })
import { TipModal } from '@/utils'
import { UserRequest } from '@/api/system/user.request'
import { useDict } from '@/hooks/useDict'
import type { FormRules } from 'element-plus'
import type { User } from '@/types'

const props = defineProps<{ user: User.UserProfile }>()
const emit = defineEmits<{ refresh: [] }>()

const { sys_user_sex } = useDict('sys_user_sex')

const formRef = useTemplateRef('formRef')
const form = ref<User.UserProfile>({})
const submitting = ref(false)

const rules: FormRules<User.UserProfile> = {
  realname: [{ required: true, message: '真实姓名不能为空', trigger: 'blur' }],
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  age: [{ required: true, message: '年龄不能为空', trigger: 'blur' }],
  email: [
    { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] },
  ],
  phone: [
    { required: true, message: '手机号码不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
}

watch(
  () => props.user,
  (user) => Object.assign(form.value, user),
  { immediate: true },
)

/** 保存个人信息 */
async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitting.value = true
    const message = await UserRequest.updateProfile(form.value)
    TipModal.msgSuccess(message || '修改成功')
    emit('refresh')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleSubmit errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
/* el-input-number 默认文本居中，对齐其他输入框的左对齐风格 */
:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
