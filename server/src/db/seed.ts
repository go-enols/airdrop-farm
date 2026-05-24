import { stmts, getScriptsDir } from './index'
import { existsSync, mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { execSync } from 'child_process'
import { createHash } from 'crypto'

interface SeedScript {
  id: string
  name: string
  version: string
  description: string
  entryPoint: string
  files: Record<string, string>
  schema: Record<string, unknown>
  dbSchema: Record<string, unknown>
  fileName: string
  tags: string[]
  changelog: string
}

function buildZip(script: SeedScript, destPath: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'seed-script-'))
  try {
    const manifest = {
      id: script.id,
      name: script.name,
      version: script.version,
      description: script.description,
      entryPoint: script.entryPoint,
      runtime: 'node',
      schema: script.schema,
      tags: script.tags,
      changelog: script.changelog,
    }
    writeFileSync(join(tmp, 'manifest.json'), JSON.stringify(manifest, null, 2))
    for (const [relPath, contents] of Object.entries(script.files)) {
      writeFileSync(join(tmp, relPath), contents)
    }

    if (existsSync(destPath)) rmSync(destPath, { force: true })
    execSync(`zip -r -q "${destPath}" .`, { cwd: tmp, timeout: 30000 })
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }

  return createHash('sha256').update(readFileSync(destPath)).digest('hex')
}

