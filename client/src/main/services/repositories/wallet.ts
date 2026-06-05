/**
 * @file WalletRepository — 钱包数据仓库
 * @description 封装 wallets 表的全部 CRUD 操作，支持私钥/助记词的透明加密存储、
 *              分页查询、批量创建/删除。继承自 BaseRepository 使用预编译语句。
 * @module main/services/repositories
 */
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type { Wallet, ListResponse } from '../../../shared/types'
import { BaseRepository } from './base'
import { EncryptionService } from '../encryption'

/**
 * 钱包数据仓库
 *
 * 管理 EVM / Solana / SUI / Bitcoin 等多链钱包的持久化。
 * 私钥和助记词通过 EncryptionService 进行 AES 加密后存入数据库，
 * 读取时自动解密，内存中保持明文。
 *
 * @example
 * ```ts
 * const repo = new WalletRepository(db, encryption)
 * const wallet = repo.createWallet({ address: '0x...', walletType: 'evm', ... })
 * const list = repo.listWallets(1, 20, '0x')
 * ```
 */
export class WalletRepository extends BaseRepository<Wallet> {
  /** 加密服务实例，用于私钥和助记词的透明加解密 */
  private encryption: EncryptionService

  /**
   * @param db - better-sqlite3 数据库连接
   * @param encryption - 加密服务实例（可选，未传入时自动创建）
   */
  constructor(db: Database.Database, encryption?: EncryptionService) {
    super(db)
    this.encryption = encryption || new EncryptionService()
    this.prepareStatements()
  }

