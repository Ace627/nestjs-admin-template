import { Column, Entity } from 'typeorm'

/**
 * 角色-自定义数据范围关联实体（多对多中间表）
 * @note 仅当 sys_role.data_scope = '2'（自定义）时生效
 * @note 物理删除，不继承 BaseEntity
 */
@Entity('sys_role_dept')
export class RoleDeptEntity {
  @Column({ name: 'role_id', type: 'varchar', length: 36, primary: true, comment: '角色ID' })
  roleId: string

  @Column({ name: 'dept_id', type: 'varchar', length: 36, primary: true, comment: '部门ID' })
  deptId: string
}
