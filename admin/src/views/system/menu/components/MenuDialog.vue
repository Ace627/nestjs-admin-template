<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="上级菜单" prop="parentId">
            <el-tree-select v-model="form.parentId" :data="parentList" check-strictly node-key="id" :props="{ label: 'menuName' }" placeholder="不选则挂载到根节点" clearable style="width: 100%" />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="菜单类型" prop="menuType">
            <el-radio-group v-model="form.menuType">
              <el-radio label="目录" value="M" />
              <el-radio label="菜单" value="C" />
              <el-radio label="按钮" value="F" />
            </el-radio-group>
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="form.menuType !== 'F'">
          <el-form-item label="菜单图标" prop="icon">
            <el-popover placement="bottom-start" width="460" trigger="click" @show="iconSelectRef?.reset">
              <IconSelect ref="iconSelectRef" :active-icon="form.icon" @selected="selectMenuIcon" />
              <template #reference>
                <el-input v-model.trim="form.icon" placeholder="请选择菜单图标" readonly>
                  <template #prefix> <SvgIcon :name="`${form.icon ? form.icon : 'Search'}`" /> </template>
                </el-input>
              </template>
            </el-popover>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="菜单名称" prop="menuName">
            <el-input v-model.trim="form.menuName" placeholder="请输入菜单名称" maxlength="50" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="显示排序" prop="menuSort">
            <el-input-number v-model="form.menuSort" :min="1" :max="999" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="form.menuType !== 'F'">
          <el-form-item label="路由地址" prop="path">
            <el-input v-model.trim="form.path" placeholder="请输入路由地址" maxlength="200" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="form.menuType === 'C'">
          <el-form-item label="组件路径" prop="component">
            <el-input v-model.trim="form.component" placeholder="如 system/user/index" maxlength="255" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="form.menuType === 'F'">
          <el-form-item label="权限字符" prop="permission">
            <el-input v-model.trim="form.permission" placeholder="如 system:user:create" maxlength="100" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="form.menuType !== 'F'">
          <el-form-item label="显示状态" prop="visible">
            <el-radio-group v-model="form.visible" :options="sys_menu_visible" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="form.menuType !== 'F'">
          <el-form-item label="菜单状态" prop="status">
            <el-radio-group v-model="form.status" :options="sys_normal_disable" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="form.menuType === 'C'">
          <el-form-item label="缓存组件" prop="isCache">
            <el-radio-group v-model="form.isCache">
              <el-radio value="1">缓存</el-radio>
              <el-radio value="0">不缓存</el-radio>
            </el-radio-group>
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
defineOptions({ name: 'MenuDialog' })
import type { GlobalComponents } from 'vue'
import { TipModal } from '@/utils'
import type { Menu } from '@/types'
import { useDict } from '@/hooks/useDict'
import type { FormRules } from 'element-plus'
import { MenuRequest } from '@/api/system/menu.request'

const emits = defineEmits<{ getList: [] }>()

const appStore = useAppStore()
const visible = ref(false)
const submitting = ref(false)
const formRef = useTemplateRef('formRef')
/** 图标选择组件实例 */
const iconSelectRef = ref<InstanceType<GlobalComponents['IconSelect']>>()
const form = ref<Menu.MenuForm>({})
const isEdit = computed(() => !!form.value.id)
const dialogWidth = computed(() => (appStore.isDesktop ? '680px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isEdit.value ? '修改菜单' : '新增菜单'))
/** 上级菜单下拉树（排除按钮与停用，根节点为「主类目」） */
const parentList = ref<Menu.ParentItem[]>([])

const { sys_normal_disable, sys_menu_visible } = useDict('sys_normal_disable', 'sys_menu_visible')

const rules: FormRules = {
  menuName: [
    { required: true, message: '菜单名称不能为空', trigger: 'blur' },
    { min: 1, max: 50, message: '菜单名称长度须在 1~50 之间', trigger: 'blur' },
  ],
  path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
  permission: [{ required: true, message: '权限字符不能为空', trigger: 'blur' }],
  menuSort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
}

/** 打开弹窗（mode 为 create 时可传父级菜单用于「新增下级」，update 时传当前行） */
async function open(mode: 'create' | 'update', menu?: Menu.MenuItem) {
  visible.value = true
  if (mode === 'update' && menu) {
    form.value = { ...(await MenuRequest.findDetail({ id: menu.id })) }
  } else {
    // 新增下级：目录下默认建菜单，菜单/按钮下默认建按钮；无上下文则默认建目录
    const childType = menu ? (menu.menuType === 'M' ? 'C' : 'F') : 'M'
    form.value = {
      menuType: childType,
      parentId: menu ? (menu.menuType === 'F' ? menu.parentId : menu.id) : '0',
      menuSort: menu && menu.menuType === 'F' ? menu.menuSort + 1 : 1,
      status: '1',
      visible: '1',
      isCache: '0',
    }
  }
  await loadParentList()
}

/** 加载上级菜单下拉树 */
async function loadParentList() {
  try {
    parentList.value = await MenuRequest.findParentList()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('loadParentList errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 图标选择框改变的回调 */
function selectMenuIcon(name: string) {
  form.value.icon = name
}

function closeDialog() {
  visible.value = false
  formRef.value?.resetFields()
}

async function handleSubmit() {
  try {
    const valid = await formRef.value?.validate()
    if (!valid) return
    if (form.value.path && /^\d+$/.test(form.value.path)) return TipModal.msgError('路由地址不允许为纯数字')
    submitting.value = true
    if (isEdit.value) await MenuRequest.update(form.value)
    else await MenuRequest.create(form.value)
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

<style lang="scss" scoped>
/** 表单 label 问号提示（参考若依 QuestionFilled 模式，纯 CSS 圆圈实现） */
.label-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 4px;
  border-radius: 50%;
  background-color: var(--el-text-color-placeholder);
  color: var(--el-color-white);
  font-size: 12px;
  line-height: 1;
  cursor: help;
  transform: translateY(-1px);
}
</style>
