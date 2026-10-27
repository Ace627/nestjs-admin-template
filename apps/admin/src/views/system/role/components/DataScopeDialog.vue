<template>
  <el-dialog v-model="visible" title="分配数据权限" width="600px" :close-on-click-modal="false" destroy-on-close>
    <el-form label-width="90px">
      <el-form-item label="角色名称">
        <el-input :model-value="role?.roleName" disabled />
      </el-form-item>
      <el-form-item label="权限字符">
        <el-input :model-value="role?.roleCode" disabled />
      </el-form-item>
      <el-form-item label="权限范围">
        <el-select v-model="dataScope" class="w-240px">
          <el-option v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="dataScope === DataScopeType.CUSTOM" label="数据权限">
        <div class="w-full">
          <div class="mb-8px">
            <el-checkbox :model-value="isExpandAll" label="展开/折叠" @change="handleExpandAll" />
            <el-checkbox :model-value="isCheckedAll" label="全选/全不选" @change="handleCheckAll" />
            <el-checkbox v-model="isLink" label="父子联动" />
          </div>
          <div class="border border-solid border-color-[var(--el-border-color-lighter)] rounded-4px p-8px max-h-320px overflow-y-auto">
            <el-tree
              ref="deptTreeRef"
              v-if="treeRendered"
              :data="deptTreeList"
              node-key="id"
              :props="{ label: 'deptName' }"
              show-checkbox
              :check-strictly="echoStrict || !isLink"
              :default-expand-all="isExpandAll"
              :default-checked-keys="defaultCheckedKeys"
            />
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      <el-button @click="handleCancel">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'DataScopeDialog' })
import { ElTree } from 'element-plus'
import { TipModal } from '@/utils'
import type { Dept, Role } from '@/types'
import { DeptRequest } from '@/api/system/dept.request'
import { RoleRequest } from '@/api/system/role.request'

/** 数据范围档位（与后端 DataScopeType 对齐） */
const DataScopeType = { ALL: '1', CUSTOM: '2', DEPT: '3', DEPT_AND_BELOW: '4', SELF: '5' } as const

const dataScopeOptions = [
  { label: '全部数据权限', value: DataScopeType.ALL },
  { label: '自定义数据权限', value: DataScopeType.CUSTOM },
  { label: '本部门数据权限', value: DataScopeType.DEPT },
  { label: '本部门及以下数据权限', value: DataScopeType.DEPT_AND_BELOW },
  { label: '仅本人数据权限', value: DataScopeType.SELF },
]

const visible = ref(false)
const submitting = ref(false)

const role = ref<Role.RoleItem>()
const dataScope = ref<string>(DataScopeType.ALL)

const isExpandAll = ref(false)
const isCheckedAll = ref(false)
/** 父子联动：勾选父节点自动带子节点；回显期间必须强制严格模式，防止联动污染 */
const isLink = ref(true)
const echoStrict = ref(true)
const treeRendered = ref(true)
/** 回显勾选的部门 ID 集合 */
const defaultCheckedKeys = ref<string[]>([])
const deptTreeRef = ref<InstanceType<typeof ElTree>>()
const deptTreeList = ref<Dept.DeptItem[]>([])

/** 打开数据权限弹窗（部门树与已配置范围并行加载） */
async function open(record: Role.RoleItem) {
  role.value = record
  visible.value = true
  submitting.value = false
  dataScope.value = DataScopeType.ALL
  isExpandAll.value = false
  isCheckedAll.value = false
  isLink.value = true
  echoStrict.value = true
  treeRendered.value = true
  defaultCheckedKeys.value = []
  try {
    const [depts, scope] = await Promise.all([DeptRequest.findTree(), RoleRequest.findDataScope({ roleId: record.id })])
    deptTreeList.value = depts
    dataScope.value = scope.dataScope
    defaultCheckedKeys.value = scope.deptIds ?? []
    // 回显完成后再放开父子联动，避免勾选被联动污染
    nextTick(() => {
      deptTreeRef.value?.setCheckedKeys(defaultCheckedKeys.value)
      echoStrict.value = false
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('open errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 展开/折叠（default-expand-all 仅首次渲染生效，v-if 强制重建树后回显勾选） */
function handleExpandAll() {
  isExpandAll.value = !isExpandAll.value
  treeRendered.value = false
  nextTick(() => {
    treeRendered.value = true
    nextTick(() => deptTreeRef.value?.setCheckedKeys((deptTreeRef.value?.getCheckedKeys() ?? []) as string[]))
  })
}

/** 全选/全不选（树恒为严格模式，全选即精确勾选全部节点） */
function handleCheckAll() {
  isCheckedAll.value = !isCheckedAll.value
  const keys = isCheckedAll.value ? collectAllDeptIds(deptTreeList.value) : []
  deptTreeRef.value?.setCheckedKeys(keys)
}

/** 递归收集部门树全部节点 ID */
function collectAllDeptIds(list: Dept.DeptItem[]): string[] {
  return list.flatMap((item) => [item.id, ...collectAllDeptIds(item.children ?? [])])
}

function handleCancel() {
  visible.value = false
}

/** 提交数据权限（自定义档位必须至少勾选一个部门） */
async function handleSubmit() {
  try {
    const deptIds = (dataScope.value === DataScopeType.CUSTOM ? deptTreeRef.value?.getCheckedKeys() ?? [] : []) as string[]
    if (dataScope.value === DataScopeType.CUSTOM && !deptIds.length) return TipModal.msgWarning('自定义数据权限至少勾选一个部门')
    const { cancel } = await TipModal.confirm(`确定要保存「${role.value?.roleName}」的数据权限吗？`)
    if (cancel) return TipModal.msg('操作取消')
    submitting.value = true
    await RoleRequest.updateDataScope({ id: role.value!.id, dataScope: dataScope.value, deptIds })
    TipModal.msgSuccess('数据权限设置成功')
    visible.value = false
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
