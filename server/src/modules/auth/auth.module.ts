import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { UserModule } from '../system/user/user.module'
import { MenuModule } from '../system/menu/menu.module'
import { RoleModule } from '../system/role/role.module'
import { LogModule } from '../monitor/log/log.module'
import { ConfigModule } from '../system/config/config.module'

@Module({
  imports: [UserModule, MenuModule, RoleModule, LogModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
