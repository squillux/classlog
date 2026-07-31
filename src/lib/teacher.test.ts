import { describe, it, expect, beforeEach, vi } from 'vitest'

const signInWithPassword = vi.fn()
const getUser = vi.fn()
const insert = vi.fn()
const select = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (c: unknown) => signInWithPassword(c),
      getUser: () => getUser(),
    },
    from: () => ({ insert, select: (cols: string) => select(cols) }),
  },
}))

const { signInTeacher, createClass, listClasses } = await import('./teacher')

beforeEach(() => {
  signInWithPassword.mockReset(); getUser.mockReset(); insert.mockReset(); select.mockReset()
  getUser.mockResolvedValue({ data: { user: { id: 't1' } } })
})

describe('signInTeacher', () => {
  it('이메일과 비밀번호로 로그인한다', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    await signInTeacher('a@b.c', 'pw')
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.c', password: 'pw' })
  })

  it('실패를 알린다', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: '자격 증명이 올바르지 않습니다' } })
    await expect(signInTeacher('a@b.c', 'x')).rejects.toThrow('자격 증명이 올바르지 않습니다')
  })
})

describe('createClass', () => {
  it('코드를 만들어 학급을 넣고 만든 행을 돌려준다', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'c1', code: 'AB23CD', name: '1학년 3반' }, error: null,
    })
    insert.mockReturnValue({ select: () => ({ single }) })

    const created = await createClass('1학년 3반')

    expect(created).toEqual({ id: 'c1', code: 'AB23CD', name: '1학년 3반' })
    const arg = insert.mock.calls[0][0]
    expect(arg.name).toBe('1학년 3반')
    expect(arg.teacher_id).toBe('t1')
    expect(arg.code).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('오류를 알린다', async () => {
    insert.mockReturnValue({
      select: () => ({ single: vi.fn().mockResolvedValue({ data: null, error: { message: '실패' } }) }),
    })
    await expect(createClass('1반')).rejects.toThrow('실패')
  })
})

describe('listClasses', () => {
  it('학급 목록을 돌려준다', async () => {
    select.mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: [{ id: 'c1', code: 'AB23CD', name: '1학년 3반' }], error: null,
      }),
    })
    expect(await listClasses()).toEqual([{ id: 'c1', code: 'AB23CD', name: '1학년 3반' }])
  })
})
