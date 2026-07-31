/**
 * 강 건너기 활동의 글감. 문구를 고치려면 이 파일만 손보면 된다.
 * 정답 비교는 앞뒤·사이 공백과 대소문자를 무시한다.
 */

export type Blank = {
  id: string
  /** □ 자리를 {} 로 적는다. */
  sentence: string
  accepts: string[]
}

/** 1단계 — 학생이 규칙을 스스로 채워 본다. */
export const RULE_BLANKS: Blank[] = [
  {
    id: 'capacity',
    sentence: '배에는 농부 말고 한 번에 {} 개만 태울 수 있다.',
    accepts: ['1', '한', '하나', '일'],
  },
  {
    id: 'farmer',
    sentence: '{} 없이는 배가 움직이지 않는다.',
    accepts: ['농부', '농부가'],
  },
  {
    id: 'wolf-eats',
    sentence: '둘만 남으면 늑대는 {} 를 잡아먹는다.',
    accepts: ['염소', '양'],
  },
  {
    id: 'goat-eats',
    sentence: '둘만 남으면 염소는 {} 를 먹는다.',
    accepts: ['양배추', '배추'],
  },
]

export type FinalQuestion =
  | { id: string; kind: 'choice'; prompt: string; choices: string[]; answerIndex: number }
  | { id: string; kind: 'text'; prompt: string }

/** 3단계 — 다 건넌 뒤 생각을 정리한다. */
export const FINAL_QUESTIONS: FinalQuestion[] = [
  {
    id: 'min-moves',
    kind: 'choice',
    prompt: '강을 건너려면 배를 최소 몇 번 움직여야 하나요?',
    choices: ['5번', '6번', '7번', '8번'],
    answerIndex: 2,
  },
  {
    id: 'first-item',
    kind: 'choice',
    prompt: '가장 먼저 태워야 하는 것은 무엇인가요?',
    choices: ['늑대', '염소', '양배추'],
    answerIndex: 1,
  },
  {
    id: 'why-goat',
    kind: 'text',
    prompt: '왜 그것을 가장 먼저 태워야 할까요? 이유를 적어 보세요.',
  },
]
