export type Item = 'wolf' | 'goat' | 'cabbage'
export type Side = 'left' | 'right'

export type RiverState = {
  farmer: Side
  positions: Record<Item, Side>
}

export const ITEM_LABEL: Record<Item, string> = {
  wolf: '늑대',
  goat: '양',
  cabbage: '양배추',
}

export const INITIAL: RiverState = {
  farmer: 'left',
  positions: { wolf: 'left', goat: 'left', cabbage: 'left' },
}

const other = (side: Side): Side => (side === 'left' ? 'right' : 'left')

export function canCarry(state: RiverState, item: Item): boolean {
  return state.positions[item] === state.farmer
}

export function move(state: RiverState, carried: Item | null): RiverState {
  const to = other(state.farmer)
  return {
    farmer: to,
    positions: carried
      ? { ...state.positions, [carried]: to }
      : { ...state.positions },
  }
}

/** 농부가 없는 쪽에서 사라지는 물건. 없으면 null. */
export function violation(state: RiverState): Item | null {
  const away = other(state.farmer)
  const at = (item: Item) => state.positions[item] === away
  if (at('wolf') && at('goat')) return 'goat'
  if (at('goat') && at('cabbage')) return 'cabbage'
  return null
}

export function violationMessage(item: Item): string {
  return item === 'goat'
    ? '농부가 없으면 늑대가 양을 잡아먹습니다.'
    : '농부가 없으면 양이 양배추를 먹습니다.'
}

export function isSolved(state: RiverState): boolean {
  return (
    state.farmer === 'right' &&
    (['wolf', 'goat', 'cabbage'] as Item[]).every(
      (item) => state.positions[item] === 'right',
    )
  )
}

export function moveLabel(carried: Item | null, from: Side): string {
  const what = carried ? ITEM_LABEL[carried] : '혼자'
  return `${what}:${from === 'left' ? '건너감' : '돌아옴'}`
}

/** 최소 해. 테스트가 이 경로로 규칙 전체를 훑는다. */
export const SOLUTION: (Item | null)[] = [
  'goat', null, 'wolf', 'goat', 'cabbage', null, 'goat',
]
