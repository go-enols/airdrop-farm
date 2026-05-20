import { createLogger } from '../utils/logger'
export class TaskService {
  store
  runningTasks = new Map()
  rendererSender
  constructor(store, options) {
    this.store = store
    this.rendererSender = options?.rendererSender
  }
  async startTask(id) {
    const task = this.store.taskRepo.getTask(id)
    if (!task) throw new Error('Task not found')
    if (this.runningTasks.has(id)) throw new Error('Task is already running')
    if (task.status === 'running') throw new Error('Task is already running')
    this.store.taskRepo.updateTask(id, { status: 'running', startedAt: new Date().toISOString() })
    this.runningTasks.set(id, {
      process: null,
      status: 'running',
      progress: { percent: 0, message: 'Starting...' }
    })
    this.store.taskRepo.addTaskLog(id, 'info', 'Task started')
    this.sendToRenderer('task:statusChanged', { id, status: 'running' })
  }
  async stopTask(id) {
    const running = this.runningTasks.get(id)
    if (!running) throw new Error('Task is not running')
    if (running.process && running.process.pid) {
      running.process.kill('SIGTERM')
    }
    this.runningTasks.delete(id)
    this.store.taskRepo.updateTask(id, { status: 'stopped', endedAt: new Date().toISOString() })
    this.store.taskRepo.addTaskLog(id, 'info', 'Task stopped')
    this.sendToRenderer('task:statusChanged', { id, status: 'stopped' })
  }
  async pauseTask(id) {
    const running = this.runningTasks.get(id)
    if (!running) throw new Error('Task is not running')
    if (running.status === 'paused') throw new Error('Task is already paused')
    if (running.process && running.process.pid) {
      running.process.kill('SIGSTOP')
    }
    running.status = 'paused'
    this.store.taskRepo.updateTask(id, { status: 'paused' })
    this.store.taskRepo.addTaskLog(id, 'info', 'Task paused')
    this.sendToRenderer('task:statusChanged', { id, status: 'paused' })
  }
  async resumeTask(id) {
    const running = this.runningTasks.get(id)
    if (!running) throw new Error('Task is not running')
    if (running.status !== 'paused') throw new Error('Task is not paused')
    if (running.process && running.process.pid) {
      running.process.kill('SIGCONT')
    }
    running.status = 'running'
    this.store.taskRepo.updateTask(id, { status: 'running' })
    this.store.taskRepo.addTaskLog(id, 'info', 'Task resumed')
    this.sendToRenderer('task:statusChanged', { id, status: 'running' })
  }
  getTaskProgress(id) {
    return this.runningTasks.get(id)?.progress ?? null
  }
  cleanOrphanTasks() {
    const tasks = this.store.taskRepo.listTasks(1, 1000)
    let cleaned = 0
    for (const task of tasks.items) {
      if (task.status === 'running' || task.status === 'paused') {
        this.store.taskRepo.updateTask(task.id, { status: 'stopped' })
        cleaned++
      }
    }
    this.runningTasks.clear()
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} orphan tasks`)
    }
  }
  cleanup() {
    const logger = createLogger('task')
    for (const [id, running] of this.runningTasks) {
      try {
        if (running.process?.pid) {
          running.process.kill('SIGTERM')
        }
      } catch (err) {
        logger.warn('Failed to kill running process on shutdown', {
          taskId: id,
          error: String(err)
        })
      }
    }
    this.runningTasks.clear()
  }
  sendToRenderer(channel, data) {
    this.rendererSender?.(channel, data)
  }
}
