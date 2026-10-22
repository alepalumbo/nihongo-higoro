import { useCallback, useState } from 'react'
import { load, save } from '../lib/storage.js'

// State mirrored to localStorage. Survives refresh.
export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => load(key, fallback))

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        save(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
