import type { Question } from '../shared/questions'

export const FINAL_QUESTIONS: Question[] = [
  {
    id: 'more-swaps', kind: 'choice',
    prompt: '선택정렬과 버블정렬 중 자리를 더 많이 바꾼 것은 무엇인가요?',
    choices: ['선택정렬', '버블정렬', '둘이 같다'],
    answerIndex: 1,
  },
  {
    id: 'search-count', kind: 'choice',
    prompt: '순차 탐색이 7을 찾기까지 몇 번 비교했나요?',
    choices: ['5번', '6번', '7번', '8번'],
    answerIndex: 2,
  },
  {
    id: 'difference', kind: 'text',
    prompt: '두 정렬 방법은 어떻게 다른가요? 관찰한 것을 설명해 보세요.',
  },
]
