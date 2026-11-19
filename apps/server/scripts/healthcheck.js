import http from 'node:http'

// 端口跟随容器环境变量，避免改了 SERVER_PORT 后探针仍探 3000 导致误判
const port = process.env.SERVER_PORT ?? 3000

const request = http.request(`http://127.0.0.1:${port}/api/monitor/health/live`, (response) => {
  process.exit(response.statusCode === 200 ? 0 : 1)
})

request.on('error', (error) => {
  const errMsg = error instanceof Error ? error.message : String(error)
  // 👉 关键调试：把错误信息打印出来！这样 docker inspect 才能看到原因
  console.error('Health check error:', errMsg)
  process.exit(1)
})
request.setTimeout(2000, () => {
  console.error('Health check timeout')
  request.destroy()
  process.exit(1)
})

request.end()
