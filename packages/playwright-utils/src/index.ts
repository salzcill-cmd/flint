// @flint/playwright-utils — E2E testing utilities for Flint applications

import { test as base, expect, type Page, type Locator } from '@playwright/test'

// ─── Types ──────────────────────────────────────────────────────

export interface FlintTestOptions {
  /** Base URL for the app */
  baseURL?: string
  /** Enable signal debugging */
  debugSignals?: boolean
  /** Wait for hydration */
  waitForHydration?: boolean
}

export interface SignalSnapshot {
  name: string
  value: any
  type: 'state' | 'computed' | 'effect'
}

// ─── Extended Test Fixture ──────────────────────────────────────

export const test = base.extend<{
  flint: FlintTestHelper
}>({
  flint: async ({ page }, use) => {
    const helper = new FlintTestHelper(page)
    await use(helper)
  },
})

export { expect }

// ─── Flint Test Helper ──────────────────────────────────────────

export class FlintTestHelper {
  constructor(private page: Page) {}

  /**
   * Wait for Flint app to hydrate
   */
  async waitForHydration(): Promise<void> {
    await this.page.waitForFunction(() => {
      return (window as any).__FLINT_HYDRATED__ === true
    }, { timeout: 10000 })
  }

  /**
   * Get signal value from DevTools
   */
  async getSignalValue(signalName: string): Promise<any> {
    return await this.page.evaluate((name) => {
      const devtools = (window as any).__FLINT_DEVTOOLS__
      if (!devtools) return undefined

      const signals = devtools.getSignals()
      const signal = signals.find((s: any) => s.name === name)
      return signal?.value
    }, signalName)
  }

  /**
   * Get all signal values
   */
  async getAllSignals(): Promise<SignalSnapshot[]> {
    return await this.page.evaluate(() => {
      const devtools = (window as any).__FLINT_DEVTOOLS__
      if (!devtools) return []

      return devtools.getSignals().map((s: any) => ({
        name: s.name,
        value: s.value,
        type: s.type,
      }))
    })
  }

  /**
   * Wait for signal value to change
   */
  async waitForSignal(
    signalName: string,
    expectedValue: any,
    timeout: number = 5000
  ): Promise<void> {
    await this.page.waitForFunction(
      ({ name, value }) => {
        const devtools = (window as any).__FLINT_DEVTOOLS__
        if (!devtools) return false

        const signals = devtools.getSignals()
        const signal = signals.find((s: any) => s.name === name)
        return signal?.value === value
      },
      { name: signalName, value: expectedValue },
      { timeout }
    )
  }

  /**
   * Click and wait for signal update
   */
  async clickAndWaitForSignal(
    selector: string,
    signalName: string,
    expectedValue: any
  ): Promise<void> {
    await this.page.click(selector)
    await this.waitForSignal(signalName, expectedValue)
  }

  /**
   * Fill input and wait for signal update
   */
  async fillAndWaitForSignal(
    selector: string,
    value: string,
    signalName: string,
    expectedValue?: any
  ): Promise<void> {
    await this.page.fill(selector, value)
    if (signalName) {
      await this.waitForSignal(signalName, expectedValue ?? value)
    }
  }

  /**
   * Get component info from DevTools
   */
  async getComponentInfo(componentName: string): Promise<any> {
    return await this.page.evaluate((name) => {
      const devtools = (window as any).__FLINT_DEVTOOLS__
      if (!devtools) return undefined

      const components = devtools.getComponents()
      return components.find((c: any) => c.name === name)
    }, componentName)
  }

  /**
   * Take screenshot with signal overlay
   */
  async screenshotWithSignals(path: string): Promise<void> {
    const signals = await this.getAllSignals()
    const overlay = signals
      .map((s) => `${s.name}: ${JSON.stringify(s.value)}`)
      .join('\n')

    // Add overlay to page
    await this.page.evaluate((text) => {
      const div = document.createElement('div')
      div.id = 'flint-signals-overlay'
      div.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        white-space: pre;
      `
      div.textContent = text
      document.body.appendChild(div)
    }, overlay)

    await this.page.screenshot({ path })

    // Remove overlay
    await this.page.evaluate(() => {
      document.getElementById('flint-signals-overlay')?.remove()
    })
  }

  /**
   * Assert no console errors
   */
  async assertNoConsoleErrors(): Promise<void> {
    const errors: string[] = []

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await this.page.waitForTimeout(1000)

    expect(errors).toEqual([])
  }

  /**
   * Assert no network errors
   */
  async assertNoNetworkErrors(): Promise<void> {
    const errors: string[] = []

    this.page.on('requestfailed', (request) => {
      errors.push(`${request.failure()?.errorText}: ${request.url()}`)
    })

    await this.page.waitForTimeout(1000)

    expect(errors).toEqual([])
  }
}

// ─── Custom Matchers ────────────────────────────────────────────

export async function toHaveSignal(
  page: Page,
  signalName: string,
  expectedValue: any
): Promise<void> {
  const value = await page.evaluate((name) => {
    const devtools = (window as any).__FLINT_DEVTOOLS__
    if (!devtools) return undefined

    const signals = devtools.getSignals()
    const signal = signals.find((s: any) => s.name === name)
    return signal?.value
  }, signalName)

  expect(value).toEqual(expectedValue)
}

export async function toHaveSignals(
  page: Page,
  signals: Record<string, any>
): Promise<void> {
  for (const [name, value] of Object.entries(signals)) {
    await toHaveSignal(page, name, value)
  }
}

// ─── Page Helpers ───────────────────────────────────────────────

export async function createFlintPage(
  baseURL: string = 'http://localhost:3000'
): Promise<{ page: Page; flint: FlintTestHelper }> {
  // This would be used with a custom test setup
  throw new Error('Use test.extend({ flint }) instead')
}
