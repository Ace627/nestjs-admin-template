import type { AuthType } from '@/types'
import { BusinessException, CommonConstant, DataScopeCondition, FileEntity, RedisConstant, RoleEntity, RbacConstant, UserEntity } from '@/common'
import { RedisService } from '@/shared/redis.service'
import { encryptPassword, verifyPassword } from '@/utils'
import { DataSource, Equal, FindOptionsWhere, In, Like, Not, Repository } from 'typeorm'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { Injectable, Logger } from '@nestjs/common'
import { resolve } from 'node:path'
import { existsSync, rmSync } from 'node:fs'
import { DeptService } from '../dept/dept.service'
import { CreateUserDto, QueryUserDto, ResetUserPwdDto, UpdateProfileDto, UpdateUserDto, UpdateUserPwdDto } from './user.dto'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(FileEntity) private readonly fileRepository: Repository<FileEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly deptService: DeptService,
  ) {}

  /** 创建用户 */
  public async create(createDto: CreateUserDto) {
    const { username, phone, email, roleIds } = createDto
    const exists = username && (await this.userRepository.existsBy({ username: Equal(username) }))
    if (exists) throw new BusinessException('该用户已存在')
    // 同名软删墓碑仍占用 username 唯一索引，先物理清理
    if (username) {
      const tombstone = await this.userRepository.findOne({ where: { username: Equal(username) }, withDeleted: true })
      if (tombstone?.deleteTime) await this.userRepository.delete(tombstone.id)
    }
    if (await this.checkPhoneExists(phone)) throw new BusinessException('该手机号已存在')
    if (await this.checkEmailExists(email)) throw new BusinessException('该邮箱已存在')

    const entity = new UserEntity()
    Object.assign(entity, createDto)
    entity.password = await encryptPassword(createDto.password)
    entity.roles = await this.roleRepository.findBy({ id: In(roleIds) })
    await this.userRepository.save(entity)
    await this.cleanUserRelatedCache(entity.id)
    return '添加成功'
  }

  /** 删除用户（持有超管角色的账号禁止删除，按角色判定而非固定 ID） */
  public async delete(userIds: string[]) {
    // 校验目标用户全部存在且未删除（默认排除已软删行）
    const targets = await this.userRepository.findBy({ id: In(userIds) })
    if (targets.length !== new Set(userIds).size) throw new BusinessException('该用户不存在')

    const adminUsers = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('role.roleCode = :roleCode', { roleCode: RbacConstant.SUPER_ROLE_CODE })
      .getMany()
    if (adminUsers.length) throw new BusinessException('系统管理员账号禁止删除')

    const targetIds = userIds
    // 清理用户-角色中间表
    await this.dataSource.createQueryBuilder().delete().from('sys_user_role').where('user_id IN (:...ids)', { ids: targetIds }).execute()
    await this.userRepository.softDelete(targetIds)
    await Promise.all(targetIds.map((userId) => this.cleanUserRelatedCache(userId)))
    return '删除成功'
  }

  /** 编辑用户（同步角色关联；按变更字段精准失效缓存，普通字段不踢下线） */
  public async update(updateDto: UpdateUserDto) {
    const { id, phone, email, roleIds, deptId, status } = updateDto
    const entity = await this.userRepository.findOne({ where: { id: Equal(id) }, relations: { roles: true } })
    if (!entity) throw new BusinessException('该用户不存在')
    if (await this.checkPhoneExists(phone, id)) throw new BusinessException('该手机号已存在')
    if (await this.checkEmailExists(email, id)) throw new BusinessException('该邮箱已存在')

    const statusChangedToDisabled = status === CommonConstant.STATUS_DISABLE && entity.status !== CommonConstant.STATUS_DISABLE
    const rolesChanged = !!roleIds && entity.roles.map((role) => role.id).sort().join() !== [...roleIds].sort().join()
    const deptChanged = !!deptId && deptId !== entity.deptId

    if (roleIds) entity.roles = await this.roleRepository.findBy({ id: In(roleIds) })
    Object.assign(entity, updateDto)
    await this.userRepository.save(entity)

    const invalidationTasks: Promise<unknown>[] = []
    if (statusChangedToDisabled) invalidationTasks.push(this.revokeUserSessions(id))
    if (rolesChanged) invalidationTasks.push(this.redisService.del(`${RedisConstant.ADMIN_USER_ROLES}:${id}`))
    if (deptChanged) invalidationTasks.push(this.redisService.del(`${RedisConstant.ADMIN_USER_DEPTS}:${id}`))
    await Promise.all(invalidationTasks)
    return '更新成功'
  }

  /** 重置密码 */
  public async resetPassword(updateDto: ResetUserPwdDto) {
    // 1. 根据用户名查询用户
    const user = await this.userRepository.findOneBy({ username: Equal(updateDto.username) })
    if (!user) throw new BusinessException('该用户不存在')
    // 2. 校验新旧密码不能相同
    const isSame = await verifyPassword(updateDto.password, user.password)
    if (isSame) throw new BusinessException('新密码不能与原密码相同')
    // 3. 加密新密码
    const newPwd = await encryptPassword(updateDto.password)
    // 4. 更新密码
    await this.userRepository.update(user.id, { password: newPwd })
    // 5. 清除缓存，强制用户重新登录
    await this.cleanUserRelatedCache(user.id)
    // 6. 返回成功提示
    return '密码重置成功，请重新登录'
  }

  /** 修改密码 */
  public async updatePassword(userId: string, updateDto: UpdateUserPwdDto): Promise<string> {
    const { oldPassword, newPassword, repeatPassword } = updateDto
    // 1. 两次密码必须一致
    if (newPassword !== repeatPassword) throw new BusinessException('两次输入的新密码不一致')
    // 2. 查询用户（仅查询id和密码）
    const user = await this.userRepository.findOne({ where: { id: Equal(userId) }, select: { id: true, password: true } })
    if (!user) throw new BusinessException('用户不存在')
    // 3. 校验旧密码是否正确
    const isOldPwdValid = await verifyPassword(oldPassword, user.password)
    if (!isOldPwdValid) throw new BusinessException('旧密码错误')
    // 4. 新密码不能与旧密码相同（加密后对比，最严谨）
    const isSameAsOld = await verifyPassword(newPassword, user.password)
    if (isSameAsOld) throw new BusinessException('新密码不能与原密码相同')
    // 5. 加密并更新密码
    await this.userRepository.update(userId, { password: await encryptPassword(newPassword) })
    // 6. 清除缓存 → 强制重新登录
    await this.cleanUserRelatedCache(userId)
    return '密码修改成功，请重新登录'
  }

  /** 根据用户 ID 查询用户信息（含角色关联，供 getInfo 使用） */
  public async findOneById(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: Equal(userId) }, relations: { roles: true } })
    if (!user) throw new BusinessException(`该用户不存在`)
    return user
  }

  /** 查询用户列表（数据权限条件由 @DataScopeSql 注入；deptId 过滤该部门及其全部子孙部门） */
  public async findList(queryParams: QueryUserDto, ds?: DataScopeCondition) {
    const { skip, take, status, username, nickname, phone, deptId } = queryParams
    const queryBuilder = this.userRepository.createQueryBuilder('user')
    const where: FindOptionsWhere<UserEntity> = {}
    if (username) where.username = Like(`%${username}%`)
    if (nickname) where.nickname = Like(`%${nickname}%`)
    if (phone) where.phone = Like(`%${phone}%`)
    if (status) where.status = Equal(status)
    queryBuilder.where(where)
    // 部门子树过滤（findDescendants 含自身；deptId 无效时返回空集避免 IN () 语法错误）
    if (deptId) {
      const deptIds = await this.deptService.findDescendants([deptId])
      queryBuilder.andWhere(deptIds.length ? 'user.deptId IN (:...deptIds)' : '1 = 0', { deptIds })
    }
    // 数据权限过滤（ds 为 undefined 表示无过滤，如超管）
    if (ds) queryBuilder.andWhere(ds.sql, ds.params)
    queryBuilder.orderBy('user.createTime', 'ASC') // 排序
    queryBuilder.skip(skip).take(take) // 分页
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 获取用户个人信息（含所属角色名组） */
  public async getProfile(id: string) {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
    queryBuilder.leftJoin('user.roles', 'role')
    queryBuilder.where('user.id = :id', { id })
    queryBuilder.select('user.nickname')
    queryBuilder.addSelect('user.realname')
    queryBuilder.addSelect('user.phone')
    queryBuilder.addSelect('user.email')
    queryBuilder.addSelect('user.age')
    queryBuilder.addSelect('user.gender')
    queryBuilder.addSelect('user.avatar')
    queryBuilder.addSelect('user.createTime')
    queryBuilder.addSelect('role.roleName')
    const user = await queryBuilder.getOne()
    if (!user) throw new BusinessException(`该用户不存在`)
    const { roles, ...profile } = user
    return { ...profile, roleGroup: roles.map((role) => role.roleName) }
  }

  /** 更新用户个人信息 */
  public async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const { phone, email, avatar } = updateDto
    if (await this.checkPhoneExists(phone, userId)) throw new BusinessException('该手机号已存在')
    if (await this.checkEmailExists(email, userId)) throw new BusinessException('该邮箱已存在')
    const user = await this.userRepository.findOne({ where: { id: Equal(userId) }, select: { avatar: true } })
    await this.userRepository.update(userId, updateDto)
    if (avatar) this.cleanupStaleAvatar(userId, user?.avatar, avatar)
    return '编辑成功'
  }

  /** 换头像后清理旧物理文件（best-effort）：无其他用户引用该路径且无文件记录引用该哈希时删除磁盘文件 */
  private cleanupStaleAvatar(userId: string, oldAvatar: string | undefined | null, newAvatar: string): void {
    if (!oldAvatar || oldAvatar === newAvatar) return
    if (!/^uploads\/[\w-]+\.(jpe?g|png|webp|gif)$/.test(oldAvatar)) return
    this.cleanupStaleAvatarAsync(userId, oldAvatar).catch((error: unknown) => this.logger.warn(`旧头像清理失败: ${String(error)}`))
  }

  private async cleanupStaleAvatarAsync(userId: string, oldAvatar: string): Promise<void> {
    const referencedByUser = await this.userRepository.existsBy({ avatar: Equal(oldAvatar), id: Not(userId) })
    if (referencedByUser) return
    const fileHash = oldAvatar.split('/').pop()?.split('.')[0]
    if (fileHash) {
      const referencedByFile = await this.fileRepository.createQueryBuilder('file').withDeleted().where('file.fileHash = :fileHash', { fileHash }).getCount()
      if (referencedByFile) return
    }
    const physicalPath = resolve(process.cwd(), oldAvatar)
    if (existsSync(physicalPath)) rmSync(physicalPath, { force: true })
  }

  /**
   * 读取用户角色缓存（AuthService.getInfo / 守卫链路使用）
   * 缓存缺失时回源重建（仅正常状态角色）
   */
  public async getUserRoles(userId: string): Promise<AuthType.UserRoleCache[] | null> {
    const cacheKey = `${RedisConstant.ADMIN_USER_ROLES}:${userId}`
    const jsonStr = await this.redisService.get(cacheKey)
    if (jsonStr) return JSON.parse(jsonStr) as AuthType.UserRoleCache[]

    const user = await this.userRepository.findOne({ where: { id: Equal(userId) }, relations: { roles: true } })
    if (!user) return null
    const roles = (user.roles ?? []).filter((role) => role.status === CommonConstant.STATUS_NORMAL)
    const cache: AuthType.UserRoleCache[] = roles.map((role) => ({ id: role.id, roleCode: role.roleCode }))
    await this.redisService.set(cacheKey, JSON.stringify(cache))
    return cache
  }

  /**
   * 读取用户可见部门缓存（归属部门，数据权限拦截器消费）
   * 缓存缺失时回源重建
   */
  public async getVisibleDeptIds(userId: string): Promise<string[] | null> {
    const cacheKey = `${RedisConstant.ADMIN_USER_DEPTS}:${userId}`
    const jsonStr = await this.redisService.get(cacheKey)
    if (jsonStr) return JSON.parse(jsonStr) as string[]

    const user = await this.userRepository.findOne({ where: { id: Equal(userId) }, select: { id: true, deptId: true } })
    if (!user) return null
    const deptIds = [user.deptId].filter((id) => id && id !== CommonConstant.DEFAULT_PARENT_ID)
    await this.redisService.set(cacheKey, JSON.stringify(deptIds))
    return deptIds
  }

  /** 获取用户仓库 */
  public getRepository() {
    return this.userRepository
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */

  /** 检查手机号是否存在 */
  private async checkPhoneExists(phone?: string, userId?: string): Promise<boolean> {
    if (!phone) return false
    const where: FindOptionsWhere<UserEntity> = {}
    where.phone = Equal(phone)
    if (userId) where.id = Not(userId)
    return await this.userRepository.existsBy(where)
  }

  /** 检查邮箱是否存在 */
  private async checkEmailExists(email?: string, userId?: string): Promise<boolean> {
    if (!email) return false
    const where: FindOptionsWhere<UserEntity> = {}
    where.email = Equal(email)
    if (userId) where.id = Not(userId)
    return await this.userRepository.existsBy(where)
  }

  /** 吊销用户全部会话（access/refresh token / 在线状态）；角色与部门缓存由字段级变更单独失效 */
  private async revokeUserSessions(userId: string) {
    const patterns = [`${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:*`, `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:*`, `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:*`]
    const keys = (await Promise.all(patterns.map((pattern) => this.redisService.scan(pattern)))).flat()
    if (keys.length) await this.redisService.del(...keys)
  }

  /** 清除用户级缓存（access/refresh token / 在线状态 / 角色 / 可见部门） */
  private async cleanUserRelatedCache(userId: string) {
    if (!userId?.trim()) return
    const patterns = [`${RedisConstant.ACCESS_TOKEN_KEY}:${userId}:*`, `${RedisConstant.REFRESH_TOKEN_KEY}:${userId}:*`, `${RedisConstant.ADMIN_USER_ONLINE_KEY}:${userId}:*`, `${RedisConstant.ADMIN_USER_ROLES}:${userId}`, `${RedisConstant.ADMIN_USER_DEPTS}:${userId}`]
    const keys = (await Promise.all(patterns.map((pattern) => this.redisService.scan(pattern)))).flat()
    if (!keys.length) return
    await this.redisService.del(...keys)
  }
}
