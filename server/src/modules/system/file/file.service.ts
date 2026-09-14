import { extname, resolve } from 'node:path'
import { createReadStream, existsSync, rmSync } from 'node:fs'
import { Injectable, StreamableFile } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Equal, FindOptionsWhere, Like, Not, Repository } from 'typeorm'
import { listToTree } from '@/utils'
import { BusinessException, CommonConstant, FileEntity, FileType } from '@/common'
import { CreateFolderDto, QueryFileDto, RecycleQueryDto, RegisterFileDto, UpdateFolderDto } from './file.dto'

@Injectable()
export class FileService {
  /** 文件上传根目录（与 UploadService 保持一致） */
  private readonly UPLOAD_DIR_PATH = resolve(process.cwd(), 'uploads')

  constructor(
    @InjectRepository(FileEntity) private readonly fileRepository: Repository<FileEntity>,
  ) {}

  /** 目录树（仅目录、未删除） */
  public async findFolderTree(): Promise<FileEntity[]> {
    const list = await this.fileRepository.find({ where: { fileType: Equal(FileType.FOLDER) }, order: { createTime: 'ASC' } })
    return listToTree<FileEntity>(list)
  }

  /** 当前目录下的文件分页列表（仅未删除） */
  public async findList(queryParams: QueryFileDto): Promise<{ total: number; records: FileEntity[] }> {
    const { skip, take, parentId, fileName } = queryParams
    const where: FindOptionsWhere<FileEntity> = { parentId: Equal(parentId ?? CommonConstant.DEFAULT_PARENT_ID) }
    if (fileName) where.fileName = Like(`%${fileName}%`)
    const [records, total] = await this.fileRepository.findAndCount({ where, skip, take, order: { createTime: 'DESC' } })
    return { total, records }
  }

  /** 新建目录 */
  public async createFolder(createDto: CreateFolderDto): Promise<string> {
    const parentId = createDto.parentId || CommonConstant.DEFAULT_PARENT_ID
    await this.assertParentFolder(parentId)
    await this.assertFolderNameUnique(parentId, createDto.fileName)
    const entity = new FileEntity()
    Object.assign(entity, { ...createDto, parentId, fileType: FileType.FOLDER, ancestors: await this.buildAncestors(parentId) })
    await this.fileRepository.save(entity)
    return '新增成功'
  }

  /** 重命名目录（不支持移动，父级恒不变） */
  public async updateFolder(updateDto: UpdateFolderDto): Promise<string> {
    const entity = await this.fileRepository.findOneBy({ id: Equal(updateDto.id) })
    if (!entity || entity.fileType !== FileType.FOLDER) throw new BusinessException('目录不存在')
    if (updateDto.fileName && updateDto.fileName !== entity.fileName) await this.assertFolderNameUnique(entity.parentId, updateDto.fileName, entity.id)
    Object.assign(entity, { fileName: updateDto.fileName })
    await this.fileRepository.save(entity)
    return '修改成功'
  }

  /** 删除文件/目录（目录按 ancestors 级联软删整棵子树，进入回收站） */
  public async delete(ids: string[]): Promise<string> {
    const targets = await this.findIncludingDeleted(ids)
    if (targets.length !== new Set(ids).size) throw new BusinessException('文件不存在')
    await this.fileRepository.softDelete(await this.expandWithDescendants(targets))
    return '删除成功，已移入回收站'
  }

