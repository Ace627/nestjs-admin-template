<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="上级部门" prop="parentId">
            <el-tree-select v-model="form.parentId" :data="deptTree" check-strictly node-key="id" :props="{ label: 'deptName' }" placeholder="请选择上级部门" clearable style="width: 100%" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="部门名称" prop="deptName">
            <el-input v-model.trim="form.deptName" placeholder="请输入部门名称" maxlength="30" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="负责人" prop="leader">
            <el-input v-model.trim="form.leader" placeholder="请输入负责人" maxlength="20" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model.trim="form.phone" placeholder="请输入联系电话" maxlength="11" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model.trim="form.email" placeholder="请输入邮箱" maxlength="50" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="显示排序" prop="deptSort">
            <el-input-number v-model="form.deptSort" :min="0" :max="999" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="部门状态" prop="status">
            <el-radio-group v-model="form.status" :options="sys_normal_disable" />
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
defineOptions({ name: 'DeptDialog' })
import { TipModal } from '@/utils'
import type { Dept } from '@/types'
import { DeptRequest } from '@/api/system/dept.request'
import type { FormRules } from 'element-plus'

const emits = defineEmits<{ getList: [] }>()

const appStore = useAppStore()
const visible = ref(false)
const submitting = ref(false)
const formRef = useTemplateRef('formRef')
const form = ref<Dept.DeptForm>({})
const isEdit = computed(() => !!form.value.id)
const dialogWidth = computed(() => (appStore.isDesktop ? '640px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isEdit.value ? '修改部门' : '新增部门'))
/** 部门下拉树（仅正常状态；不含虚拟根节点） */
const deptTree = ref<Dept.DeptItem[]>([])

const { sys_normal_disable } = useDict('sys_normal_disable')

const rules: FormRules = {
  parentId: [{ required: true, message: '上级部门不能为空', trigger: 'change' }],
  deptName: [
    { required: true, message: '部门名称不能为空', trigger: 'blur' },
    { min: 1, max: 30, message: '部门名称长度须在 1~30 之间', trigger: 'blur' },
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  deptSort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

/** 打开弹窗（mode 为 create 时可传上级部门用于「新增下级」，update 时传当前行） */
async function open(mode: 'create' | 'update', dept?: Dept.DeptItem) {
  visible.value = true
  if (mode === 'update' && dept) {
    form.value = { ...(await DeptRequest.findDetail({ id: dept.id })) }
  } else {
    form.value = { parentId: dept?.id, status: '1', deptSort: 1 }
  }
  await loadDeptTree()
}

/** 加载部门下拉树 */
async function loadDeptTree() {
  try {
    deptTree.value = await DeptRequest.findTree()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('loadDeptTree errMsg: ', errMsg)
    return Promise.reject(error)
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
    if (isEdit.value) await DeptRequest.update(form.value)
    else await DeptRequest.create(form.value)
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

<style lang="scss" scoped></style>
