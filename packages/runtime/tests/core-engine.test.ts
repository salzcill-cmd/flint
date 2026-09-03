/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import {
  component,
  onMount,
  onUpdate,
  onDestroy,
  getCurrentInstance,
  ref,
  formatFlintError,
  ErrorMessages,
} from '../src/index.js'
import { state, effect } from '@flint/reactivity'
import { h, render } from '../src/renderer/index.js'
import { create as createStore } from '@flint/store'

describe('component()', () => {
  it('wraps a function as a Flint component', () => {
    const MyComp = component(() => h('div', null, 'Hello'))
    expect(typeof MyComp).toBe('function')
    expect((MyComp as any).__flint_component).toBe(true)
  })

  it('component returns JSX', () => {
    const Greeting = component((props: { name: string }) => {
      return h('div', null, `Hello, ${props.name}!`)
    })
    const el = h(Greeting, { name: 'World' }) as HTMLElement
    expect(el.textContent).toBe('Hello, World!')
  })
})

describe('Lifecycle hooks', () => {
  it('onMount runs after render', async () => {
    const mountFn = vi.fn()

    const App = component(() => {
      onMount(() => {
        mountFn()
      })
      return h('div', null, 'Hello')
    })

    const container = document.createElement('div')
    render(App, container)

    // onMount should be called
    await new Promise(r => setTimeout(r, 10))
    expect(mountFn).toHaveBeenCalled()
  })

  it('onDestroy is available', () => {
    const destroyFn = vi.fn()

    const App = component(() => {
      onDestroy(() => {
        destroyFn()
      })
      return h('div', null, 'Hello')
    })

    expect(typeof App).toBe('function')
  })

  it('onUpdate is available', () => {
    const updateFn = vi.fn()

    const App = component(() => {
      onUpdate(() => {
        updateFn()
      })
      return h('div', null, 'Hello')
    })

    expect(typeof App).toBe('function')
  })
})

describe('ref()', () => {
  it('creates a ref', () => {
    const inputRef = ref()
    expect(inputRef.current).toBeNull()
  })

  it('ref can be assigned', () => {
    const inputRef = ref()
    const mockElement = document.createElement('input')
    inputRef(mockElement)
    expect(inputRef.current).toBe(mockElement)
  })
})

describe('createStore()', () => {
  it('creates a store with initial state', () => {
    const store = createStore(() => ({ count: 0, name: 'Flint' }))
    const state = store.getState()
    expect(state.count).toBe(0)
    expect(state.name).toBe('Flint')
  })

  it('gets a signal from store', () => {
    const store = createStore(() => ({ count: 0 }))
    const sig = store.signal()
    expect(typeof sig).toBe('function')
    expect(sig()).toEqual({ count: 0 })
  })

  it('updates state', () => {
    const store = createStore((set) => ({
      count: 0,
      setCount: (v: number) => set({ count: v }),
    }))
    store.getState().setCount(5)
    expect(store.getState().count).toBe(5)
  })

  it('updates state with function', () => {
    const store = createStore((set) => ({
      count: 0,
      increment: () => set((prev) => ({ count: prev.count + 1 })),
    }))
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })

  it('subscribes to changes', () => {
    const store = createStore(() => ({ count: 0 }))
    const callback = vi.fn()
    store.subscribe(callback)

    store.setState({ count: 5 })
    expect(callback).toHaveBeenCalledWith(
      { count: 5 },
      { count: 0 }
    )
  })

  it('unsubscribes correctly', () => {
    const store = createStore(() => ({ count: 0 }))
    const callback = vi.fn()
    const unsubscribe = store.subscribe(callback)

    unsubscribe()
    store.setState({ count: 5 })
    expect(callback).not.toHaveBeenCalled()
  })

  it('destroys store', () => {
    const store = createStore(() => ({ count: 0 }))
    store.destroy()
    // After destroy, getState and setState throw
    expect(() => store.getState()).toThrow()
    expect(() => store.setState({ count: 1 })).toThrow()
  })
})

describe('Error System', () => {
  it('formats error correctly', () => {
    const error = ErrorMessages.COMPONENT_NOT_FOUND('Navbar', 'src/pages/Home.js')
    const formatted = formatFlintError(error)

    expect(formatted).toContain('Navbar')
    expect(formatted).toContain('src/pages/Home.js')
    expect(formatted).toContain('💡')
  })

  it('formats error with line number', () => {
    const error = ErrorMessages.INVALID_JSX('src/App.jsx', 12)
    const formatted = formatFlintError(error)

    expect(formatted).toContain('12')
  })

  it('creates error with suggestion', () => {
    const error = ErrorMessages.MISSING_IMPORT('Button', 'src/App.jsx')
    expect(error.suggestion).toContain('Button')
  })
})

describe('Reactive Component', () => {
  it('component updates when state changes', async () => {
    const container = document.createElement('div')

    const App = component(() => {
      const count = state(0)
      return h('div', null, `Count: ${count()}`)
    })

    render(App, container)
    expect(container.textContent).toContain('Count: 0')
  })
})
