/**
 * 构建 server 生产镜像，并用 docker save 导出为 dist 下的离线 tar 包
 *
 * 构建上下文 = 仓库根（与 Dockerfile.server / .dockerignore 同级）
 * 用法：node scripts/build-server-image.mjs
 * 镜像名与产物路径统一在下方 config 中修改
 * 导出成功后自动删除本地镜像，Docker Desktop 镜像列表不留存
 */
import { spawnSync } from 'node:child_process'
import { mkdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

// 镜像名与产物路径统一在此修改
const config = {
  // 构建使用的 Dockerfile，相对仓库根
  dockerfileName: 'Dockerfile.server',
  // 构建出的镜像名与标签，save 时导出同一个；与 docker-compose.yml 的 image 保持一致
  imageTag: 'nest-admin-server:latest',
  // 离线 tar 包的产物路径
  outputPath: path.join(projectRoot, 'dist', 'nest-admin-template-server.tar'),
}

/**
 * 探测 Docker 守护进程，未启动时给出明确提示而非抛一大段构建报错
 */
function ensureDockerIsRunning() {
  const versionResult = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  if (versionResult.error) {
    throw new Error(`无法执行 docker 命令，请确认已安装 Docker Desktop：${versionResult.error.message}`)
  }

  if (versionResult.status !== 0) {
    const errorOutput = (versionResult.stderr || '').trim()
    throw new Error(`Docker 守护进程不可用，请先启动 Docker Desktop${errorOutput ? `\n${errorOutput}` : ''}`)
  }

  console.log(`Docker 服务端版本：${versionResult.stdout.trim()}`)
}

/**
 * 执行 docker 子命令，输出直通终端以便观察构建进度
 */
function runDockerCommand(commandArguments, actionDescription) {
  console.log(`\n[docker] ${actionDescription}`)
  console.log(`  docker ${commandArguments.join(' ')}\n`)

  const commandResult = spawnSync('docker', commandArguments, {
    cwd: projectRoot,
    stdio: 'inherit',
  })

  if (commandResult.error) {
    throw new Error(`${actionDescription} 失败：${commandResult.error.message}`)
  }

  if (commandResult.status !== 0) {
    throw new Error(`${actionDescription} 失败，退出码 ${commandResult.status}`)
  }
}

/**
 * 删除文件，文件不存在视为成功
 */
async function removeFileIfExists(filePath) {
  try {
    await unlink(filePath)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

/**
 * 把字节数格式化为 MB，用于输出产物体积
 */
function formatMegabytes(byteSize) {
  return `${(byteSize / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 删除本地镜像，避免 Docker Desktop 镜像列表长期留存一份
 * 产物已落盘，删除失败（如仍被容器引用）只提示，不中断脚本
 */
function removeLocalImage(imageTag) {
  console.log(`\n[docker] 清理本地镜像 ${imageTag}`)

  const removeResult = spawnSync('docker', ['image', 'rm', imageTag], { cwd: projectRoot, stdio: 'inherit' })

  if (removeResult.error || removeResult.status !== 0) {
    console.warn(`本地镜像 ${imageTag} 未能删除，可手动执行：docker image rm ${imageTag}`)
  }
}

async function main() {
  const { dockerfileName, imageTag, outputPath } = config
  let isExportFinished = false

  try {
    ensureDockerIsRunning()

    await mkdir(path.dirname(outputPath), { recursive: true })
    // 先清掉旧产物，避免本次 save 中断后留下新旧混杂的 tar
    await removeFileIfExists(outputPath)

    const buildCommandArguments = ['build', '--file', dockerfileName, '--tag', imageTag, '.']

    runDockerCommand(buildCommandArguments, `构建镜像 ${imageTag}`)
    runDockerCommand(['save', '--output', outputPath, imageTag], '导出镜像 tar 包')

    isExportFinished = true

    removeLocalImage(imageTag)

    const outputStat = await stat(outputPath)
    console.log(['', '镜像已导出', `  镜像：${imageTag}`, `  文件：${outputPath}`, `  体积：${formatMegabytes(outputStat.size)}`, `  离线部署：docker load -i ${path.basename(outputPath)}`].join('\n'))
  } finally {
    // 失败时清掉写坏的半成品 tar
    if (!isExportFinished) await removeFileIfExists(outputPath)
  }
}

main().catch((error) => {
  console.error(`\n构建失败：${error.message}`)
  process.exitCode = 1
})
