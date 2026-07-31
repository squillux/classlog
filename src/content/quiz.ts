export type QuizQuestion =
  | { id: string; kind: 'choice'; prompt: string; choices: string[]; answerIndex: number }
  | { id: string; kind: 'blank'; prompt: string; answer: string }

// 교과서를 보고 채우기 전까지 파이프라인 검증용으로 쓰는 샘플이다.
export const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1', kind: 'choice',
    prompt: '순서도에서 조건을 판단할 때 쓰는 도형은 무엇인가요?',
    choices: ['타원', '마름모', '직사각형', '평행사변형'],
    answerIndex: 1,
  },
  {
    id: 'q2', kind: 'choice',
    prompt: '문제를 작은 문제로 나누어 푸는 것을 무엇이라고 하나요?',
    choices: ['추상화', '문제 분해', '패턴 인식', '자동화'],
    answerIndex: 1,
  },
  {
    id: 'q3', kind: 'blank',
    prompt: '같은 명령을 여러 번 되풀이하는 제어 구조를 □□ 구조라고 합니다.',
    answer: '반복',
  },
]
