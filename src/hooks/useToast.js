import { useCallback, useRef, useState } from 'react'

// Minimal toast queue. show(message, type) -> auto-dismiss (errors stay longer
// so a longer explanation can be read).
export function useToast() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const show = useCallback((message, type = 'success') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, type === 'error' ? 6000 : 2800)
  }, [])

  return { toasts, show }
}
