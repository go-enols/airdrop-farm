# 统一中文注释规范 — 适用于 airdrop-farm 项目

> 所有并行 agent 必须严格遵守此规范，确保注释风格一致。

## 1. 文件头注释

每个源文件（.ts / .tsx）顶部必须添加文件级注释块，说明文件用途：

```typescript
/**
 * @file 文件用途简述（一行）
 * @description 详细说明文件的职责、所属模块、关键功能
 * @module 模块路径（如 main/services / renderer/pages / server/routes）
 */
```

**示例**：
```typescript
/**
 * @file StoreService — SQLite 数据访问层
 * @description 封装所有数据表 CRUD 操作，提供钱包、账户、代理、任务、空投项目等的统一数据访问接口。
 *              内部使用 better-sqlite3 同步 API + 预编译语句，JSON 字段自动序列化/反序列化。
 * @module main/services
 */
```

## 2. 类 / 接口注释

```typescript
/**
 * 类用途描述
 *
 * 详细说明类的职责、生命周期、关键方法、注意事项
 *
 * @example
 * ```ts
 * const service = new StoreService(dbPath)
 * const wallets = service.wallets.list()
 * ```
 */
export class StoreService { ... }
```

## 3. 公共方法注释（JSDoc 完整格式）

```typescript
/**
 * 方法用途简述（一行）
 *
 * 详细说明方法行为、副作用、注意事项
 *
 * @param paramName - 参数说明（含类型、取值范围、默认值）
 * @param options - 配置项说明
 * @returns 返回值说明
 * @throws 可能抛出的错误类型及触发条件
 * @example
 * ```ts
 * const result = service.methodName('value', { flag: true })
 * ```
 */
```

**规则**：
- 公共方法（`export` / 类的 public 方法）必须写完整 JSDoc
- 包含 `@param`、`@returns`，必要时 `@throws`、`@example`
- 每个 `@param` 必须有说明

## 4. 私有 / 内部方法注释

简短说明，使用单行或多行块：

```typescript
/** 内部辅助方法：将任意值序列化为 JSON 字符串 */
function toJson(val: unknown): JsonField { ... }

/**
 * 内部辅助方法：从 JSON 字符串解析为对象
 * - 解析失败时返回 null（不抛错）
 */
function fromJson<T>(val: JsonField): T | null { ... }
```

## 5. React 组件注释

### 5.1 组件定义前

```typescript
/**
 * StatCard — 统计卡片组件
 *
 * 用于 Dashboard 页面展示单一统计指标（图标 + 标签 + 数值 + 趋势）。
 *
 * @param icon  - lucide-react 图标组件
 * @param label - 卡片标签文字
 * @param value - 主数值
 * @param color - 图标背景颜色（Tailwind class）
 * @param trend - 可选趋势数据 {value, isUp}
 */
function StatCard({ icon: Icon, label, value, color, trend }: { ... }) { ... }
```

### 5.2 组件内 Hooks

```typescript
// 加载统计数据，加载期间显示 skeleton
const { data, isLoading } = useQuery({ ... })
```

### 5.3 JSX 关键区块

```tsx
return (
  <div>
    {/* 顶部统计卡片区 */}
    <div className="grid grid-cols-4 gap-4">
      {stats.map(...)}
    </div>

    {/* 空投项目列表 */}
    <AirdropList ... />
  </div>
)
```

## 6. 复杂逻辑行内注释

```typescript
// 优先使用 IPC，失败时降级到 HTTP（双传输层策略）
const result = await transport.call(channel, args)

// 这里必须用 prepared statement 以提升性能并防止 SQL 注入
const stmt = this.db.prepare('SELECT * FROM wallets WHERE id = ?')
```

## 7. TypeScript 特定

- **类型别名 / 接口字段**：使用 JSDoc `@property` 或单行 `/** 描述 */`
- **枚举值**：在每个值上方说明含义
- **常量**（如配置项）：说明取值范围和默认值

```typescript
/** 任务状态枚举 */
type TaskStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'complete' | 'error'

export interface Wallet {
  /** 钱包 UUID */
  id: string
  /** 钱包地址（EVM: 0x... / Solana: base58） */
  address: string
  /** 加密存储的私钥（可选） */
  private_key?: string
}
```

