import { contextBridge, ipcRenderer } from 'electron'
const httpPortArg = process.argv.find((a) => a.startsWith('--http-port='))
const httpPort = httpPortArg ? Number(httpPortArg.split('=')[1]) : 34116
const api = {
  invoke: (channel, ...args) => {
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (channel, callback) => {
    const handler = (_event, ...args) => callback(...args)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  httpPort: httpPort
}
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electronAPI = api
}
