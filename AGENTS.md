# Project Instructions

This file provides context for AI assistants working on this project.

## Project Type: Electron + TypeScript

Full-stack desktop application using Electron as the shell, React + Tailwind CSS for the renderer, and Node.js for the main process. No Go backend — all business logic is implemented in TypeScript.

### Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Typecheck (main): `npx tsc --noEmit -p tsconfig.node.json`
- Typecheck (renderer): `npx tsc --noEmit -p tsconfig.web.json`
- Typecheck (all): `npm run typecheck`
- Lint: `npm run lint`
- Format: `npm run format`

### Architecture

```
src/
├── main/           # Electron main process (Node.js)
│   ├── index.ts    # App entry, window management, service init
│   ├── ipc/        # Unified handler registry (IPC + HTTP shared)
│   ├── httpapi/    # HTTP API server (redundant transport on :34116)
│   ├── services/   # Business logic (store, wallet, task, proxy, etc.)
│   └── utils/      # Logger and utilities
├── preload/        # Context bridge (electronAPI.invoke / .on)
└── renderer/       # React frontend
    └── src/
        ├── api.ts        # Typed API client (calls transport.call)
        ├── transport.ts  # Dual transport: IPC → HTTP auto-fallback
        ├── components/   # Shared UI components
        ├── pages/        # Route pages
        ├── hooks/        # Custom React hooks
        ├── i18n/         # Internationalization (zh-CN)
        ├── types/        # TypeScript type definitions
        └── utils/        # Frontend utilities
```

### Communication Architecture

**Dual transport with automatic fallback:**

1. **IPC (primary)** — `window.electronAPI.invoke(channel, ...args)` via Electron context bridge
2. **HTTP (fallback)** — `POST http://127.0.0.1:34116/api/call {channel, args}`

Both transports share the same `handlerMap` in `src/main/ipc/index.ts`. The `executeHandler()` function is the single entry point for all API calls regardless of transport.

**Transport selection logic** (in `src/renderer/src/transport.ts`):
- Force mode: URL param `?transport=http` or `localStorage['app-transport']`
- Auto mode: IPC first → HTTP fallback → remember working transport

**Adding a new API endpoint:**
1. Add handler in `src/main/ipc/index.ts` via `register('channel:name', handler)`
2. Add typed method in `src/renderer/src/api.ts` via `call<T>('channel:name', [args])`
3. Both IPC and HTTP automatically support the new endpoint

### Key Technologies

- **Electron** — Desktop shell (electron-vite scaffolding)
- **React 19 + TypeScript** — Renderer UI
- **Tailwind CSS v4** — Styling (via @tailwindcss/vite plugin)
- **better-sqlite3** — Main process database (WAL mode, prepared statements)
- **ethers.js** — EVM wallet management
- **@solana/web3.js** — Solana wallet management
- **bip39 + ed25519-hd-key** — HD wallet derivation
- **react-router-dom** — Frontend routing (HashRouter)
- **i18next** — Internationalization
- **lucide-react** — Icons

### Database

SQLite via better-sqlite3 at `app.getPath('userData')/airdrop-farm.db`.

Tables: wallets, accounts, proxies, tasks, task_logs, templates, task_templates, scheduled_tasks, airdrop_projects, settings, captcha_keys, proxy_providers, app_logs

## Guidelines

- Follow existing code style and patterns
- Write tests for new functionality
- Keep changes focused and atomic
- Do NOT add comments to code unless explicitly asked
- All API calls must go through `transport.ts` → `api.ts` — never call `window.electronAPI` directly from components
- New API endpoints must be registered in `handlerMap` via `register()` in `src/main/ipc/index.ts`
- Use the `useApi` hook for component-level API calls with loading/error state

## Important Notes

- 前后端通信必须通过 `transport.ts` 统一封装，IPC 优先、HTTP 降级
- 主进程 handler 通过 `handlerMap` 统一注册，IPC 和 HTTP 共用同一套 handler
- 所有当前无法完成的功能必须进行 Todo 标记
- 在实现功能之前需要检查是否有现成的实现
- 编写代码之前需要思考清楚再开始
- HTTP API 服务器监听 `127.0.0.1:34116`，仅用于冗余通信和调试
- 数据库操作使用 better-sqlite3 的同步 API，无需 async/await
- 本项目为自己使用的你无需考虑安全性，只需考虑多平台兼容性