  /** 上传登记：单传/分片合并成功后调用，将物理文件登记为目录下的一条文件记录 */
  public async register(registerDto: RegisterFileDto): Promise<string> {
    const parentId = registerDto.parentId || CommonConstant.DEFAULT_PARENT_ID
    await this.assertParentFolder(parentId)
    const fileExt = extname(registerDto.fileName)
    const physicalPath = resolve(this.UPLOAD_DIR_PATH, `${registerDto.fileHash}${fileExt}`)
    if (!existsSync(physicalPath)) throw new BusinessException('物理文件不存在，请先完成上传')
    // 同目录同哈希已登记 → 幂等返回（秒传场景重复登记）
    const registered = await this.fileRepository.findOneBy({ parentId: Equal(parentId), fileHash: Equal(registerDto.fileHash) })
    if (registered) return '文件已登记'
    const entity = new FileEntity()
    Object.assign(entity, {
      parentId,
      ancestors: await this.buildAncestors(parentId),
      fileType: FileType.FILE,
      fileName: registerDto.fileName,
      fileHash: registerDto.fileHash,
      filePath: `uploads/${registerDto.fileHash}${fileExt}`,
      fileSize: registerDto.fileSize,
      fileExt: fileExt || null,
      mimeType: registerDto.mimeType || null,
    })
    await this.fileRepository.save(entity)
    return '登记成功'
  }

  /** 文件下载（流式响应，保留原始文件名） */
  public async download(id: string): Promise<StreamableFile> {
    const entity = await this.fileRepository.findOneBy({ id: Equal(id) })
    if (!entity || entity.fileType !== FileType.FILE) throw new BusinessException('文件不存在')
    // filePath 口径为相对项目根（如 uploads/xxx.png），与静态资源挂载、UploadService 返回值一致
    const physicalPath = resolve(process.cwd(), entity.filePath)
    if (!existsSync(physicalPath)) throw new BusinessException('物理文件已丢失，请联系管理员')
    const filename = encodeURIComponent(entity.fileName)
    return new StreamableFile(createReadStream(physicalPath), {
      disposition: `attachment; filename="${filename}"; filename*=UTF-8''${filename}`,
      type: entity.mimeType || 'application/octet-stream',
    })
  }

  /** 回收站分页列表（仅已软删记录，按删除时间倒序） */
  public async findRecycleList(queryParams: RecycleQueryDto): Promise<{ total: number; records: FileEntity[] }> {
    const { skip, take, fileName } = queryParams
    const queryBuilder = this.fileRepository.createQueryBuilder('file').withDeleted()
    queryBuilder.where('file.deleteTime IS NOT NULL')
    if (fileName) queryBuilder.andWhere('file.fileName LIKE :fileName', { fileName: `%${fileName}%` })
    queryBuilder.orderBy('file.deleteTime', 'DESC')
    queryBuilder.skip(skip).take(take)
    const [records, total] = await queryBuilder.getManyAndCount()
    return { total, records }
  }

  /** 从回收站还原（目录级联还原整棵子树） */
  public async restore(ids: string[]): Promise<string> {
    const targets = await this.findIncludingDeleted(ids)
    if (targets.length !== new Set(ids).size) throw new BusinessException('文件不存在')
    await this.fileRepository.restore(await this.expandWithDescendants(targets))
    return '还原成功'
  }

  /** 回收站彻底删除（引用计数：同一哈希仍有其他记录引用时不删磁盘文件） */
  public async deletePermanent(ids: string[]): Promise<string> {
    const removedCount = await this.purge(await this.resolvePurgeIds(ids))
    return `彻底删除成功${removedCount ? `，清理物理文件 ${removedCount} 个` : ''}`
  }

