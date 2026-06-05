import type { TaskLogLevel } from '../../../../shared/types'

/**
 * Canonical level color map. Aligned with Tasks.tsx so the same level
 * looks the same everywhere in the app. Pre-existing DebugPage had a
 * divergent palette (info was `text-text-secondary` / gray instead of
 * `text-success` / green) — that was a one-off oversight.
 *
 * Exported from a separate file so LogViewer.tsx (the only React component
 * in this module) satisfies the `react-refresh/only-export-components`
 * ESLint rule (component files must export only components).
 */
export const LOG_LEVEL_STYLES: Record<TaskLogLevel, string> = {
  info: 'text-success',
  warn: 'text-warning',
  error: 'text-danger',
  debug: 'text-text-muted'
}

export const LOG_LEVELS: TaskLogLevel[] = ['info', 'warn', 'error', 'debug']

export const LEVEL_LABEL_KEY: Record<TaskLogLevel, string> = {
  info: 'tasks.logFilter.info',
  warn: 'tasks.logFilter.warn',
  error: 'tasks.logFilter.error',
  debug: 'tasks.logFilter.debug'
}
