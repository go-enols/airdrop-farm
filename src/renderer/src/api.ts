import type {
  Wallet,
  Account,
  Proxy,
  Task,
  TaskLog,
  Template,
  ScheduledTask,
  AirdropProject,
  AppInfo,
  StatsAggregate,
  ListResponse,
  AppLog,
  CaptchaKey,
  ProxyProvider
} from './types'
import { call } from './transport'

export const appApi = {
  getInfo: () => call<AppInfo>('app:getInfo'),
  getStats: () => call<StatsAggregate>('app:getStats')
}

export const walletApi = {
  list: (page = 1, pageSize = 50, search = '') =>
    call<ListResponse<Wallet>>('wallet:list', [page, pageSize, search]),
  get: (id: string) => call<Wallet | null>('wallet:get', [id]),
  create: (data: Omit<Wallet, 'id' | 'createdAt'>) => call<Wallet>('wallet:create', [data]),
  update: (id: string, data: Partial<Omit<Wallet, 'id' | 'createdAt'>>) =>
    call<Wallet>('wallet:update', [id, data]),
  delete: (id: string) => call<void>('wallet:delete', [id]),
  batchDelete: (ids: string[]) => call<void>('wallet:batchDelete', [ids]),
  generateMnemonic: () => call<string>('wallet:generateMnemonic'),
  generateKeypair: (walletType: string) =>
    call<{ address: string; privateKey: string; walletType: string }>('wallet:generateKeypair', [
      walletType
    ]),
  deriveFromMnemonic: (mnemonic: string, count: number, walletTypes: string[]) =>
    call<Array<{ index: number; walletType: string; address: string; privateKey: string }>>(
      'wallet:deriveFromMnemonic',
      [mnemonic, count, walletTypes]
    )
}

export const accountApi = {
  list: (page = 1, pageSize = 50, search = '') =>
    call<ListResponse<Account>>('account:list', [page, pageSize, search]),
  get: (id: string) => call<Account | null>('account:get', [id]),
  create: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) =>
    call<Account>('account:create', [data]),
  update: (id: string, data: Partial<Account>) => call<Account>('account:update', [id, data]),
  delete: (id: string) => call<void>('account:delete', [id])
}

export const proxyApi = {
  list: (page = 1, pageSize = 50, search = '') =>
    call<ListResponse<Proxy>>('proxy:list', [page, pageSize, search]),
  get: (id: string) => call<Proxy | null>('proxy:get', [id]),
  create: (data: Omit<Proxy, 'id' | 'createdAt'>) => call<Proxy>('proxy:create', [data]),
  update: (id: string, data: Partial<Omit<Proxy, 'id' | 'createdAt'>>) =>
    call<Proxy>('proxy:update', [id, data]),
  delete: (id: string) => call<void>('proxy:delete', [id]),
  batchDelete: (ids: string[]) => call<void>('proxy:batchDelete', [ids])
}

export const taskApi = {
  list: (page = 1, pageSize = 50, search = '') =>
    call<ListResponse<Task>>('task:list', [page, pageSize, search]),
  get: (id: string) => call<Task | null>('task:get', [id]),
  create: (data: { scriptFolder: string; config: Record<string, unknown> }) =>
    call<Task>('task:create', [data]),
  start: (id: string) => call<void>('task:start', [id]),
  stop: (id: string) => call<void>('task:stop', [id]),
  pause: (id: string) => call<void>('task:pause', [id]),
  resume: (id: string) => call<void>('task:resume', [id]),
  delete: (id: string) => call<void>('task:delete', [id]),
  update: (id: string, data: Partial<Task>) => call<Task>('task:update', [id, data]),
  clearLogs: (taskId: string) => call<void>('task:clearLogs', [taskId]),
  getLogs: (taskId: string, limit = 100) => call<TaskLog[]>('task:getLogs', [taskId, limit]),
  getProgress: (taskId: string) =>
    call<{ percent: number; message: string } | null>('task:getProgress', [taskId])
}

export const templateApi = {
  list: (page?: number, pageSize?: number, search?: string) =>
    call<ListResponse<Template>>('template:list', [page, pageSize, search]),
  get: (id: string) => call<Template | null>('template:get', [id]),
  create: (data: Omit<Template, 'id' | 'updatedAt'>) => call<Template>('template:create', [data]),
  update: (id: string, data: Partial<Template>) => call<Template>('template:update', [id, data]),
  delete: (id: string) => call<void>('template:delete', [id])
}

export const schedulerApi = {
  list: (page?: number, pageSize?: number, search?: string) =>
    call<ListResponse<ScheduledTask>>('scheduler:list', [page, pageSize, search]),
  create: (data: Omit<ScheduledTask, 'id' | 'createdAt'>) =>
    call<ScheduledTask>('scheduler:create', [data]),
  update: (id: string, data: Partial<ScheduledTask>) =>
    call<ScheduledTask>('scheduler:update', [id, data]),
  delete: (id: string) => call<void>('scheduler:delete', [id])
}

export const airdropApi = {
  list: (page = 1, pageSize = 50, search = '') =>
    call<ListResponse<AirdropProject>>('airdrop:list', [page, pageSize, search]),
  create: (data: Omit<AirdropProject, 'id' | 'createdAt' | 'updatedAt'>) =>
    call<AirdropProject>('airdrop:create', [data]),
  get: (id: string) => call<AirdropProject | null>('airdrop:get', [id]),
  update: (id: string, data: Partial<AirdropProject>) =>
    call<AirdropProject>('airdrop:update', [id, data]),
  delete: (id: string) => call<void>('airdrop:delete', [id])
}

export const settingApi = {
  get: (key: string) => call<string | null>('setting:get', [key]),
  set: (key: string, value: string) => call<void>('setting:set', [key, value]),
  getAll: () => call<Record<string, string>>('setting:getAll'),
  delete: (key: string) => call<void>('setting:delete', [key])
}

export const logApi = {
  query: (
    level?: string,
    category?: string,
    search?: string,
    since?: string,
    until?: string,
    limit?: number
  ) => call<ListResponse<AppLog>>('log:query', [level, category, search, since, until, limit]),
  getCategories: () => call<string[]>('log:getCategories'),
  setLevel: (level: string) => call<void>('log:setLevel', [level]),
  getLevel: () => call<string>('log:getLevel'),
  deleteLogs: () => call<void>('log:deleteLogs')
}

export const captchaKeyApi = {
  list: () => call<ListResponse<CaptchaKey>>('captchaKey:list'),
  create: (data: Omit<CaptchaKey, 'id' | 'createdAt'>) =>
    call<CaptchaKey>('captchaKey:create', [data]),
  update: (id: string, data: Partial<CaptchaKey>) =>
    call<CaptchaKey>('captchaKey:update', [id, data]),
  delete: (id: string) => call<void>('captchaKey:delete', [id])
}

export const proxyProviderApi = {
  list: () => call<ListResponse<ProxyProvider>>('proxyProvider:list'),
  create: (data: Omit<ProxyProvider, 'id' | 'createdAt'>) =>
    call<ProxyProvider>('proxyProvider:create', [data]),
  update: (id: string, data: Partial<ProxyProvider>) =>
    call<ProxyProvider>('proxyProvider:update', [id, data]),
  delete: (id: string) => call<void>('proxyProvider:delete', [id])
}

export const updateApi = {
  check: () => call<void>('update:check'),
  download: () => call<void>('update:download'),
  install: () => call<void>('update:install')
}
