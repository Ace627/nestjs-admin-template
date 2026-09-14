<template>
  <div class="signature-page">
    <el-row :gutter="16" class="signature-page__grid">
      <el-col :xs="24" class="signature-page__col">
        <el-card class="signature-page__card">
          <template #header>
            <div class="signature-page__card-header">手写签名板</div>
          </template>
          <div class="signature-page__canvas-wrap" @pointerdown="startDraw" @pointermove="draw" @pointerup="endDraw" @pointerleave="endDraw" @pointercancel="endDraw">
            <canvas ref="canvasRef" class="signature-page__canvas" />
            <div v-if="strokes.length === 0" class="signature-page__placeholder">在此区域手写签名</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" class="signature-page__col">
        <el-card class="signature-page__card">
          <template #header>
            <div class="signature-page__card-header">画笔设置</div>
          </template>
          <div class="signature-page__controls-inner">
            <div class="signature-page__control-item">
              <span class="signature-page__control-label">画笔颜色</span>
              <el-color-picker v-model="penColor" :predefine="predefineColors" />
            </div>
            <div class="signature-page__control-item signature-page__control-item--slider">
              <span class="signature-page__control-label">线条粗细</span>
              <el-slider v-model="penWidth" :min="1" :max="12" :step="1" show-input />
            </div>
            <div class="signature-page__control-item signature-page__control-item--grow">
              <el-button @click="undoStroke" :disabled="strokes.length === 0">
                <template #icon><SvgIcon name="ArrowLeft" /></template>
                撤销
              </el-button>
              <el-button type="danger" plain @click="clearCanvas" :disabled="strokes.length === 0">
                <template #icon><SvgIcon name="Delete" /></template>
                清空
              </el-button>
              <el-button type="primary" @click="exportAndDownload" :disabled="strokes.length === 0">
                <template #icon><SvgIcon name="Download" /></template>
                导出下载
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" class="signature-page__col">
        <el-card class="signature-page__card">
          <template #header>
            <div class="signature-page__card-header">技术说明</div>
          </template>
          <el-descriptions :column="appStore.isDesktop ? 3 : 1" border size="small">
            <el-descriptions-item label="绘图技术">Canvas 2D API（DPR 适配高清屏）</el-descriptions-item>
            <el-descriptions-item label="交互方式">Pointer Events（鼠标 / 触控笔 / 手指触摸）</el-descriptions-item>
            <el-descriptions-item label="笔迹平滑">二次贝塞尔曲线 midpoint 插值</el-descriptions-item>
            <el-descriptions-item label="撤销机制">完整笔划存储，按次回退</el-descriptions-item>
            <el-descriptions-item label="导出格式">PNG / base64 dataURL</el-descriptions-item>
            <el-descriptions-item label="适用场景">审批签字、合同签署、报销留痕</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { linkDownload } from '@/utils'

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
  color: string
  width: number
}

const appStore = useAppStore()

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const strokes = ref<Stroke[]>([])
const currentStroke = ref<Stroke | null>(null)
const penColor = ref('#333333')
const penWidth = ref(3)
const isDrawing = ref(false)

const predefineColors = ['#333333', '#E74C3C', '#E67E22', '#27AE60', '#2980B9', '#8E44AD']

