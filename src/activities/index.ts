import QuizActivity from './quiz/QuizActivity'
import BurgerActivity from './burger/BurgerActivity'
import RiverActivity from './river/RiverActivity'
import type { Activity } from './types'

export type { Activity, ActivityProps } from './types'

export const activities: Activity[] = [
  { id: 'quiz', title: '퀴즈 · 빈칸 채우기', Component: QuizActivity },
  { id: 'burger', title: '햄버거 만들기', Component: BurgerActivity },
  { id: 'river', title: '강 건너기', Component: RiverActivity },
]

export function findActivity(id: string): Activity | undefined {
  return activities.find((activity) => activity.id === id)
}
