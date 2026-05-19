import { useState, useCallback } from 'react'

type SetValue<T> = (value: T | ((prev: T) => T)) => void

/**
 * Typed localStorage hook with fail-safe on corrupt JSON.
 * Falls back to initialValue if parsing fails.
 */
export const useLocalStorage = <T>(key: string, initialValue: T): [T, SetValue<T>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue: SetValue<T> = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch {
        // Silently ignore write errors (e.g., storage quota exceeded)
      }
    },
    [key, storedValue],
  )

  return [storedValue, setValue]
}
