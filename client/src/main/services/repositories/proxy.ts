/**
 * @file ProxyRepository — 代理数据仓库
 * @description 封装 proxies 表的全部 CRUD 操作，支持多种代理格式（manual / api / ip / ws）、
 *              多种协议（http / https / socks5 / ws）、分页查询和批量操作。
 * @module main/services/repositories
 */
import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type { Proxy, ListResponse } from '../../../shared/types'
import { BaseRepository } from './base'

/**
 * 代理数据仓库
 *
 * 管理系统中的所有代理配置，支持手动输入、API 拉取、IP 绑定和 WebSocket 代理。
 * 提供按协议和状态的统计查询，以及事务性的批量创建/删除。
 *
 * @example
 * ```ts
 * const repo = new ProxyRepository(db)
 * const proxy = repo.createProxy({ protocol: 'http', host: '127.0.0.1', port: 8080, ... })
 * const list = repo.listProxies(1, 20, '127.0.0')
 * ```
 */
export class ProxyRepository extends BaseRepository<Proxy> {
  /**
   * @param db - better-sqlite3 数据库连接
   */
  constructor(db: Database.Database) {
    super(db)
    this.prepareStatements()
  }

  /** 注册所有代理相关的预编译 SQL 语句 */
  prepareStatements(): void {
    this.setStmt(
      'proxy.insert',
      this.db.prepare(
        'INSERT INTO proxies (id, protocol, host, port, username, password, status, format, labels, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
    )
    this.setStmt('proxy.getById', this.db.prepare('SELECT * FROM proxies WHERE id = ?'))
    this.setStmt(
      'proxy.update',
      this.db.prepare(
        'UPDATE proxies SET protocol=?, host=?, port=?, username=?, password=?, status=?, format=?, labels=? WHERE id=?'
      )
    )
    this.setStmt('proxy.delete', this.db.prepare('DELETE FROM proxies WHERE id = ?'))
    this.setStmt('proxy.count', this.db.prepare('SELECT COUNT(*) as cnt FROM proxies'))
    this.setStmt(
      'proxy.countByProtocol',
      this.db.prepare('SELECT protocol, COUNT(*) as cnt FROM proxies GROUP BY protocol')
    )
    this.setStmt(
      'proxy.countByStatus',
      this.db.prepare('SELECT status, COUNT(*) as cnt FROM proxies GROUP BY status')
    )
  }

  /**
   * 将数据库行记录映射为 Proxy 对象
   * 解析 JSON 标签数组字段。
   * @param row - 数据库查询返回的原始行数据
   * @returns 组装好的 Proxy 实体
   */
  private rowToProxy(row: Record<string, unknown>): Proxy {
    return {
      id: row.id as string,
      protocol: row.protocol as Proxy['protocol'],
      host: row.host as string,
      port: row.port as number,
      username: row.username as string | null,
      password: row.password as string | null,
      status: row.status as Proxy['status'],
      format: row.format as Proxy['format'],
      labels: this.fromJsonArray<string>(row.labels as string | null),
      createdAt: row.created_at as string
    }
  }

  /** 获取代理总数 */
  count(): number {
    return (this.stmt('proxy.count').get() as Record<string, number>).cnt
  }

  /**
   * 按协议类型统计代理数量
   * @returns 协议名 → 数量的映射，如 { http: 10, socks5: 5 }
   */
  countByProtocol(): Record<string, number> {
    const rows = this.stmt('proxy.countByProtocol').all() as Record<string, unknown>[]
    const result: Record<string, number> = {}
    for (const row of rows) {
      result[row.protocol as string] = row.cnt as number
    }
    return result
  }

  /**
   * 按状态统计代理数量
   * @returns 状态名 → 数量的映射，如 { active: 15, inactive: 3 }
   */
  countByStatus(): Record<string, number> {
    const rows = this.stmt('proxy.countByStatus').all() as Record<string, unknown>[]
    const result: Record<string, number> = {}
    for (const row of rows) {
      result[row.status as string] = row.cnt as number
    }
    return result
  }

  /**
   * 创建新代理
   * 自动生成 UUID 和 ISO 时间戳，默认格式为 manual。
   * @param data - 代理数据（不含 id 和 createdAt）
   * @returns 创建完成的 Proxy 实体
   */
  createProxy(data: Omit<Proxy, 'id' | 'createdAt'>): Proxy {
    const id = uuidv4()
    const createdAt = this.nowISO()
    this.stmt('proxy.insert').run(
      id,
      data.protocol,
      data.host,
      data.port,
      data.username ?? null,
      data.password ?? null,
      data.status,
      data.format ?? 'manual',
      this.toJson(data.labels),
      createdAt
    )
    return this.getProxy(id)!
  }

  /**
   * 根据 ID 获取代理
   * @param id - 代理 UUID
   * @returns Proxy 实体，未找到时返回 null
   */
  getProxy(id: string): Proxy | null {
    const row = this.stmt('proxy.getById').get(id) as Record<string, unknown> | undefined
    return row ? this.rowToProxy(row) : null
  }

  /**
   * 分页查询代理列表
   * 支持按主机地址或协议类型模糊搜索。
   * @param page - 页码（从 1 开始，默认 1）
   * @param pageSize - 每页条数（默认 20）
   * @param search - 可选搜索关键词（匹配 host 或 protocol）
   * @returns 分页响应，包含 items 和分页元信息
   */
  listProxies(page = 1, pageSize = 20, search?: string): ListResponse<Proxy> {
    if (search) {
      const countStmt = this.db.prepare(
        'SELECT COUNT(*) as cnt FROM proxies WHERE host LIKE ? OR protocol LIKE ?'
      )
      const listStmt = this.db.prepare(
        'SELECT * FROM proxies WHERE host LIKE ? OR protocol LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToProxy(r), [
        `%${search}%`,
        `%${search}%`
      ])
    }
    const countStmt = this.stmt('proxy.count')
    const listStmt = this.db.prepare(
      'SELECT * FROM proxies ORDER BY created_at DESC LIMIT ? OFFSET ?'
    )
    return this.paginate(countStmt, listStmt, page, pageSize, (r) => this.rowToProxy(r))
  }

