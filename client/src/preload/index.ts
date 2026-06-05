/**
 * @file Preload 脚本 — Context Bridge 主入口
 * @description 通过 Electron contextBridge 将主进程的 IPC 通信能力暴露给渲染进程，
 *              提供 invoke/on/httpPort/httpToken/tmpdir 等 API。
 *              所有暴露的接口在 window.electronAPI 对象上可访问。
 * @module preload
 */
import { contextBridge, ipcRenderer } from 'electron'
import { tmpdir } from 'os'

/** 从进程参数中解析 HTTP API 端口号（--http-port=xxx），默认 34116 */
const httpPortArg = process.argv.find((a) => a.startsWith('--http-port='))
const httpPort = httpPortArg ? Number(httpPortArg.split('=')[1]) : 34116

/** 从进程参数中解析 HTTP API 认证令牌（--http-token=xxx），默认为空 */
const httpTokenArg = process.argv.find((a) => a.startsWith('--http-token='))
const httpToken = httpTokenArg ? httpTokenArg.split('=')[1] : ''

/** 暴露给渲染进程的 API 对象 */
const api = {
  /**
   * 通过 IPC 调用主进程处理器
   * @param channel - IPC 频道名称（如 "wallet:list"）
   * @param args - 传递给处理器的参数列表
   * @returns 处理器返回的结果
   */
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args)
  },
  /**
   * 注册 IPC 事件监听器
   * @param channel - IPC 频道名称
   * @param callback - 事件回调函数
   * @returns 取消监听的清理函数
   */
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void =>
      callback(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  /** HTTP API 端口号（从主进程参数传入） */
  httpPort: httpPort,
  /** HTTP API 认证令牌（从主进程参数传入） */
  httpToken: httpToken,
  /** 获取系统临时目录路径 */
  tmpdir: (): string => tmpdir()
}

if (process.contextIsolated) {
  // 上下文隔离启用时，通过 contextBridge 安全暴露 API
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // 上下文隔离未启用时，直接挂载到 window 对象
  ;(window as unknown as Record<string, unknown>).electronAPI = api
}
