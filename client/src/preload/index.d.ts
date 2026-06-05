/**
 * @file Preload 类型声明 — electronAPI 类型定义
 * @description 声明 window.electronAPI 和 window.electron 的类型结构，
 *              使 TypeScript 在渲染进程中能够正确推断这些全局对象的类型。
 * @module preload
 */
import { ElectronAPI } from '@electron-toolkit/preload'

/** 自定义 electronAPI 的接口定义 */
interface CustomAPI {
  /** 调用主进程处理器（IPC invoke） */
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  /** 监听主进程事件（IPC on），返回取消监听的清理函数 */
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  /** HTTP API 端口号（可选） */
  httpPort?: number
  /** HTTP API 认证令牌（可选） */
  httpToken?: string
}

declare global {
  interface Window {
    /** @electron-toolkit/preload 提供的标准 electron API */
    electron: ElectronAPI
    /** 自定义的 electronAPI（context bridge 暴露） */
    electronAPI?: CustomAPI
  }
}
