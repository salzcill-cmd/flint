// @flint/server — Background Job Queue
// Process tasks in the background

// ─── Types ──────────────────────────────────────────────────────

export interface JobConfig {
  /** Maximum concurrent jobs (default: 5) */
  concurrency?: number
  /** Job timeout in ms (default: 300000 = 5 minutes) */
  timeout?: number
  /** Retry attempts (default: 3) */
  retries?: number
  /** Retry delay in ms (default: 1000) */
  retryDelay?: number
  /** Enable job logging (default: true) */
  logging?: boolean
}

export interface Job<T = any> {
  /** Job ID */
  id: string
  /** Job name */
  name: string
  /** Job data */
  data: T
  /** Job status */
  status: 'pending' | 'active' | 'completed' | 'failed' | 'retrying'
  /** Retry count */
  retries: number
  /** Error message if failed */
  error?: string
  /** Result if completed */
  result?: any
  /** Created timestamp */
  createdAt: number
  /** Started timestamp */
  startedAt?: number
  /** Completed timestamp */
  completedAt?: number
}

export type JobHandler<T = any> = (data: T, job: Job<T>) => Promise<any>

// ─── Job Queue ──────────────────────────────────────────────────

export class JobQueue {
  private config: Required<JobConfig>
  private handlers: Map<string, JobHandler> = new Map()
  private queue: Job[] = []
  private activeJobs: Map<string, Job> = new Map()
  private completedJobs: Map<string, Job> = new Map()
  private isProcessing = false
  private processInterval: NodeJS.Timeout | null = null

  constructor(config: JobConfig = {}) {
    this.config = {
      concurrency: 5,
      timeout: 300000,
      retries: 3,
      retryDelay: 1000,
      logging: true,
      ...config,
    }
  }

  // ─── Job Registration ────────────────────────────────────────

  /** Register job handler */
  on<T = any>(name: string, handler: JobHandler<T>): void {
    this.handlers.set(name, handler as JobHandler)
  }

  // ─── Job Creation ────────────────────────────────────────────

  /** Add job to queue */
  async add<T = any>(name: string, data: T): Promise<Job<T>> {
    if (!this.handlers.has(name)) {
      throw new Error(`No handler registered for job: ${name}`)
    }

    const job: Job<T> = {
      id: this.generateId(),
      name,
      data,
      status: 'pending',
      retries: 0,
      createdAt: Date.now(),
    }

    this.queue.push(job)
    this.log(`Job added: ${name} (${job.id})`)

    // Start processing if not already
    if (!this.isProcessing) {
      this.startProcessing()
    }

    return job
  }

  /** Add delayed job */
  async addDelayed<T = any>(name: string, data: T, delayMs: number): Promise<Job<T>> {
    const job = await this.add(name, data)
    
    setTimeout(() => {
      const index = this.queue.findIndex(j => j.id === job.id)
      if (index !== -1) {
        this.queue[index].status = 'pending'
      }
    }, delayMs)

    return job
  }

  /** Add recurring job */
  async addRecurring<T = any>(name: string, data: T, intervalMs: number): Promise<void> {
    const handler = async () => {
      await this.add(name, data)
    }

    // Run immediately
    await handler()

    // Then run on interval
    setInterval(handler, intervalMs)
  }

  // ─── Job Processing ──────────────────────────────────────────

  private startProcessing(): void {
    if (this.isProcessing) return
    this.isProcessing = true

    this.processInterval = setInterval(() => {
      this.processJobs()
    }, 100) // Check every 100ms
  }

