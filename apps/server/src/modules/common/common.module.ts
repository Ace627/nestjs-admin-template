import { Global, Module } from '@nestjs/common'
import { ExcelModule } from './excel/excel.module'
import { UploadModule } from './upload/upload.module'

@Global()
@Module({
  imports: [ExcelModule, UploadModule],
  exports: [ExcelModule, UploadModule],
})
export class CommonModule {}