## 8. 注释语言与标点

- **全部使用简体中文**（避免繁简混用）
- **句末使用中文标点**：句号 `。` 逗号 `，` 冒号 `：` 引号 `""`（除 JSDoc 标签外）
- **JSDoc 标签内仍用英文**：`@param`, `@returns`, `@throws`, `@example` 等保持英文
- **JSDoc 描述部分用中文**
- **代码示例可保留英文**（如 `service.methodName()`）

## 9. 不要做的事

- ❌ 不要修改任何代码逻辑（只添加/修改注释）
- ❌ 不要删除现有注释
- ❌ 不要翻译已有的英文标识符（变量名、函数名保持英文）
- ❌ 不要添加无意义的废话注释（如 `// 这是一个循环` 下面是 for 循环）
- ❌ 不要在已注释的代码块上重复注释
- ❌ 不要改变文件编码或换行符
- ❌ 不要触碰 `client/src/main/services/sandbox-enforcer.cjs`（CJS 文件，结构特殊）
- ❌ 不要触碰 `node_modules/`、`client/out/`、`client/dist/`、`.omo/`、`.sisyphus/`、`.vscode/`、`.github/`、`.claude/`、`.dbg/`、构建产物

## 10. 完成后验证清单

- [ ] `cd client && npm run typecheck` 通过
- [ ] `cd client && npm run lint` 通过（注释不应触发 lint 错误）
- [ ] 抽样检查 5-10 个文件确认注释质量
- [ ] 注释覆盖率：每个公共方法、每个类、每个公共组件都有 JSDoc
- [ ] 注释语言一致（简体中文）

## 11. 文件清单（按职责分类）

### Server（server/src/）
- `index.ts` — Express 入口
- `types.ts` — 服务端共享类型
- `db/index.ts` — SQLite 数据库初始化
- `middleware/auth.ts` — JWT 中间件
- `routes/auth.ts` — 认证路由
- `routes/scripts.ts` — 脚本 CRUD 路由
- `routes/templates.ts` — 模板 CRUD 路由
- `routes/users.ts` — 用户管理路由
- `utils/keys.ts` — 密钥生成工具

### Client Main（client/src/main/）
- `index.ts` — Electron 主进程入口
- `ipc/index.ts` — IPC handler 注册表
- `httpapi/server.ts` — HTTP API 冗余传输层
- `services/store.ts` — SQLite 数据访问层
- `services/task.ts` — 任务执行引擎
- `services/wallet.ts` — 钱包管理
- `services/encryption.ts` — 加密服务
- `services/scheduler.ts` — 定时任务调度
- `services/script-fetcher.ts` — 远程脚本下载器
- `services/repositories/base.ts` — 仓库基类
- `services/repositories/wallet.ts` — 钱包仓库
- `services/repositories/proxy.ts` — 代理仓库
- `services/repositories/task.ts` — 任务仓库
- `services/repositories/index.ts` — 仓库集合
- `utils/logger.ts` — 日志工具
- `utils/log-buffer.ts` — 日志缓冲

### Client Preload（client/src/preload/）
- `index.ts` — Context bridge 主入口
- `index.d.ts` — electronAPI 类型声明

### Client Shared（client/shared/）
- `types/index.ts` — 共享类型定义
- `schemas/*` — 共享数据校验 schema

### Client Renderer（client/src/renderer/src/）
- `App.tsx` — 根组件
- `main.tsx` — 渲染入口（如有）
- `api.ts` — 类型化 API 客户端
- `transport.ts` — 双传输层
- `pages/*` — 路由页面
- `components/**/*` — 共享 UI 组件
- `hooks/*` — 自定义 hooks
- `contexts/*` — React contexts
- `i18n/*` — 国际化资源
- `utils/*` — 前端工具函数
- `types/*` — 前端类型定义

### Tests（client/tests/）
- `main/*` — 主进程测试
- `renderer/*` — 渲染进程测试

---

**严格遵守此规范。不要发挥"创意"添加与本规范冲突的注释风格。**
