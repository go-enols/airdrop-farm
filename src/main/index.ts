import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc'
import { StoreService } from './services/store'
import { WalletService } from './services/wallet'
import { TaskService } from './services/task'
import { HttpApiServer } from './httpapi/server'

let store: StoreService
let httpServer: HttpApiServer
let taskService: TaskService

// Auto-updater configuration
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

function sendUpdateStatusToWindows(status: string, data?: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('update:status', { status, data })
  }
}

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatusToWindows('checking')
})

autoUpdater.on('update-available', (info) => {
  sendUpdateStatusToWindows('available', info)
})

autoUpdater.on('update-not-available', () => {
  sendUpdateStatusToWindows('not-available')
})

autoUpdater.on('error', (err) => {
  sendUpdateStatusToWindows('error', err.message)
})

autoUpdater.on('download-progress', (progress) => {
  sendUpdateStatusToWindows('progress', {
    percent: progress.percent,
    transferred: progress.transferred,
    total: progress.total,
    bytesPerSecond: progress.bytesPerSecond
  })
})

autoUpdater.on('update-downloaded', () => {
  sendUpdateStatusToWindows('downloaded')
  // Quit and install after a short delay to allow UI to show message
  setTimeout(() => {
    autoUpdater.quitAndInstall()
  }, 1000)
})

app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch(
  'disable-features',
  'VaapiVideoDecoder,VaapiVideoEncoder,VaapiVideoDecodeLinuxGL'
)

function createWindow(httpPort: number): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      additionalArguments: [`--http-port=${httpPort}`]
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.airdrop-farm')

  const dataDir = app.getPath('userData')
  const dbPath = join(dataDir, 'airdrop-farm.db')

  store = new StoreService(dbPath)
  const walletService = new WalletService(store)
  taskService = new TaskService(store, {
    rendererSender: (channel, data) => {
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(channel, data)
      }
    }
  })

  registerIpcHandlers({
    store,
    walletService,
    taskService,
    walletRepo: store.walletRepo,
    proxyRepo: store.proxyRepo,
    taskRepo: store.taskRepo
  })

  httpServer = new HttpApiServer(34116)
  await httpServer.start()
  const httpPort = httpServer.getPort()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow(httpPort)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(httpPort)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', (e) => {
  e.preventDefault()
  taskService.cleanup()
  httpServer
    .stop()
    .then(() => {
      store.close()
      app.quit()
    })
    .catch(() => {
      store.close()
      app.quit()
    })
})
