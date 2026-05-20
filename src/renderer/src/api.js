import { call } from './transport'
export const appApi = {
  getInfo: () => call('app:getInfo'),
  getStats: () => call('app:getStats')
}
export const walletApi = {
  list: (page = 1, pageSize = 50, search = '') => call('wallet:list', [page, pageSize, search]),
  get: (id) => call('wallet:get', [id]),
  create: (data) => call('wallet:create', [data]),
  update: (id, data) => call('wallet:update', [id, data]),
  delete: (id) => call('wallet:delete', [id]),
  batchDelete: (ids) => call('wallet:batchDelete', [ids]),
  generateMnemonic: () => call('wallet:generateMnemonic'),
  generateKeypair: (walletType) => call('wallet:generateKeypair', [walletType]),
  deriveFromMnemonic: (mnemonic, count, walletTypes) =>
    call('wallet:deriveFromMnemonic', [mnemonic, count, walletTypes])
}
export const accountApi = {
  list: (page = 1, pageSize = 50, search = '') => call('account:list', [page, pageSize, search]),
  get: (id) => call('account:get', [id]),
  create: (data) => call('account:create', [data]),
  update: (id, data) => call('account:update', [id, data]),
  delete: (id) => call('account:delete', [id])
}
export const proxyApi = {
  list: (page = 1, pageSize = 50, search = '') => call('proxy:list', [page, pageSize, search]),
  get: (id) => call('proxy:get', [id]),
  create: (data) => call('proxy:create', [data]),
  update: (id, data) => call('proxy:update', [id, data]),
  delete: (id) => call('proxy:delete', [id]),
  batchDelete: (ids) => call('proxy:batchDelete', [ids])
}
export const taskApi = {
  list: (page = 1, pageSize = 50, search = '') => call('task:list', [page, pageSize, search]),
  get: (id) => call('task:get', [id]),
  create: (data) => call('task:create', [data]),
  start: (id) => call('task:start', [id]),
  stop: (id) => call('task:stop', [id]),
  pause: (id) => call('task:pause', [id]),
  resume: (id) => call('task:resume', [id]),
  delete: (id) => call('task:delete', [id]),
  update: (id, data) => call('task:update', [id, data]),
  clearLogs: (taskId) => call('task:clearLogs', [taskId]),
  getLogs: (taskId, limit = 100) => call('task:getLogs', [taskId, limit]),
  getProgress: (taskId) => call('task:getProgress', [taskId])
}
export const templateApi = {
  list: (page, pageSize, search) => call('template:list', [page, pageSize, search]),
  get: (id) => call('template:get', [id]),
  create: (data) => call('template:create', [data]),
  update: (id, data) => call('template:update', [id, data]),
  delete: (id) => call('template:delete', [id])
}
export const schedulerApi = {
  list: (page, pageSize, search) => call('scheduler:list', [page, pageSize, search]),
  create: (data) => call('scheduler:create', [data]),
  update: (id, data) => call('scheduler:update', [id, data]),
  delete: (id) => call('scheduler:delete', [id])
}
export const airdropApi = {
  list: (page = 1, pageSize = 50, search = '') => call('airdrop:list', [page, pageSize, search]),
  create: (data) => call('airdrop:create', [data]),
  get: (id) => call('airdrop:get', [id]),
  update: (id, data) => call('airdrop:update', [id, data]),
  delete: (id) => call('airdrop:delete', [id])
}
export const settingApi = {
  get: (key) => call('setting:get', [key]),
  set: (key, value) => call('setting:set', [key, value]),
  getAll: () => call('setting:getAll'),
  delete: (key) => call('setting:delete', [key])
}
export const logApi = {
  query: (level, category, search, since, until, limit) =>
    call('log:query', [level, category, search, since, until, limit]),
  getCategories: () => call('log:getCategories'),
  setLevel: (level) => call('log:setLevel', [level]),
  getLevel: () => call('log:getLevel'),
  deleteLogs: () => call('log:deleteLogs')
}
export const captchaKeyApi = {
  list: () => call('captchaKey:list'),
  create: (data) => call('captchaKey:create', [data]),
  update: (id, data) => call('captchaKey:update', [id, data]),
  delete: (id) => call('captchaKey:delete', [id])
}
export const proxyProviderApi = {
  list: () => call('proxyProvider:list'),
  create: (data) => call('proxyProvider:create', [data]),
  update: (id, data) => call('proxyProvider:update', [id, data]),
  delete: (id) => call('proxyProvider:delete', [id])
}
export const updateApi = {
  check: () => call('update:check'),
  download: () => call('update:download'),
  install: () => call('update:install')
}
