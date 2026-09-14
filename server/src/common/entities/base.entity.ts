import { CommonEntity } from './common.entity'
import { UserContext } from '../context/user.context'
import { BeforeInsert, BeforeUpdate, Column } from 'typeorm'

/**
 * TypeORM 通用实体基类
 * @description 封装所有业务实体的公共字段（主键、创建/更新信息、时间戳），避免重复定义
 * @abstract 抽象类，仅用于继承，不能直接实例化
 */
export abstract class BaseEntity extends CommonEntity {
  /**
   * 创建者 ID/用户名
   * @description 记录数据创建人，默认 null（需业务层手动赋值）
   * @type {string | null}
   * @example "admin123" / "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"
   */
  @Column({ name: 'create_by', comment: '创建人', nullable: true, type: 'varchar', length: 36 })
  createBy: string

  /**
   * 更新者 ID/用户名
   * @description 记录数据最后更新人，默认 null（需业务层手动赋值）
   * @type {string | null}
   * @example "admin456" / "7c9e6679-7425-40de-944b-e07fc1f90ae7"
   */
  @Column({ name: 'update_by', comment: '更新人', nullable: true, type: 'varchar', length: 36 })
  updateBy: string

  // 新增时触发 → 只执行一次
  @BeforeInsert()
  protected beforeInsert() {
    this.createBy = UserContext.getCurrentUsername()
    this.updateBy = UserContext.getCurrentUsername()
  }

  // 更新时触发 → 每次更新都执行
  @BeforeUpdate()
  protected beforeUpdate() {
    this.updateBy = UserContext.getCurrentUsername()
  }
}
