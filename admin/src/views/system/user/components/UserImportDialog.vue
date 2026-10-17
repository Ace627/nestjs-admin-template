<template>
  <el-dialog v-model="visible" title="导入用户" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" :label-position="appStore.isMobile ? 'top' : 'right'" :label-width="appStore.isMobile ? undefined : '100px'">
      <el-row :gutter="16">
        <el-col :span="appStore.isMobile ? 24 : 12">
          <el-form-item label="归属部门" prop="deptId">
            <el-tree-select v-model="form.deptId" :data="deptTree" check-strictly node-key="id" :props="{ label: 'deptName' }" placeholder="请选择归属部门" clearable style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="appStore.isMobile ? 24 : 12">
          <el-form-item label="用户角色" prop="roleIds">
            <el-select v-model="form.roleIds" placeholder="请选择用户角色" multiple clearable style="width: 100%">
              <el-option v-for="item in roleList" :key="item.id" :label="item.roleName" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="是否覆盖">
        <div class="flex items-center gap-8px">
          <el-switch v-model="updateSupport" class="shrink-0" />
          <span class="text-12px color-[var(--el-text-color-secondary)]">已存在用户仅更新资料字段（密码、部门、角色不变）</span>
        </div>
      </el-form-item>
      <el-form-item label="数据文件" prop="file">
        <el-upload class="import-upload" drag :auto-upload="false" :show-file-list="false" accept=".xlsx" :disabled="importing" :on-change="handleFileChange">
          <div class="flex items-center justify-center gap-8px">
            <SvgIcon name="Upload" class="text-20px color-[var(--el-color-primary)]" />
            <span class="text-14px">将文件拖到此处，或 <em>点击选择</em></span>
            <span class="text-12px color-[var(--el-text-color-secondary)]">仅支持 .xlsx 格式文件</span>
          </div>
        </el-upload>
        <div v-if="form.file" class="mt-8px flex w-full items-center justify-between rounded-4px bg-[var(--el-fill-color-light)] p-8px text-13px">
          <span class="truncate">{{ form.file.name }}</span>
          <el-link type="danger" underline="never" @click="handleRemoveFile"> <SvgIcon name="Delete" class="mr-4px" /><span>删除</span> </el-link>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button plain type="primary" @click="handleDownloadTemplate">
        <template #icon><SvgIcon name="Download" /></template><span>下载导入模板</span>
      </el-button>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="importing" @click="handleImport">开始导入</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'UserImportDialog' })
import { linkDownload, TipModal } from '@/utils'
import type { FormRules, UploadFile } from 'element-plus'
import type { Dept, Role } from '@/types'
import { UserRequest } from '@/api/system/user.request'
import { RoleRequest } from '@/api/system/role.request'
import { DeptRequest } from '@/api/system/dept.request'

const emits = defineEmits<{ getList: [] }>()

const appStore = useAppStore()
const visible = ref(false)
const importing = ref(false)
const formRef = useTemplateRef('formRef')
const dialogWidth = computed(() => (appStore.isDesktop ? '640px' : 'calc(100% - 32px)'))

const form = ref<{ deptId?: string; roleIds: string[]; file?: File }>({ roleIds: [] })
const updateSupport = ref(false)

/** 角色下拉（不分页）与部门下拉树，打开弹窗时加载 */
const roleList = ref<Role.RoleItem[]>([])
const deptTree = ref<Dept.DeptItem[]>([])

const rules: FormRules<{ deptId: string; roleIds: string[]; file: File }> = {
  deptId: [{ required: true, message: '归属部门不能为空', trigger: 'change' }],
  roleIds: [{ required: true, message: '用户角色不能为空', trigger: 'change' }],
  file: [{ required: true, message: '请选择导入文件', trigger: 'change' }],
}

async function open() {
  visible.value = true
  form.value = { roleIds: [] }
  updateSupport.value = false
  await loadSelectData()
}

/** 加载角色下拉与部门下拉树（与新增用户弹窗同一数据源） */
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

/** 下载导入模板 */
async function handleDownloadTemplate() {
  try {
    const response = await UserRequest.importTemplate()
    linkDownload(response.data, '用户导入模板.xlsx')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDownloadTemplate errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 选择导入文件（单文件替换式，前端拦截非 .xlsx） */
function handleFileChange(uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw) return
  const ext = raw.name.split('.').pop()?.toLowerCase()
  if (ext === 'xls') return TipModal.msgError('暂不支持旧版 .xls 格式，请将文件另存为 .xlsx 后重新选择')
  if (ext !== 'xlsx') return TipModal.msgError('仅支持 .xlsx 格式文件')
  form.value.file = raw
  formRef.value?.validateField('file')
}

/** 移除已选文件，恢复未选择状态 */
function handleRemoveFile() {
  form.value.file = undefined
}

function closeDialog() {
  visible.value = false
  formRef.value?.resetFields()
  form.value = { roleIds: [] }
}

async function handleImport() {
  try {
    await formRef.value?.validate()
    importing.value = true
    const formData = new FormData()
    formData.append('file', form.value.file as File)
    formData.append('updateSupport', String(updateSupport.value))
    formData.append('deptId', form.value.deptId as string)
    formData.append('roleIds', form.value.roleIds.join(','))
    const message = await UserRequest.importData(formData)
    closeDialog()
    emits('getList')
    TipModal.msgSuccess(message || '导入成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleImport errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    importing.value = false
  }
}

defineExpose({ open })
</script>

<style lang="scss">
/* 拖拽上传区默认固定 360px 宽、40px 上下内边距，压成撑满整行的单行样式（非 scoped，以自定义类圈定作用域） */
.import-upload {
  width: 100%;

  .el-upload-dragger {
    width: 100%;
    padding: 12px 16px;
  }
}
</style>
