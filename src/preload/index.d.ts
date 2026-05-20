import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: CustomAPI
  }
}
