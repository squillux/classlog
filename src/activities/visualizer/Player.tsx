import { useEffect, useState } from 'react'

/** 수업에서 보고 조절한다. */
const SPEEDS = [
  { id: 'slow', label: '느리게', ms: 900 },
  { id: 'normal', label: '보통', ms: 500 },
  { id: 'fast', label: '빠르게', ms: 200 },
]

type Props = {
  total: number
  index: number
  onChange: (index: number) => void
}

export default function Player({ total, index, onChange }: Props) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(SPEEDS[1])

  const atStart = index <= 0
  const atEnd = index >= total - 1

  useEffect(() => {
    if (!playing) return
    if (atEnd) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => onChange(index + 1), speed.ms)
    return () => clearTimeout(timer)
  }, [playing, index, atEnd, speed.ms, onChange])

  return (
    <div className="player">
      <div className="chip-row">
        <button type="button" className="btn btn--utility"
          disabled={atStart} onClick={() => onChange(0)}>처음으로</button>
        <button type="button" className="btn btn--utility"
          disabled={atStart} onClick={() => onChange(index - 1)}>이전</button>
        <button type="button" className="btn btn--primary"
          onClick={() => setPlaying(!playing)}>
          {playing ? '일시정지' : '재생'}
        </button>
        <button type="button" className="btn btn--utility"
          disabled={atEnd} onClick={() => onChange(index + 1)}>다음</button>
      </div>

      <div className="chip-row">
        {SPEEDS.map((s) => (
          <button key={s.id} type="button" className="btn btn--utility"
            aria-pressed={speed.id === s.id}
            onClick={() => setSpeed(s)}>{s.label}</button>
        ))}
        <span className="player__count">{index + 1} / {total}</span>
      </div>
    </div>
  )
}