  private async processJobs(): Promise<void> {
    // Check if we can process more jobs
    if (this.activeJobs.size >= this.config.concurrency) {
      return
    }

    // Get next pending job
    const job = this.queue.find(j => j.status === 'pending')
    if (!job) return

    // Mark as active
    job.status = 'active'
    job.startedAt = Date.now()
    this.activeJobs.set(job.id, job)

    // Process job
    try {
      const handler = this.handlers.get(job.name)
      if (!handler) {
        throw new Error(`No handler for job: ${job.name}`)
      }

      const result = await Promise.race([
        handler(job.data, job),
        this.createTimeout(),
      ])

      // Mark as completed
      job.status = 'completed'
      job.result = result
      job.completedAt = Date.now()
      this.completedJobs.set(job.id, job)
      this.activeJobs.delete(job.id)

      this.log(`Job completed: ${job.name} (${job.id})`)
    } catch (error) {
      // Handle retry
      if (job.retries < this.config.retries) {
        job.status = 'retrying'
        job.retries++
        job.error = error instanceof Error ? error.message : String(error)
        this.activeJobs.delete(job.id)

        this.log(`Job retrying: ${job.name} (${job.id}) attempt ${job.retries}/${this.config.retries}`)

        // Delay before retry
        setTimeout(() => {
          job.status = 'pending'
        }, this.config.retryDelay * job.retries)
      } else {
        // Mark as failed
        job.status = 'failed'
        job.error = error instanceof Error ? error.message : String(error)
        job.completedAt = Date.now()
        this.completedJobs.set(job.id, job)
        this.activeJobs.delete(job.id)

        this.log(`Job failed: ${job.name} (${job.id}) - ${job.error}`)
      }
    }
  }

  private createTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timed out after ${this.config.timeout}ms`))
      }, this.config.timeout)
    })
  }

  // ─── Job Queries ─────────────────────────────────────────────

  /** Get job by ID */
  getJob(id: string): Job | undefined {
    return this.queue.find(j => j.id === id) || this.completedJobs.get(id)
  }

  /** Get all jobs */
  getJobs(): Job[] {
    return [...this.queue, ...Array.from(this.completedJobs.values())]
  }

  /** Get pending jobs */
  getPendingJobs(): Job[] {
    return this.queue.filter(j => j.status === 'pending')
  }

  /** Get active jobs */
  getActiveJobs(): Job[] {
    return Array.from(this.activeJobs.values())
  }

  /** Get completed jobs */
  getCompletedJobs(): Job[] {
    return Array.from(this.completedJobs.values())
  }

  /** Get failed jobs */
  getFailedJobs(): Job[] {
    return this.getCompletedJobs().filter(j => j.status === 'failed')
  }

  // ─── Queue Management ────────────────────────────────────────

  /** Clear completed jobs */
  clearCompleted(): void {
    this.completedJobs.clear()
  }

  /** Clear all jobs */
  clearAll(): void {
    this.queue = []
    this.activeJobs.clear()
    this.completedJobs.clear()
  }

  /** Pause processing */
  pause(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }
    this.isProcessing = false
  }

  /** Resume processing */
  resume(): void {
    this.startProcessing()
  }

  /** Get queue stats */
  getStats(): {
    pending: number
    active: number
    completed: number
    failed: number
  } {
    return {
      pending: this.getPendingJobs().length,
      active: this.getActiveJobs().length,
      completed: this.getCompletedJobs().filter(j => j.status === 'completed').length,
      failed: this.getFailedJobs().length,
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  private log(message: string): void {
    if (this.config.logging) {
      console.log(`[Flint Queue] ${message}`)
    }
  }
}

// ─── Factory Function ───────────────────────────────────────────

export function createJobQueue(config?: JobConfig): JobQueue {
  return new JobQueue(config)
}

// ─── Built-in Jobs ──────────────────────────────────────────────

/** Email job */
export async function sendEmailJob(data: {
  to: string
  subject: string
  body: string
}): Promise<void> {
  // Implement email sending
  console.log(`[Flint Queue] Sending email to ${data.to}`)
}

/** SMS job */
export async function sendSmsJob(data: {
  to: string
  message: string
}): Promise<void> {
  // Implement SMS sending
  console.log(`[Flint Queue] Sending SMS to ${data.to}`)
}

/** Webhook job */
export async function webhookJob(data: {
  url: string
  method?: string
  body?: any
}): Promise<void> {
  // Implement webhook call
  console.log(`[Flint Queue] Calling webhook: ${data.url}`)
}
