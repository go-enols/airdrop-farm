import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'fs'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { createHash } from 'crypto'
import { createLogger } from '../utils/logger'
import type { RemoteScript, InstalledScript } from '../../shared/types'
import type { StoreService } from './store'

const logger = createLogger('script-fetcher')

export class ScriptFetcher {
  private scriptsDir: string
  private store: StoreService
  private defaultServerUrl = 'http://127.0.0.1:3400'

  constructor(store: StoreService) {
    this.store = store
    this.scriptsDir = join(app.getPath('userData'), 'scripts')
    if (!existsSync(this.scriptsDir)) {
      mkdirSync(this.scriptsDir, { recursive: true })
    }
  }

  getServerUrl(): string {
    const url = this.store.getSetting('marketplace_server_url')
    return url || this.defaultServerUrl
  }

  async fetchScriptList(): Promise<RemoteScript[]> {
    const serverUrl = this.getServerUrl()
    const url = `${serverUrl}/api/scripts`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch script list: ${response.status} ${response.statusText}`)
    }
    const json = await response.json() as Record<string, unknown>
    // Server returns { data: { items, total } }; unwrap if data envelope present
    const data = json.data as Record<string, unknown> | undefined
    return (data?.items ?? json) as RemoteScript[]
  }

  async downloadScript(scriptId: string): Promise<InstalledScript> {
    const scripts = await this.fetchScriptList()
    const script = scripts.find((s) => s.id === scriptId)
    if (!script) throw new Error(`Script not found: ${scriptId}`)

    const scriptDir = join(this.scriptsDir, scriptId)
    if (!existsSync(scriptDir)) {
      mkdirSync(scriptDir, { recursive: true })
    }

    const downloadUrl = script.downloadUrl.startsWith('http')
      ? script.downloadUrl
      : `${this.getServerUrl()}${script.downloadUrl}`

    const tmpPath = join(scriptDir, 'download.tmp')
    await this.downloadFile(downloadUrl, tmpPath)

    const checksum = this.calculateChecksum(tmpPath)
    if (checksum !== script.checksum) {
      rmSync(tmpPath, { force: true })
      throw new Error(`Checksum mismatch for ${scriptId}: expected ${script.checksum}, got ${checksum}`)
    }

    const ext = this.getArchiveExtension(downloadUrl)
    await this.extractArchive(tmpPath, scriptDir, ext)
    rmSync(tmpPath, { force: true })

    const installed: InstalledScript = {
      id: script.id,
      name: script.name,
      version: script.version,
      description: script.description,
      schema: script.schema,
      installPath: scriptDir,
      checksum: script.checksum,
      remoteUrl: this.getServerUrl(),
      downloadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    writeFileSync(join(scriptDir, 'meta.json'), JSON.stringify(installed, null, 2))

    logger.info('Script downloaded', { scriptId, version: script.version })
    return installed
  }

  async checkUpdates(): Promise<RemoteScript[]> {
    const installed = this.getInstalledScripts()
    const remote = await this.fetchScriptList()

    return remote.filter((r) => {
      const local = installed.find((i) => i.id === r.id)
      return !local || local.version !== r.version
    })
  }

  getInstalledScripts(): InstalledScript[] {
    if (!existsSync(this.scriptsDir)) return []

    const dirs = readdirSync(this.scriptsDir, { withFileTypes: true }).filter(
      (d) => d.isDirectory()
    )

    const scripts: InstalledScript[] = []
    for (const dir of dirs) {
      const metaPath = join(this.scriptsDir, dir.name, 'meta.json')
      if (!existsSync(metaPath)) continue
      try {
        const raw = readFileSync(metaPath, 'utf-8')
        scripts.push(JSON.parse(raw) as InstalledScript)
      } catch {
        logger.warn('Failed to read script meta', { path: metaPath })
      }
    }
    return scripts
  }

  removeScript(scriptId: string): void {
    const scriptDir = join(this.scriptsDir, scriptId)
    if (existsSync(scriptDir)) {
      rmSync(scriptDir, { recursive: true, force: true })
      logger.info('Script removed', { scriptId })
    }
  }

  private async downloadFile(url: string, destPath: string, retries = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        if (!response.body) {
          throw new Error('No response body')
        }

        const fileStream = createWriteStream(destPath)
        const nodeStream = await this.webStreamToNode(response.body)

        await pipeline(nodeStream as any, fileStream)
        return
      } catch (err) {
        if (attempt === retries) throw err
        logger.warn(`Download retry ${attempt}/${retries}`, { url, error: String(err) })
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)))
      }
    }
  }

  private async webStreamToNode(stream: ReadableStream<Uint8Array>): Promise<any> {
    const { Readable } = await import('stream')
    const reader = stream.getReader()
    return new Readable({
      async read() {
        const { done, value } = await reader.read()
        if (done) this.push(null)
        else this.push(Buffer.from(value))
      }
    })
  }

  private calculateChecksum(filePath: string): string {
    const content = readFileSync(filePath)
    return createHash('sha256').update(content).digest('hex')
  }

  private getArchiveExtension(url: string): string {
    if (url.endsWith('.tar.gz') || url.endsWith('.tgz')) return 'tar.gz'
    if (url.endsWith('.tar')) return 'tar'
    return 'zip'
  }

  private async extractArchive(archivePath: string, destDir: string, ext: string): Promise<void> {
    const { execSync } = await import('child_process')
    if (ext === 'tar.gz' || ext === 'tar') {
      execSync(`tar xf "${archivePath}" -C "${destDir}"`, { timeout: 60000 })
    } else {
      if (process.platform === 'win32') {
        execSync(
          `powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`,
          { timeout: 60000 }
        )
      } else {
        execSync(`unzip -o "${archivePath}" -d "${destDir}"`, { timeout: 60000 })
      }
    }
  }
}
