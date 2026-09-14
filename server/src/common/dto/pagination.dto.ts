import { Type } from 'class-transformer'
import { IsOptional, IsNumber, Min } from 'class-validator'

export class PaginationDto {
  /* 当前页 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字类型' }) // 校验是否为数字，自定义错误提示
  public pageNo: number

  /* 每页条数 */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: '每页条数必须是数字类型' })
  public pageSize?: number

  /* MySQL 查询时忽略的条数（数据库层面使用，前端无需传入） */
  public skip: number

  /*  MySQL 查询时返回的条数（数据库层面使用，前端无需传入） */
  public take: number
}
