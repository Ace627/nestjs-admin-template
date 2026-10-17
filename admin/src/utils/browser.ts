/**
 * 读取元素上的 CSS 变量值，默认读 <html>（:root），body 或组件元素上的变量需传入对应 element
 * @param name CSS 变量名，需带 -- 前缀，如 '--el-font-family'
 * @param element 目标元素，默认 document.documentElement
 * @returns 去除首尾空白的变量值，变量不存在时为空字符串
 */
export function getCssVar(name: string, element: Element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(name).trim()
}

/**
 * 设置元素上的 CSS 变量值，默认写到 <html>（:root），全站生效
 * @param name CSS 变量名，需带 -- 前缀，如 '--el-font-family'
 * @param value 变量值
 * @param element 目标元素，默认 document.documentElement
 */
export function setCssVar(name: string, value: string, element: HTMLElement = document.documentElement) {
  element.style.setProperty(name, value)
}
