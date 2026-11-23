/**
 * 文件上传常量
 * - 说明：服务端权威上限，前端提示文案仅供参考，最终以服务端校验为准
 * - 用途：控制器 Multer limits、DTO 校验、Service 二次校验共用同一份数值
 */
export const UploadConstant = {
  /** 单文件直传上限：10MB，超出要求走分片 */
  MAX_SINGLE_FILE_SIZE: 10 * 1024 * 1024,

  /** 单个分片请求体上限：10MB（前端固定 5MB 分片，留一倍余量） */
  MAX_CHUNK_SIZE: 10 * 1024 * 1024,

  /** 分片数量上限：10000 片（与对象存储分段上传量级一致） */
  MAX_CHUNK_COUNT: 10000,

  /** 单文件总大小上限：2GB（sys_file.file_size 为 int，有符号上限 2147483647） */
  MAX_FILE_SIZE: 2147483647,
} as const
