<template></template>

<script setup lang="ts">
defineOptions({ name: 'Redirect' })

const route = useRoute()
const router = useRouter()

/** created：从 fullPath 取原始编码路径回跳（params 会被 vue-router 解码，iframe 外链路径中的 %2F 解码后与注册路由不匹配会 404） */
router.replace(route.fullPath.replace(/^\/redirect/, ''))
</script>
