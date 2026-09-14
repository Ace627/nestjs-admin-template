import { Body, Controller, Delete, Get, ParseArrayPipe, Post, Put, Query } from '@nestjs/common'
import { BusinessType, Operlog, PaginationPipe, RequirePermissions, SkipTransform } from '@/common'
import { FileService } from './file.service'
import { CreateFolderDto, QueryFileDto, RecycleQueryDto, RegisterFileDto, UpdateFolderDto } from './file.dto'

@Controller('system/file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /** 目录树（仅目录、未删除） */
  @Get('tree')
  @RequirePermissions(['system:file:query'])
  findFolderTree() {
    return this.fileService.findFolderTree()
  }

  /** 当前目录下文件分页列表 */
  @Get('list')
  @RequirePermissions(['system:file:query'])
  findList(@Query(PaginationPipe) queryParams: QueryFileDto) {
    return this.fileService.findList(queryParams)
  }

  /** 新建目录 */
  @Post('folder/create')
  @RequirePermissions(['system:file:create'])
  @Operlog({ title: '文件管理', businessType: BusinessType.INSERT })
  createFolder(@Body() createDto: CreateFolderDto) {
    return this.fileService.createFolder(createDto)
  }

  /** 重命名目录 */
  @Put('folder/update')
  @RequirePermissions(['system:file:update'])
  @Operlog({ title: '文件管理', businessType: BusinessType.UPDATE })
  updateFolder(@Body() updateDto: UpdateFolderDto) {
    return this.fileService.updateFolder(updateDto)
  }

  /** 删除文件/目录（软删，进入回收站） */
  @Delete('delete')
  @RequirePermissions(['system:file:delete'])
  @Operlog({ title: '文件管理', businessType: BusinessType.DELETE })
  delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.fileService.delete(ids)
  }

  /** 上传登记：单传/分片合并成功后写入文件记录 */
  @Post('register')
  @RequirePermissions(['system:file:create'])
  @Operlog({ title: '文件管理', businessType: BusinessType.IMPORT })
  register(@Body() registerDto: RegisterFileDto) {
    return this.fileService.register(registerDto)
  }

  /** 文件下载 */
  @Get('download')
  @SkipTransform()
  @RequirePermissions(['system:file:query'])
  download(@Query('id') id: string) {
    return this.fileService.download(id)
  }

  /* ----------------------------- 回收站 ----------------------------- */

  /** 回收站分页列表 */
  @Get('recycle/list')
  @RequirePermissions(['system:file:recycle'])
  findRecycleList(@Query(PaginationPipe) queryParams: RecycleQueryDto) {
    return this.fileService.findRecycleList(queryParams)
  }

  /** 回收站还原 */
  @Put('recycle/restore')
  @RequirePermissions(['system:file:recycle'])
  @Operlog({ title: '文件管理', businessType: BusinessType.UPDATE })
  restore(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.fileService.restore(ids)
  }

  /** 回收站彻底删除 */
  @Delete('recycle/delete')
  @RequirePermissions(['system:file:recycle'])
  @Operlog({ title: '文件管理', businessType: BusinessType.DELETE })
  deletePermanent(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.fileService.deletePermanent(ids)
  }

  /** 清空回收站 */
  @Delete('recycle/clear')
  @RequirePermissions(['system:file:recycle'])
  @Operlog({ title: '文件管理', businessType: BusinessType.CLEAR })
  clearRecycle() {
    return this.fileService.clearRecycle()
  }
}
