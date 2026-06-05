/**
 * @file 钱包导入工具
 * @description 提供 JSON 格式的钱包批量导入功能，支持验证地址、私钥、钱包类型和标签格式。
 * @module renderer/utils
 */
import type { Wallet } from '../types'

/** 解析后的钱包数据（不包含数据库自动生成的字段） */
export type ParsedWallet = Omit<Wallet, 'id' | 'createdAt'>

/** 支持的钱包类型列表 */
const VALID_WALLET_TYPES: ReadonlyArray<Wallet['walletType']> = ['evm', 'solana', 'sui', 'bitcoin']

/**
 * 检查值是否为普通对象（非 null、非数组）
 * @param value - 要检查的值
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 验证并解析单个钱包项
 * @param item - 原始 JSON 中的单个钱包对象
 * @param index - 在数组中的索引（用于错误消息）
 * @returns 解析后的钱包数据
 * @throws 字段缺失或格式错误时抛出异常
 */
function validateOne(item: unknown, index: number): ParsedWallet {
  if (!isPlainObject(item)) {
    throw new Error(`Item #${index + 1} must be an object`)
  }

  const { address, privateKey, mnemonic, walletType, labels } = item

  if (typeof address !== 'string' || address.trim() === '') {
    throw new Error(`Item #${index + 1}: missing or invalid "address"`)
  }
  if (typeof privateKey !== 'string' || privateKey.trim() === '') {
    throw new Error(`Item #${index + 1}: missing or invalid "privateKey"`)
  }
  if (typeof walletType !== 'string') {
    throw new Error(`Item #${index + 1}: missing or invalid "walletType"`)
  }
  if (!VALID_WALLET_TYPES.includes(walletType as Wallet['walletType'])) {
    throw new Error(
      `Item #${index + 1}: "walletType" must be one of ${VALID_WALLET_TYPES.join(', ')}`
    )
  }

  let parsedLabels: string[] = []
  if (labels !== undefined && labels !== null) {
    if (!Array.isArray(labels) || !labels.every((l) => typeof l === 'string')) {
      throw new Error(`Item #${index + 1}: "labels" must be an array of strings`)
    }
    parsedLabels = labels as string[]
  }

  let parsedMnemonic: string | null = null
  if (mnemonic !== undefined && mnemonic !== null) {
    if (typeof mnemonic !== 'string') {
      throw new Error(`Item #${index + 1}: "mnemonic" must be a string`)
    }
    parsedMnemonic = mnemonic
  }

  return {
    address: address.trim(),
    privateKey: privateKey.trim(),
    mnemonic: parsedMnemonic,
    walletType: walletType as Wallet['walletType'],
    labels: parsedLabels
  }
}

/**
 * 解析 JSON 字符串为钱包数据数组
 *
 * 支持单个钱包对象或钱包数组两种输入格式。
 * 每个钱包必须包含 address、privateKey 和 walletType 字段。
 *
 * @param raw - JSON 字符串
 * @returns 解析后的钱包数组
 * @throws JSON 格式错误、内容为空或字段校验失败时抛出异常
 */
export function parseWalletJson(raw: string): ParsedWallet[] {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('Empty JSON content')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`)
  }

  const list = Array.isArray(parsed) ? parsed : [parsed]
  if (list.length === 0) {
    throw new Error('No wallets found in JSON')
  }

  return list.map((item, i) => validateOne(item, i))
}
