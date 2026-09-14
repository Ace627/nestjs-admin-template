// vue-cropper@1.1.4 包内 typings 链回纯 JS 的 lib/vue-cropper.vue，消费端 vue-tsc 推导报 TS7016，
// 故通过 tsconfig.app.json 的 paths 将该包重定向到本声明文件，绕开包内类型链（运行时仍走 node_modules）。
import type { DefineComponent } from 'vue'

/** VueCropper 组件 props */
export interface VueCropperProps {
  /** 裁剪的图片源（URL / Blob / File，空串不渲染） */
  img?: string | Blob | File
  /** 是否显示截图框宽高信息 */
  info?: boolean
  /** 是否默认生成截图框 */
  autoCrop?: boolean
  /** 生成图片的质量（0~1） */
  outputSize?: number | string
  /** 生成图片的格式（jpg / png / webp） */
  outputType?: string
  /** 是否固定截图框大小 */
  fixedBox?: boolean
  /** 截图框宽高比 */
  fixedNumber?: [number, number]
  /** 截图框默认宽度 */
  autoCropWidth?: number | string
  /** 截图框默认高度 */
  autoCropHeight?: number | string
  /** 截图框是否限制在图片区域内 */
  centerBox?: boolean
  /** 截图框能否拖动 */
  canMoveBox?: boolean
}

export const VueCropper: DefineComponent<VueCropperProps>
