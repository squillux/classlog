export type Ingredient = { id: string; label: string }

/** 아래부터 위로. 이 순서가 곧 정답이다. */
export const INGREDIENTS: Ingredient[] = [
  { id: 'bottom-bun', label: '아래빵' },
  { id: 'sauce', label: '소스' },
  { id: 'lettuce', label: '양상추' },
  { id: 'tomato', label: '토마토' },
  { id: 'patty', label: '패티' },
  { id: 'cheese', label: '치즈' },
  { id: 'top-bun', label: '위빵' },
]

export const CORRECT_ORDER: string[] = INGREDIENTS.map((i) => i.id)

export function isComplete(stack: string[]): boolean {
  return stack.length === CORRECT_ORDER.length
}

export function isCorrect(stack: string[]): boolean {
  return isComplete(stack) && stack.every((id, index) => id === CORRECT_ORDER[index])
}

export function shuffle(items: Ingredient[], rng: () => number): Ingredient[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