  /**
   * 更新代理信息
   * 合并新数据到现有代理记录。
   * @param id - 代理 UUID
   * @param data - 需要更新的字段（部分更新）
   * @returns 更新后的 Proxy 实体，代理不存在时返回 null
   */
  updateProxy(id: string, data: Partial<Omit<Proxy, 'id' | 'createdAt'>>): Proxy | null {
    const existing = this.getProxy(id)
    if (!existing) return null
    const updated = { ...existing, ...data }
    this.stmt('proxy.update').run(
      updated.protocol,
      updated.host,
      updated.port,
      updated.username ?? null,
      updated.password ?? null,
      updated.status,
      updated.format ?? 'manual',
      this.toJson(updated.labels),
      id
    )
    return this.getProxy(id)
  }

  /**
   * 删除单个代理
   * @param id - 代理 UUID
   * @returns 是否删除成功
   */
  deleteProxy(id: string): boolean {
    const result = this.stmt('proxy.delete').run(id)
    return result.changes > 0
  }

  /**
   * 批量删除代理（事务）
   * @param ids - 代理 UUID 数组
   * @returns 成功删除的数量
   */
  batchDeleteProxies(ids: string[]): number {
    const deleteStmt = this.db.prepare('DELETE FROM proxies WHERE id = ?')
    const transaction = this.db.transaction((items: string[]) => {
      let count = 0
      for (const id of items) {
        count += deleteStmt.run(id).changes
      }
      return count
    })
    return transaction(ids)
  }

  /**
   * 批量创建代理（事务）
   * 所有代理在同一个事务中创建，失败时全部回滚。
   * @param items - 代理数据数组
   * @returns 成功创建的数量
   */
  batchCreateProxies(items: Omit<Proxy, 'id' | 'createdAt'>[]): number {
    const insert = this.stmt('proxy.insert')
    const transaction = this.db.transaction((data: Omit<Proxy, 'id' | 'createdAt'>[]) => {
      let count = 0
      for (const item of data) {
        const id = uuidv4()
        const createdAt = this.nowISO()
        insert.run(
          id,
          item.protocol,
          item.host,
          item.port,
          item.username ?? null,
          item.password ?? null,
          item.status,
          item.format ?? 'manual',
          this.toJson(item.labels),
          createdAt
        )
        count++
      }
      return count
    })
    return transaction(items)
  }
}