  /** 注册所有钱包相关的预编译 SQL 语句 */
  prepareStatements(): void {
    this.setStmt(
      'wallet.insert',
      this.db.prepare(
        'INSERT INTO wallets (id, address, private_key, mnemonic, wallet_type, labels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
    )
    this.setStmt('wallet.getById', this.db.prepare('SELECT * FROM wallets WHERE id = ?'))
    this.setStmt('wallet.delete', this.db.prepare('DELETE FROM wallets WHERE id = ?'))
    this.setStmt('wallet.count', this.db.prepare('SELECT COUNT(*) as cnt FROM wallets'))
    this.setStmt(
      'wallet.countByType',
      this.db.prepare('SELECT wallet_type, COUNT(*) as cnt FROM wallets GROUP BY wallet_type')
    )
  }

  /**
   * 将数据库行记录映射为 Wallet 对象
   * 自动解密私钥和助记词字段，解析 JSON 标签数组。
   * @param row - 数据库查询返回的原始行数据
   * @returns 组装好的 Wallet 实体
   */
  private rowToWallet(row: Record<string, unknown>): Wallet {
    return {
      id: row.id as string,
      address: row.address as string,
      privateKey: this.encryption.decrypt(row.private_key as string) || null,
      mnemonic: this.encryption.decrypt(row.mnemonic as string) || null,
      walletType: row.wallet_type as Wallet['walletType'],
      labels: this.fromJsonArray<string>(row.labels as string | null),
      createdAt: row.created_at as string
    }
  }

  /** 获取钱包总数 */
  count(): number {
    return (this.stmt('wallet.count').get() as Record<string, number>).cnt
  }

  /**
   * 按钱包类型统计数量
   * @returns 类型名 → 数量的映射，如 { evm: 5, solana: 3 }
   */
  countByType(): Record<string, number> {
    const rows = this.stmt('wallet.countByType').all() as Record<string, unknown>[]
    const result: Record<string, number> = {}
    for (const row of rows) {
      result[row.wallet_type as string] = row.cnt as number
    }
    return result
  }

  /**
   * 创建新钱包
   * 自动生成 UUID 和 ISO 时间戳，私钥/助记词加密存储。
   * @param data - 钱包数据（不含 id 和 createdAt）
   * @returns 创建完成的 Wallet 实体
   */
  createWallet(data: Omit<Wallet, 'id' | 'createdAt'>): Wallet {
    const id = uuidv4()
    const createdAt = this.nowISO()
    this.stmt('wallet.insert').run(
      id,
      data.address,
      data.privateKey ? this.encryption.encrypt(data.privateKey) : null,
      data.mnemonic ? this.encryption.encrypt(data.mnemonic) : null,
      data.walletType,
      this.toJson(data.labels),
      createdAt
    )
    return this.getWallet(id)!
  }

  /**
   * 根据 ID 获取钱包
   * @param id - 钱包 UUID
   * @returns Wallet 实体，未找到时返回 null
   */
  getWallet(id: string): Wallet | null {
    const row = this.stmt('wallet.getById').get(id) as Record<string, unknown> | undefined
    return row ? this.rowToWallet(row) : null
  }

  /**
   * 分页查询钱包列表
   * 支持按地址或钱包类型模糊搜索。
   * @param page - 页码（从 1 开始，默认 1）
   * @param pageSize - 每页条数（默认 20）
   * @param search - 可选搜索关键词（匹配 address 或 wallet_type）
   * @returns 分页响应，包含 items 和分页元信息
   */
  listWallets(page = 1, pageSize = 20, search?: string): ListResponse<Wallet> {
    if (search) {
      const countStmt = this.db.prepare(
        'SELECT COUNT(*) as cnt FROM wallets WHERE address LIKE ? OR wallet_type LIKE ?'
      )
      const listStmt = this.db.prepare(
        'SELECT * FROM wallets WHERE address LIKE ? OR wallet_type LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToWallet(r), [
        `%${search}%`,
        `%${search}%`
      ])
    }
    const countStmt = this.stmt('wallet.count')
    const listStmt = this.db.prepare(
      'SELECT * FROM wallets ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToWallet(r))
  }

  /**
   * 更新钱包信息
   * 合并新数据到现有钱包，私钥/助记词重新加密存储。
   * @param id - 钱包 UUID
   * @param data - 需要更新的字段（部分更新）
   * @returns 更新后的 Wallet 实体，钱包不存在时返回 null
   */
  updateWallet(id: string, data: Partial<Omit<Wallet, 'id' | 'createdAt'>>): Wallet | null {
    const existing = this.getWallet(id)
    if (!existing) return null
    const updated = { ...existing, ...data }
    this.db
      .prepare(
        'UPDATE wallets SET address=?, private_key=?, mnemonic=?, wallet_type=?, labels=? WHERE id=?'
      )
      .run(
        updated.address,
        updated.privateKey ? this.encryption.encrypt(updated.privateKey) : null,
        updated.mnemonic ? this.encryption.encrypt(updated.mnemonic) : null,
        updated.walletType,
        this.toJson(updated.labels),
        id
      )
    return this.getWallet(id)
  }

  /**
   * 删除单个钱包
   * @param id - 钱包 UUID
   * @returns 是否删除成功
   */
  deleteWallet(id: string): boolean {
    const result = this.stmt('wallet.delete').run(id)
    return result.changes > 0
  }

  /**
   * 批量创建钱包（事务）
   * 所有钱包在同一个事务中创建，失败时全部回滚。
   * @param items - 钱包数据数组
   * @returns 成功创建的数量
   */
  batchCreateWallets(items: Omit<Wallet, 'id' | 'createdAt'>[]): number {
    const insert = this.stmt('wallet.insert')
    const transaction = this.db.transaction((data: Omit<Wallet, 'id' | 'createdAt'>[]) => {
      let count = 0
      for (const item of data) {
        const id = uuidv4()
        const createdAt = this.nowISO()
        insert.run(
          id,
          item.address,
          item.privateKey ? this.encryption.encrypt(item.privateKey) : null,
          item.mnemonic ? this.encryption.encrypt(item.mnemonic) : null,
          item.walletType,
          this.toJson(item.labels),
          createdAt
        )
        count++
      }
      return count
    })
    return transaction(items)
  }

  /**
   * 批量删除钱包（事务）
   * @param ids - 钱包 UUID 数组
   * @returns 成功删除的数量
   */
  batchDeleteWallets(ids: string[]): number {
    const del = this.stmt('wallet.delete')
    const transaction = this.db.transaction((idList: string[]) => {
      let count = 0
      for (const id of idList) {
        const result = del.run(id)
        count += result.changes
      }
      return count
    })
    return transaction(ids)
  }
}
