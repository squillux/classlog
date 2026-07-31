type Bag = Record<string, unknown>

function asBag(payload: unknown): Bag | null {
  return payload && typeof payload === 'object' ? (payload as Bag) : null
}

/** 표의 점수 칸. 퀴즈는 점수, 미니게임은 성공 여부. */
export function summarize(payload: unknown): string {
  const p = asBag(payload)
  if (!p) return '—'
  if (typeof p.score === 'number' && typeof p.total === 'number') {
    return `${p.score} / ${p.total}`
  }
  if (typeof p.solved === 'boolean') return p.solved ? '성공' : '미완'
  return '—'
}

export function noteOf(payload: unknown): string | null {
  const p = asBag(payload)
  if (!p || typeof p.note !== 'string') return null
  const trimmed = p.note.trim()
  return trimmed === '' ? null : trimmed
}

export function detailsOf(payload: unknown): string | null {
  const p = asBag(payload)
  if (!p || typeof p.attempts !== 'number' || typeof p.elapsedMs !== 'number') {
    return null
  }
  const seconds = Math.round(p.elapsedMs / 1000)
  const time =
    seconds < 60 ? `${seconds}초` : `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
  return `${p.attempts}번 시도 · ${time}`
}
