# excel-import 实施模板

标本来源：`system/user` 定稿版。`<>` 标记处替换为目标模块对应物；未标注处原样照抄。

## 1. 实体：`@Excel` 导入列

`server/src/common/entities/<...>/<模块>.entity.ts`。仅给「用户可填的业务字段」加装饰器；密码、外键 ID、关联关系、审计字段不进模板。导入专列用 `type: ExcelType.IMPORT`（不影响以后可能新增的导出）。

```ts
import { Excel } from '@/common/decorator/excel.decorator'
import { ExcelType } from '@/common/constant/excel.constant'

// 字段上方加（示例）：
@Excel({ name: '用户账号', type: ExcelType.IMPORT })
@Column({ ... })
username: string

// 字典列：填字典标签，导入/模板自动做 标签↔值 互转
@Excel({ name: '状态', dictType: 'sys_normal_disable', type: ExcelType.IMPORT })
@Column({ ... })
status: string
```

字典列下拉由 `ExcelService.importTemplate` 自动生成（第 2~1000 行 list 校验），业务侧零代码。

## 2. DTO：ImportXxxDto

`server/src/modules/<分组>/<模块>/<模块>.dto.ts` 追加。FormData 传参均为字符串：布尔用 `'true'/'false'`（service 内转换），关联 ID 用逗号串（service 内拆分并校验存在性）。

```ts
// IsIn 需在既有 class-validator 导入中补
export class ImportUserDto {
  /** 是否覆盖已存在用户（FormData 布尔以字符串传输：'true'/'false'） */
  @IsIn(['true', 'false'], { message: 'updateSupport 取值不合法' })
  updateSupport: string

  /** 归属部门 ID（本次导入的所有新用户共用） */
  @IsNotEmpty({ message: '归属部门不能为空' })
  @IsString()
  deptId: string

  /** 角色 ID（FormData 传逗号拼接字符串，Service 内拆分） */
  @IsNotEmpty({ message: '用户角色不能为空' })
  @IsString()
  roleIds: string
}
```

## 3. Controller：两个端点

```ts
// 顶部导入补充：
// @nestjs/common 增加 UploadedFile、UseInterceptors
// import { FileInterceptor } from '@nestjs/platform-express'
// @/common 增加 SkipTransform（BusinessType/Operlog 通常已引入）
// dto 导入追加 ImportXxxDto

/** 下载<模块>导入模板（blob 响应） */
@SkipTransform()
@Post('importTemplate')
@RequirePermissions(['system:<模块>:import'])
public importTemplate() {
  return this.userService.importTemplate()
}

/** 导入<模块>（file 为 xlsx 文件；updateSupport 控制是否覆盖已存在用户） */
@Post('importData')
@RequirePermissions(['system:<模块>:import'])
@Operlog({ title: '<功能名>', businessType: BusinessType.IMPORT })
@UseInterceptors(FileInterceptor('file'))
public importData(@UploadedFile() file: ExpressMulterFile, @Body() importDto: ImportUserDto) {
  return this.userService.importData(file, importDto)
}
```

## 4. Service：模板下载 + 导入

构造器注入（`ExcelModule` 经 `@Global CommonModule` 已导出，无需 module imports；`ConfigService` 需模块导入 ConfigModule）：

```ts
import { Injectable, Logger, StreamableFile } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { ExcelService } from '@/modules/common/excel/excel.service'

private readonly configService: ConfigService,
private readonly excelService: ExcelService,
```

模板下载（文件名按模块改）：

```ts
/** 下载<模块>导入模板 */
public async importTemplate(): Promise<StreamableFile> {
  const fileReadableStream = await this.excelService.importTemplate(XxxEntity)
  const filename = encodeURIComponent('<模块>导入模板.xlsx')
  const disposition = `attachment; filename="${filename}"; filename*=UTF-8''${filename}`
  const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return new StreamableFile(fileReadableStream, { disposition, type })
}
```

导入（骨架，`<保护口径>`/`<唯一字段>`/`<初始密码参数>` 按模块适配；完整实现见 `system/user/user.service.ts` 的 `importData`）：

