import { spawn, ChildProcess, exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)
import { join } from 'path'
import { existsSync, readFileSync, statSync } from 'fs'
import { app } from 'electron'
import { createLogger } from '../utils/logger'
import { LogBuffer } from '../utils/log-buffer'
import type { LogEntry } from '../utils/log-buffer'
import type { StoreService } from './store'
import type { TaskOutput, TaskLogBatch } from '../../shared/types'

export type RendererSender = (channel: string, data: unknown) => void

interface TaskServiceOptions {
  rendererSender?: RendererSender
}

interface TaskProgress {
  percent: number
  message: string
}

interface RunningTask {
  process: ChildProcess | null
  status: 'running' | 'paused'
  progress: TaskProgress
  logBuffer: LogBuffer
  isSoftPaused: boolean
  startedAt: number
  stdout: string
  stderr: string
}

const MAX_COMPLETED_OUTPUTS = 100

export class TaskService {
  private runningTasks = new Map<string, RunningTask>()
  private completedOutputs = new Map<string, TaskOutput>()
  private rendererSender: RendererSender | undefined
  private scriptsDir: string

  constructor(
    private store: StoreService,
    options?: TaskServiceOptions
  ) {
    this.rendererSender = options?.rendererSender
    this.scriptsDir = join(app.getPath('userData'), 'scripts')
  }

