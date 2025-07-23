// utils.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/utils.ts
// 最后更新: 2025/7/23

// utils.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 通用工具函数库

// 导入 clsx 库用于条件性类名合并
import { type ClassValue, clsx } from "clsx";
// 导入 tailwind-merge 用于合并 Tailwind CSS 类名
import { twMerge } from "tailwind-merge";

/**
 * 合并 CSS 类名的工具函数
 * 使用 clsx 处理条件性类名，然后用 tailwind-merge 合并 Tailwind 类名
 * @param inputs - 要合并的类名数组
 * @returns 合并后的类名字符串
 */
// cn 函数
// 工具函数 - 可复用的功能函数
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成 UUID v4 字符串
 * 优先使用 crypto.randomUUID()，如果不可用则回退到自定义实现
 * @returns UUID v4 格式的字符串
 */
// generateUUID 函数
// 工具函数 - 可复用的功能函数
export function generateUUID(): string {
  // 如果浏览器支持原生 crypto.randomUUID，则使用它
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  // 使用 crypto.getRandomValues 的安全回退方案
  // 常量定义 - 不可变的值
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // 设置版本 4 (UUIDv4)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // 设置变体 10xxxxxx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // 将字节数组转换为十六进制字符串
  // 常量定义 - 不可变的值
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0"));

  // 按照 UUID 格式拼接字符串
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}

/**
 * 检查元素是否为 DOM 元素
 * @param el - 要检查的元素
 * @returns 如果是 DOM 元素则返回 true
 */
// isDOMElement 函数
// 工具函数 - 可复用的功能函数
export function isDOMElement(el: any): el is HTMLElement {
  return !!el && (el instanceof Element || el instanceof HTMLElement);
}

/**
 * 检查元素是否可输入文本
 * @param el - 要检查的 HTML 元素
 * @returns 如果元素可以输入文本则返回 true
 */
// isTypableElement 函数
// 工具函数 - 可复用的功能函数
export function isTypableElement(el: HTMLElement): boolean {
  // 如果元素是可编辑的，则返回 true
  if (el.isContentEditable) return true;

  // 如果是 input 元素且未禁用，则返回 true
  if (el.tagName === "INPUT") {
    return !(el as HTMLInputElement).disabled;
  }
  // 如果是 textarea 元素且未禁用，则返回 true
  if (el.tagName === "TEXTAREA") {
    return !(el as HTMLTextAreaElement).disabled;
  }

  return false;
}

/**
 * 检查是否为 Apple 设备
 * @returns 如果是 Apple 设备则返回 true
 */
// isAppleDevice 函数
// 工具函数 - 可复用的功能函数
export function isAppleDevice() {
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}

/**
 * 获取平台特定的修饰键符号
 * @returns Apple 设备返回 "⌘"，其他设备返回 "Ctrl"
 */
// getPlatformSpecialKey 函数
// 工具函数 - 可复用的功能函数
export function getPlatformSpecialKey() {
  return isAppleDevice() ? "⌘" : "Ctrl";
}

/**
 * 获取平台特定的替代键符号
 * @returns Apple 设备返回 "⌥"，其他设备返回 "Alt"
 */
// getPlatformAlternateKey 函数
// 工具函数 - 可复用的功能函数
export function getPlatformAlternateKey() {
  return isAppleDevice() ? "⌥" : "Alt";
}