```ts
/** 导入<模块>（首错即返；<受保护数据>禁止被导入修改；覆盖模式仅更新资料字段） */
public async importData(file: ExpressMulterFile, importDto: ImportUserDto) {
  this.validateImportFile(file)
  const updateSupport = importDto.updateSupport === 'true'
  const roleIds = importDto.roleIds.split(',').map((id) => id.trim()).filter(Boolean)
  if (!roleIds.length) throw new BusinessException('<关联字段>不能为空')

  const rows = await this.excelService.import(XxxEntity, file)

  // 文件内校验（不查库，首个错误立即抛出）：业务主键格式、文件内去重、值域校验
  const seenKeys = new Set<string>()
  for (const row of rows) {
    const { username } = row.data
    if (!username || !usernameRegex.test(username)) throw new BusinessException(`第 ${row.rowNumber} 行：<主键校验文案>`)
    if (seenKeys.has(username)) throw new BusinessException(`第 ${row.rowNumber} 行：<主键名>「${username}」在文件中重复`)
    seenKeys.add(username)
  }

  const result = await this.dataSource.transaction(async (manager) => {
    const xxxRepository = manager.getRepository(XxxEntity)
    const <关联>Repository = manager.getRepository(<关联>Entity)

    const <关联>s = await <关联>Repository.findBy({ id: In(roleIds) })
    if (<关联>s.length !== new Set(roleIds).size) throw new BusinessException('所选<关联>不存在或已被删除')

    const keys = rows.map((row) => row.data.username)
    const existingMap = new Map((await xxxRepository.find({ where: { username: In(keys) }, relations: { <关联>: true } })).map((item) => [item.username, item]))

    // 保护口径 + 覆盖判定
    if (updateSupport) {
      const protectedKey = keys.find((key) => existingMap.get(key)?.<命中受保护数据的判定，如 roles.some(role => role.roleCode === RbacConstant.SUPER_ROLE_CODE)>)
      if (protectedKey) throw new BusinessException(`<受保护数据>「${protectedKey}」禁止导入修改`)
    } else {
      const firstExisting = keys.find((key) => existingMap.has(key))
      if (firstExisting) throw new BusinessException(`<主键名>「${firstExisting}」已存在`)
    }

    // 唯一字段：文件内去重 + 库内查重（覆盖模式排除自身）
    for (const row of rows) {
      const selfId = updateSupport ? existingMap.get(row.data.username)?.id : undefined
      // 逐个唯一字段（如 phone/email）：
      // if (seenXxx.has(v)) throw ... 在文件中重复
      // const where: FindOptionsWhere<XxxEntity> = { phone: Equal(v) }
      // if (selfId) where.id = Not(selfId)
      // if (await xxxRepository.existsBy(where)) throw ... 已存在
    }

    // 同名软删墓碑先物理清理（与模块 create 口径一致）
    const withDeleted = await xxxRepository.find({ where: { username: In(keys) }, withDeleted: true })
    const activeKeys = new Set(existingMap 的 keys)
    const tombstoneIds = withDeleted.filter((item) => item.deleteTime && !activeKeys.has(item.username)).map((item) => item.id)
    if (tombstoneIds.length) await xxxRepository.delete(tombstoneIds)

    // 入库
    const initialPassword = await encryptPassword(await this.configService.getStringConfig('sys.user.initPassword', '123456'))
    const affectedIds: string[] = []
    let createdCount = 0
    let updatedCount = 0
    for (const row of rows) {
      const existing = existingMap.get(row.data.username)
      if (existing) {
        Object.assign(existing, row.data) // 仅 Excel 内资料字段，密码/关联/归属不动
        await xxxRepository.save(existing)
        updatedCount++
        affectedIds.push(existing.id)
      } else {
        const entity = new XxxEntity()
        Object.assign(entity, row.data, { password: initialPassword, deptId: importDto.deptId, roles: <关联>s })
        await xxxRepository.save(entity)
        createdCount++
        affectedIds.push(entity.id)
      }
    }
    return { createdCount, updatedCount, affectedIds }
  })

  await Promise.all(result.affectedIds.map((id) => this.clean<模块>Cache(id))) // 复用模块既有缓存清理方法
  return `导入成功：新增 ${result.createdCount} 条、更新 ${result.updatedCount} 条`
}
```

文件校验私有方法（原样照抄）：

```ts
/** 导入文件校验：仅允许 .xlsx（旧版 .xls 引擎不支持；ZIP 魔数拦截改后缀的伪造文件） */
private validateImportFile(file: ExpressMulterFile): void {
  if (!file?.buffer?.length) throw new BusinessException('导入文件不能为空')
  const ext = (file.originalname ?? '').split('.').pop()?.toLowerCase()
  if (ext === 'xls') throw new BusinessException('暂不支持旧版 .xls 格式，请将文件另存为 .xlsx 后重新上传')
  if (ext !== 'xlsx') throw new BusinessException('仅支持 .xlsx 格式文件')
  const isZipMagic = file.buffer[0] === 0x50 && file.buffer[1] === 0x4b
  if (!isZipMagic) throw new BusinessException('导入文件不是有效的 .xlsx 文件')
}
```

## 5. Module 登记

模块需读系统参数时：`server/src/modules/<分组>/<模块>/<模块>.module.ts` 的 imports 追加 `ConfigModule`（来自 `../config/config.module`）。

## 6. 前端 request

