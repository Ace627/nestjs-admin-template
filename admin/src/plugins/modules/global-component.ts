import type { App } from 'vue'
import SvgIcon from '@/components/SvgIcon/index.vue'
import ProChart from '@/components/ProChart/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import ProSearch from '@/components/ProSearch/index.vue'
import ProTooltip from '@/components/ProTooltip/index.vue'
import ProPagination from '@/components/ProPagination/index.vue'
import DictTag from '@/components/DictTag/index.vue'
import IconSelect from '@/components/IconSelect/index.vue'
import CrontabDialog from '@/components/Crontab/index.vue'

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
}