  private async installDependencies(cwd: string, running: RunningTask): Promise<void> {
    const pkgPath = join(cwd, 'package.json')
    if (!existsSync(pkgPath)) return

    const nmPath = join(cwd, 'node_modules')
    const nmExists = existsSync(nmPath)

    if (nmExists) {
      const pkgStat = statSync(pkgPath)
      const nmStat = statSync(nmPath)

      // If node_modules is newer than package.json AND all declared
      // dependencies actually exist on disk, skip install.
      if (pkgStat.mtimeMs < nmStat.mtimeMs) {
        if (this.areAllDepsInstalled(pkgPath, nmPath)) return
        running.logBuffer.push(
          'warn',
          'node_modules 不完整（部分依赖缺失），将重新安装…'
        )
      } else {
        running.logBuffer.push('info', 'package.json 已更新，重新安装依赖...')
      }
    } else {
      running.logBuffer.push('info', '检测到 package.json，正在安装依赖...')
    }

    try {
      await execAsync('npm install --omit=dev --no-audit --no-fund', {
        cwd,
        timeout: 180000,
      })
      running.logBuffer.push('info', '依赖安装完成')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`依赖安装失败: ${msg}`)
    }
  }

  /**
   * Verify that every dependency declared in package.json's "dependencies"
   * has a corresponding directory inside node_modules.
   * Returns false if any declared package is missing, true otherwise.
   */
  private areAllDepsInstalled(pkgPath: string, nmPath: string): boolean {
    try {
      const raw = readFileSync(pkgPath, 'utf-8')
      const pkg = JSON.parse(raw) as Record<string, unknown>
      const deps = pkg.dependencies as Record<string, string> | undefined
      if (!deps || Object.keys(deps).length === 0) return true

      for (const name of Object.keys(deps)) {
        // Scoped packages like "@scope/name" need a directory at node_modules/@scope/name
        const depDir = join(nmPath, name)
        if (!existsSync(depDir)) return false
      }
      return true
    } catch {
      // If we can't read/parse package.json, assume deps are missing (safer)
      return false
    }
  }

  async startTask(id: string): Promise<void> {
    const task = this.store.taskRepo.getTask(id)
    if (!task) throw new Error('Task not found')
    if (this.runningTasks.has(id)) throw new Error('Task is already running')
    if (task.status === 'running') throw new Error('Task is already running')

    this.store.taskRepo.updateTask(id, { status: 'running', startedAt: new Date().toISOString() })

    const logBuffer = new LogBuffer((lines: LogEntry[]) => {
      const batch: TaskLogBatch = { taskId: id, logs: lines }
      this.sendToRenderer('task:log', batch)
      for (const line of lines) {
        this.store.taskRepo.addTaskLog(id, line.level, line.message)
      }
    })

    const running: RunningTask = {
      process: null,
      status: 'running',
      progress: { percent: 0, message: 'Starting...' },
      logBuffer,
      isSoftPaused: false,
      startedAt: Date.now(),
      stdout: '',
      stderr: '',
    }

    this.runningTasks.set(id, running)

    try {
      const scriptPath = task.scriptFolder
      if (!existsSync(scriptPath)) {
        const localPath = join(this.scriptsDir, scriptPath)
        if (!existsSync(localPath)) {
          throw new Error(`Script not found: ${scriptPath}. The script may have been removed.`)
        }
      }

      const resolvedPath = existsSync(scriptPath) ? scriptPath : join(this.scriptsDir, scriptPath)
      const isDirectory = statSync(resolvedPath).isDirectory()
      let entryPoint = resolvedPath
      let cwd = resolvedPath

      if (isDirectory) {
        cwd = resolvedPath
        const metaPath = join(resolvedPath, 'meta.json')
        if (existsSync(metaPath)) {
          const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
          entryPoint = meta.entryPoint
            ? join(resolvedPath, meta.entryPoint)
            : join(resolvedPath, 'index.js')
        } else {
          entryPoint = join(resolvedPath, 'index.js')
        }
      }

      if (!existsSync(entryPoint)) {
        throw new Error(`Entry point not found: ${entryPoint}. The script may be corrupted or incompletely installed.`)
      }

      await this.installDependencies(cwd, running)

      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(task.config)) {
        if (value !== undefined && value !== null) {
          env[`TASK_${key.toUpperCase()}`] = String(value)
        }
      }
      env['PATH'] = process.env.PATH ?? ''
      env['HOME'] = process.env.HOME ?? ''
      env['USERPROFILE'] = process.env.USERPROFILE ?? ''
      env['APPDATA'] = process.env.APPDATA ?? ''
      env['TEMP'] = process.env.TEMP ?? ''
      env['TMP'] = process.env.TMP ?? ''
      env['NODE_PATH'] = join(cwd, 'node_modules')
      env['TASK_ID'] = id
      env['TASK_CONFIG'] = JSON.stringify(task.config)

      let command = entryPoint
      const args: string[] = []

      const isNodeFile =
        entryPoint.endsWith('.js') ||
        entryPoint.endsWith('.mjs') ||
        entryPoint.endsWith('.cjs')

      if (isNodeFile) {
        command = 'node'
        args.push(entryPoint)
      } else if (entryPoint.endsWith('.ts')) {
        command = 'npx'
        args.push('tsx', entryPoint)
      }

      if (task.config.args && Array.isArray(task.config.args)) {
        args.push(...(task.config.args as string[]))
      } else if (task.config._command) {
        command = String(task.config._command)
      }

      const proc = spawn(command, args, {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      running.process = proc

      proc.stdout?.on('data', (data: Buffer) => {
        if (running.isSoftPaused) return
        const text = data.toString()
        running.stdout += text
        for (const line of text.split('\n')) {
          if (line.trim()) logBuffer.push('info', line)
        }
      })

      proc.stderr?.on('data', (data: Buffer) => {
        if (running.isSoftPaused) return
        const text = data.toString()
        running.stderr += text
        for (const line of text.split('\n')) {
          if (line.trim()) logBuffer.push('error', line)
        }
      })

      proc.on('exit', (code) => {
        logBuffer.destroy()
        const status = code === 0 ? 'complete' : 'error'
        const output: TaskOutput = {
          taskId: id,
          exitCode: code,
          stdout: running.stdout.slice(-10000),
          stderr: running.stderr.slice(-10000),
          durationMs: Date.now() - running.startedAt,
        }
        this.store.taskRepo.updateTask(id, { status, endedAt: new Date().toISOString() })
        this.store.taskRepo.addTaskLog(id, 'info', `Process exited with code ${code ?? 'null'}`)
        this.sendToRenderer('task:statusChanged', { id, status })
        this.sendToRenderer('task:output', output)
        this.completedOutputs.set(id, output)
        this.trimCompletedOutputs()
        this.runningTasks.delete(id)
      })

      this.store.taskRepo.addTaskLog(id, 'info', 'Task started')
      this.sendToRenderer('task:statusChanged', { id, status: 'running' })
    } catch (err) {
      logBuffer.destroy()
      this.store.taskRepo.updateTask(id, { status: 'error', endedAt: new Date().toISOString() })
      this.store.taskRepo.addTaskLog(id, 'error', `Failed to start: ${String(err)}`)
      this.sendToRenderer('task:statusChanged', { id, status: 'error' })
      this.runningTasks.delete(id)
    }
  }

  async stopTask(id: string): Promise<void> {
    const running = this.runningTasks.get(id)
    if (!running) throw new Error('Task is not running')

    if (running.process?.pid) {
      try {
        running.process.kill('SIGTERM')
        setTimeout(() => {
          if (running.process?.pid) {
            running.process.kill('SIGKILL')
          }
        }, 5000)
      } catch (err) {
        createLogger('task').warn('Failed to kill process', { taskId: id, error: String(err) })
      }
    }

    running.logBuffer.destroy()
    this.runningTasks.delete(id)
    this.store.taskRepo.updateTask(id, { status: 'stopped', endedAt: new Date().toISOString() })
    this.store.taskRepo.addTaskLog(id, 'info', 'Task stopped')
    this.sendToRenderer('task:statusChanged', { id, status: 'stopped' })
  }

  async pauseTask(id: string): Promise<void> {
    const running = this.runningTasks.get(id)
    if (!running) throw new Error('Task is not running')
    if (running.status === 'paused') throw new Error('Task is already paused')

    if (process.platform !== 'win32' && running.process?.pid) {
      try {
        running.process.kill('SIGSTOP')
      } catch {
        createLogger('task').warn('SIGSTOP failed, falling back to soft pause', { taskId: id })
        running.isSoftPaused = true
        running.process?.stdout?.pause()
        running.process?.stderr?.pause()
      }
    } else {
      running.isSoftPaused = true
      running.process?.stdout?.pause()
      running.process?.stderr?.pause()
    }

    running.status = 'paused'
    this.store.taskRepo.updateTask(id, { status: 'paused' })
    this.store.taskRepo.addTaskLog(id, 'info', 'Task paused')
    this.sendToRenderer('task:statusChanged', { id, status: 'paused' })
  }

  async resumeTask(id: string): Promise<void> {
    const running = this.runningTasks.get(id)
    if (!running) throw new Error('Task is not running')
    if (running.status !== 'paused') throw new Error('Task is not paused')

    if (running.isSoftPaused) {
      running.isSoftPaused = false
      running.process?.stdout?.resume()
      running.process?.stderr?.resume()
    } else if (running.process?.pid) {
      try {
        running.process.kill('SIGCONT')
      } catch {
        createLogger('task').warn('SIGCONT failed', { taskId: id })
      }
    }

    running.status = 'running'
    this.store.taskRepo.updateTask(id, { status: 'running' })
    this.store.taskRepo.addTaskLog(id, 'info', 'Task resumed')
    this.sendToRenderer('task:statusChanged', { id, status: 'running' })
  }

  getTaskProgress(id: string): TaskProgress | null {
    return this.runningTasks.get(id)?.progress ?? null
  }

  getTaskOutput(id: string): TaskOutput | null {
    const completed = this.completedOutputs.get(id)
    if (completed) return completed
    const running = this.runningTasks.get(id)
    if (!running) return null
    return {
      taskId: id,
      exitCode: null,
      stdout: running.stdout.slice(-10000),
      stderr: running.stderr.slice(-10000),
      durationMs: Date.now() - running.startedAt,
    }
  }

  cleanOrphanTasks(): void {
    const tasks = this.store.taskRepo.listTasks(1, 1000)
    let cleaned = 0
    for (const task of tasks.items) {
      if (task.status === 'running' || task.status === 'paused') {
        this.store.taskRepo.updateTask(task.id, { status: 'stopped' })
        cleaned++
        continue
      }
      if (task.status === 'idle' && task.scriptFolder) {
        const resolvedPath = existsSync(task.scriptFolder)
          ? task.scriptFolder
          : join(this.scriptsDir, task.scriptFolder)
        if (!existsSync(resolvedPath)) {
          this.store.taskRepo.updateTask(task.id, { status: 'error' })
          cleaned++
          continue
        }
        const isDir = existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()
        if (isDir) {
          const metaPath = join(resolvedPath, 'meta.json')
          let entryFile = join(resolvedPath, 'index.js')
          if (existsSync(metaPath)) {
            try {
              const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
              if (meta.entryPoint) entryFile = join(resolvedPath, meta.entryPoint)
            } catch { /* ignore */ }
          }
          if (!existsSync(entryFile)) {
            this.store.taskRepo.updateTask(task.id, { status: 'error' })
            cleaned++
          }
        } else if (!existsSync(resolvedPath)) {
          this.store.taskRepo.updateTask(task.id, { status: 'error' })
          cleaned++
        }
      }
    }
    this.runningTasks.clear()
    if (cleaned > 0) {
      createLogger('task').info(`Cleaned ${cleaned} orphan/broken tasks`)
    }
  }

  cleanup(): void {
    for (const [id, running] of this.runningTasks) {
      try {
        if (running.process?.pid) {
          running.process.kill('SIGTERM')
        }
        running.logBuffer.destroy()
      } catch (err) {
        createLogger('task').warn('Failed to kill running process on shutdown', {
          taskId: id,
          error: String(err)
        })
      }
    }
    this.runningTasks.clear()
    this.completedOutputs.clear()
  }

  private trimCompletedOutputs(): void {
    if (this.completedOutputs.size <= MAX_COMPLETED_OUTPUTS) return
    const entries = [...this.completedOutputs.entries()]
    const toDelete = entries.slice(0, entries.length - MAX_COMPLETED_OUTPUTS)
    for (const [key] of toDelete) {
      this.completedOutputs.delete(key)
    }
  }

  private sendToRenderer(channel: string, data: unknown): void {
    this.rendererSender?.(channel, data)
  }
}