`admin/src/api/<...>/<模块>.request.ts` 追加：

```ts
/** 下载<模块>导入模板（blob 响应，拦截器透传完整 axios response） */
static importTemplate() {
  return request.post('/system/<模块>/importTemplate', {}, { responseType: 'blob' })
}

/** 导入<模块>（FormData：file + updateSupport + <关联字段>） */
static importData(data: FormData): Promise<string> {
  return request.post('/system/<模块>/importData', data)
}
```

## 7. 前端导入弹窗

新增 `admin/src/views/<...>/<模块>/components/XxxImportDialog.vue`，完整定稿版见 `admin/src/views/system/user/components/UserImportDialog.vue`。适配要点：

- `defineOptions({ name: 'XxxImportDialog' })` 紧邻 `<script setup>` 下（弹窗子组件允许命名）；
- `open()` 重置表单并加载关联下拉数据（与该模块新增弹窗同一数据源与方法）；
- 弹窗内字段：关联字段下拉（必填校验）+ 是否覆盖开关（说明文案「已存在用户仅更新资料字段（密码、部门、角色不变）」按模块语义改写，保持一行不折行）+ 单行紧凑拖拽上传；
- 文件条：文件名 + 「删除」链接（`SvgIcon name="Delete"`），点击清空 `form.file`；
- `handleFileChange`：`accept` 之外再校验扩展名，`.xls` 与非 `.xlsx` 分别提示（文案与后端一致）；
- `handleImport`：`formRef.validate()` → FormData（`file`/`updateSupport`/关联字段）→ `XxxRequest.importData` → `closeDialog()` + `emits('getList')` + `TipModal.msgSuccess(message)`；
- `defineExpose({ open })`。

移动端自适应（定稿口径，勿丢）：

```html
<el-form :label-position="appStore.isMobile ? 'top' : 'right'" :label-width="appStore.isMobile ? undefined : '100px'">
  <el-col :span="appStore.isMobile ? 24 : 12"> <!-- 关联字段并排两列，移动端整行 -->
  <!-- 开关 + 说明文字包 flex items-center gap-8px，开关 shrink-0 -->
```

拖拽区样式（非 scoped + 自定义类圈定作用域，勿用 scoped `:deep()`）：

```html
<el-upload class="import-upload" drag :auto-upload="false" :show-file-list="false" accept=".xlsx" :disabled="importing" :on-change="handleFileChange">
  <div class="flex items-center justify-center gap-8px">
    <SvgIcon name="Upload" class="text-20px color-[var(--el-color-primary)]" />
    <span class="text-14px">将文件拖到此处，或 <em>点击选择</em></span>
    <span class="text-12px color-[var(--el-text-color-secondary)]">仅支持 .xlsx 格式文件</span>
  </div>
</el-upload>
```

```scss
<style lang="scss">
/* 拖拽上传区默认固定 360px 宽、40px 上下内边距，压成撑满整行的单行样式（非 scoped，以自定义类圈定作用域） */
.import-upload {
  width: 100%;
  .el-upload-dragger {
    width: 100%;
    padding: 12px 16px;
  }
}
</style>
```

## 8. index.vue 按钮 + 挂载

```html
<!-- 工具栏（新增/批量删除之后） -->
<el-button v-permissions="['system:<模块>:import']" plain type="warning" @click="handleImport">
  <template #icon><SvgIcon name="Upload" /></template><span>导入</span>
</el-button>

<!-- 弹窗挂载 -->
<XxxImportDialog ref="xxxImportDialogRef" @getList="getList" />
```

```ts
import XxxImportDialog from './components/XxxImportDialog.vue'
const xxxImportDialogRef = useTemplateRef('xxxImportDialogRef')
function handleImport() {
  xxxImportDialogRef.value?.open()
}
```

## 9. 验收清单

构建口径：server `npm run build`、admin `pnpm build`（真实类型检查口径）。

1. 下载导入模板：文件名正确、表头与实体 `@Excel` 列一致、字典列出现下拉（选项 = 字典标签）；
2. 填 2 行正常数据导入：提示「导入成功：新增 2 条、更新 0 条」，新记录初始密码取系统参数（缺失回退默认值），可正常登录/使用；
3. 同一批文件再次导入（不勾覆盖）：报「<主键名>已存在」，库内无新增；
4. 勾选覆盖再导入：返回更新条数，仅资料字段变化，密码/关联/归属不变；
5. 模板填入受保护数据（用户模块 = 超管账号）+ 勾覆盖：整体驳回；
6. 唯一字段冲突（文件内重复 / 与库内冲突）：报错带 `第 N 行：` 定位，无部分成功；
7. 上传 `.xls`、改后缀假 `.xlsx`、空文件：分别得到对应友好提示。
