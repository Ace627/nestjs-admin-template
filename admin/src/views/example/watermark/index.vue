<template>
  <div class="watermark-page">
    <el-row :gutter="16" class="watermark-page__grid">
      <el-col :xs="24" :md="12" class="watermark-page__col">
        <el-card class="watermark-page__card">
          <template #header>
            <div class="watermark-page__card-header">基础文本水印</div>
          </template>
          <el-watermark :content="VITE_APP_TITLE" :font="{ color: 'rgba(64, 158, 255, 0.35)' }">
            <div class="watermark-page__demo-box">
              <p class="watermark-page__demo-text">这是一段受水印保护的文本内容，适用于文档查看、敏感数据展示等场景。</p>
              <p class="watermark-page__demo-text">水印文字可自定义，默认旋转 -22° 平铺显示。</p>
            </div>
          </el-watermark>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" class="watermark-page__col">
        <el-card class="watermark-page__card">
          <template #header>
            <div class="watermark-page__card-header">多行文本水印</div>
          </template>
          <el-watermark :content="[VITE_APP_TITLE, '管理系统']" :font="{ color: 'rgba(64, 158, 255, 0.35)' }">
            <div class="watermark-page__demo-box">
              <p class="watermark-page__demo-text">支持多行文本水印，通过数组传入每一行内容。</p>
              <p class="watermark-page__demo-text">适用于需要同时展示中文与英文标识的场景。</p>
            </div>
          </el-watermark>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" class="watermark-page__col">
        <el-card class="watermark-page__card">
          <template #header>
            <div class="watermark-page__card-header">图片水印</div>
          </template>
          <el-watermark
            image="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='28' fill='none' stroke='rgba(64,158,255,0.3)' stroke-width='2'/%3E%3Ctext x='32' y='38' text-anchor='middle' fill='rgba(64,158,255,0.3)' font-size='14' font-family='sans-serif'%3ELOGO%3C/text%3E%3C/svg%3E"
            :width="80"
            :height="80"
          >
            <div class="watermark-page__demo-box">
              <p class="watermark-page__demo-text">水印类型：图片（SVG / PNG）</p>
              <p class="watermark-page__demo-text">尺寸：80 × 80 | 旋转：-22° | 间距：[100, 100]</p>
            </div>
          </el-watermark>
          <div class="watermark-page__controls">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="水印类型">图片（base64 / URL）</el-descriptions-item>
              <el-descriptions-item label="推荐分辨率">2x 或 3x 原图尺寸</el-descriptions-item>
              <el-descriptions-item label="图片格式">SVG / PNG / JPG</el-descriptions-item>
              <el-descriptions-item label="适用场景">品牌 Logo、防伪标识</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12" class="watermark-page__col">
        <el-card class="watermark-page__card">
          <template #header>
            <div class="watermark-page__card-header">自定义配置</div>
          </template>
          <el-watermark :content="customConfig.content" :font="customConfig.font" :rotate="customConfig.rotate" :gap="customConfig.gap">
            <div class="watermark-page__demo-box">
              <p class="watermark-page__demo-text">水印内容：{{ customConfig.content }}</p>
              <p class="watermark-page__demo-text">旋转角度：{{ customConfig.rotate }}° | 间距：{{ customConfig.gap }}</p>
            </div>
          </el-watermark>
          <div class="watermark-page__controls">
            <el-form label-width="80px" size="small">
              <el-form-item label="水印文字">
                <el-input v-model="customConfig.content" placeholder="请输入水印文字" />
              </el-form-item>
              <el-form-item label="旋转角度">
                <el-slider v-model="customConfig.rotate" :min="-90" :max="90" show-input />
              </el-form-item>
              <el-form-item label="水平间距">
                <el-slider v-model="customConfig.gap[0]" :min="50" :max="300" show-input />
              </el-form-item>
              <el-form-item label="垂直间距">
                <el-slider v-model="customConfig.gap[1]" :min="50" :max="300" show-input />
              </el-form-item>
              <el-form-item label="字体颜色">
                <el-color-picker v-model="customConfig.font.color" />
              </el-form-item>
              <el-form-item label="字体大小">
                <el-input-number v-model="customConfig.font.fontSize" :min="12" :max="48" />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" class="watermark-page__col">
        <el-card class="watermark-page__card">
          <template #header>
            <div class="watermark-page__card-header">表格数据保护（业务场景）</div>
          </template>
          <el-watermark :content="VITE_APP_TITLE" :font="{ color: 'rgba(64, 158, 255, 0.2)', fontSize: 14 }" :gap="[120, 120]">
            <ProTable :data="tableData" :columns="columns" border stripe size="small">
              <template #status="{ row }">
                <el-tag :type="row.status === '成功' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
              </template>
            </ProTable>
          </el-watermark>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import type { ProTableColumn } from '@/components/ProTable/types'

