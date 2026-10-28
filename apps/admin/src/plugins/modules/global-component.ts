import type { App } from 'vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import ProSearch from '@/components/ProSearch/index.vue'
import ProTooltip from '@/components/ProTooltip/index.vue'
import ProPagination from '@/components/ProPagination/index.vue'
import DictTag from '@/components/DictTag/index.vue'
import RightToolbar from '@/components/RightToolbar/index.vue'

/* 异步注册避免进首屏主包，仅渲染到时才加载对应 chunk */
const ProChart = defineAsyncComponent(() => import('@/components/ProChart/index.vue'))
const CrontabDialog = defineAsyncComponent(() => import('@/components/Crontab/index.vue'))
const IconSelect = defineAsyncComponent(() => import('@/components/IconSelect/index.vue'))

export function registerGlobalComponent(app: App<any>) {
  app.component('SvgIcon', SvgIcon)
  app.component('ProChart', ProChart)
  app.component('ProTable', ProTable)
  app.component('ProSearch', ProSearch)
  app.component('ProTooltip', ProTooltip)
  app.component('ProPagination', ProPagination)
  app.component('DictTag', DictTag)
  app.component('IconSelect', IconSelect)
  app.component('CrontabDialog', CrontabDialog)
  app.component('RightToolbar', RightToolbar)
}
