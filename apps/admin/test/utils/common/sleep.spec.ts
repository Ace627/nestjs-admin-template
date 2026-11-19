import { afterEach, describe, expect, it, vi } from 'vitest'
import { sleep } from '@/utils/common/sleep'

describe('sleep', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('不传延迟时无需等待即可完成', async () => {
    vi.useFakeTimers()
    const sleepPromise = sleep()

    await vi.advanceTimersByTimeAsync(0)

    await expect(sleepPromise).resolves.toBeUndefined()
  })

  it('延迟未走完时保持 pending，走完后完成', async () => {
    vi.useFakeTimers()
    let isSettled = false

    const sleepPromise = sleep(1000).then(() => {
      isSettled = true
    })

    await vi.advanceTimersByTimeAsync(999)
    expect(isSettled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(isSettled).toBe(true)

    await sleepPromise
  })

  it('多个调用各自按延迟时间完成，互不阻塞', async () => {
    vi.useFakeTimers()
    const finishedOrder: string[] = []

    const shortSleep = sleep(100).then(() => finishedOrder.push('short'))
    const longSleep = sleep(300).then(() => finishedOrder.push('long'))

    await vi.advanceTimersByTimeAsync(100)
    expect(finishedOrder).toEqual(['short'])

    await vi.advanceTimersByTimeAsync(200)
    await Promise.all([shortSleep, longSleep])
    expect(finishedOrder).toEqual(['short', 'long'])
  })

  it('负数延迟按 0 处理，立即完成', async () => {
    vi.useFakeTimers()
    const sleepPromise = sleep(-100)

    await vi.advanceTimersByTimeAsync(0)

    await expect(sleepPromise).resolves.toBeUndefined()
  })

  it('返回 Promise 实例，可直接 await', () => {
    vi.useFakeTimers()
    const sleepPromise = sleep(10)

    expect(sleepPromise).toBeInstanceOf(Promise)

    return vi.advanceTimersByTimeAsync(10)
  })
})

describe('sleep 的非法延迟', () => {
  it('Infinity 抛 TypeError', () => {
    expect(() => sleep(Infinity)).toThrow(TypeError)
  })

  it('-Infinity 抛 TypeError', () => {
    expect(() => sleep(-Infinity)).toThrow(TypeError)
  })

  it('NaN 抛 TypeError', () => {
    expect(() => sleep(NaN)).toThrow(TypeError)
  })

  it('错误信息中包含原始入参，便于定位调用方', () => {
    expect(() => sleep(NaN)).toThrow('无效的延迟时间：NaN')
  })
})
