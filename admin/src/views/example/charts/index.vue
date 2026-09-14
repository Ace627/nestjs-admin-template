<template>
  <div class="charts-page">
    <el-row :gutter="16" class="charts-page__grid">
      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">柱状图（单数据）</div>
          </template>
          <ProChart :options="barSingleOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">柱状图（多组数据）</div>
          </template>
          <ProChart :options="barMultipleOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">柱状图（堆叠）</div>
          </template>
          <ProChart :options="barStackOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">折线图</div>
          </template>
          <ProChart :options="lineOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">折线图（填充背景）</div>
          </template>
          <ProChart :options="lineAreaOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">折线图（多组数据）</div>
          </template>
          <ProChart :options="lineMultipleOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">柱状图（水平）</div>
          </template>
          <ProChart :options="barHorizontalOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">柱状图（水平多组）</div>
          </template>
          <ProChart :options="barHorizontalMultipleOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">柱状图（水平堆叠）</div>
          </template>
          <ProChart :options="barHorizontalStackOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">环形图</div>
          </template>
          <ProChart :options="pieRingOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">饼图</div>
          </template>
          <ProChart :options="pieOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">散点图</div>
          </template>
          <ProChart :options="scatterOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">雷达图</div>
          </template>
          <ProChart :options="radarOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">K线图</div>
          </template>
          <ProChart :options="klineOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" class="charts-page__col">
        <el-card class="charts-page__card">
          <template #header>
            <div class="charts-page__card-header">双坐标轴柱状图</div>
          </template>
          <ProChart :options="dualAxisOption" customClass="charts-page__chart" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'

const barSingleOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: false },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', max: 250 },
  series: [
    {
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110, 130],
      itemStyle: { borderRadius: [4, 4, 0, 0] },
    },
  ],
}))

const barMultipleOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['KPI完成', '实际', '目标'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: false },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', max: 250 },
  series: [
    { name: 'KPI完成', type: 'bar', data: [80, 220, 150, 80, 60, 80, 120], itemStyle: { borderRadius: [4, 4, 0, 0] } },
    { name: '实际', type: 'bar', data: [50, 40, 30, 30, 40, 50, 40], itemStyle: { borderRadius: [4, 4, 0, 0] } },
    { name: '目标', type: 'bar', data: [100, 180, 120, 100, 80, 90, 110], itemStyle: { borderRadius: [4, 4, 0, 0] } },
  ],
}))

const barStackOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['Q1', 'Q2', 'Q3', 'Q4'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: false },
  xAxis: { type: 'category', data: ['华东', '华南', '华北', '西南', '西北', '东北', '华中'] },
  yAxis: { type: 'value', max: 100 },
  series: [
    { name: 'Q1', type: 'bar', stack: 'total', data: [25, 30, 20, 15, 10, 18, 22] },
    { name: 'Q2', type: 'bar', stack: 'total', data: [20, 25, 25, 20, 15, 22, 20] },
    { name: 'Q3', type: 'bar', stack: 'total', data: [30, 25, 25, 30, 35, 25, 30] },
    { name: 'Q4', type: 'bar', stack: 'total', data: [25, 20, 30, 35, 40, 35, 28] },
  ],
}))

const lineOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: false },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] },
  yAxis: { type: 'value', max: 150 },
  series: [
    {
      type: 'line',
      data: [30, 50, 70, 60, 80, 100, 120, 130, 110, 90, 70, 50],
      smooth: true,
    },
  ],
}))

const lineAreaOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: false },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], boundaryGap: false },
  yAxis: { type: 'value', max: 120 },
  series: [
    {
      type: 'line',
      data: [20, 40, 60, 80, 100, 110, 120, 110, 90, 70, 50, 30],
      areaStyle: { opacity: 0.3 },
      smooth: true,
    },
  ],
}))

const lineMultipleOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['销售A', '销售B', '销售C'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: false },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], boundaryGap: false },
  yAxis: { type: 'value', max: 150 },
  series: [
    { name: '销售A', type: 'line', data: [60, 80, 95, 110, 120, 130, 140, 135, 120, 100, 80, 65], areaStyle: { opacity: 0.2 }, smooth: true },
    { name: '销售B', type: 'line', data: [40, 55, 70, 85, 95, 105, 115, 110, 95, 75, 55, 45], areaStyle: { opacity: 0.2 }, smooth: true },
    { name: '销售C', type: 'line', data: [20, 35, 50, 65, 80, 90, 100, 95, 80, 60, 40, 30], areaStyle: { opacity: 0.2 }, smooth: true },
  ],
}))

const barHorizontalOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: false },
  xAxis: { type: 'value', max: 150 },
  yAxis: { type: 'category', data: ['产品A', '产品B', '产品C', '产品D', '产品E', '产品F', '产品G'] },
  series: [
    {
      type: 'bar',
      data: [35, 65, 90, 110, 130, 145, 150],
      itemStyle: { borderRadius: [0, 4, 4, 0] },
    },
  ],
}))

const barHorizontalMultipleOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['2023', '2024', '2025'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: false },
  xAxis: { type: 'value', max: 100 },
  yAxis: { type: 'category', data: ['电子产品', '服装鞋帽', '食品饮料', '家居用品', '美妆护肤', '运动户外'] },
  series: [
    { name: '2023', type: 'bar', data: [45, 55, 40, 35, 50, 30], itemStyle: { borderRadius: [0, 4, 4, 0] } },
    { name: '2024', type: 'bar', data: [60, 70, 55, 50, 65, 45], itemStyle: { borderRadius: [0, 4, 4, 0] } },
    { name: '2025', type: 'bar', data: [80, 85, 70, 65, 80, 60], itemStyle: { borderRadius: [0, 4, 4, 0] } },
  ],
}))

const barHorizontalStackOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['线上', '线下', '渠道'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: false },
  xAxis: { type: 'value', max: 100 },
  yAxis: { type: 'category', data: ['华东区', '华南区', '华北区', '西南区'] },
  series: [
    { name: '线上', type: 'bar', stack: 'total', data: [40, 50, 35, 25] },
    { name: '线下', type: 'bar', stack: 'total', data: [35, 25, 40, 45] },
    { name: '渠道', type: 'bar', stack: 'total', data: [25, 25, 25, 30] },
  ],
}))

const pieRingOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { data: ['搜索引擎', '直接访问', '邮件营销', '社交媒体'], bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['45%', '75%'],
      data: [
        { value: 45, name: '搜索引擎', itemStyle: { color: '#5470c6' } },
        { value: 30, name: '直接访问', itemStyle: { color: '#91cc75' } },
        { value: 15, name: '邮件营销', itemStyle: { color: '#fac858' } },
        { value: 10, name: '社交媒体', itemStyle: { color: '#ee6666' } },
      ],
      label: { show: false },
    },
  ],
}))

const pieOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left', data: ['分类A', '分类B', '分类C', '分类D'] },
  series: [
    {
      type: 'pie',
      radius: '55%',
      data: [
        { value: 45, name: '分类A', itemStyle: { color: '#5470c6' } },
        { value: 30, name: '分类B', itemStyle: { color: '#73c0de' } },
        { value: 18, name: '分类C', itemStyle: { color: '#91cc75' } },
        { value: 7, name: '分类D', itemStyle: { color: '#fac858' } },
      ],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    },
  ],
}))

const scatterOption = computed<EChartsOption>(() => {
  const data = []
  for (let i = 0; i < 30; i++) {
    data.push([Math.random() * 12 + 1, Math.random() * 10 + 2])
  }
  return {
    tooltip: { trigger: 'item' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: false },
    xAxis: { type: 'value', min: 0, max: 14 },
    yAxis: { type: 'value', min: 0, max: 14 },
    series: [
      {
        type: 'scatter',
        data,
        symbolSize: 10,
        itemStyle: { color: '#5470c6' },
      },
    ],
  }
})

const radarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { data: ['2023年', '2024年', '2025年'], bottom: 0 },
  radar: {
    indicator: [
      { name: '销售', max: 100 },
      { name: '市场', max: 100 },
      { name: '研发', max: 100 },
      { name: '客服', max: 100 },
      { name: '技术', max: 100 },
      { name: '管理', max: 100 },
    ],
    axisName: { color: '#666' },
    splitNumber: 5,
    alignTicks: false,
  },
  series: [
    {
      type: 'radar',
      data: [
        { value: [60, 55, 70, 65, 50, 55], name: '2023年' },
        { value: [70, 75, 80, 75, 65, 70], name: '2024年' },
        { value: [85, 80, 85, 80, 75, 75], name: '2025年' },
      ],
    },
  ],
}))

const klineOption = computed<EChartsOption>(() => {
  const data = [
    ['2024-01-01', 28, 35, 25, 32],
    ['2024-01-02', 32, 38, 28, 35],
    ['2024-01-03', 35, 42, 30, 40],
    ['2024-01-04', 40, 45, 38, 43],
    ['2024-01-05', 43, 48, 40, 45],
    ['2024-01-08', 45, 52, 42, 50],
    ['2024-01-09', 50, 55, 48, 53],
    ['2024-01-10', 53, 58, 50, 55],
  ]
  const dates = data.map((item) => item[0])
  const values = data.map((item) => item.slice(1))
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['K线', 'MA5'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: false },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', scale: true, min: 20, max: 60 },
    series: [
      { name: 'K线', type: 'candlestick', data: values },
      { name: 'MA5', type: 'line', data: [30, 34, 38, 40, 44, 46, 48, 52], smooth: true, lineStyle: { opacity: 0.8 } },
    ],
  }
})

const dualAxisOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: false },
  xAxis: { type: 'category', data: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'] },
  yAxis: { type: 'value', min: -100, max: 100 },
  series: [
    { type: 'bar', data: [65, 72, 58, 78, 45, 38, 32, 28], itemStyle: { borderRadius: [4, 4, 0, 0] } },
    { type: 'bar', data: [35, 28, -42, -35, -25, -18, -12, -8], itemStyle: { borderRadius: [4, 4, 0, 0] } },
  ],
}))
</script>

<style lang="scss" scoped>
.charts-page {
  padding: 16px;

  &__header {
    margin-bottom: 16px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

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

  &__chart {
    height: 320px;
  }
}

html[data-device='mobile'] {
  .charts-page {
    padding: 12px;

    &__chart {
      height: 280px;
    }

    &__col {
      margin-bottom: 12px;
    }
  }
}
</style>
