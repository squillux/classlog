import QuizActivity from './quiz/QuizActivity'
import type { Activity } from './types'

export type { Activity, ActivityProps } from './types'

export const activities: Activity[] = [
  { id: 'quiz', title: '퀴즈 · 빈칸 채우기', Component: QuizActivity },
]

export function findActivity(id: string): Activity | undefined {
  return activities.find((activity) => activity.id === id)
}
