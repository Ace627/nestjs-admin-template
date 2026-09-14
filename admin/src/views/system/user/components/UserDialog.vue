<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户账号" prop="username">
            <el-input v-model.trim="form.username" placeholder="字母开头，仅含字母与数字" :disabled="isEdit" />
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="!isEdit">
          <el-form-item label="登录密码" prop="password">
            <el-input v-model.trim="form.password" type="password" placeholder="请输入登录密码" show-password />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nickname">
            <el-input v-model.trim="form.nickname" placeholder="请输入用户昵称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model.trim="form.phone" placeholder="请输入手机号码" maxlength="11" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户邮箱" prop="email">
            <el-input v-model.trim="form.email" placeholder="请输入用户邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户性别" prop="gender">
            <el-radio-group v-model="form.gender" :options="sys_user_sex" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户状态" prop="status">
            <el-radio-group v-model="form.status" :options="sys_normal_disable" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="年龄" prop="age">
            <el-input-number v-model="form.age" :min="1" :max="120" controls-position="right" placeholder="请输入年龄" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户角色" prop="roleIds">
            <el-select v-model="form.roleIds" placeholder="请选择用户角色" multiple clearable style="width: 100%">
              <el-option v-for="item in roleList" :key="item.id" :label="item.roleName" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="归属部门" prop="deptId">
            <el-tree-select
              v-model="form.deptId"
              :data="deptTree"
              check-strictly
              node-key="id"
              :props="{ label: 'deptName' }"
              placeholder="请选择归属部门"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注信息" prop="remark">
            <el-input v-model.trim="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'UserDialog' })
import { TipModal } from '@/utils'
import type { User } from '@/types'
import { UserRequest } from '@/api/system/user.request'
import { RoleRequest } from '@/api/system/role.request'
import { DeptRequest } from '@/api/system/dept.request'
import { useDict } from '@/hooks/useDict'
import type { Role } from '@/types'
import type { Dept } from '@/types'
import type { FormRules } from 'element-plus'

const emits = defineEmits<{ getList: [] }>()

const appStore = useAppStore()
const visible = ref(false)
const submitting = ref(false)
const formRef = useTemplateRef('formRef')
const form = ref<User.UserForm>({})
const isEdit = computed(() => !!form.value.id)
const dialogWidth = computed(() => (appStore.isDesktop ? '720px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isEdit.value ? '修改用户' : '新增用户'))
/** 不分页的角色表（仅正常状态） */
const roleList = ref<Role.RoleItem[]>([])
/** 部门下拉树（仅正常状态） */
const deptTree = ref<Dept.DeptItem[]>([])

const { sys_normal_disable, sys_user_sex } = useDict('sys_normal_disable', 'sys_user_sex')

const rules: FormRules<User.UserForm> = {
  username: [
    { required: true, message: '用户账号不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9]*$/, message: '用户账号须以字母开头，仅含字母与数字', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '登录密码不能为空', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度为 5~20 位', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  roleIds: [{ required: true, message: '用户角色不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
  gender: [{ required: true, message: '性别不能为空', trigger: 'change' }],
  deptId: [{ required: true, message: '归属部门不能为空', trigger: 'change' }],
}

/** 打开弹窗（传 record 为编辑模式，不传为新增模式） */
async function open(record?: User.SysUser) {
  visible.value = true
  await Promise.all([resetForm(record?.id), loadSelectData()])
}

/** 编辑时回填详情并将关联角色映射为 roleIds；新增时恢复默认值（deptId=0 视为未分配） */
async function resetForm(userId?: string) {
  if (userId) {
    const data = await UserRequest.findDetail({ id: userId })
    const deptId = data.deptId && data.deptId !== '0' ? data.deptId : undefined
    form.value = { ...data, deptId, roleIds: (data.roles ?? []).map((item) => item.id) }
  } else {
    form.value = { status: '1', gender: '2' }
  }
}

/** 加载角色下拉与部门下拉树 */
async function loadSelectData() {
  try {
    const [roles, tree] = await Promise.all([RoleRequest.findAll(), DeptRequest.findTree()])
    roleList.value = roles
    deptTree.value = tree
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('loadSelectData errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

function closeDialog() {
  visible.value = false
  formRef.value?.resetFields()
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return
    submitting.value = true
    if (isEdit.value) {
      const { username: _u, password: _p, ...updateForm } = form.value
      await UserRequest.update(updateForm)
    } else {
      await UserRequest.create(form.value)
    }
    closeDialog()
    emits('getList')
    TipModal.msgSuccess(isEdit.value ? '修改成功' : '新增成功')
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

