/**
 * Marketplace Integration Test
 *
 * Tests the marketplace server API (scripts + templates CRUD, file download, auth)
 * and optionally the Electron app client-side HTTP API integration.
 *
 * Prerequisites:
 *   - Marketplace server running on http://127.0.0.1:3400
 *   - (optional) Electron app running with HTTP API on http://127.0.0.1:34116
 *
 * Usage:
 *   npx tsx test/integration/marketplace.test.ts
 */

const SERVER_URL = process.env.MARKETPLACE_URL || 'http://127.0.0.1:3400'
const ELECTRON_API_URL = process.env.ELECTRON_API_URL || 'http://127.0.0.1:34116'
const API_KEY = process.env.MARKETPLACE_API_KEY || 'airdrop-farm-dev-key'

// ─── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ ${msg}`)
    passed++
  } else {
    console.log(`  ❌ ${msg}`)
    failed++
  }
}

async function assertGet(
  url: string,
  expectedStatus: number,
  checkBody: (body: any) => boolean,
  label: string
) {
  try {
    const res = await fetch(url)
    const body = await res.json()
    assert(res.status === expectedStatus && checkBody(body), `${label} (status=${res.status})`)
  } catch (e: any) {
    assert(false, `${label} (error: ${e.message})`)
  }
}

async function assertPost(
  url: string,
  expectedStatus: number,
  checkBody: (body: any) => boolean,
  label: string,
  headers?: Record<string, string>,
  bodyPayload?: any
) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: bodyPayload ? JSON.stringify(bodyPayload) : undefined
    })
    const body = await res.json().catch(() => ({}))
    assert(res.status === expectedStatus && checkBody(body), `${label} (status=${res.status})`)
  } catch (e: any) {
    assert(false, `${label} (error: ${e.message})`)
  }
}

async function assertPut(
  url: string,
  expectedStatus: number,
  checkBody: (body: any) => boolean,
  label: string,
  headers?: Record<string, string>,
  bodyPayload?: any
) {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: bodyPayload ? JSON.stringify(bodyPayload) : undefined
    })
    const body = await res.json().catch(() => ({}))
    assert(res.status === expectedStatus && checkBody(body), `${label} (status=${res.status})`)
  } catch (e: any) {
    assert(false, `${label} (error: ${e.message})`)
  }
}

