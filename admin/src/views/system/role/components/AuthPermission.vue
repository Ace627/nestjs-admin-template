<template>
  <el-drawer v-model="visible" :size="300" :with-header="false">
    <div class="flex flex-col h-full">
      <div class="fw-bold tracking-widest mb-16px">角色权限分配</div>

      <div class="flex items-center mb-12px">
        <el-checkbox v-model="isLinkage">父子联动</el-checkbox>
        <el-checkbox v-model="isExpandAll" @change="handleExpandAll">全部展开</el-checkbox>
      </div>

      <el-scrollbar class="flex-grow-1 h-0">
        <el-tree
          ref="menuTreeRef"
          :data="treeList"
          node-key="id"
          :props="{ label: 'menuName' }"
          show-checkbox
          :check-strictly="checkStrictly"
          :default-expand-all="isExpandAll"
          :default-checked-keys="defaultCheckedKeys"
        />
      </el-scrollbar>

      <footer class="flex-center pt-12px">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </footer>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
defineOptions({ name: 'AuthPermission' })
import { ElTree } from 'element-plus'
import { TipModal } from '@/utils'
import type { Menu, Role } from '@/types'
import { MenuRequest } from '@/api/system/menu.request'
import { RoleRequest } from '@/api/system/role.request'

const emits = defineEmits<{ getList: [] }>()

const visible = ref(false)
const submitting = ref(false)
/** 父子联动开关：回显时必须先关闭（check-strictly），否则勾选会被联动污染 */
const checkStrictly = ref(true)
/** 父子联动开关：勾选=联动；回显阶段必须关闭联动（checkStrictly=true），否则勾选会被联动污染 */
const isLinkage = computed({
  get: () => !checkStrictly.value,
  set: (checked: boolean) => (checkStrictly.value = !checked),
})

/** 切到联动时重放一次勾选，让父节点半选状态立即重算 */
watch(isLinkage, (checked) => {
  if (checked) nextTick(() => menuTreeRef.value?.setCheckedKeys(defaultCheckedKeys.value))
})

const isExpandAll = ref(false)
/** 回显勾选的菜单 ID 集合 */
const defaultCheckedKeys = ref<string[]>([])
const menuTreeRef = ref<InstanceType<typeof ElTree>>()
const treeList = ref<Menu.MenuItem[]>([])
const role = ref<Role.RoleItem>()

/** 打开权限分配抽屉 */
async function open(record: Role.RoleItem) {
  role.value = record
  visible.value = true
  submitting.value = false
  checkStrictly.value = true
  isExpandAll.value = false
  await findTreeList()
  try {
    // 回显该角色已授权的菜单 ID（超管角色后端返回全部），关闭联动保证只精确勾选
    defaultCheckedKeys.value = await RoleRequest.findPermission({ roleId: record.id })
    menuTreeRef.value?.setCheckedKeys(defaultCheckedKeys.value)
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('open errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 加载正常状态的菜单树（后端已返回树形结构） */
async function findTreeList() {
  try {
    treeList.value = await MenuRequest.findList({ status: '1' })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('findTreeList errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 勾选=展开全部、取消=折叠全部（直接改节点 expanded，不影响勾选回显） */
function handleExpandAll() {
  const nodesMap = menuTreeRef.value?.store?.nodesMap as Record<string, { expanded: boolean }> | undefined
  if (!nodesMap) return
  Object.values(nodesMap).forEach((node) => {
    node.expanded = isExpandAll.value
  })
}

function handleCancel() {
  visible.value = false
}

/** 查找勾选节点缺失的祖先菜单名（严格模式下 el-tree 不算半选，缺父级会提交孤儿权限） */
function findMissingParentNames(ids: string[]): string[] {
  const parentMap = new Map<string, string>()
  const nameMap = new Map<string, string>()
  const walk = (nodes: Menu.MenuItem[], parentId?: string) => {
    nodes.forEach((node) => {
      if (parentId) parentMap.set(node.id, parentId)
      nameMap.set(node.id, node.menuName ?? '')
      if (node.children?.length) walk(node.children, node.id)
    })
  }
  walk(treeList.value)

  const selectedIds = new Set(ids)
  const missingIds = new Set<string>()
  ids.forEach((id) => {
    let parentId = parentMap.get(id)
    while (parentId) {
      if (!selectedIds.has(parentId)) missingIds.add(parentId)
      parentId = parentMap.get(parentId)
    }
  })
  return [...missingIds].map((id) => nameMap.get(id) ?? id)
}

/** 提交角色授权（父级菜单必须一并勾选，否则目录/菜单会丢） */
async function handleSubmit() {
  try {
    const checkedIds = (menuTreeRef.value?.getCheckedKeys() ?? []) as string[]
    const halfCheckedIds = (menuTreeRef.value?.getHalfCheckedKeys() ?? []) as string[]
    if (!checkedIds.length && !halfCheckedIds.length) return TipModal.msgWarning('请至少勾选一个菜单权限')
    const selectedIds = [...halfCheckedIds, ...checkedIds]
    const missingParentNames = findMissingParentNames(selectedIds)
    if (missingParentNames.length) return TipModal.msgWarning(`请先勾选父级菜单：${missingParentNames.join('、')}`)
    const { cancel } = await TipModal.confirm(`确定要保存「${role.value?.roleName}」的权限分配吗？`)
    if (cancel) return TipModal.msg('操作取消')
    submitting.value = true
    await RoleRequest.authPermission({ roleId: role.value!.id, menuIds: selectedIds })
    TipModal.msgSuccess('授权成功')
    visible.value = false
    emits('getList')
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
footer .el-button {
  width: 120px;
}
</style>
