import { ipcMain, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { createLogger } from '../utils/logger'
const logger = createLogger('ipc')
export const handlerMap = new Map()
function handleError(err) {
  const message = err instanceof Error ? err.message : String(err)
  logger.error('handler error', { message })
  return {
    error: {
      message,
      code: err instanceof Error && 'code' in err ? String(err.code) : 'UNKNOWN',
      category: err instanceof Error && 'category' in err ? String(err.category) : 'GENERAL'
    }
  }
}
export async function executeHandler(channel, args) {
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
function register(channel, handler) {
  handlerMap.set(channel, handler)
  ipcMain.handle(channel, async (_event, ...args) => {
    return executeHandler(channel, args)
  })
}
export function registerIpcHandlers(services) {
  const { store, walletService, taskService, walletRepo, proxyRepo, taskRepo } = services
  register('app:getInfo', () => store.getAppInfo(app.getVersion(), app.getPath('userData')))
  register('app:getStats', () => store.getStats())
  register('wallet:list', (_page, _pageSize, _search) =>
    walletRepo.listWallets(_page, _pageSize, _search)
  )
  register('wallet:get', (id) => walletRepo.getWallet(id))
  register('wallet:create', (data) => walletRepo.createWallet(data))
  register('wallet:update', (id, data) => walletRepo.updateWallet(id, data))
  register('wallet:delete', (id) => walletRepo.deleteWallet(id))
  register('wallet:batchDelete', (ids) => walletRepo.batchDeleteWallets(ids))
  register('wallet:generateMnemonic', () => walletService.generateMnemonic())
  register('wallet:generateKeypair', (walletType) => walletService.generateKeypair(walletType))
  register('wallet:deriveFromMnemonic', (mnemonic, count, walletTypes) =>
    walletService.deriveFromMnemonic(mnemonic, count, walletTypes)
  )
  register('account:list', (_page, _pageSize, _search) =>
    store.listAccounts(_page, _pageSize, _search)
  )
  register('account:get', (id) => store.getAccount(id))
  register('account:create', (data) => store.createAccount(data))
  register('account:update', (id, data) => store.updateAccount(id, data))
  register('account:delete', (id) => store.deleteAccount(id))
  register('proxy:list', (_page, _pageSize, _search) =>
    proxyRepo.listProxies(_page, _pageSize, _search)
  )
  register('proxy:get', (id) => proxyRepo.getProxy(id))
  register('proxy:create', (data) => proxyRepo.createProxy(data))
  register('proxy:update', (id, data) => proxyRepo.updateProxy(id, data))
  register('proxy:delete', (id) => proxyRepo.deleteProxy(id))
  register('task:list', (_page, _pageSize, _search) =>
    taskRepo.listTasks(_page, _pageSize, _search)
  )
  register('task:get', (id) => taskRepo.getTask(id))
  register('task:create', (data) => taskRepo.createTask(data))
  register('task:update', (id, data) => taskRepo.updateTask(id, data))
  register('task:start', (id) => taskService.startTask(id))
  register('task:stop', (id) => taskService.stopTask(id))
  register('task:pause', (id) => taskService.pauseTask(id))
  register('task:resume', (id) => taskService.resumeTask(id))
  register('task:delete', (id) => taskRepo.deleteTask(id))
  register('task:getLogs', (taskId, limit) => taskRepo.getTaskLogs(taskId, limit))
  register('task:clearLogs', () => taskRepo.clearTaskLogs())
  register('task:getProgress', (taskId) => taskService.getTaskProgress(taskId))
  register('template:list', (_page, _pageSize, _search) =>
    store.listTemplates(_page, _pageSize, _search)
  )
  register('template:get', (id) => store.getTemplate(id))
  register('template:create', (data) => store.createTemplate(data))
  register('template:update', (id, data) => store.updateTemplate(id, data))
  register('template:delete', (id) => store.deleteTemplate(id))
  register('scheduler:list', (_page, _pageSize, _search) =>
    store.listScheduledTasks(_page, _pageSize, _search)
  )
  register('scheduler:get', (id) => store.getScheduledTask(id))
  register('scheduler:create', (data) => store.createScheduledTask(data))
  register('scheduler:update', (id, data) => store.updateScheduledTask(id, data))
  register('scheduler:delete', (id) => store.deleteScheduledTask(id))
  register('taskTemplate:list', (_page, _pageSize, _search) =>
    store.listTaskTemplates(_page, _pageSize, _search)
  )
  register('taskTemplate:get', (id) => store.getTaskTemplate(id))
  register('taskTemplate:create', (data) => store.createTaskTemplate(data))
  register('taskTemplate:update', (id, data) => store.updateTaskTemplate(id, data))
  register('taskTemplate:delete', (id) => store.deleteTaskTemplate(id))
  register('captchaKey:list', (_page, _pageSize, _search) =>
    store.listCaptchaKeys(_page, _pageSize, _search)
  )
  register('captchaKey:get', (id) => store.getCaptchaKey(id))
  register('captchaKey:create', (data) => store.createCaptchaKey(data))
  register('captchaKey:update', (id, data) => store.updateCaptchaKey(id, data))
  register('captchaKey:delete', (id) => store.deleteCaptchaKey(id))
  register('proxyProvider:list', (_page, _pageSize, _search) =>
    store.listProxyProviders(_page, _pageSize, _search)
  )
  register('proxyProvider:get', (id) => store.getProxyProvider(id))
  register('proxyProvider:create', (data) => store.createProxyProvider(data))
  register('proxyProvider:update', (id, data) => store.updateProxyProvider(id, data))
  register('proxyProvider:delete', (id) => store.deleteProxyProvider(id))
  register('airdrop:list', (_page, _pageSize, _search) =>
    store.listAirdrops(_page, _pageSize, _search)
  )
  register('airdrop:create', (data) => store.createAirdrop(data))
  register('airdrop:get', (id) => store.getAirdrop(id))
  register('airdrop:update', (id, data) => store.updateAirdrop(id, data))
  register('airdrop:delete', (id) => store.deleteAirdrop(id))
  register('setting:get', (key) => store.getSetting(key))
  register('setting:set', (key, value) => store.setSetting(key, value))
  register('setting:getAll', () => store.getAllSettings())
  register('log:query', (level, category, search, since, until, limit) =>
    store.queryLogs(level, category, search, since, until, limit)
  )
  register('log:getCategories', () => store.getLogCategories())
  register('log:setLevel', (level) => store.setLogLevel(level))
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
  logger.info('All handlers registered', { count: handlerMap.size })
}
