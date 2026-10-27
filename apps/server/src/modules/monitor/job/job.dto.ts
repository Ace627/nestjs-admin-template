import { PickType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { PaginationDto } from '@/common'

export class CreateJobDto {
  @IsNotEmpty({ message: '任务名称不能为空' })
  jobName: string

  @IsNotEmpty({ message: '调用目标不能为空' })
  invokeTarget: string

  @IsNotEmpty({ message: '执行表达式不能为空' })
  cronExpression: string

  @IsOptional()
  @IsString()
  jobGroup: string

  @IsOptional()
  @IsString()
  misfirePolicy: string

  @IsOptional()
  @IsString()
  concurrent: string

  @IsOptional()
  @IsString()
  status: string

  @IsOptional()
  @IsString()
  remark: string
}

export class UpdateJobDto extends PickType(CreateJobDto, ['jobName', 'invokeTarget', 'cronExpression', 'jobGroup', 'misfirePolicy', 'concurrent', 'status', 'remark']) {
  @IsNotEmpty({ message: '任务编号不能为空' })
  id: string
}

export class ChangeJobStatusDto extends PickType(UpdateJobDto, ['id']) {
  @IsNotEmpty({ message: '任务状态不能为空' })
  status: string
}

export class RunJobDto {
  @IsNotEmpty({ message: '任务编号不能为空' })
  jobId: string

  @IsNotEmpty({ message: '任务组名不能为空' })
  jobGroup: string
}

export class QueryJobDto extends PaginationDto {
  @IsOptional()
  @IsString()
  jobName: string

  @IsOptional()
  @IsString()
  jobGroup: string

  @IsOptional()
  @IsString()
  status: string
}

export class AnalysisInvokeTargetDto {
  @IsString()
  invokeTarget: string
}

export class QueryJobLogDto extends PaginationDto {
  @IsOptional()
  @IsString()
  jobName: string

  @IsOptional()
  @IsString()
  jobGroup: string

  @IsOptional()
  @IsString()
  status: string
}
