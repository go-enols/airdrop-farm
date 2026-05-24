import { ipcMain, IpcMainInvokeEvent, app, dialog, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { StoreService } from '../services/store'
import { WalletService } from '../services/wallet'
import { TaskService } from '../services/task'
import { ScriptFetcher } from '../services/script-fetcher'
import { WalletRepository } from '../services/repositories/wallet'
import { ProxyRepository } from '../services/repositories/proxy'
import { TaskRepository } from '../services/repositories/task'
import { Task } from '../../shared/types'
import { createLogger } from '../utils/logger'

const logger = createLogger('ipc')

interface Services {
  store: StoreService
  walletService: WalletService
  taskService: TaskService
  scriptFetcher: ScriptFetcher
  walletRepo: WalletRepository
  proxyRepo: ProxyRepository
  taskRepo: TaskRepository
}

export interface ApiError {
  message: string
  code?: string
  category?: string
}

export interface ApiResult<T = unknown> {
  data?: T
  error?: ApiError
}

export type ApiHandler = (...args: unknown[]) => unknown | Promise<unknown>

export const handlerMap = new Map<string, ApiHandler>()

function handleError(err: unknown): ApiResult {
  const message = err instanceof Error ? err.message : String(err)
  logger.error('handler error', { message })
  return {
    error: {
      message,
      code:
        err instanceof Error && 'code' in err
          ? String((err as Error & { code: string }).code)
          : 'UNKNOWN',
      category:
        err instanceof Error && 'category' in err
          ? String((err as Error & { category: string }).category)
          : 'GENERAL'
    }
  }
}

export async function executeHandler(channel: string, args: unknown[]): Promise<ApiResult> {
  const handler = handlerMap.get(channel)
  if (!handler) {
    return { error: { message: `Unknown channel: ${channel}`, code: 'NOT_FOUND' } }
  }
  try {
    const result = await handler(...args)
    return { data: result }
  } catch (err) {
    return handleError(err)
  }
}

function register(channel: string, handler: ApiHandler): void {
  handlerMap.set(channel, handler)
  ipcMain.handle(
    channel,
    async (_event: IpcMainInvokeEvent, ...args: unknown[]): Promise<ApiResult> => {
      return executeHandler(channel, args)
    }
  )
}

export function registerIpcHandlers(services: Services): void {
  const { store, walletService, taskService, scriptFetcher, walletRepo, proxyRepo, taskRepo } = services

  register('app:getInfo', () => store.getAppInfo(app.getVersion(), app.getPath('userData')))
  register('app:getStats', () => store.getStats())

  register('wallet:list', (_page?, _pageSize?, _search?) =>
    walletRepo.listWallets(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('wallet:get', (id) => walletRepo.getWallet(id as string))
  register('wallet:create', (data) =>
    walletRepo.createWallet(data as Parameters<typeof walletRepo.createWallet>[0])
  )
  register('wallet:update', (id, data) =>
    walletRepo.updateWallet(id as string, data as Parameters<typeof walletRepo.updateWallet>[1])
  )
  register('wallet:delete', (id) => walletRepo.deleteWallet(id as string))
  register('wallet:batchDelete', (ids) => walletRepo.batchDeleteWallets(ids as string[]))
  register('wallet:generateMnemonic', () => walletService.generateMnemonic())
  register('wallet:generateKeypair', (walletType) =>
    walletService.generateKeypair(walletType as string)
  )
  register('wallet:deriveFromMnemonic', (mnemonic, count, walletTypes) =>
    walletService.deriveFromMnemonic(mnemonic as string, count as number, walletTypes as string[])
  )

  register('account:list', (_page?, _pageSize?, _search?) =>
    store.listAccounts(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('account:get', (id) => store.getAccount(id as string))
  register('account:create', (data) =>
    store.createAccount(data as Parameters<typeof store.createAccount>[0])
  )
  register('account:update', (id, data) =>
    store.updateAccount(id as string, data as Parameters<typeof store.updateAccount>[1])
  )
  register('account:delete', (id) => store.deleteAccount(id as string))
  register('account:listPools', () => store.listAccountPools())
  register('account:batchCreate', (items) =>
    store.batchCreateAccounts(items as Parameters<typeof store.batchCreateAccounts>[0])
  )

  register('proxy:list', (_page?, _pageSize?, _search?) =>
    proxyRepo.listProxies(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('proxy:get', (id) => proxyRepo.getProxy(id as string))
  register('proxy:create', (data) =>
    proxyRepo.createProxy(data as Parameters<typeof proxyRepo.createProxy>[0])
  )
  register('proxy:update', (id, data) =>
    proxyRepo.updateProxy(id as string, data as Parameters<typeof proxyRepo.updateProxy>[1])
  )
  register('proxy:delete', (id) => proxyRepo.deleteProxy(id as string))

  register('task:list', (_page?, _pageSize?, _search?) =>
    taskRepo.listTasks(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('task:get', (id) => taskRepo.getTask(id as string))
  register('task:create', (data) => {
    const input = data as Partial<Omit<Task, 'id'>>
    return taskRepo.createTask({
      scriptFolder: input.scriptFolder ?? '',
      config: input.config ?? {},
      status: input.status ?? 'idle',
      workerId: input.workerId ?? null,
      startedAt: input.startedAt ?? null,
      endedAt: input.endedAt ?? null,
      isSandbox: input.isSandbox ?? false,
    })
  })
  register('task:update', (id, data) =>
    taskRepo.updateTask(id as string, data as Parameters<typeof taskRepo.updateTask>[1])
  )
  register('task:start', (id) => taskService.startTask(id as string))
  register('task:stop', (id) => taskService.stopTask(id as string))
  register('task:pause', (id) => taskService.pauseTask(id as string))
  register('task:resume', (id) => taskService.resumeTask(id as string))
  register('task:delete', (id) => taskRepo.deleteTask(id as string))
  register('task:getLogs', (taskId, limit?) =>
    taskRepo.getTaskLogs(taskId as string, limit as number | undefined)
  )
  register('task:clearLogs', () => taskRepo.clearTaskLogs())
  register('task:getProgress', (taskId) => taskService.getTaskProgress(taskId as string))
  register('task:getOutput', (taskId) => taskService.getTaskOutput(taskId as string))

  register('script:listRemote', () => scriptFetcher.fetchScriptList())
  register('script:download', (scriptId) =>
    scriptFetcher.downloadScript(scriptId as string)
  )
  register('script:checkUpdate', () => scriptFetcher.checkUpdates())
  register('script:listInstalled', () => scriptFetcher.getInstalledScripts())
  register('script:remove', (scriptId) => scriptFetcher.removeScript(scriptId as string))

  register('template:list', (_page?, _pageSize?, _search?) =>
    store.listTemplates(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('template:get', (id) => store.getTemplate(id as string))
  register('template:create', (data) =>
    store.createTemplate(data as Parameters<typeof store.createTemplate>[0])
  )
  register('template:update', (id, data) =>
    store.updateTemplate(id as string, data as Parameters<typeof store.updateTemplate>[1])
  )
  register('template:delete', (id) => store.deleteTemplate(id as string))

  register('scheduler:list', (_page?, _pageSize?, _search?) =>
    store.listScheduledTasks(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('scheduler:get', (id) => store.getScheduledTask(id as string))
  register('scheduler:create', (data) =>
    store.createScheduledTask(data as Parameters<typeof store.createScheduledTask>[0])
  )
  register('scheduler:update', (id, data) =>
    store.updateScheduledTask(id as string, data as Parameters<typeof store.updateScheduledTask>[1])
  )
  register('scheduler:delete', (id) => store.deleteScheduledTask(id as string))

  register('taskTemplate:list', (_page?, _pageSize?, _search?) =>
    store.listTaskTemplates(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('taskTemplate:get', (id) => store.getTaskTemplate(id as string))
  register('taskTemplate:create', (data) =>
    store.createTaskTemplate(data as Parameters<typeof store.createTaskTemplate>[0])
  )
  register('taskTemplate:update', (id, data) =>
    store.updateTaskTemplate(id as string, data as Parameters<typeof store.updateTaskTemplate>[1])
  )
  register('taskTemplate:delete', (id) => store.deleteTaskTemplate(id as string))

  register('captchaKey:list', (_page?, _pageSize?, _search?) =>
    store.listCaptchaKeys(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('captchaKey:get', (id) => store.getCaptchaKey(id as string))
  register('captchaKey:create', (data) =>
    store.createCaptchaKey(data as Parameters<typeof store.createCaptchaKey>[0])
  )
  register('captchaKey:update', (id, data) =>
    store.updateCaptchaKey(id as string, data as Parameters<typeof store.updateCaptchaKey>[1])
  )
  register('captchaKey:delete', (id) => store.deleteCaptchaKey(id as string))

  register('proxyProvider:list', (_page?, _pageSize?, _search?) =>
    store.listProxyProviders(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('proxyProvider:get', (id) => store.getProxyProvider(id as string))
  register('proxyProvider:create', (data) =>
    store.createProxyProvider(data as Parameters<typeof store.createProxyProvider>[0])
  )
  register('proxyProvider:update', (id, data) =>
    store.updateProxyProvider(id as string, data as Parameters<typeof store.updateProxyProvider>[1])
  )
  register('proxyProvider:delete', (id) => store.deleteProxyProvider(id as string))

  register('airdrop:list', (_page?, _pageSize?, _search?) =>
    store.listAirdrops(
      _page as number | undefined,
      _pageSize as number | undefined,
      _search as string | undefined
    )
  )
  register('airdrop:create', (data) =>
    store.createAirdrop(data as Parameters<typeof store.createAirdrop>[0])
  )
  register('airdrop:get', (id) => store.getAirdrop(id as string))
  register('airdrop:update', (id, data) =>
    store.updateAirdrop(id as string, data as Parameters<typeof store.updateAirdrop>[1])
  )
  register('airdrop:delete', (id) => store.deleteAirdrop(id as string))

  register('setting:get', (key) => store.getSetting(key as string))
  register('setting:set', (key, value) => store.setSetting(key as string, value as string))
  register('setting:getAll', () => store.getAllSettings())
  register('setting:delete', (key) => store.deleteSetting(key as string))

  register('log:query', (level?, category?, search?, since?, until?, limit?) =>
    store.queryLogs(
      level as string | undefined,
      category as string | undefined,
      search as string | undefined,
      since as string | undefined,
      until as string | undefined,
      limit as number | undefined
    )
  )
  register('log:getCategories', () => store.getLogCategories())
  register('log:setLevel', (level) => store.setLogLevel(level as string))
  register('log:getLevel', () => store.getLogLevel())

  // Auto-updater handlers
  register('update:check', () => {
    autoUpdater.checkForUpdates()
    return null
  })
  register('update:download', () => {
    autoUpdater.downloadUpdate()
    return null
  })
  register('update:install', () => {
    autoUpdater.quitAndInstall()
    return null
  })

  register('dialog:openFile', async (...args: unknown[]) => {
    const _filters = args[0] as { name: string; extensions: string[] }[] | undefined
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { canceled: true, filePath: null, content: null }
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: _filters ?? [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || result.filePaths.length === 0)
      return { canceled: true, filePath: null, content: null }
    const fs = await import('fs')
    const content = fs.readFileSync(result.filePaths[0], 'utf-8')
    return { canceled: false, filePath: result.filePaths[0], content }
  })

  register('dialog:saveFile', async (...args: unknown[]) => {
    const _defaultName = args[0] as string
    const _content = args[1] as string
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { canceled: true, filePath: null }
    const result = await dialog.showSaveDialog(win, {
      defaultPath: _defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { canceled: true, filePath: null }
    const fs = await import('fs')
    fs.writeFileSync(result.filePath, _content, 'utf-8')
    return { canceled: false, filePath: result.filePath }
  })

  register('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
    return null
  })
  register('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
    return null
  })
  register('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
    return null
  })
  register('window:isMaximized', () => BrowserWindow.getFocusedWindow()?.isMaximized() ?? false)
  register('window:platform', () => process.platform)

  logger.info('All handlers registered', { count: handlerMap.size })
}
