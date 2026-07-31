export type Step = {
  array: number[]
  comparing: number[]
  settled: number[]
  found: number | null
  comparisons: number
  swaps: number
  caption: string
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k)

export function selectionSortSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = []
  let comparisons = 0
  let swaps = 0
  let settledCount = 0

  const push = (extra: Partial<Step>) =>
    steps.push({
      array: [...a],
      comparing: [],
      settled: range(0, settledCount),
      found: null,
      comparisons,
      swaps,
      caption: '',
      ...extra,
    })

  push({ caption: '앞에서부터 가장 작은 수를 하나씩 찾아 놓습니다.' })

  for (let i = 0; i < a.length - 1; i++) {
    let min = i
    push({ comparing: [min], caption: `${i + 1}번째 자리에 올 가장 작은 수를 찾습니다.` })

    for (let j = i + 1; j < a.length; j++) {
      comparisons++
      push({ comparing: [min, j], caption: `${a[min]} 과 ${a[j]} 를 비교합니다.` })
      if (a[j] < a[min]) {
        min = j
        push({ comparing: [min], caption: `${a[min]} 이 지금까지 가장 작습니다.` })
      }
    }

    if (min !== i) {
      const moved = a[i]
      const smallest = a[min]
      ;[a[i], a[min]] = [a[min], a[i]]
      swaps++
      push({ comparing: [i, min], caption: `${smallest} 과 ${moved} 의 자리를 바꿉니다.` })
    } else {
      push({ comparing: [i], caption: `${a[i]} 이 이미 제자리에 있습니다.` })
    }

    settledCount = i + 1
    push({ caption: `${i + 1}번째 자리가 정해졌습니다.` })
  }

  settledCount = a.length
  push({ caption: '정렬이 끝났습니다.' })
  return steps
}

export function bubbleSortSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = []
  let comparisons = 0
  let swaps = 0
  // 이 인덱스부터 끝까지는 자리가 정해졌다.
  let settledFrom = a.length

  const push = (extra: Partial<Step>) =>
    steps.push({
      array: [...a],
      comparing: [],
      settled: range(settledFrom, a.length),
      found: null,
      comparisons,
      swaps,
      caption: '',
      ...extra,
    })

  push({ caption: '옆자리끼리 비교해 큰 수를 뒤로 보냅니다.' })

  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false

    for (let j = 0; j < a.length - 1 - i; j++) {
      comparisons++
      push({ comparing: [j, j + 1], caption: `${a[j]} 과 ${a[j + 1]} 을 비교합니다.` })
      if (a[j] > a[j + 1]) {
        const left = a[j]
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        swaps++
        swapped = true
        push({ comparing: [j, j + 1], caption: `${left} 이 더 크므로 자리를 바꿉니다.` })
      }
    }

    settledFrom = a.length - 1 - i
    push({ caption: `${a.length - i}번째 자리가 정해졌습니다.` })

    if (!swapped) {
      settledFrom = 0
      push({ caption: '한 번도 바꾸지 않았으므로 정렬이 끝났습니다.' })
      return steps
    }
  }

  settledFrom = 0
  push({ caption: '정렬이 끝났습니다.' })
  return steps
}

export function linearSearchSteps(input: number[], target: number): Step[] {
  const a = [...input]
  const steps: Step[] = []
  let comparisons = 0

  const push = (extra: Partial<Step>) =>
    steps.push({
      array: [...a],
      comparing: [],
      settled: [],
      found: null,
      comparisons,
      swaps: 0,
      caption: '',
      ...extra,
    })

  push({ caption: `${target} 을 찾습니다. 앞에서부터 하나씩 봅니다.` })

  for (let i = 0; i < a.length; i++) {
    comparisons++
    if (a[i] === target) {
      push({
        comparing: [i], found: i,
        caption: `${a[i]} 을 찾았습니다! ${comparisons}번 비교했습니다.`,
      })
      return steps
    }
    push({ comparing: [i], caption: `${a[i]} 은 ${target} 이 아닙니다.` })
  }

  push({ caption: `끝까지 봤지만 ${target} 을 찾지 못했습니다.` })
  return steps
}
