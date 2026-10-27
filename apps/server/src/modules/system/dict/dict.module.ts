import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DictTypeEntity, DictDataEntity } from '@/common'
import { DictTypeService } from './dict-type.service'
import { DictDataService } from './dict-data.service'
import { DictController } from './dict.controller'

@Module({
  imports: [TypeOrmModule.forFeature([DictTypeEntity, DictDataEntity])],
  controllers: [DictController],
  providers: [DictTypeService, DictDataService],
  exports: [DictTypeService, DictDataService],
})
export class DictModule {}