  /** 清空回收站 */
  public async clearRecycle(): Promise<string> {
    const allDeleted = await this.fileRepository.createQueryBuilder('file').withDeleted().select('file.id', 'id').where('file.deleteTime IS NOT NULL').getRawMany()
    if (!allDeleted.length) throw new BusinessException('回收站已为空')
    const removedCount = await this.purge(await this.resolvePurgeIds(allDeleted.map((row) => row.id)))
    return `回收站已清空${removedCount ? `，清理物理文件 ${removedCount} 个` : ''}`
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Handler                              */
  /* -------------------------------------------------------------------------- */

  /** 按 ID 查询（含已软删，回收站操作用） */
  private findIncludingDeleted(ids: string[]): Promise<FileEntity[]> {
    return this.fileRepository.createQueryBuilder('file').withDeleted().where('file.id IN (:...ids)', { ids }).getMany()
  }

  /** 计算目标及其全部子孙 ID（目录按 ancestors 前缀级联，含自身） */
  private async expandWithDescendants(targets: FileEntity[]): Promise<string[]> {
    const folderPrefixes = targets.filter((item) => item.fileType === FileType.FOLDER).map((item) => `${item.ancestors},${item.id}`)
    if (!folderPrefixes.length) return targets.map((item) => item.id)
    const descendants = await this.fileRepository
      .createQueryBuilder('file')
      .withDeleted()
      .select('file.id', 'id')
      .where(folderPrefixes.map((_, index) => `file.ancestors LIKE :prefix${index}`).join(' OR '), Object.fromEntries(folderPrefixes.map((prefix, index) => [`prefix${index}`, `${prefix}%`])))
      .getRawMany()
    return [...new Set([...targets.map((item) => item.id), ...descendants.map((row) => row.id)])]
  }

  /**
   * 汇总彻底删除的最终 ID 集合（入参 + 目录级联子孙）
   */
  private async resolvePurgeIds(ids: string[]): Promise<string[]> {
    const targets = await this.findIncludingDeleted(ids)
    if (targets.length !== new Set(ids).size) throw new BusinessException('文件不存在')
    return this.expandWithDescendants(targets)
  }

  /**
   * 物理删除：先按 file_hash 引用计数判定是否删磁盘文件，再硬删 DB 记录
   * 引用口径 = 全部记录（含已软删）中，同一哈希且不在本次删除集合内的数量
   */
  private async purge(allIds: string[]): Promise<number> {
    const records = await this.findIncludingDeleted(allIds)
    const fileRecords = records.filter((item) => item.fileType === FileType.FILE && item.fileHash)
    let removedCount = 0
    for (const hash of new Set(fileRecords.map((item) => item.fileHash))) {
      const referenced = await this.fileRepository.createQueryBuilder('file').withDeleted().where('file.fileHash = :hash AND file.id NOT IN (:...ids)', { hash, ids: allIds }).getCount()
      if (referenced) continue
      const record = fileRecords.find((item) => item.fileHash === hash)
      if (!record) continue
      const physicalPath = resolve(process.cwd(), record.filePath)
      if (existsSync(physicalPath)) {
        rmSync(physicalPath, { force: true })
        removedCount += 1
      }
    }
    await this.fileRepository.delete(allIds)
    return removedCount
  }

  /** 校验父节点为根或目录（目录/文件登记共用） */
  private async assertParentFolder(parentId: string): Promise<void> {
    if (parentId === CommonConstant.DEFAULT_PARENT_ID) return
    const parent = await this.fileRepository.findOneBy({ id: Equal(parentId) })
    if (!parent || parent.fileType !== FileType.FOLDER) throw new BusinessException('父目录不存在')
  }

  /** 同一父目录下目录名唯一（编辑时排除自身） */
  private async assertFolderNameUnique(parentId: string, fileName: string, excludeId?: string): Promise<void> {
    const where: FindOptionsWhere<FileEntity> = { parentId: Equal(parentId), fileName: Equal(fileName), fileType: Equal(FileType.FOLDER) }
    if (excludeId) where.id = Not(excludeId)
    if (await this.fileRepository.existsBy(where)) throw new BusinessException('同级目录下已存在同名目录')
  }

  /** 根据父节点 ID 计算 ancestors 链（借鉴 dept 模块） */
  private async buildAncestors(parentId: string): Promise<string> {
    if (parentId === CommonConstant.DEFAULT_PARENT_ID) return CommonConstant.DEFAULT_PARENT_ID
    const parent = await this.fileRepository.findOneBy({ id: Equal(parentId) })
    if (!parent || parent.fileType !== FileType.FOLDER) throw new BusinessException('父目录不存在')
    return `${parent.ancestors},${parent.id}`
  }
}
