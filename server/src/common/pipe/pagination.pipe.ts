import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'

/**
 * 分页参数处理管道
 * 作用：自动解析前端传入的分页参数（pageNo/pageSize），并计算出数据库查询需要的 skip/take 参数
 * 场景：用于列表接口，统一处理分页逻辑，避免重复编写分页参数解析代码
 */
@Injectable()
export class PaginationPipe implements PipeTransform {
  /**
   * 管道核心转换方法
   * @param value 前端传入的请求参数（如 query / body 中的数据）
   * @param metadata 参数元数据（包含参数类型、所属类/方法等信息，此处未使用）
   * @returns 处理后的参数（新增 skip/take 字段，保留原有字段）
   */
  transform(value: any) {
    // 1. 解析页码：优先取前端传入的 pageNo，无则默认第1页
    // +value.pageNo 是把字符串类型的参数转为数字类型（前端传参默认是字符串）
    const pageNo = value.pageNo ? value.pageNo : 1

    // 2. 解析每页条数：优先取前端传入的 pageSize，无则默认每页10条
    const pageSize = value.pageSize ? value.pageSize : 10

    // 3. 计算分页偏移量（skip）：即数据库查询时需要「跳过前面多少条数据」
    // 公式：(当前页码 - 1) * 每页条数 → 比如第2页、每页10条，需要跳过前10条
    const skip: number = (pageNo - 1) * pageSize

    // 4. 计算当前页查询条数（take）：即数据库查询时需要「取多少条数据」，等于每页条数
    const take: number = pageSize

    // 5. 把计算好的 skip/take 挂载到参数对象上，供后续业务逻辑使用
    value.skip = skip
    value.take = take

    // 6. 返回处理后的参数（保留原有字段，新增分页计算字段）
    return value
  }
}
