import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { spawn, type ChildProcess } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc'
import { StoreService } from './services/store'
import { WalletService } from './services/wallet'
import { TaskService } from './services/task'
import { ScriptFetcher } from './services/script-fetcher'
import { SchedulerService } from './services/scheduler'
import { HttpApiServer } from './httpapi/server'
import { Logger, createLogger } from './utils/logger'

let store: StoreService
let httpServer: HttpApiServer
let taskService: TaskService
let scriptFetcher: ScriptFetcher
let schedulerService: SchedulerService
let marketplaceServerProcess: ChildProcess | null = null

// Auto-updater configuration
autoUpdater.autoDownload = true
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
  sendUpdateStatusToWindows('downloading', {
    percent: progress.percent,
    transferred: progress.transferred,
    total: progress.total,
    bytesPerSecond: progress.bytesPerSecond
  })
})

autoUpdater.on('update-downloaded', () => {
  sendUpdateStatusToWindows('downloaded')
})

app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch(
  'disable-features',
  'VaapiVideoDecoder,VaapiVideoEncoder,VaapiVideoDecodeLinuxGL'
)

function createWindow(httpPort: number): void {
  const isDarwin = process.platform === 'darwin'
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: true,
    autoHideMenuBar: true,
    ...(isDarwin
      ? { titleBarStyle: 'hiddenInset' as const, trafficLightPosition: { x: 12, y: 12 } }
      : { frame: false }),
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

  const broadcastMaximizedChanged = (maximized: boolean): void => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('window:maximizedChanged', maximized)
    }
  }
  mainWindow.on('maximize', () => broadcastMaximizedChanged(true))
  mainWindow.on('unmaximize', () => broadcastMaximizedChanged(false))

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function startMarketplaceServer(): void {
  const logger = createLogger('marketplace-server')
  const serverDir = join(app.getAppPath(), 'server')

  // In dev mode, use tsx to run TypeScript directly
  // In production, use the compiled JS
  const cmd = is.dev ? 'npx' : process.execPath
  const args = is.dev
    ? ['tsx', 'src/index.ts']
    : ['dist/index.js']

  const apiKey = store.getSetting('marketplace_api_key') || 'airdrop-farm-dev-key'

  try {
    marketplaceServerProcess = spawn(cmd, args, {
      cwd: serverDir,
      env: { ...process.env, MARKETPLACE_API_KEY: apiKey, PORT: '3400' },
      stdio: 'pipe',
      shell: true
    })

    marketplaceServerProcess.stdout?.on('data', (data: Buffer) => {
      logger.info(data.toString().trim())
    })
    marketplaceServerProcess.stderr?.on('data', (data: Buffer) => {
      logger.warn(data.toString().trim())
    })
    marketplaceServerProcess.on('error', (err: Error) => {
      logger.warn(`Marketplace server failed to start: ${err.message}`)
    })
    marketplaceServerProcess.on('exit', (code: number | null) => {
      logger.info(`Marketplace server exited with code ${code}`)
      marketplaceServerProcess = null
    })
  } catch (err) {
    logger.warn(`Could not start marketplace server: ${err}`)
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
  scriptFetcher = new ScriptFetcher(store)
  schedulerService = new SchedulerService(store, taskService)
  schedulerService.start()

  registerIpcHandlers({
    store,
    walletService,
    taskService,
    scriptFetcher,
    walletRepo: store.walletRepo,
    proxyRepo: store.proxyRepo,
    taskRepo: store.taskRepo
  })

  // Start marketplace server (scripts / templates backend)
  startMarketplaceServer()

  httpServer = new HttpApiServer(34116)
  await httpServer.start()
  const httpPort = httpServer.getPort()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow(httpPort)

  // Auto-check for updates on startup (after window is ready)
  setTimeout(() => {
    autoUpdater.checkForUpdates()
  }, 3000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(httpPort)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  } else {
    schedulerService.stop()
  }
})

let isQuitting = false

app.on('before-quit', (e) => {
  if (isQuitting) return
  isQuitting = true
  Logger.shutdown()
  e.preventDefault()
  schedulerService.stop()
  taskService.cleanup()
  // Kill marketplace server if running
  if (marketplaceServerProcess) {
    try {
      marketplaceServerProcess.kill('SIGTERM')
    } catch {
      // process already dead, ignore
    }
    marketplaceServerProcess = null
  }
  // Wait 500ms for task exit handlers to flush before closing store
  setTimeout(() => {
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
  }, 500)
})