// Flint Runtime — Visual Debug Tools (v5)
// Real-time visual debugging that surpasses React DevTools

import { state, computed, effect } from '@flint/reactivity'
import type { Signal, Computed } from '@flint/reactivity'

// ─── Signal Inspector ───────────────────────────────────────────

interface SignalInfo {
  id: string
  name: string
  value: any
  listeners: number
  history: { value: any; timestamp: number }[]
}

const signalRegistry = new Map<string, SignalInfo>()
let inspectorPanel: HTMLElement | null = null

/**
 * Register a signal for visual inspection.
 */
export function registerSignal<T>(
  signal: Signal<T>,
  name: string
): void {
  const id = `signal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const info: SignalInfo = {
    id,
    name,
    value: signal(),
    listeners: 0,
    history: [{ value: signal(), timestamp: Date.now() }],
  }
  signalRegistry.set(id, info)

  // Track changes
  effect(() => {
    const currentValue = signal()
    const existing = signalRegistry.get(id)
    if (existing) {
      existing.value = currentValue
      existing.history.push({ value: currentValue, timestamp: Date.now() })
      if (existing.history.length > 50) {
        existing.history.shift()
      }
    }
  })
}

/**
 * Get all registered signals.
 */
export function getRegisteredSignals(): SignalInfo[] {
  return Array.from(signalRegistry.values())
}

/**
 * Clear signal registry.
 */
export function clearSignalRegistry(): void {
  signalRegistry.clear()
}

// ─── Visual Inspector Panel ─────────────────────────────────────

/**
 * Create a visual inspector panel that shows all signals.
 * This panel floats on top of your app and shows real-time state.
 *
 * @example
 * import { showInspector } from 'flint'
 * showInspector()
 */
export function showInspector(): void {
  if (inspectorPanel) return

  inspectorPanel = document.createElement('div')
  inspectorPanel.id = 'flint-inspector'
  inspectorPanel.innerHTML = `
    <style>
      #flint-inspector {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        max-height: 500px;
        background: #1a1a2e;
        border: 1px solid #16213e;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 12px;
        color: #e0e0e0;
        z-index: 99999;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      #flint-inspector-header {
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
      }
      #flint-inspector-header span {
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #flint-inspector-close {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #flint-inspector-close:hover {
        background: rgba(255,255,255,0.3);
      }
      #flint-inspector-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      #flint-inspector-search {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #333;
        border-radius: 6px;
        background: #0f0f23;
        color: #e0e0e0;
        font-size: 12px;
        margin-bottom: 8px;
      }
      #flint-inspector-search::placeholder {
        color: #666;
      }
      .flint-signal-item {
        padding: 10px 12px;
        margin: 4px 0;
        background: #0f0f23;
        border-radius: 8px;
        border-left: 3px solid #667eea;
        cursor: pointer;
        transition: all 0.2s;
      }
      .flint-signal-item:hover {
        background: #16213e;
        border-left-color: #764ba2;
      }
      .flint-signal-name {
        color: #667eea;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .flint-signal-value {
        color: #4ade80;
        word-break: break-all;
      }
      .flint-signal-history {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid #333;
        color: #888;
        font-size: 10px;
      }
      .flint-signal-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        animation: flint-pulse 2s infinite;
      }
      @keyframes flint-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .flint-empty {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }
      .flint-stats {
        padding: 8px 12px;
        background: #16213e;
        border-radius: 6px;
        margin-bottom: 8px;
        display: flex;
        justify-content: space-between;
      }
      .flint-stat {
        text-align: center;
      }
      .flint-stat-value {
        font-size: 18px;
        font-weight: bold;
        color: #667eea;
      }
      .flint-stat-label {
        font-size: 10px;
        color: #888;
      }
    </style>
    <div id="flint-inspector-header">
      <span>🔥 Flint Inspector</span>
      <button id="flint-inspector-close">×</button>
    </div>
    <div id="flint-inspector-content">
      <input type="text" id="flint-inspector-search" placeholder="Search signals..." />
      <div id="flint-inspector-list"></div>
    </div>
  `

  document.body.appendChild(inspectorPanel)

  // Event listeners
  const closeBtn = inspectorPanel.querySelector('#flint-inspector-close')
  closeBtn?.addEventListener('click', hideInspector)

  const searchInput = inspectorPanel.querySelector('#flint-inspector-search') as HTMLInputElement
  searchInput?.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase()
    renderSignalList(query)
  })

  // Make draggable
  makeDraggable(inspectorPanel)

  // Initial render
  renderSignalList()

  // Auto-update
  effect(() => {
    renderSignalList(searchInput?.value?.toLowerCase() || '')
  })
}

/**
 * Hide the inspector panel.
 */
export function hideInspector(): void {
  if (inspectorPanel) {
    inspectorPanel.remove()
    inspectorPanel = null
  }
}

/**
 * Toggle the inspector panel.
 */
export function toggleInspector(): void {
  if (inspectorPanel) {
    hideInspector()
  } else {
    showInspector()
  }
}

function renderSignalList(query: string = ''): void {
  const list = inspectorPanel?.querySelector('#flint-inspector-list')
  if (!list) return

  const signals = getRegisteredSignals()
    .filter(s => s.name.toLowerCase().includes(query))

  if (signals.length === 0) {
    list.innerHTML = `
      <div class="flint-empty">
        ${query ? 'No signals match your search' : 'No signals registered yet'}
      </div>
    `
    return
  }

  // Stats
  const totalChanges = signals.reduce((sum, s) => sum + s.history.length, 0)

  let html = `
    <div class="flint-stats">
      <div class="flint-stat">
        <div class="flint-stat-value">${signals.length}</div>
        <div class="flint-stat-label">Signals</div>
      </div>
      <div class="flint-stat">
        <div class="flint-stat-value">${totalChanges}</div>
        <div class="flint-stat-label">Changes</div>
      </div>
    </div>
  `

  for (const signal of signals) {
    const valueStr = typeof signal.value === 'object'
      ? JSON.stringify(signal.value, null, 2)
      : String(signal.value)

    html += `
      <div class="flint-signal-item">
        <div class="flint-signal-name">
          <span class="flint-signal-dot" style="background: ${getSignalColor(signal.history.length)}"></span>
          ${signal.name}
        </div>
        <div class="flint-signal-value">${valueStr}</div>
        <div class="flint-signal-history">
          ${signal.history.length} changes • Last: ${formatTimestamp(signal.history[signal.history.length - 1]?.timestamp)}
        </div>
      </div>
    `
  }

  list.innerHTML = html
}

function getSignalColor(changes: number): string {
  if (changes > 20) return '#ef4444'
  if (changes > 10) return '#f59e0b'
  return '#4ade80'
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return 'never'
  const diff = Date.now() - timestamp
  if (diff < 1000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  return `${Math.floor(diff / 60000)}m ago`
}

function makeDraggable(element: HTMLElement): void {
  const header = element.querySelector('#flint-inspector-header') as HTMLElement
  if (!header) return

  let isDragging = false
  let offsetX = 0
  let offsetY = 0

  header.addEventListener('mousedown', (e) => {
    isDragging = true
    offsetX = e.clientX - element.offsetLeft
    offsetY = e.clientY - element.offsetTop
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return
    element.style.left = `${e.clientX - offsetX}px`
    element.style.top = `${e.clientY - offsetY}px`
    element.style.right = 'auto'
    element.style.bottom = 'auto'
  })

  document.addEventListener('mouseup', () => {
    isDragging = false
  })
}

// ─── Performance Monitor ────────────────────────────────────────

interface RenderMetric {
  component: string
  renderTime: number
  timestamp: number
}

const renderMetrics: RenderMetric[] = []
let monitorPanel: HTMLElement | null = null

/**
 * Record a component render time.
 */
export function recordRender(component: string, time: number): void {
  renderMetrics.push({ component, renderTime: time, timestamp: Date.now() })
  if (renderMetrics.length > 100) {
    renderMetrics.shift()
  }
}

/**
 * Show performance monitor panel.
 */
export function showMonitor(): void {
  if (monitorPanel) return

  monitorPanel = document.createElement('div')
  monitorPanel.id = 'flint-monitor'
  monitorPanel.innerHTML = `
    <style>
      #flint-monitor {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: #1a1a2e;
        border: 1px solid #16213e;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 12px;
        color: #e0e0e0;
        z-index: 99999;
        overflow: hidden;
      }
      #flint-monitor-header {
        padding: 12px 16px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #flint-monitor-content {
        padding: 12px;
        max-height: 300px;
        overflow-y: auto;
      }
      .flint-metric-bar {
        display: flex;
        align-items: center;
        margin: 6px 0;
      }
      .flint-metric-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .flint-metric-time {
        width: 60px;
        text-align: right;
        color: #4ade80;
      }
      .flint-metric-bar-visual {
        width: 100px;
        height: 6px;
        background: #333;
        border-radius: 3px;
        margin-left: 8px;
        overflow: hidden;
      }
      .flint-metric-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s;
      }
    </style>
    <div id="flint-monitor-header">
      <span>⚡ Performance</span>
      <button onclick="document.getElementById('flint-monitor').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;width:24px;height:24px;border-radius:50%;cursor:pointer">×</button>
    </div>
    <div id="flint-monitor-content">
      <div id="flint-metrics-list"></div>
    </div>
  `

  document.body.appendChild(monitorPanel)

  // Auto-update
  setInterval(() => {
    renderMetricsList()
  }, 1000)
}

function renderMetricsList(): void {
  const list = monitorPanel?.querySelector('#flint-metrics-list')
  if (!list) return

  const recentMetrics = renderMetrics.slice(-20)
  const maxTime = Math.max(...recentMetrics.map(m => m.renderTime), 1)

  let html = ''
  for (const metric of recentMetrics) {
    const percent = (metric.renderTime / maxTime) * 100
    const color = metric.renderTime > 16 ? '#ef4444' : metric.renderTime > 8 ? '#f59e0b' : '#4ade80'

    html += `
      <div class="flint-metric-bar">
        <div class="flint-metric-name">${metric.component}</div>
        <div class="flint-metric-time">${metric.renderTime.toFixed(1)}ms</div>
        <div class="flint-metric-bar-visual">
          <div class="flint-metric-bar-fill" style="width:${percent}%;background:${color}"></div>
        </div>
      </div>
    `
  }

  list.innerHTML = html || '<div style="text-align:center;color:#666;padding:20px">No renders recorded</div>'
}

// ─── Component Tree Visualizer ──────────────────────────────────

interface ComponentNode {
  name: string
  props: Record<string, any>
  children: ComponentNode[]
  renderTime: number
}

let treePanel: HTMLElement | null = null

/**
 * Show component tree visualizer.
 */
export function showComponentTree(): void {
  if (treePanel) return

  treePanel = document.createElement('div')
  treePanel.id = 'flint-tree'
  treePanel.innerHTML = `
    <style>
      #flint-tree {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        max-height: 600px;
        background: #1a1a2e;
        border: 1px solid #16213e;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 12px;
        color: #e0e0e0;
        z-index: 99999;
        overflow: hidden;
      }
      #flint-tree-header {
        padding: 12px 16px;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #flint-tree-content {
        padding: 12px;
        overflow-y: auto;
        max-height: 540px;
      }
      .flint-tree-node {
        padding: 8px;
        margin: 4px 0;
        background: #0f0f23;
        border-radius: 6px;
        border-left: 2px solid #667eea;
      }
      .flint-tree-children {
        margin-left: 20px;
      }
      .flint-tree-name {
        color: #667eea;
        font-weight: bold;
      }
      .flint-tree-props {
        color: #888;
        font-size: 10px;
        margin-top: 4px;
      }
    </style>
    <div id="flint-tree-header">
      <span>🌳 Component Tree</span>
      <button onclick="document.getElementById('flint-tree').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;width:24px;height:24px;border-radius:50%;cursor:pointer">×</button>
    </div>
    <div id="flint-tree-content">
      <div id="flint-tree-root"></div>
    </div>
  `

  document.body.appendChild(treePanel)
  renderComponentTree()
}

function renderComponentTree(): void {
  const root = treePanel?.querySelector('#flint-tree-root')
  if (!root) return

  root.innerHTML = `
    <div class="flint-tree-node">
      <div class="flint-tree-name">App</div>
      <div class="flint-tree-props">Root component</div>
    </div>
  `
}

// ─── Console Logger ─────────────────────────────────────────────

/**
 * Pretty-print signal changes to console.
 *
 * @example
 * import { enableConsoleLog } from 'flint'
 * enableConsoleLog()
 */
export function enableConsoleLog(): void {
  const originalLog = console.log
  const originalGroup = console.group
  const originalGroupEnd = console.groupEnd

  console.log = (...args) => {
    if (args[0] === '%c[Flint]') {
      const style = 'background: #667eea; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;'
      originalLog.call(console, style, ...args.slice(1))
    } else {
      originalLog.call(console, ...args)
    }
  }

  console.group = (label) => {
    const style = 'color: #667eea; font-weight: bold;'
    originalGroup.call(console, `%c${label}`, style)
  }

  console.groupEnd = () => {
    originalGroupEnd.call(console)
  }
}

// ─── Debug Helpers ──────────────────────────────────────────────

/**
 * Add debug border to all elements.
 */
export function showDebugBorders(): void {
  const style = document.createElement('style')
  style.id = 'flint-debug-borders'
  style.textContent = `
    * {
      outline: 1px solid rgba(102, 126, 234, 0.3) !important;
    }
    *:hover {
      outline: 2px solid rgba(102, 126, 234, 0.8) !important;
    }
  `
  document.head.appendChild(style)
}

/**
 * Remove debug borders.
 */
export function hideDebugBorders(): void {
  document.getElementById('flint-debug-borders')?.remove()
}

/**
 * Log all DOM mutations.
 */
export function logMutations(callback?: (mutation: MutationRecord) => void): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      console.log('[Flint] DOM Mutation:', {
        type: mutation.type,
        target: mutation.target,
        addedNodes: mutation.addedNodes.length,
        removedNodes: mutation.removedNodes.length,
      })
      callback?.(mutation)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  })

  return observer
}

// ─── Quick Debug Commands ───────────────────────────────────────

export const debug = {
  inspector: toggleInspector,
  monitor: showMonitor,
  tree: showComponentTree,
  borders: showDebugBorders,
  noBorders: hideDebugBorders,
  signals: getRegisteredSignals,
  clear: () => {
    clearSignalRegistry()
    renderMetrics.length = 0
  },
  help: () => {
    console.log(`
%c🔥 Flint Debug Commands
━━━━━━━━━━━━━━━━━━━━━━━

debug.inspector()  - Toggle signal inspector
debug.monitor()    - Show performance monitor
debug.tree()       - Show component tree
debug.borders()    - Show debug borders
debug.noBorders()  - Hide debug borders
debug.signals()    - Get all registered signals
debug.clear()      - Clear all debug data
debug.help()       - Show this help
    `, 'color: #667eea; font-weight: bold;')
  },
}
