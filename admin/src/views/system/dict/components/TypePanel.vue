<template>
  <el-card shadow="never" class="dict-type-card w-250px shrink-0" :class="{ 'is-mobile': appStore.isMobile }" body-class="h-full">
    <div class="h-full flex flex-col">
      <div class="mb-12px flex items-center justify-between">
        <div class="flex items-center gap-4px">
          <SvgIcon name="Dict" />
          <span class="font-bold">字典类型</span>
        </div>
        <div class="flex items-center gap-8px">
          <el-tooltip content="新增类型" placement="top">
            <SvgIcon v-permissions="['system:dict:create']" name="Plus" class="cursor-pointer" @click="typeDialogRef?.open()" />
          </el-tooltip>
          <el-tooltip content="刷新" placement="top">
            <SvgIcon name="Refresh" class="cursor-pointer" @click="getTypeList" />
          </el-tooltip>
        </div>
      </div>
      <el-input v-model="filterText" placeholder="请输入字典名称" clearable>
        <template #prefix><SvgIcon name="Search" /></template>
      </el-input>
      <div class="dict-type-list mt-12px flex-1 overflow-auto">
        <div v-for="typeItem in types" :key="typeItem.id" class="dict-type-item" :class="{ 'is-active': selectedId === typeItem.id }" @click="emit('select', typeItem)">
          <div class="dict-type-item__info">
            <span class="dict-type-item__name">{{ typeItem.dictName }}</span>
            <span class="dict-type-item__code">{{ typeItem.dictType }}</span>
          </div>
          <div class="dict-type-item__actions">
            <SvgIcon v-permissions="['system:dict:update']" name="Edit" @click.stop="typeDialogRef?.open(typeItem)" />
            <SvgIcon v-permissions="['system:dict:delete']" name="Delete" @click.stop="handleDeleteType(typeItem)" />
          </div>
        </div>
        <el-empty v-if="!types.length" :image-size="60" description="暂无字典类型" />
      </div>
      <el-pagination
        v-if="typeTotal > typeQuery.pageSize"
        v-model:current-page="typeQuery.pageNo"
        :page-size="typeQuery.pageSize"
        :total="typeTotal"
        :pager-count="5"
        size="small"
        layout="prev, pager, next"
        class="mt-8px justify-center"
        @current-change="getTypeList"
      />
    </div>
  </el-card>

  <TypeDialog ref="typeDialogRef" @success="handleTypeSaved" />
</template>

<script setup lang="ts">
defineOptions({ name: 'DictTypePanel' })
import { TipModal } from '@/utils'
import type { Dict } from '@/types'
import TypeDialog from './TypeDialog.vue'
import { DictRequest } from '@/api/system/dict.request'

const props = defineProps<{ selectedId: string }>()
const emit = defineEmits<{
  select: [type: Dict.TypeItem]
  edited: [type: Dict.TypeItem]
  deleted: [type: Dict.TypeItem]
}>()

const appStore = useAppStore()

const types = ref<Dict.TypeItem[]>([])
const typeQuery = ref<Dict.TypeQuery>({ pageNo: 1, pageSize: 20 })
const typeTotal = ref(0)
const filterText = ref('')
const typeDialogRef = useTemplateRef('typeDialogRef')
/** 是否已完成首次加载（首次加载后默认选中第一个类型） */
let firstLoaded = false

async function getTypeList() {
  try {
    const data = await DictRequest.findTypeList({ ...typeQuery.value })
    types.value = data.records
    typeTotal.value = data.total
    if (!firstLoaded) {
      firstLoaded = true
      if (types.value[0]) emit('select', types.value[0])
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getTypeList errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

/** 名称搜索：服务端模糊查询，防抖后复位页码 */
const handleFilterType = useDebounceFn(() => getTypeList(), 300)

watch(filterText, (value) => {
  typeQuery.value.dictName = value.trim() || undefined
  typeQuery.value.pageNo = 1
  handleFilterType()
})

/** 类型弹窗保存成功（form.id 存在为编辑，否则为新增） */
async function handleTypeSaved(form: Dict.TypeForm) {
  if (form.id) {
    const wasSelected = form.id === props.selectedId
    await getTypeList()
    if (wasSelected) {
      // 编辑后被筛选条件过滤掉时，用提交的表单数据兜底同步
      const updated = types.value.find((typeItem) => typeItem.id === form.id)
      emit('edited', updated ?? (form as Dict.TypeItem))
    }
  } else {
    await getTypeList()
    // 新类型按创建时间排序在最后一页，跳转后自动选中
    typeQuery.value.pageNo = Math.max(1, Math.ceil(typeTotal.value / typeQuery.value.pageSize))
    await getTypeList()
    const created = types.value.find((typeItem) => typeItem.dictType === form.dictType)
    if (created) emit('select', created)
  }
}

async function handleDeleteType(target: Dict.TypeItem) {
  try {
    const { cancel } = await TipModal.confirm(`确定要删除字典「${target.dictName}」吗？删除后其下字典数据将一并删除。`)
    if (cancel) return TipModal.msg('操作取消')
    await DictRequest.deleteType({ ids: target.id })
    // 当前页删空时回退一页
    if (types.value.length <= 1) typeQuery.value.pageNo = typeQuery.value.pageNo > 1 ? typeQuery.value.pageNo - 1 : 1
    await getTypeList()
    emit('deleted', target)
    TipModal.msgSuccess('删除成功')
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('handleDeleteType errMsg: ', errMsg)
    return Promise.reject(error)
  }
}

onMounted(getTypeList)
</script>

<style lang="scss" scoped>
.dict-type-card {
  display: flex;
  flex-direction: column;
  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  &.is-mobile {
    width: 100%;
    max-height: 240px;
  }
}

.dict-type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  margin-bottom: 2px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--el-fill-color-light);

    .dict-type-item__actions {
      visibility: visible;
    }
  }

  &.is-active {
    background-color: var(--el-color-primary-light-9);

    .dict-type-item__name {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  &__code {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    visibility: hidden;
    flex-shrink: 0;
    color: var(--el-text-color-secondary);

    .svg-icon:hover {
      color: var(--el-color-primary);
    }
  }
}
</style>
