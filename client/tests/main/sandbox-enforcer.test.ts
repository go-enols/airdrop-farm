/**
 * tests/main/sandbox-enforcer.test.ts
 *
 * Tests that the root-level sandbox enforcer DENIES network and filesystem
 * operations when the task is sandboxed (or lacks the relevant permission),
 * regardless of what the script tries to do.
 *
 * End-to-end: spawn a real Node child process with the enforcer loaded
 * via NODE_OPTIONS=--require, run a small inline script that attempts
 * the forbidden operation, and assert the error code is
 * ERR_PERMISSION_DENIED.
 */

import { spawn } from 'child_process'
import { resolve } from 'path'
import { describe, it, expect } from 'vitest'

const ENFORCER_PATH = resolve(__dirname, '../../src/main/services/sandbox-enforcer.cjs')

interface ChildResult {
  code: number | null
  stdout: string
  stderr: string
}

function runChild(script: string, env: Record<string, string>): Promise<ChildResult> {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(process.execPath, ['-e', script], {
      env: {
        ...process.env,
        ...env,
        NODE_OPTIONS: `--require ${ENFORCER_PATH}`
      } as NodeJS.ProcessEnv,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('error', rejectP)
    child.on('exit', (code) => {
      resolveP({ code, stdout, stderr })
    })
  })
}

describe('sandbox-enforcer', () => {
  describe('when TASK_PERM_NETWORK=0', () => {
    it('http.request throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { require('http').request('http://example.com'); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '0',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
      expect(stdout).not.toContain('NO_THROW')
    })

    it('https.get throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { require('https').get('https://example.com'); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '0',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
    })

    it('net.connect throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { require('net').connect(80, 'example.com'); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '0',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
    })

    it('tls.connect throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { require('tls').connect(443, 'example.com'); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '0',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
    })

    it('global fetch throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { fetch('http://example.com'); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '0',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
    })

    it('child_process.spawn throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { require('child_process').spawn('echo', ['hi']); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '0',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
    })
  })

  describe('when TASK_PERM_NETWORK=1', () => {
    it('http.request does NOT throw synchronously (permission granted)', async () => {
      // Use an invalid host so the request fails fast; we only check
      // that the function itself doesn't throw synchronously.
      const script = `try { const r = require('http').request('http://127.0.0.1:1'); r.on('error', () => {}); r.end(); console.log('OK'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '1',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('OK')
    })
  })

  describe('when TASK_PERM_FILESYSTEM=0', () => {
    it('fs.readFileSync throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { require('fs').readFileSync('/etc/hostname'); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '1',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
    })

    it('fs.writeFileSync throws ERR_PERMISSION_DENIED', async () => {
      const script = `try { require('fs').writeFileSync('/tmp/should-not-exist.txt', 'x'); console.log('NO_THROW'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '1',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('THREW:ERR_PERMISSION_DENIED')
    })

    it('fs.promises.readFile rejects with ERR_PERMISSION_DENIED', async () => {
      const script = `require('fs').promises.readFile('/etc/hostname').then(() => console.log('NO_THROW')).catch(e => console.log('REJECTED:' + e.code))`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '1',
        TASK_PERM_FILESYSTEM: '0'
      })
      expect(stdout).toContain('REJECTED:ERR_PERMISSION_DENIED')
    })
  })

  describe('when TASK_PERM_BYPASS=1', () => {
    it('no patches applied — http.request does not throw synchronously', async () => {
      const script = `try { const r = require('http').request('http://127.0.0.1:1'); r.on('error', () => {}); r.end(); console.log('OK'); } catch (e) { console.log('THREW:' + e.code); }`
      const { stdout } = await runChild(script, {
        TASK_PERM_NETWORK: '0',
        TASK_PERM_FILESYSTEM: '0',
        TASK_PERM_BYPASS: '1'
      })
      expect(stdout).toContain('OK')
    })
  })
})
