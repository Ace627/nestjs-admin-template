import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module'
import { DictModule } from './dict/dict.module'
import { RoleModule } from './role/role.module'
import { MenuModule } from './menu/menu.module'
import { DeptModule } from './dept/dept.module'
import { FileModule } from './file/file.module'

@Module({
  imports: [UserModule, DictModule, RoleModule, MenuModule, DeptModule, FileModule],
  exports: [UserModule, RoleModule, MenuModule, DeptModule],
})
export class SystemModule {}
