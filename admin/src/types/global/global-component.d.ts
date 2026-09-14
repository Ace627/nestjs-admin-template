import { GlobalComponents } from 'vue'

export {}

declare module 'vue' {
  export interface GlobalComponents {
    SvgIcon: (typeof import('../components/SvgIcon/index.vue'))['default']
    ProChart: (typeof import('../components/ProChart/index.vue'))['default']
    ProTable: (typeof import('../components/ProTable/index.vue'))['default']
    ProSearch: (typeof import('../components/ProSearch/index.vue'))['default']
    ProTooltip: (typeof import('../components/ProTooltip/index.vue'))['default']
    ProPagination: (typeof import('../components/ProPagination/index.vue'))['default']
    DictTag: (typeof import('../components/DictTag/index.vue'))['default']
    IconSelect: (typeof import('../components/IconSelect/index.vue'))['default']
    CrontabDialog: (typeof import('../components/Crontab/index.vue'))['default']
  }
}
