/**
 * @file 国际化状态标签工具
 * @description 将各领域的状态值（任务状态、代理状态、空投状态等）映射为
 *              对应的国际化翻译键，通过 i18next TFunction 获取本地化显示文本。
 * @module renderer/utils
 */
import type { TFunction } from 'i18next'

/** 状态所属领域类型：任务 / 空投 / 代理 / 钱包 / 日志 / 空投类型 */
export type StatusDomain = 'task' | 'airdrop' | 'proxy' | 'wallet' | 'log' | 'airdropType'

/** 各领域的状态值到国际化键名的映射表 */
const STATUS_KEY_MAP: Record<StatusDomain, Record<string, string>> = {
  task: {
    idle: 'tasks.status.idle',
    running: 'tasks.status.running',
    paused: 'tasks.status.paused',
    stopped: 'tasks.status.stopped',
    complete: 'tasks.status.complete',
    error: 'tasks.status.error'
  },
  airdrop: {
    ongoing: 'airdrops.statusOngoing',
    completed: 'airdrops.statusCompleted',
    cancelled: 'airdrops.statusCancelled',
    claimed: 'airdrops.statusClaimed'
  },
  airdropType: {
    testnet: 'airdrops.typeTestnet',
    mainnet: 'airdrops.typeMainnet',
    galxe: 'airdrops.typeGalxe',
    quest: 'airdrops.typeQuest',
    social: 'airdrops.typeSocial',
    other: 'airdrops.typeOther'
  },
  proxy: {
    active: 'proxies.statusActive',
    inactive: 'proxies.statusInactive',
    expired: 'proxies.statusExpired'
  },
  wallet: {
    evm: 'EVM',
    solana: 'Solana',
    sui: 'Sui',
    bitcoin: 'Bitcoin'
  },
  log: {
    debug: 'logs.levelDebug',
    info: 'logs.levelInfo',
    warn: 'logs.levelWarn',
    error: 'logs.levelError'
  }
}

/**
 * 将领域状态值映射为本地化标签
 *
 * 根据领域和状态值查找对应的国际化键名，通过 t 函数获取翻译结果。
 * 如果找不到映射，则返回原始值。
 * 钱包领域直接返回固定名称（不经过翻译）。
 *
 * @param domain - 状态所属领域
 * @param value - 状态值（如 'running'、'active'）
 * @param t - i18next 翻译函数
 * @returns 本地化后的显示文本
 */
export function statusLabel(domain: StatusDomain, value: string, t: TFunction): string {
  const key = STATUS_KEY_MAP[domain]?.[value]
  if (!key) return value
  // 钱包名称直接返回（不翻译，如 ETH、Solana）
  if (domain === 'wallet') return key
  return t(key, value)
}
