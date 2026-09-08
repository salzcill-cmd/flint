// @flint/server — Health Check Endpoints
// Monitor your application health

// ─── Types ──────────────────────────────────────────────────────

export interface HealthCheckConfig {
  /** Enable health check endpoints (default: true) */
  enabled?: boolean
  /** Health check path (default: '/health') */
  path?: string
  /** Readiness check path (default: '/ready') */
  readinessPath?: string
  /** Liveness check path (default: '/live') */
  livenessPath?: string
  /** Custom health check function */
  check?: () => Promise<HealthStatus> | HealthStatus
  /** Timeout for health checks (default: 5000) */
  timeout?: number
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version?: string
  checks?: Record<string, CheckResult>
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'warn'
  message?: string
  duration?: number
}

// ─── Health Check Registry ──────────────────────────────────────

const healthChecks: Map<string, () => Promise<CheckResult> | CheckResult> = new Map()

/** Register a health check */
export function registerHealthCheck(
  name: string,
  check: () => Promise<CheckResult> | CheckResult
): void {
  healthChecks.set(name, check)
}

/** Remove a health check */
export function unregisterHealthCheck(name: string): void {
  healthChecks.delete(name)
}

// ─── Health Check Middleware ─────────────────────────────────────

export function healthCheck(config: HealthCheckConfig = {}) {
  const {
    enabled = true,
    path = '/health',
    readinessPath = '/ready',
    livenessPath = '/live',
    check,
    timeout = 5000,
  } = config

  if (!enabled) {
    return async (c: any, next: () => Promise<void>) => next()
  }

  const startTime = Date.now()

  return async (c: any, next: () => Promise<void>) => {
    const url = new URL(c.req.url)
    const pathname = url.pathname

    // Health check endpoint
    if (pathname === path) {
      const status = await runHealthChecks(check, timeout)
      const statusCode = status.status === 'healthy' ? 200 : 
                         status.status === 'degraded' ? 200 : 503
      return c.json(status, statusCode)
    }

    // Readiness check endpoint
    if (pathname === readinessPath) {
      const isReady = await checkReadiness(timeout)
      return c.json({
        status: isReady ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
      }, isReady ? 200 : 503)
    }

    // Liveness check endpoint
    if (pathname === livenessPath) {
      return c.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    }

    return next()
  }
}

// ─── Health Check Runner ────────────────────────────────────────

async function runHealthChecks(
  customCheck?: () => Promise<HealthStatus> | HealthStatus,
  timeout?: number
): Promise<HealthStatus> {
  const checks: Record<string, CheckResult> = {}
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'

  // Run custom check if provided
  if (customCheck) {
    try {
      const result = await withTimeout(Promise.resolve(customCheck()), timeout || 5000)
      if (typeof result === 'object' && result.status) {
        return {
          ...result,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        }
      }
    } catch (error) {
      overallStatus = 'unhealthy'
      checks['custom'] = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Custom check failed',
      }
    }
  }

  // Run registered checks
  for (const [name, checkFn] of healthChecks.entries()) {
    try {
      const start = Date.now()
      const result = await withTimeout(Promise.resolve(checkFn()), timeout || 5000)
      const duration = Date.now() - start

      checks[name] = {
        ...result,
        duration,
      }

      if (result.status === 'fail') {
        overallStatus = 'unhealthy'
      } else if (result.status === 'warn' && overallStatus === 'healthy') {
        overallStatus = 'degraded'
      }
    } catch (error) {
      checks[name] = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Check failed',
      }
      overallStatus = 'unhealthy'
    }
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  }
}

// ─── Readiness Check ────────────────────────────────────────────

async function checkReadiness(timeout: number): Promise<boolean> {
  // Check if all health checks pass
  for (const [name, checkFn] of healthChecks.entries()) {
    try {
      const result = await withTimeout(Promise.resolve(checkFn()), timeout)
      if (result.status === 'fail') {
        return false
      }
    } catch {
      return false
    }
  }
  return true
}

// ─── Timeout Helper ─────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Health check timed out after ${timeout}ms`))
    }, timeout)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

// ─── Common Health Checks ───────────────────────────────────────

/** Database health check */
export function createDatabaseCheck(
  db: any,
  query: string = 'SELECT 1'
): () => Promise<CheckResult> {
  return async () => {
    try {
      await db.execute(query)
      return { status: 'pass', message: 'Database connection OK' }
    } catch (error) {
      return {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Database check failed',
      }
    }
  }
}

/** Memory health check */
export function createMemoryCheck(
  maxHeapMB: number = 500
): () => CheckResult {
  return () => {
    const memUsage = process.memoryUsage()
    const heapMB = memUsage.heapUsed / 1024 / 1024

    if (heapMB > maxHeapMB) {
      return {
        status: 'warn',
        message: `Memory usage high: ${heapMB.toFixed(2)}MB / ${maxHeapMB}MB`,
      }
    }

    return {
      status: 'pass',
      message: `Memory usage OK: ${heapMB.toFixed(2)}MB / ${maxHeapMB}MB`,
    }
  }
}

/** Disk health check */
export function createDiskCheck(
  minFreeSpaceMB: number = 100
): () => Promise<CheckResult> {
  return async () => {
    try {
      const { execSync } = await import('child_process')
      const output = execSync('df -m / | tail -1 | awk \'{print $4}\'').toString().trim()
      const freeSpaceMB = parseInt(output, 10)

      if (freeSpaceMB < minFreeSpaceMB) {
        return {
          status: 'warn',
          message: `Disk space low: ${freeSpaceMB}MB free (min: ${minFreeSpaceMB}MB)`,
        }
      }

      return {
        status: 'pass',
        message: `Disk space OK: ${freeSpaceMB}MB free`,
      }
    } catch {
      return {
        status: 'warn',
        message: 'Could not check disk space',
      }
    }
  }
}
