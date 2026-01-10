import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseSupabaseStoragePublicUrl(url: string): { bucket: string; path: string } | null {
  // Matches:
  // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  // https://<project>.supabase.co/storage/v1/object/<bucket>/<path> (sometimes)
  const m =
    url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/) ||
    url.match(/\/storage\/v1\/object\/([^/]+)\/(.+)$/)
  if (!m) return null
  return { bucket: decodeURIComponent(m[1]), path: decodeURIComponent(m[2]) }
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
  const [resolvedSrc, setResolvedSrc] = useState(src)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triedSigned, setTriedSigned] = useState(false)

  useEffect(() => {
    setResolvedSrc(src)
    setError(null)
    setTriedSigned(false)
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
  }, [src])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    const onLoaded = () => setDuration(a.duration || 0)
    const onTime = () => setCurrent(a.currentTime || 0)
    const onEnd = () => setPlaying(false)

    const onErr = async () => {
      // If the bucket is private, publicUrl will 403 and the audio element errors.
      // Try a signed URL fallback once.
      if (!triedSigned) {
        const parsed = parseSupabaseStoragePublicUrl(src)
        if (parsed) {
          try {
            const { data, error: signErr } = await supabase.storage
              .from(parsed.bucket)
              .createSignedUrl(parsed.path, 60 * 60) // 1 hour
            if (!signErr && data?.signedUrl) {
              setTriedSigned(true)
              setResolvedSrc(data.signedUrl)
              setError(null)
              // reload & autoplay only if it was playing
              const wasPlaying = playing
              a.src = data.signedUrl
              a.load()
              if (wasPlaying) {
                try {
                  await a.play()
                  setPlaying(true)
                } catch {
                  setPlaying(false)
                }
              }
              return
            }
          } catch {
            // fall through to error below
          }
        }
      }

      setError('Could not load audio.')
      setPlaying(false)
    }

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
  }, [src, playing, triedSigned])

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
    } catch {
      setError('Could not play audio.')
      setPlaying(false)
    }
  }

  const seek = (v: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = v
    setCurrent(v)
  }

  const pct = useMemo(() => (duration ? Math.min(100, (current / duration) * 100) : 0), [current, duration])

  if (error) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${className}`}
      >
        <div className="text-sm font-bold">Voice note</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error}</div>
        {error && isIOS && /\.webm(\?|$)/i.test(resolvedSrc) ? (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            This voice note may be in a format iPhone doesn’t support. Please re-record and resend.
          </div>
        ) : null}

        {/* Always provide a native fallback so it plays on PC */}
        <audio className="mt-2 w-full" controls preload="metadata" crossOrigin="anonymous" src={resolvedSrc} />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${className}`}>
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" src={resolvedSrc} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="h-10 w-10 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <span className="font-extrabold">II</span>
          ) : (
            <span className="font-extrabold">▶</span>
          )}
        </button>

        <div className="flex-1">
          <div className="h-2 rounded-full bg-slate-200 dark:bg-white/20 overflow-hidden">
            <div className="h-2 bg-slate-900 dark:bg-white" style={{ width: `${pct}%` }} />
          </div>

          <input
            type="range"
            min={0}
            max={duration || 0}
            value={current}
            step={0.1}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full mt-1"
          />

          <div className="flex justify-between text-[10px] text-slate-500 dark:text-white/70 mt-1">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
