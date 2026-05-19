import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns the initial value when key is not in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('returns stored value when key exists in localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('stored')
  })

  it('updates value and persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    act(() => { result.current[1]('updated') })
    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(localStorage.getItem('test-key')!)).toBe('updated')
  })

  it('falls back to initial value when localStorage contains corrupt JSON', () => {
    localStorage.setItem('test-key', 'this-is-not-valid-json!!!')
    const { result } = renderHook(() => useLocalStorage('test-key', 42))
    expect(result.current[0]).toBe(42)
  })

  it('works with object values', () => {
    const { result } = renderHook(() => useLocalStorage<{ a: number; b?: number }>('obj-key', { a: 1 }))
    act(() => { result.current[1]({ a: 2, b: 3 }) })
    expect(result.current[0]).toEqual({ a: 2, b: 3 })
  })

  it('works with array values', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('arr-key', []))
    act(() => { result.current[1](['x', 'y']) })
    expect(result.current[0]).toEqual(['x', 'y'])
  })

  it('supports functional updater pattern', () => {
    const { result } = renderHook(() => useLocalStorage('count-key', 0))
    act(() => { result.current[1]((prev) => prev + 1) })
    expect(result.current[0]).toBe(1)
  })
})
