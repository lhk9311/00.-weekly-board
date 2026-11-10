import { useCallback, useRef, useState } from 'react'

export interface ToastState {
  id: number
  message: string
  type: 'error' | 'success'
}

/**
 * 화면 하단 알림(토스트) 상태 관리 훅
 * notify() 를 호출하면 3초간 메시지를 보여주고 자동으로 사라진다.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const notify = useCallback((message: string, type: 'error' | 'success' = 'success') => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), message, type })
    timer.current = window.setTimeout(() => setToast(null), 3000)
  }, [])

  return { toast, notify }
}
