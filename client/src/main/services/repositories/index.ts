/**
 * @file 数据仓库模块统一导出
 * @description 聚合所有 Repository 类，提供单一导入入口。
 *              import { WalletRepository, ProxyRepository, TaskRepository } from './repositories'
 * @module main/services/repositories
 */
export { BaseRepository } from './base'
export { WalletRepository } from './wallet'
export { ProxyRepository } from './proxy'
export { TaskRepository } from './task'
