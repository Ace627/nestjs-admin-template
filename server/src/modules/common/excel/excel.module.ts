import { Module } from '@nestjs/common'
import { ExcelService } from './excel.service'
import { DictModule } from '@/modules/system/dict/dict.module'

@Module({
  imports: [DictModule],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
