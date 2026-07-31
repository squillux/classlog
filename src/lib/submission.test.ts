import { describe, it, expect, beforeEach, vi } from 'vitest'

const insert = vi.fn()
const select = vi.fn()

vi.mock('./supabase', () => ({
  supabase: { from: (table: string) => ({ insert, select: (cols: string) => select(table, cols) }) },
}))

const { saveSubmission, listSubmissions, listSubmittedActivityIds } =
  await import('./submission')

beforeEach(() => {
  insert.mockReset()
  select.mockReset()
})

describe('saveSubmission', () => {
  it('제출물을 넣는다', async () => {
    insert.mockResolvedValue({ error: null })
    await saveSubmission('s1', 'quiz', { score: 3 })
    expect(insert).toHaveBeenCalledWith({
      student_id: 's1', activity_id: 'quiz', payload: { score: 3 },
    })
  })

  it('오류를 알린다', async () => {
    insert.mockResolvedValue({ error: { message: '권한이 없습니다' } })
    await expect(saveSubmission('s1', 'quiz', {})).rejects.toThrow('권한이 없습니다')
  })
})

describe('listSubmittedActivityIds', () => {
  it('학생이 낸 활동 id 를 돌려준다', async () => {
    select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ activity_id: 'quiz' }, { activity_id: 'burger' }], error: null,
      }),
    })
    expect(await listSubmittedActivityIds('s1')).toEqual(['quiz', 'burger'])
  })

  it('같은 활동을 여러 번 냈어도 한 번만 센다', async () => {
    select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ activity_id: 'quiz' }, { activity_id: 'quiz' }], error: null,
      }),
    })
    expect(await listSubmittedActivityIds('s1')).toEqual(['quiz'])
  })

  it('낸 것이 없으면 빈 배열', async () => {
    select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })
    expect(await listSubmittedActivityIds('s1')).toEqual([])
  })

  it('오류를 알린다', async () => {
    select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: '실패' } }),
    })
    await expect(listSubmittedActivityIds('s1')).rejects.toThrow('실패')
  })
})

describe('listSubmissions', () => {
  it('학급의 제출물을 최신순으로 평평하게 만들어 돌려준다', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'sub1', activity_id: 'quiz', payload: { score: 3 },
          created_at: '2026-07-31T01:00:00Z',
          students: { display_name: '김하늘', number: 7, class_id: 'c1' },
        },
      ],
      error: null,
    })
    select.mockReturnValue({ eq: () => ({ order }) })

    const rows = await listSubmissions('c1')

    expect(rows).toEqual([
      {
        id: 'sub1', activityId: 'quiz', payload: { score: 3 },
        createdAt: '2026-07-31T01:00:00Z', studentName: '김하늘', studentNumber: 7,
      },
    ])
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('오류를 알린다', async () => {
    select.mockReturnValue({
      eq: () => ({ order: vi.fn().mockResolvedValue({ data: null, error: { message: '실패' } }) }),
    })
    await expect(listSubmissions('c1')).rejects.toThrow('실패')
  })
})
