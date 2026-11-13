/**
 * 基础 sleep 方法（延迟执行）
 * @param {number} delay 延迟毫秒数
 * @returns Promise<void> 可通过 await 等待
 */
export function sleep(delay: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), delay))
}
