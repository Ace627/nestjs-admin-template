/**
 * 基础 sleep 方法（延迟执行）
 * @param {number} delay 延迟毫秒数，必须是有限数字；负数按 0 处理
 * @returns Promise<void> 可通过 await 等待
 * @throws {TypeError} delay 为 Infinity / -Infinity / NaN 时抛出
 */
export function sleep(delay: number = 0): Promise<void> {
  if (!Number.isFinite(delay)) throw new TypeError(`无效的延迟时间：${String(delay)}`)
  return new Promise((resolve) => setTimeout(() => resolve(), delay))
}
