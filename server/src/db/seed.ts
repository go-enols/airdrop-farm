import { db, stmts, getScriptsDir } from './index'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

function seed() {
  const now = new Date().toISOString()

  const existingScripts = stmts.scriptGetAll.all() as Record<string, unknown>[]
  if (existingScripts.length === 0) {
    stmts.scriptInsert.run(
      'script-example-echo',
      'Echo 示例脚本',
      '1.0.0',
      '简单的 echo 示例脚本，用于测试任务执行',
      JSON.stringify({ fields: [{ name: 'message', type: 'string', label: '消息内容', required: true, description: '要输出的消息' }] }),
      'echo.sh',
      '',
      'echo-1.0.0.zip',
      '["示例","测试"]',
      '初始版本',
      0, now, now
    )

    stmts.scriptInsert.run(
      'script-example-wallet-check',
      '钱包余额检查',
      '1.0.0',
      '检查 EVM 钱包地址的余额',
      JSON.stringify({
        fields: [
          { name: 'rpcUrl', type: 'string', label: 'RPC URL', required: true, defaultValue: 'https://eth.llamarpc.com' },
          { name: 'chainName', type: 'select', label: '链', required: true, options: [{ label: 'Ethereum', value: 'ethereum' }, { label: 'BSC', value: 'bsc' }, { label: 'Polygon', value: 'polygon' }] },
          { name: 'proxyEnabled', type: 'boolean', label: '使用代理', required: false, defaultValue: false },
        ]
      }),
      'check-balance.js',
      '',
      'wallet-check-1.0.0.zip',
      '["钱包","余额"]',
      '初始版本',
      0, now, now
    )

    // Create placeholder zip files for download testing
    const scriptsDir = getScriptsDir()
    const placeholderFiles = ['echo-1.0.0.zip', 'wallet-check-1.0.0.zip']
    for (const f of placeholderFiles) {
      const fp = join(scriptsDir, f)
      if (!existsSync(fp)) {
        writeFileSync(fp, 'placeholder-script-content')
      }
    }
    console.log('Seeded 2 example scripts')
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
          { name: 'chain', type: 'select', label: '链', required: true, options: [{ label: 'Ethereum', value: 'ethereum' }, { label: 'BSC', value: 'bsc' }, { label: 'Polygon', value: 'polygon' }, { label: 'Arbitrum', value: 'arbitrum' }] },
        ]
      }),
      '', 0, now, now
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
        ]
      }),
      '', 0, now, now
    )

    console.log('Seeded 2 example templates')
  }

  if (existingScripts.length > 0 && existingTemplates.length > 0) {
    console.log('Database already seeded, skipping')
  }
}

seed()
