/** 세 미니게임이 공통으로 내는 제출물 모양. */
export type MinigamePayload = {
  solved: boolean
  attempts: number
  elapsedMs: number
  result: unknown
  note: string
}

export function buildPayload(
  startedAt: number,
  parts: { solved: boolean; attempts: number; result: unknown; note: string },
  now: () => number = Date.now,
): MinigamePayload {
  return {
    solved: parts.solved,
    attempts: parts.attempts,
    // 기기 시계가 흔들려도 음수가 나오지 않게 막는다.
    elapsedMs: Math.max(0, now() - startedAt),
    result: parts.result,
    note: parts.note.trim(),
  }
}
