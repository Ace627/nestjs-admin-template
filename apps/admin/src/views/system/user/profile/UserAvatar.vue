<template>
  <el-dialog v-model="visible" title="修改头像" :close-on-click-modal="false" :width="dialogWidth" append-to-body @opened="handleOpened" @close="handleClose">
    <el-row :gutter="16">
      <el-col :md="12" :xs="24">
        <div class="cropper-area">
          <VueCropper
            v-if="cropperVisible"
            ref="cropperRef"
            :img="imgSrc"
            info
            :output-size="0.8"
            output-type="png"
            :auto-crop="true"
            :auto-crop-width="200"
            :auto-crop-height="200"
            :fixed-box="true"
            :center-box="true"
            @real-time="handleRealTime"
          />
        </div>
      </el-col>
      <el-col :md="12" :xs="24">
        <div class="preview-area">
          <div class="preview-circle">
            <img v-if="preview.url" :src="preview.url" :style="preview.img" draggable="false" alt="头像预览" />
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="mt-16px flex flex-wrap items-center gap-12px">
      <el-button type="primary" plain @click="handleSelectImage">
        选择
        <SvgIcon name="Upload" class="ml-4px" />
      </el-button>
      <el-button title="放大" @click="cropperRef?.changeScale(1)">
        <SvgIcon name="Plus" />
      </el-button>
      <el-button title="缩小" @click="cropperRef?.changeScale(-1)">
        <SvgIcon name="Minus" />
      </el-button>
      <el-button title="左旋" @click="cropperRef?.rotateLeft()">
        <SvgIcon name="RefreshLeft" />
      </el-button>
      <el-button title="右旋" @click="cropperRef?.rotateRight()">
        <SvgIcon name="RefreshRight" />
      </el-button>
      <el-button title="重置" @click="cropperRef?.refresh()">
        <SvgIcon name="Refresh" />
      </el-button>
      <el-button type="primary" :loading="submitting" class="ml-auto" @click="handleSubmit">提 交</el-button>
    </div>
    <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'UserAvatar' })
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { TipModal } from '@/utils'
import { UploadRequest } from '@/api/common/upload.request'
import { UserRequest } from '@/api/system/user.request'
import type { CSSProperties } from 'vue'

/** 组件实例方法清单（包类型质量有限，此处按用到的接口收窄） */
interface VueCropperInstance {
  /** 缩放图片，num 正数为放大、负数为缩小 */
  changeScale: (num: number) => void
  rotateLeft: () => void
  rotateRight: () => void
  /** 重置组件至初始状态（缩放/旋转/位移清零，图片与截图框回到中心） */
  refresh: () => void
  /** 获取裁剪结果 Blob，通过回调返回 */
  getCropBlob: (callback: (blob: Blob) => void) => void
}

/** real-time 事件回传的预览数据 */
interface CropperPreview {
  url: string
  img: CSSProperties
}

const emit = defineEmits<{ refresh: [] }>()

const appStore = useAppStore()
const userStore = useUserStore()
const visible = ref(false)
/** 弹窗完全打开后才挂载裁剪器，保证容器尺寸计算正确 */
const cropperVisible = ref(false)
const submitting = ref(false)
const cropperRef = useTemplateRef<VueCropperInstance>('cropperRef')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const dialogWidth = computed(() => (appStore.isDesktop ? '800px' : 'calc(100% - 32px)'))

/** 裁剪源图片，默认取当前登录者头像 */
const imgSrc = ref<string>(userStore.avatar)
/** 本地创建的 objectURL，替换或关闭时需释放 */
let objectUrl = ''
const preview = ref<CropperPreview>({ url: '', img: {} })

/** 打开弹窗（还原为当前头像） */
function open() {
  imgSrc.value = userStore.avatar
  visible.value = true
}

/** 弹窗打开动画结束后再挂载裁剪器 */
function handleOpened() {
  cropperVisible.value = true
}

/** 关闭弹窗：卸载裁剪器并还原为当前头像 */
function handleClose() {
  cropperVisible.value = false
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = ''
  imgSrc.value = userStore.avatar
  preview.value = { url: '', img: {} }
}

/** 实时预览回调 */
function handleRealTime(data: CropperPreview) {
  preview.value = { url: data.url, img: (data.img ?? {}) as CSSProperties }
}

/** 触发文件选择 */
function handleSelectImage() {
  fileInputRef.value?.click()
}

/** 选中图片后载入裁剪框 */
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) return TipModal.msgError('仅支持选择图片文件')
  if (file.size > 5 * 1024 * 1024) return TipModal.msgError('图片大小不能超过 5MB')
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = URL.createObjectURL(file)
  imgSrc.value = objectUrl
}

/** 提交：上传裁剪结果并更新头像 */
function handleSubmit() {
  cropperRef.value?.getCropBlob(async (blob: Blob) => {
    try {
      submitting.value = true
      const formData = new FormData()
      formData.append('file', blob, 'avatar.png')
      const avatarPath = await UploadRequest.uploadFile(formData)
      const message = await UserRequest.updateProfile({ avatar: avatarPath })
      await userStore.getInfo()
      TipModal.msgSuccess(message || '头像修改成功')
      visible.value = false
      emit('refresh')
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.log('handleSubmit errMsg: ', errMsg)
      return Promise.reject(error)
    } finally {
      submitting.value = false
    }
  })
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.cropper-area {
  width: 100%;
  height: 350px;
}

.preview-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 350px;
}

.preview-circle {
  width: 200px;
  height: 200px;
  overflow: hidden;
  border-radius: 50%;
  box-shadow: 0 0 8px rgb(0 0 0 / 15%);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
