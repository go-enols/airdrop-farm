const TRANSPORT_KEY = 'app-transport'
const HEALTH_TIMEOUT = 3000
const HTTP_PORT_RANGE = { from: 34116, to: 34126 }
let activeTransport = null
let discoveredPort = null
function getElectronHttpPort() {
  try {
    const ep = window.electronAPI
    if (ep?.httpPort && typeof ep.httpPort === 'number') return ep.httpPort
  } catch {
    // Ignore access errors
  }
  return null
}
export function getActiveTransport() {
  return activeTransport
}
export function setActiveTransport(t) {
  activeTransport = t
  try {
    localStorage.setItem(TRANSPORT_KEY, t)
  } catch {
    // Ignore storage errors
  }
}
function getForcedTransport() {
  try {
    const params = new URLSearchParams(window.location.search)
    const forced = params.get('transport')
    if (forced === 'ipc' || forced === 'http') return forced
    const stored = localStorage.getItem(TRANSPORT_KEY)
    if (stored === 'ipc' || stored === 'http') return stored
  } catch {
    // Ignore access errors
  }
  return null
}
async function callIPC(channel, args) {
  const electronAPI = window.electronAPI
  if (!electronAPI?.invoke) {
    throw new Error('IPC: electronAPI not available')
  }
  const result = await electronAPI.invoke(channel, ...args)
  if (result.error) {
    throw Object.assign(new Error(result.error.message), {
      code: result.error.code,
      category: result.error.category
    })
  }
  return result.data
}
async function tryHttpPort(port, channel, args) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 1500)
  try {
    const url = `http://127.0.0.1:${port}/api/call`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, args }),
      signal: controller.signal
    })
    if (!response.ok) {
      const errBody = await response.json().catch(() => null)
      const errMsg = errBody?.error?.message || `HTTP ${response.status}`
      throw Object.assign(new Error(errMsg), {
        code: errBody?.error?.code,
        category: errBody?.error?.category
      })
    }
    const result = await response.json()
    if (result.error) {
      throw Object.assign(new Error(result.error.message), {
        code: result.error.code,
        category: result.error.category
      })
    }
    return result.data
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
async function callHTTP(channel, args) {
  if (discoveredPort) {
    const result = await tryHttpPort(discoveredPort, channel, args)
    if (result !== null) return result
    discoveredPort = null
  }
  const electronPort = getElectronHttpPort()
  if (electronPort) {
    const result = await tryHttpPort(electronPort, channel, args)
    if (result !== null) {
      discoveredPort = electronPort
      return result
    }
  }
  for (let port = HTTP_PORT_RANGE.from; port <= HTTP_PORT_RANGE.to; port++) {
    const result = await tryHttpPort(port, channel, args)
    if (result !== null) {
      discoveredPort = port
      return result
    }
  }
  throw new Error(
    `HTTP API unreachable (tried ports ${HTTP_PORT_RANGE.from}-${HTTP_PORT_RANGE.to})`
  )
}
export async function call(channel, args = []) {
  const forced = getForcedTransport()
  if (forced) {
    activeTransport = forced
    return forced === 'http' ? callHTTP(channel, args) : callIPC(channel, args)
  }
  const transport = activeTransport || 'ipc'
  if (transport === 'http') {
    try {
      return await callHTTP(channel, args)
    } catch {
      activeTransport = null
    }
  }
  try {
    return await callIPC(channel, args)
  } catch (ipcErr) {
    try {
      const result = await callHTTP(channel, args)
      activeTransport = 'http'
      console.warn(`[transport] IPC failed (${ipcErr.message}), switched to HTTP: ${channel}`)
      return result
    } catch (httpErr) {
      console.error(
        `[transport] Both failed for "${channel}": IPC=${ipcErr.message}, HTTP=${httpErr.message}`
      )
      throw httpErr
    }
  }
}
export async function checkHTTPHealth() {
  const electronPort = getElectronHttpPort()
  const ports = electronPort
    ? [electronPort]
    : Array.from(
        { length: HTTP_PORT_RANGE.to - HTTP_PORT_RANGE.from + 1 },
        (_, i) => HTTP_PORT_RANGE.from + i
      )
  for (const port of ports) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT)
      const resp = await fetch(`http://127.0.0.1:${port}/api/health`, {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timer)
      if (resp.ok) return true
    } catch {
      continue
    }
  }
  return false
}
export function checkIPCHealth() {
  return !!window.electronAPI?.invoke
}
