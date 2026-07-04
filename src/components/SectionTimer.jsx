import { useRef, useEffect } from 'react'

/**
 * SectionTimer — counts up from 0, pauses on tab switch.
 * Props:
 *   running: bool
 *   onTick: (seconds) => void   — called every second
 */
export default function SectionTimer({ running, onTick }) {
  const startRef = useRef(null)
  const accRef   = useRef(0)   // accumulated seconds before any pause
  const rafRef   = useRef(null)

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Pause: save accumulated time
        if (startRef.current !== null) {
          accRef.current += (Date.now() - startRef.current) / 1000
          startRef.current = null
        }
      } else {
        // Resume
        if (running) startRef.current = Date.now()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [running])

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      const tick = () => {
        const elapsed = accRef.current + (startRef.current !== null ? (Date.now() - startRef.current) / 1000 : 0)
        onTick?.(Math.floor(elapsed))
        rafRef.current = setTimeout(tick, 1000)
      }
      rafRef.current = setTimeout(tick, 1000)
    } else {
      clearTimeout(rafRef.current)
      if (startRef.current !== null) {
        accRef.current += (Date.now() - startRef.current) / 1000
        startRef.current = null
      }
    }
    return () => clearTimeout(rafRef.current)
  }, [running]) // eslint-disable-line

  return null  // no UI — just a side-effect component
}

export function formatSectionTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
