// @flint/server — Graceful Shutdown
// Handle process termination gracefully

// ─── Types ──────────────────────────────────────────────────────

export interface ShutdownConfig {
  /** Timeout before force exit (default: 30000) */
  timeout?: number
  /** Callback before shutdown */
  onShutdown?: () => Promise<void> | void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Signals to handle (default: ['SIGTERM', 'SIGINT']) */
  signals?: string[]
}

// ─── Graceful Shutdown Manager ───────────────────────────────────

export class GracefulShutdown {
  private config: ShutdownConfig
  private isShuttingDown = false
  private cleanupFns: Array<() => Promise<void>> = []

  constructor(config: ShutdownConfig = {}) {
    this.config = {
      timeout: 30000,
      signals: ['SIGTERM', 'SIGINT'],
      ...config,
    }
  }

  /** Register cleanup function */
  onShutdown(fn: () => Promise<void> | void): void {
    this.cleanupFns.push(fn as () => Promise<void>)
  }

  /** Start listening for shutdown signals */
  start(server?: any): void {
    const signals = this.config.signals || ['SIGTERM', 'SIGINT']

    for (const signal of signals) {
      process.on(signal, () => this.handleSignal(signal, server))
    }

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('[Flint] Uncaught Exception:', error)
      this.shutdown(1)
    })

    process.on('unhandledRejection', (reason) => {
      console.error('[Flint] Unhandled Rejection:', reason)
      this.shutdown(1)
    })
  }

  /** Handle shutdown signal */
  private async handleSignal(signal: string, server?: any): Promise<void> {
    if (this.isShuttingDown) return
    this.isShuttingDown = true

    console.log(`[Flint] Received ${signal}. Starting graceful shutdown...`)

    // Start force exit timeout
    const forceExitTimeout = setTimeout(() => {
      console.error('[Flint] Forced exit due to timeout')
      process.exit(1)
    }, this.config.timeout)

    // Don't keep process alive for timeout
    if (forceExitTimeout.unref) {
      forceExitTimeout.unref()
    }

    try {
      // Close HTTP server
      if (server && typeof server.close === 'function') {
        console.log('[Flint] Closing HTTP server...')
        await new Promise<void>((resolve, reject) => {
          server.close((err: any) => {
            if (err) reject(err)
            else resolve()
          })
        })
        console.log('[Flint] HTTP server closed')
      }

      // Run custom shutdown handlers
      console.log('[Flint] Running cleanup handlers...')
      for (const fn of this.cleanupFns) {
        try {
          await fn()
        } catch (error) {
          console.error('[Flint] Cleanup error:', error)
        }
      }

      // Call config onShutdown
      if (this.config.onShutdown) {
        await this.config.onShutdown()
      }

      console.log('[Flint] Graceful shutdown complete')
      clearTimeout(forceExitTimeout)
      process.exit(0)
    } catch (error) {
      console.error('[Flint] Shutdown error:', error)
      if (this.config.onError) {
        this.config.onError(error as Error)
      }
      clearTimeout(forceExitTimeout)
      process.exit(1)
    }
  }

  /** Force shutdown */
  shutdown(exitCode: number = 0): void {
    process.exit(exitCode)
  }
}

// ─── Factory Function ───────────────────────────────────────────

export function createShutdownManager(config?: ShutdownConfig): GracefulShutdown {
  return new GracefulShutdown(config)
}

// ─── Convenience Function ───────────────────────────────────────

export function gracefulShutdown(
  server: any,
  config?: ShutdownConfig
): GracefulShutdown {
  const manager = new GracefulShutdown(config)
  manager.start(server)
  return manager
}