const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE

interface LoginRecord {
  username: string
  ip: string
  location: string
  browser: string
  os: string
  loginTime: string
  status: string
}

const columns: ProTableColumn<LoginRecord>[] = [
  { align: 'center', type: 'index', label: '序号', width: 60 },
  { align: 'center', prop: 'username', label: '用户名称', minWidth: 120 },
  { align: 'center', prop: 'ip', label: '登录地址', minWidth: 140 },
  { align: 'center', prop: 'location', label: '登录地点', minWidth: 120 },
  { align: 'center', prop: 'browser', label: '浏览器', minWidth: 140 },
  { align: 'center', prop: 'os', label: '操作系统', minWidth: 140 },
  { align: 'center', prop: 'loginTime', label: '登录时间', minWidth: 170 },
  { align: 'center', slot: 'status', label: '状态', width: 80 },
]

const customConfig = reactive({
  content: VITE_APP_TITLE,
  rotate: -22,
  gap: [100, 100] as [number, number],
  font: {
    color: 'rgba(64, 158, 255, 0.35)',
    fontSize: 16,
  },
})

const tableData: LoginRecord[] = [
  { username: 'admin', ip: '192.168.1.100', location: '杭州', browser: 'Chrome 120', os: 'Windows 11', loginTime: '2026-05-10 09:15:32', status: '成功' },
  { username: 'zhangsan', ip: '10.0.0.56', location: '上海', browser: 'Edge 120', os: 'macOS 14', loginTime: '2026-05-10 08:42:18', status: '成功' },
  { username: 'lisi', ip: '172.16.5.88', location: '北京', browser: 'Firefox 121', os: 'Ubuntu 22', loginTime: '2026-05-10 08:30:05', status: '成功' },
  { username: 'guest', ip: '203.0.113.45', location: '未知', browser: 'Safari 17', os: 'iOS 17', loginTime: '2026-05-10 07:55:21', status: '失败' },
  { username: 'wangwu', ip: '192.168.2.33', location: '深圳', browser: 'Chrome 119', os: 'Windows 10', loginTime: '2026-05-09 18:20:47', status: '成功' },
]
</script>

<style lang="scss" scoped>
.watermark-page {
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

  &__demo-box {
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    border: 1px dashed var(--el-border-color);
  }

  &__demo-text {
    margin: 4px 0;
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.8;
  }

  &__controls {
    margin-top: 16px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    :deep(.el-form-item) {
      margin-bottom: 12px;
    }

    :deep(.el-form-item:last-child) {
      margin-bottom: 0;
    }
  }
}

html[data-device='mobile'] {
  .watermark-page {
    padding: 12px;

    &__col {
      margin-bottom: 12px;
    }

    &__demo-box {
      min-height: 140px;
      padding: 12px;
    }

    &__controls {
      :deep(.el-form-item__label) {
        width: 64px !important;
      }
    }
  }
}
</style>
