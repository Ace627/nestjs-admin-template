<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="上级菜单" prop="parentId">
            <el-tree-select
              v-model="form.parentId"
              :data="parentList"
              :cache-data="parentCacheData"
              check-strictly
              node-key="id"
              :props="parentTreeProps"
              :placeholder="parentPlaceholder"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="菜单类型" prop="menuType">
            <el-radio-group v-model="displayType" @change="handleDisplayTypeChange">
              <el-radio-button value="M">目录</el-radio-button>
              <el-radio-button value="C">菜单</el-radio-button>
              <el-radio-button value="F">按钮</el-radio-button>
              <el-radio-button value="EMBED">内嵌</el-radio-button>
              <el-radio-button value="LINK">外链</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="displayType !== 'F'">
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

        <el-col :span="12" v-if="displayType !== 'F'">
          <el-form-item label="路由地址" prop="path">
            <el-input v-model.trim="form.path" :placeholder="pathPlaceholder" maxlength="200" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="displayType === 'C'">
          <el-form-item label="组件路径" prop="component">
            <el-input v-model.trim="form.component" placeholder="如 system/user/index" maxlength="255" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="displayType === 'F'">
          <el-form-item label="权限字符" prop="permission">
            <el-input v-model.trim="form.permission" placeholder="如 system:user:create" maxlength="100" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="displayType !== 'F'">
          <el-form-item label="显示状态" prop="visible">
            <el-radio-group v-model="form.visible" :options="sys_menu_visible" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="displayType !== 'F'">
          <el-form-item label="菜单状态" prop="status">
            <el-radio-group v-model="form.status" :options="sys_normal_disable" />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="displayType === 'C' || displayType === 'EMBED'">
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
import { TipModal, isHttpUrl } from '@/utils'
import type { Menu } from '@/types'
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
/** 类型选择器的展示值：内嵌/外链是「菜单」的两种外部地址形态，提交时仍落 menuType=C */
type MenuDisplayType = 'M' | 'C' | 'F' | 'EMBED' | 'LINK'

/** 显式保存当前选择（不可用 computed 派生：新增时地址为空，点击内嵌/外链会被立刻算回菜单） */
const displayType = ref<MenuDisplayType>('M')

/** 由表单数据反推类型（仅在打开弹窗时分派） */
function resolveDisplayType(menu: Menu.MenuForm): MenuDisplayType {
  if (menu.menuType === 'M') return 'M'
  if (menu.menuType === 'F') return 'F'
  if (!isHttpUrl(menu.path)) return 'C'
  return menu.target === '2' ? 'LINK' : 'EMBED'
}

/**
 * 用户切换类型时同步底层字段并清理该类型无意义的字段
 * 清理口径与服务端 MenuService.cleanFields 保持一致，另额外处理 path 的 http/相对互斥
 */
function handleDisplayTypeChange(nextValue: string | number | boolean | undefined) {
  const nextType = nextValue as MenuDisplayType
  const currentPath = form.value.path ?? ''
  // http 地址只属于内嵌/外链，相对路由只属于目录/菜单，切换时按目标类型二选一保留
  const externalPath = isHttpUrl(currentPath) ? currentPath : ''
  const internalPath = isHttpUrl(currentPath) ? '' : currentPath

  // 目录：无组件、无权限标识、无缓存
  if (nextType === 'M') Object.assign(form.value, { menuType: 'M', component: '', permission: '', isCache: '0', target: '1', path: internalPath })
  // 菜单：无权限标识（组件路径本身就属于该类型，保留用户已填值）
  if (nextType === 'C') Object.assign(form.value, { menuType: 'C', permission: '', target: '1', path: internalPath })
  // 按钮：无图标、无路由、无组件、无缓存
  if (nextType === 'F') Object.assign(form.value, { menuType: 'F', icon: '', component: '', path: '', isCache: '0', target: '1' })
  // 内嵌：无组件、无权限标识，当前页 iframe；缓存保留（iframe 页签可命中 KeepAlive）
  if (nextType === 'EMBED') Object.assign(form.value, { menuType: 'C', component: '', permission: '', target: '1', path: externalPath })
  // 外链：无组件、无权限标识、无缓存（不产生页签），新标签直达
  if (nextType === 'LINK') Object.assign(form.value, { menuType: 'C', component: '', permission: '', isCache: '0', target: '2', path: externalPath })
  // 按钮必须挂在具体菜单/目录下：根节点不能作为父级，清空后由 placeholder 提示重新选择；切回其他类型时回落到主类目
  if (nextType === 'F') {
    if (form.value.parentId === '0') form.value.parentId = ''
  } else if (!form.value.parentId) {
    form.value.parentId = '0'
  }
  formRef.value?.clearValidate()
}

/** 是否内嵌/外链类型（需填写 http(s) 地址且无组件路径） */
const isUrlType = computed(() => displayType.value === 'EMBED' || displayType.value === 'LINK')
const pathPlaceholder = computed(() => (isUrlType.value ? '请输入 https:// 开头的外部地址' : '请输入路由地址'))
/** 上级菜单占位文案（按钮必须挂在具体菜单/目录下，根节点不可用） */
const parentPlaceholder = computed(() => (displayType.value === 'F' ? '按钮须选择具体菜单或目录' : '不选则挂载到根节点'))
/** 上级菜单下拉树（排除按钮与停用，根节点为「主类目」） */
const parentList = ref<Menu.ParentItem[]>([])
/** 上级树回显兜底：树数据未就绪时按 value 显示 label（根节点固定为主类目） */
const parentCacheData = [{ value: '0', label: '主类目' }]
/** 上级菜单树配置（内嵌/外链无子路由出口，不可作为上级） */
const parentTreeProps = { label: 'menuName', disabled: (data: Record<string, unknown>) => isHttpUrl(data.path) }

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
  // 上级树必须先就绪：el-tree-select 按 node-key 回显 label，树里查不到 key 时只显示 placeholder 且不会自动重算
  await loadParentList()
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
      target: '1',
    }
  }
  displayType.value = resolveDisplayType(form.value)
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

/** 剔除空字符串字段：后端 DTO 可选字段是 @IsOptional + @Length(1, n)，空串会命中长度校验直接报错 */
function toSubmitPayload(menu: Menu.MenuForm): Menu.MenuForm {
  return Object.fromEntries(Object.entries(menu).filter(([, value]) => value !== '')) as Menu.MenuForm
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    if (displayType.value === 'F' && (!form.value.parentId || form.value.parentId === '0')) return TipModal.msgError('按钮必须挂在目录或菜单下')
    if (isUrlType.value && !isHttpUrl(form.value.path)) return TipModal.msgError('内嵌/外链须填写 http(s) 开头的外部地址')
    if (displayType.value === 'C' && isHttpUrl(form.value.path)) return TipModal.msgError('外部地址请选择「内嵌」或「外链」类型')
    if (form.value.path && /^\d+$/.test(form.value.path)) return TipModal.msgError('路由地址不允许为纯数字')
    submitting.value = true
    const payload = toSubmitPayload(form.value)
    if (isEdit.value) await MenuRequest.update(payload)
    else await MenuRequest.create(payload)
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
