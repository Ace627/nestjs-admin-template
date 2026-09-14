import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { RoleEntity, UserEntity, FileEntity } from '@/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeptModule } from '../dept/dept.module'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoleEntity, FileEntity]), DeptModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