function getCanvasSize() {
  if (!canvasRef.value) return { width: 0, height: 0 }
  const rect = canvasRef.value.parentElement!.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const { width, height } = getCanvasSize()
  if (width === 0 || height === 0) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function getCanvasPoint(e: PointerEvent): Point {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e: PointerEvent) {
  if (e.pointerType === 'touch') {
    e.preventDefault()
  }
  isDrawing.value = true
  const point = getCanvasPoint(e)
  currentStroke.value = { points: [point], color: penColor.value, width: penWidth.value }
  canvasRef.value!.setPointerCapture(e.pointerId)
}

function draw(e: PointerEvent) {
  if (!isDrawing.value || !currentStroke.value) return
  const point = getCanvasPoint(e)
  const stroke = currentStroke.value
  stroke.points.push(point)
  redrawCanvas()
  drawCurrentStroke()
}

function endDraw() {
  if (!isDrawing.value || !currentStroke.value) return
  isDrawing.value = false
  if (currentStroke.value.points.length === 1) {
    const single = currentStroke.value.points[0]
    const extra = { x: single.x + 0.5, y: single.y + 0.5 }
    currentStroke.value.points.push(extra)
  }
  strokes.value.push(currentStroke.value)
  currentStroke.value = null
  redrawCanvas()
}

function redrawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  strokes.value.forEach((s) => renderStroke(ctx, s))
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, color, width } = stroke
  if (points.length < 2) return
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
  }
  if (points.length > 1) {
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  }
  ctx.stroke()
}

function drawCurrentStroke() {
  const canvas = canvasRef.value
  if (!canvas || !currentStroke.value) return
  const ctx = canvas.getContext('2d')!
  ctx.save()
  renderStroke(ctx, currentStroke.value)
  ctx.restore()
}

function undoStroke() {
  strokes.value.pop()
  redrawCanvas()
}

function clearCanvas() {
  strokes.value = []
  currentStroke.value = null
  redrawCanvas()
}

function exportAndDownload() {
  const canvas = canvasRef.value
  if (!canvas) return
  const tempCanvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  const { width, height } = getCanvasSize()
  tempCanvas.width = width * dpr
  tempCanvas.height = height * dpr
  tempCanvas.style.width = `${width}px`
  tempCanvas.style.height = `${height}px`
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
  tempCtx.fillStyle = '#FFFFFF'
  tempCtx.fillRect(0, 0, width, height)
  tempCtx.drawImage(canvas, 0, 0)
  const dataUrl = tempCanvas.toDataURL('image/png')
  const fileName = `签名_${new Date().toISOString().slice(0, 10)}.png`
  linkDownload(dataUrl, fileName)
}

let resizeObserver: ResizeObserver | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null

function handleResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    if (strokes.value.length === 0) {
      initCanvas()
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    initCanvas()
    const img = new Image()
    img.onload = () => {
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
    }
    img.src = dataUrl
  }, 200)
}

onMounted(() => {
  initCanvas()
  const wrap = canvasRef.value?.parentElement
  if (wrap) {
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.observe(wrap)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (resizeTimer) clearTimeout(resizeTimer)
})
</script>

<style lang="scss" scoped>
.signature-page {
  padding: 16px;

  &__grid {
    display: flex;
    flex-wrap: wrap;
  }

  &__col {
    margin-bottom: 16px;
  }

  &__card {
    height: 100%;
  }

  &__card-header {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__canvas-wrap {
    position: relative;
    width: 100%;
    height: 320px;
    background: var(--el-bg-color);
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    cursor: crosshair;
    touch-action: none;
    user-select: none;
  }

  &__canvas {
    display: block;
  }

  &__placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: var(--el-text-color-placeholder);
    pointer-events: none;
  }

  &__controls-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    padding: 8px 0;
  }

  &__control-item {
    display: flex;
    align-items: center;
    gap: 8px;

    &--slider {
      flex: 1;
      min-width: 200px;
      max-width: 320px;
    }

    &--grow {
      margin-left: auto;
    }
  }

  &__control-label {
    font-size: 14px;
    color: var(--el-text-color-regular);
    white-space: nowrap;
  }
}

html[data-device='mobile'] {
  .signature-page {
    padding: 12px;

    &__col {
      margin-bottom: 12px;
    }

    &__canvas-wrap {
      height: 260px;
    }

    &__placeholder {
      font-size: 16px;
    }

    &__controls-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    &__control-item--grow {
      margin-left: 0;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      :deep(.el-button) {
        flex: 1;
        min-width: 0;
      }
    }

    &__control-item--slider {
      width: 100%;
      max-width: 100%;
    }
  }
}
</style>
