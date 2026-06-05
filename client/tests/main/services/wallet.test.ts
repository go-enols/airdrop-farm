/**
 * @file 钱包服务测试
 * @description 验证 WalletService 的助记词生成、密钥对生成、助记词派生、
 *              生成并保存钱包、派生并保存钱包等核心功能。
 * @module tests/main/services
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { WalletService } from '../../../src/main/services/wallet'
import { StoreService } from '../../../src/main/services/store'

// describe: WalletService 钱包服务测试套件
describe('WalletService', () => {
  let store: StoreService
  let walletService: WalletService

  // 每个测试前创建临时数据库和 WalletService 实例
  beforeEach(() => {
    const dbPath = join(tmpdir(), `wallet-test-${randomUUID()}.db`)
    store = new StoreService(dbPath)
    walletService = new WalletService(store)
  })

  // 每个测试后关闭数据库
  afterEach(() => {
    store.close()
  })

  // describe: generateMnemonic 助记词生成
  describe('generateMnemonic', () => {
    it('returns 12-word mnemonic', async () => {
      // 用例：generateMnemonic 返回 12 个单词的助记词
      const mnemonic = await walletService.generateMnemonic()
      const words = mnemonic.split(' ')
      expect(words).toHaveLength(12)
    })

    it('generates different mnemonics each time', async () => {
      // 用例：每次生成的助记词不相同
      const first = await walletService.generateMnemonic()
      const second = await walletService.generateMnemonic()
      expect(first).not.toBe(second)
    })
  })

  // describe: generateKeypair 密钥对生成
  describe('generateKeypair', () => {
    it('evm type returns 0x-prefixed address and privateKey with walletType evm', async () => {
      // 用例：EVM 类型返回 0x 前缀地址和私钥
      const result = await walletService.generateKeypair('evm')
      expect(result.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(result.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
      expect(result.walletType).toBe('evm')
    })

    it('solana type returns base58 address and hex privateKey with walletType solana', async () => {
      // 用例：Solana 类型返回 base58 地址和十六进制私钥
      const result = await walletService.generateKeypair('solana')
      expect(result.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/)
      expect(result.privateKey).toMatch(/^[0-9a-fA-F]+$/)
      expect(result.walletType).toBe('solana')
    })

    it('sui type returns 0x-prefixed address and hex privateKey with walletType sui', async () => {
      // 用例：Sui 类型返回 0x 前缀地址和十六进制私钥
      const result = await walletService.generateKeypair('sui')
      expect(result.address).toMatch(/^0x[0-9a-fA-F]+$/)
      expect(result.privateKey).toMatch(/^[0-9a-fA-F]+$/)
      expect(result.walletType).toBe('sui')
    })

    it('unsupported type throws Error', async () => {
      // 用例：不支持的币种类型抛出错误
      await expect(walletService.generateKeypair('bitcoin')).rejects.toThrow(
        'Unsupported wallet type: bitcoin'
      )
    })
  })

  // describe: deriveFromMnemonic 助记词派生钱包
  describe('deriveFromMnemonic', () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

    it('derives EVM wallets from valid mnemonic', async () => {
      // 用例：从有效助记词派生 EVM 钱包
      const results = await walletService.deriveFromMnemonic(mnemonic, 3, ['evm'])
      expect(results).toHaveLength(3)
      for (const r of results) {
        expect(r.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
        expect(r.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
        expect(r.walletType).toBe('evm')
        expect(r).toHaveProperty('index')
      }
    })

    it('derives Solana wallets from valid mnemonic', async () => {
      // 用例：从有效助记词派生 Solana 钱包
      const results = await walletService.deriveFromMnemonic(mnemonic, 2, ['solana'])
      expect(results).toHaveLength(2)
      for (const r of results) {
        expect(r.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/)
        expect(r.privateKey).toMatch(/^[0-9a-fA-F]+$/)
        expect(r.walletType).toBe('solana')
      }
    })

    it('derives Sui wallets from valid mnemonic', async () => {
      // 用例：从有效助记词派生 Sui 钱包
      const results = await walletService.deriveFromMnemonic(mnemonic, 2, ['sui'])
      expect(results).toHaveLength(2)
      for (const r of results) {
        expect(r.address).toMatch(/^0x[0-9a-fA-F]+$/)
        expect(r.privateKey).toMatch(/^[0-9a-fA-F]+$/)
        expect(r.walletType).toBe('sui')
      }
    })

    it('derives multiple wallet types simultaneously', async () => {
      // 用例：同时派生多种类型的钱包
      const results = await walletService.deriveFromMnemonic(mnemonic, 2, ['evm', 'solana', 'sui'])
      expect(results).toHaveLength(6)
      const evmResults = results.filter((r) => r.walletType === 'evm')
      const solanaResults = results.filter((r) => r.walletType === 'solana')
      const suiResults = results.filter((r) => r.walletType === 'sui')
      expect(evmResults).toHaveLength(2)
      expect(solanaResults).toHaveLength(2)
      expect(suiResults).toHaveLength(2)
    })

    it('throws Error for invalid mnemonic', async () => {
      // 用例：无效助记词抛出错误
      await expect(
        walletService.deriveFromMnemonic('invalid mnemonic phrase', 1, ['evm'])
      ).rejects.toThrow('Invalid mnemonic')
    })

    it('derives with index starting from 0 and incrementing', async () => {
      // 用例：派生索引从 0 开始并递增
      const results = await walletService.deriveFromMnemonic(mnemonic, 3, ['evm'])
      expect(results[0].index).toBe(0)
      expect(results[1].index).toBe(1)
      expect(results[2].index).toBe(2)
    })
  })

  // describe: generateAndSaveKeypair 生成并保存密钥对
  describe('generateAndSaveKeypair', () => {
    it('generates and saves EVM wallet to database', async () => {
      // 用例：生成并保存 EVM 钱包到数据库
      const wallet = await walletService.generateAndSaveKeypair('evm')
      expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
      expect(wallet.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
      expect(wallet.walletType).toBe('evm')
      expect(wallet.mnemonic).toBeNull()
      expect(wallet.labels).toEqual([])
    })

    it('returns Wallet object with id and createdAt', async () => {
      // 用例：返回包含 id 和 createdAt 的 Wallet 对象
      const wallet = await walletService.generateAndSaveKeypair('evm')
      expect(wallet.id).toBeDefined()
      expect(typeof wallet.id).toBe('string')
      expect(wallet.id.length).toBeGreaterThan(0)
      expect(wallet.createdAt).toBeDefined()
      expect(typeof wallet.createdAt).toBe('string')
      expect(new Date(wallet.createdAt).getTime()).not.toBeNaN()
    })
  })

  // describe: deriveAndSaveFromMnemonic 从助记词派生并保存钱包
  describe('deriveAndSaveFromMnemonic', () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

    it('derives and saves multiple wallets to database', async () => {
      // 用例：派生并保存多个钱包到数据库
      const wallets = await walletService.deriveAndSaveFromMnemonic(mnemonic, 2, ['evm', 'solana'])
      expect(wallets).toHaveLength(4)
      for (const wallet of wallets) {
        expect(wallet.id).toBeDefined()
        expect(wallet.createdAt).toBeDefined()
        expect(wallet.mnemonic).toBe(mnemonic)
        expect(wallet.labels).toEqual([])
      }
    })

    it('returns Wallet array with correct length', async () => {
      // 用例：返回正确长度的 Wallet 数组
      const wallets = await walletService.deriveAndSaveFromMnemonic(mnemonic, 3, ['evm'])
      expect(wallets).toHaveLength(3)
    })
  })
})
