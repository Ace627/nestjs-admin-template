import { SkipThrottle } from '@/common'
import { UploadService } from './upload.service'
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express'
import { CheckFileDto, ClearChunkDto, MergeChunkDto, UploadChunkDto } from './upload.dto'
import { Body, Controller, Delete, Post, Query, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common'

// @Public()
@Controller('common/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /** 单文件上传 */
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  public uploadFile(@UploadedFile() file: ExpressMulterFile) {
    return this.uploadService.uploadFile(file)
  }

  /** 秒传 + 断点续传检查 */
  @Post('check')
  public checkFile(@Body() body: CheckFileDto) {
    return this.uploadService.checkFile(body)
  }

  /** 上传单个分片 */
  @SkipThrottle()
  @Post('chunk')
  @UseInterceptors(AnyFilesInterceptor())
  public uploadChunk(@UploadedFiles() files: ExpressMulterFile[], @Body() body: UploadChunkDto) {
    return this.uploadService.uploadChunk(files, body)
  }

  /** 合并所有分片 */
  @Post('chunk/merge')
  public mergeChunk(@Body() body: MergeChunkDto) {
    return this.uploadService.mergeChunk(body)
  }

  /** 清理分片 */
  @Delete('chunk/clear')
  public clearChunk(@Query() clearChunkDto: ClearChunkDto) {
    return this.uploadService.clearChunk(clearChunkDto)
  }
}
