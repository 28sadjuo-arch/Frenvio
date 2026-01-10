import React, { useEffect, useRef, useState } from 'react'

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// WhatsApp-ish audio bubble (play/pause + progress + time)
export default function AudioBubble({
  src,
  className = '',
}: {
  src: string
  className?: string
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    const onLoaded = () => setDuration(a.duration || 0)
    const onTime = () => setCurrent(a.currentTime || 0)
    const onEnd = () => setPlaying(false)
    const onErr = () => setError('Could not load audio.')

    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    a.addEventListener('error', onErr)

    return () => {
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('error', onErr)
    }
  }, [src])

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    try {
      if (playing) {
        a.pause()
        setPlaying(false)
      } else {
        await a.play()
        setPlaying(true)
      }
    } catch (e) {
      setError('Could not play audio.')
      setPlaying(false)
    }
  }

  const seek = (t: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = t
    setCurrent(t)
  }

  return (
    <>
      {error ? (
        <div
          className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${className}`}
        >
          <div className="text-sm font-bold">Voice note</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</div>

          {/* PC-safe fallback */}
          <audio className="mt-2 w-full" controls preload="metadata" src={src} />
        </div>
      ) : (
        <div
          className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${className}`}
        >
          <div className="flex items-center gap-3">
            <audio
              ref={audioRef}
              src={src}
              preload="metadata"
              crossOrigin="anonymous"
              playsInline
            />
            <button
              type="button"
              onClick={toggle}
              className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '❚❚' : '▶'}
            </button>

            <div className="flex-1 min-w-[160px]">
              <input
                type="range"
                min={0}
                max={duration || 1}
                value={Math.min(current, duration || 1)}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] opacity-80 mt-1">
                <span>{fmt(current)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