function seed(): void {
  const now = new Date().toISOString()
  const scriptsDir = getScriptsDir()

  const seedScripts: SeedScript[] = [
    {
      id: 'script-example-echo',
      name: 'Echo 示例脚本',
      version: '1.0.0',
      description: '简单的 echo 示例脚本，用于测试任务执行',
      entryPoint: 'index.js',
      fileName: 'echo-1.0.0.zip',
      tags: ['示例', '测试'],
      changelog: '初始版本',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', title: '消息内容', description: '要输出的消息' },
        },
        required: ['message'],
      },
      dbSchema: {
        fields: [
          {
            name: 'message',
            type: 'string',
            label: '消息内容',
            required: true,
            description: '要输出的消息',
          },
        ],
      },
      files: {
        'index.js': [
          '#!/usr/bin/env node',
          '// Echo example: prints TASK_CONFIG.message and exits.',
          'try {',
          "  const cfg = JSON.parse(process.env.TASK_CONFIG || '{}')",
          "  console.log('[echo]', cfg.message ?? '(no message)')",
          '  process.exit(0)',
          '} catch (err) {',
          "  console.error('[echo] failed to parse TASK_CONFIG:', err)",
          '  process.exit(1)',
          '}',
          '',
        ].join('\n'),
        'README.md': '# Echo 示例脚本\n\n读取 `TASK_CONFIG.message` 并打印到 stdout。\n',
        'package.json': JSON.stringify({
          name: 'script-example-echo',
          private: true,
          description: 'Echo example script - no external dependencies',
          dependencies: {}
        }, null, 2),
      },
    },
    {
      id: 'script-example-wallet-check',
      name: '钱包余额检查',
      version: '1.0.0',
      description: '检查 EVM 钱包地址的余额',
      entryPoint: 'check-balance.js',
      fileName: 'wallet-check-1.0.0.zip',
      tags: ['钱包', '余额'],
      changelog: '初始版本',
      schema: {
        type: 'object',
        properties: {
          rpcUrl: {
            type: 'string',
            title: 'RPC URL',
            default: 'https://eth.llamarpc.com',
          },
          chainName: {
            type: 'string',
            title: '链',
            enum: ['ethereum', 'bsc', 'polygon'],
          },
          proxyEnabled: { type: 'boolean', title: '使用代理', default: false },
        },
        required: ['rpcUrl', 'chainName'],
      },
      dbSchema: {
        fields: [
          {
            name: 'rpcUrl',
            type: 'string',
            label: 'RPC URL',
            required: true,
            defaultValue: 'https://eth.llamarpc.com',
          },
          {
            name: 'chainName',
            type: 'select',
            label: '链',
            required: true,
            options: [
              { label: 'Ethereum', value: 'ethereum' },
              { label: 'BSC', value: 'bsc' },
              { label: 'Polygon', value: 'polygon' },
            ],
          },
          {
            name: 'proxyEnabled',
            type: 'boolean',
            label: '使用代理',
            required: false,
            defaultValue: false,
          },
        ],
      },
      files: {
'check-balance.js': [
          '#!/usr/bin/env node',
          '// Wallet balance checker - uses ethers.js for RPC calls',
          'try {',
          "  const cfg = JSON.parse(process.env.TASK_CONFIG || '{}')",
          '  console.log("[wallet-check] rpc:", cfg.rpcUrl)',
          '  console.log("[wallet-check] chain:", cfg.chainName)',
          '  console.log("[wallet-check] proxy:", cfg.proxyEnabled ? "on" : "off")',
          '  // Example: load ethers if installed as dependency',
          '  try {',
          "    const { ethers } = require('ethers')",
          "    const provider = new ethers.JsonRpcProvider(cfg.rpcUrl || 'https://eth.llamarpc.com')",
          '    console.log("[wallet-check] ethers loaded, blockNumber:", await provider.getBlockNumber())',
          '  } catch (e) {',
          '    console.log("[wallet-check] ethers not available, skipping RPC check")',
          '  }',
          '  process.exit(0)',
          '} catch (err) {',
          "  console.error('[wallet-check] error:', err)",
          '  process.exit(1)',
          '}',
          '',
        ].join('\n'),
        'README.md': '# 钱包余额检查\n\n占位实现，真实的余额查询逻辑请自行扩展。\n',
        'package.json': JSON.stringify({
          name: 'script-example-wallet-check',
          private: true,
          description: 'EVM wallet balance checker',
          dependencies: {
            ethers: '^6.13.0'
          }
        }, null, 2),
      },
    },
  ]

  const existingScripts = stmts.scriptGetAll.all() as Record<string, unknown>[]
  if (existingScripts.length === 0) {
    for (const s of seedScripts) {
      const zipPath = join(scriptsDir, s.fileName)
      const checksum = buildZip(s, zipPath)
      stmts.scriptInsert.run(
        s.id,
        s.name,
        s.version,
        s.description,
        JSON.stringify(s.schema),
        s.entryPoint,
        checksum,
        s.fileName,
        JSON.stringify(s.tags),
        s.changelog,
        0,
        now,
        now,
      )
    }
    console.log(`Seeded ${seedScripts.length} example scripts`)
  }

  const existingTemplates = stmts.templateGetAll.all() as Record<string, unknown>[]
  if (existingTemplates.length === 0) {
    stmts.templateInsert.run(
      'template-evm-wallet',
      'EVM 钱包',
      'evm-wallet',
      '1.0.0',
      'EVM 兼容链钱包账户',
      JSON.stringify({
        fields: [
          { name: 'address', type: 'string', label: '钱包地址', required: true },
          { name: 'privateKey', type: 'string', label: '私钥', required: true },
          { name: 'mnemonic', type: 'string', label: '助记词', required: false },
          {
            name: 'chain',
            type: 'select',
            label: '链',
            required: true,
            options: [
              { label: 'Ethereum', value: 'ethereum' },
              { label: 'BSC', value: 'bsc' },
              { label: 'Polygon', value: 'polygon' },
              { label: 'Arbitrum', value: 'arbitrum' },
            ],
          },
        ],
      }),
      '',
      0,
      now,
      now,
    )

    stmts.templateInsert.run(
      'template-solana-wallet',
      'Solana 钱包',
      'solana-wallet',
      '1.0.0',
      'Solana 链钱包账户',
      JSON.stringify({
        fields: [
          { name: 'address', type: 'string', label: '钱包地址', required: true },
          { name: 'privateKey', type: 'string', label: '私钥', required: true },
          { name: 'mnemonic', type: 'string', label: '助记词', required: false },
        ],
      }),
      '',
      0,
      now,
      now,
    )

    console.log('Seeded 2 example templates')
  }

  if (existingScripts.length > 0 && existingTemplates.length > 0) {
    console.log('Database already seeded, skipping')
  }
}

seed()