async function assertDelete(
  url: string,
  expectedStatus: number,
  checkBody: (body: any) => boolean,
  label: string,
  headers?: Record<string, string>
) {
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers
    })
    const body = await res.json().catch(() => ({}))
    assert(res.status === expectedStatus && checkBody(body), `${label} (status=${res.status})`)
  } catch (e: any) {
    assert(false, `${label} (error: ${e.message})`)
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('\n═══ Marketplace Server Integration Tests ═══\n')

  // 1. Health check
  console.log('\n── Health Check ──')
  await assertGet(
    `${SERVER_URL}/api/health`,
    200,
    (b) => b.status === 'ok',
    'GET /api/health returns ok'
  )

  // 2. Script market - list
  console.log('\n── Script Market: List ──')
  await assertGet(
    `${SERVER_URL}/api/scripts`,
    200,
    (b) => b.data?.items?.length >= 2 && b.data?.total >= 2,
    'GET /api/scripts returns seed scripts (>=2 items)'
  )

  // 3. Script market - get by id
  console.log('\n── Script Market: Get by ID ──')
  await assertGet(
    `${SERVER_URL}/api/scripts/script-example-echo`,
    200,
    (b) => b.data?.name === 'Echo 示例脚本' && b.data?.entryPoint === 'echo.sh',
    'GET /api/scripts/script-example-echo returns echo script'
  )
  await assertGet(
    `${SERVER_URL}/api/scripts/script-example-wallet-check`,
    200,
    (b) => b.data?.name === '钱包余额检查' && b.data?.schema?.fields?.length === 3,
    'GET /api/scripts/script-example-wallet-check returns wallet check script with 3 fields'
  )
  await assertGet(
    `${SERVER_URL}/api/scripts/non-existent`,
    404,
    (b) => b.error?.code === 'NOT_FOUND',
    'GET /api/scripts/non-existent returns 404'
  )

  // 4. Script market - file download
  console.log('\n── Script Market: File Download ──')
  try {
    const dlRes = await fetch(`${SERVER_URL}/api/scripts/script-example-echo/download`)
    assert(
      dlRes.status === 200 && dlRes.headers.get('Content-Type')?.includes('zip'),
      `Download script file (status=${dlRes.status}, contentType=${dlRes.headers.get('Content-Type')})`
    )
  } catch (e: any) {
    assert(false, `Download script file (error: ${e.message})`)
  }

  // 5. Template market - list
  console.log('\n── Template Market: List ──')
  await assertGet(
    `${SERVER_URL}/api/templates`,
    200,
    (b) => b.data?.items?.length >= 2 && b.data?.total >= 2,
    'GET /api/templates returns seed templates (>=2 items)'
  )

  // 6. Template market - get by id
  console.log('\n── Template Market: Get by ID ──')
  await assertGet(
    `${SERVER_URL}/api/templates/template-evm-wallet`,
    200,
    (b) => b.data?.name === 'EVM 钱包' && b.data?.type === 'evm-wallet',
    'GET /api/templates/template-evm-wallet returns EVM wallet template'
  )
  await assertGet(
    `${SERVER_URL}/api/templates/template-solana-wallet`,
    200,
    (b) => b.data?.name === 'Solana 钱包' && b.data?.type === 'solana-wallet',
    'GET /api/templates/template-solana-wallet returns Solana wallet template'
  )
  await assertGet(
    `${SERVER_URL}/api/templates/non-existent`,
    404,
    (b) => b.error?.code === 'NOT_FOUND',
    'GET /api/templates/non-existent returns 404'
  )

  // 7. Auth - POST/PUT/DELETE require API key
  console.log('\n── Auth: API Key Required for Write Operations ──')
  await assertPost(
    `${SERVER_URL}/api/scripts`,
    401,
    (b) => b.error?.code === 'UNAUTHORIZED',
    'POST /api/scripts without auth returns 401'
  )

  // 8. Auth - valid API key works
  console.log('\n── Auth: Valid API Key ──')
  const authHeaders = { Authorization: `Bearer ${API_KEY}` }

  // Create a new script (won't have a real file, but the endpoint requires multipart - so this will fail with 400)
  // Let's test template create instead (which doesn't need file upload)
  await assertPost(
    `${SERVER_URL}/api/templates`,
    201,
    (b) => b.data?.name === 'Test Template' && b.data?.type === 'test',
    'POST /api/templates with valid auth creates template',
    authHeaders,
    {
      name: 'Test Template',
      type: 'test',
      version: '1.0.0',
      description: 'Integration test template',
      schema: { fields: [{ name: 'testField', type: 'string', label: 'Test', required: true }] }
    }
  )

  // 9. Update the created template
  console.log('\n── Template Market: Update ──')
  await assertPut(
    `${SERVER_URL}/api/templates/template-evm-wallet`,
    200,
    (b) => b.data?.description === 'Updated description',
    'PUT /api/templates/template-evm-wallet updates description',
    authHeaders,
    { description: 'Updated description' }
  )

  // 10. Duplicate template name test (should still work, no unique constraint on name)
  await assertPost(
    `${SERVER_URL}/api/templates`,
    201,
    (b) => b.data?.name === 'Duplicate Template',
    'POST /api/templates creates second template',
    authHeaders,
    { name: 'Duplicate Template', type: 'test' }
  )

  // 11. Delete the created templates
  console.log('\n── Template Market: Delete ──')
  // Get the templates we created
  try {
    const listRes = await fetch(`${SERVER_URL}/api/templates`)
    const listBody = await listRes.json()
    const items = listBody.data?.items || []
    const testTemplates = items.filter(
      (t: any) => t.name === 'Test Template' || t.name === 'Duplicate Template'
    )
    for (const tpl of testTemplates) {
      await assertDelete(
        `${SERVER_URL}/api/templates/${tpl.id}`,
        200,
        (b) => b.data?.deleted === true,
        `DELETE /api/templates/${tpl.id} deletes template "${tpl.name}"`,
        authHeaders
      )
    }
    if (testTemplates.length === 0) {
      console.log('  ⚠️  No test templates found to delete (may have been cleaned up)')
    }
  } catch (e: any) {
    assert(false, `Cleanup test templates (error: ${e.message})`)
  }

  // 12. Reset the template we updated back to original
  await assertPut(
    `${SERVER_URL}/api/templates/template-evm-wallet`,
    200,
    (b) => b.data?.description === 'EVM 兼容链钱包账户',
    'PUT /api/templates/template-evm-wallet restores description',
    authHeaders,
    { description: 'EVM 兼容链钱包账户' }
  )

  // 13. Test Electron client-side HTTP API (if available)
  console.log('\n── Electron Client HTTP API (optional) ──')
  try {
    const electronRes = await fetch(`${ELECTRON_API_URL}/api/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'setting:getAll', args: [] })
    })
    if (electronRes.ok) {
      const body = await electronRes.json()
      assert(body !== undefined, 'POST /api/call setting:getAll returns data')
    } else {
      console.log(`  ⏭️  Electron API not available (HTTP ${electronRes.status})`)
    }
  } catch {
    console.log(`  ⏭️  Electron HTTP API not reachable at ${ELECTRON_API_URL}`)
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══\n`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((e) => {
  console.error('Test runner error:', e)
  process.exit(1)
})
