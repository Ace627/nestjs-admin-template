import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { RoleEntity, UserEntity, FileEntity } from '@/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeptModule } from '../dept/dept.module'
import { ConfigModule } from '../config/config.module'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, FileEntity]), DeptModule, ConfigModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
