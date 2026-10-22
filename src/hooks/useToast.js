import { useCallback, useRef, useState } from 'react'

// Minimal toast queue. show(message, type) -> auto-dismiss after 2.6s.
export function useToast() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const show = useCallback((message, type = 'success') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 2600)
  }, [])

  return { toasts, show }
}
