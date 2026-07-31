import QuizActivity from './quiz/QuizActivity'
import RiverActivity from './river/RiverActivity'
import VisualizerActivity from './visualizer/VisualizerActivity'
import TicTacToeActivity from './tictactoe/TicTacToeActivity'
import type { Activity } from './types'

export type { Activity, ActivityProps } from './types'

export const activities: Activity[] = [
  { id: 'quiz', title: '퀴즈 · 빈칸 채우기', Component: QuizActivity },
  { id: 'river', title: '강 건너기', Component: RiverActivity },
  { id: 'visualizer', title: '알고리즘 시각화', Component: VisualizerActivity },
  { id: 'tictactoe', title: '틱택토', Component: TicTacToeActivity },
]

export function findActivity(id: string): Activity | undefined {
  return activities.find((activity) => activity.id === id)
}
