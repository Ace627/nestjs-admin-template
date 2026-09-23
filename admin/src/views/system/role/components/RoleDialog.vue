<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="角色编码" prop="roleCode">
        <el-input v-model.trim="form.roleCode" placeholder="字母开头，2~20 位字母、数字与下划线" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model.trim="form.roleName" placeholder="请输入角色名称" maxlength="20" />
      </el-form-item>
      <el-form-item label="角色排序" prop="roleSort">
        <el-input-number v-model="form.roleSort" :min="1" :max="999" controls-position="right" style="width: 50%" />
      </el-form-item>
      <el-form-item label="角色状态" prop="status">
        <el-radio-group v-model="form.status" :options="sys_normal_disable" />
      </el-form-item>
      <el-form-item label="角色备注" prop="remark">
        <el-input v-model.trim="form.remark" type="textarea" :rows="3" placeholder="请输入角色备注" maxlength="200" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'RoleDialog' })
import { TipModal } from '@/utils'
import type { Role } from '@/types'
import { RoleRequest } from '@/api/system/role.request'
import type { FormRules } from 'element-plus'

const emits = defineEmits<{ getList: [] }>()

const appStore = useAppStore()
const visible = ref(false)
const submitting = ref(false)
const formRef = useTemplateRef('formRef')
const form = ref<Role.RoleForm>({})
const isEdit = computed(() => !!form.value.id)
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isEdit.value ? '修改角色' : '新增角色'))

const { sys_normal_disable } = useDict('sys_normal_disable')

const rules: FormRules<Role.RoleForm> = {
  roleCode: [
    { required: true, message: '角色编码不能为空', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{1,19}$/, message: '角色编码须以字母开头，2~20 位字母、数字与下划线', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value === 'admin') callback(new Error('admin 为系统超管保留编码'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  roleName: [
    { required: true, message: '角色名称不能为空', trigger: 'blur' },
    { min: 1, max: 20, message: '角色名称长度须在 1~20 之间', trigger: 'blur' },
  ],
  roleSort: [{ required: true, message: '角色排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

/** 打开弹窗（传 record 为编辑模式，不传为新增模式） */
async function open(record?: Role.RoleItem) {
  visible.value = true
  await resetForm(record?.id)
}

/** 编辑时回填详情；新增时恢复默认值 */
async function resetForm(roleId?: string) {
  if (roleId) {
    form.value = { ...(await RoleRequest.findDetail({ id: roleId })) }
  } else {
    form.value = { status: '1', roleSort: 1 }
  }
}

function closeDialog() {
  visible.value = false
  formRef.value?.resetFields()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    submitting.value = true
    if (isEdit.value) await RoleRequest.update(form.value)
    else await RoleRequest.create(form.value)
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
