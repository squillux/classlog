import { describe, it, expect, beforeEach, vi } from 'vitest'

const signInAnonymously = vi.fn()
const getSession = vi.fn()
const rpc = vi.fn()

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: () => signInAnonymously(),
      getSession: () => getSession(),
    },
    rpc: (name: string, args: unknown) => rpc(name, args),
  },
}))

const { enterClass, saveSession, loadSession, clearSession } = await import('./session')

beforeEach(() => {
  localStorage.clear()
  signInAnonymously.mockReset()
  getSession.mockReset()
  rpc.mockReset()
  getSession.mockResolvedValue({ data: { session: null } })
  signInAnonymously.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
})

describe('enterClass', () => {
  it('코드를 정규화해서 RPC에 넘긴다', async () => {
    rpc.mockResolvedValue({
      data: [{ student_id: 's1', class_id: 'c1', class_name: '1학년 3반' }],
      error: null,
    })

    await enterClass(' ab12cd ', 7, ' 김하늘 ')

    expect(rpc).toHaveBeenCalledWith('enter_class', {
      p_code: 'AB12CD',
      p_number: 7,
      p_name: '김하늘',
    })
  })

  it('세션 정보를 돌려주고 저장한다', async () => {
    rpc.mockResolvedValue({
      data: [{ student_id: 's1', class_id: 'c1', class_name: '1학년 3반' }],
      error: null,
    })

    const session = await enterClass('AB12CD', 7, '김하늘')

    expect(session).toEqual({
      studentId: 's1',
      classId: 'c1',
      className: '1학년 3반',
      number: 7,
      displayName: '김하늘',
    })
    expect(loadSession()).toEqual(session)
  })

  it('로그인 세션이 이미 있으면 익명 로그인을 다시 하지 않는다', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    rpc.mockResolvedValue({
      data: [{ student_id: 's1', class_id: 'c1', class_name: '1반' }],
      error: null,
    })

    await enterClass('AB12CD', 1, '홍길동')

    expect(signInAnonymously).not.toHaveBeenCalled()
  })

  it('코드 형식이 틀리면 RPC를 부르지 않고 거절한다', async () => {
    await expect(enterClass('AB12', 7, '김하늘')).rejects.toThrow('학급 코드는 6자리')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('RPC 오류를 그대로 알린다', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: '학급 코드를 찾을 수 없습니다' } })
    await expect(enterClass('AB12CD', 7, '김하늘')).rejects.toThrow('학급 코드를 찾을 수 없습니다')
  })
})

describe('세션 보관', () => {
  it('저장한 세션을 다시 읽는다', () => {
    const session = {
      studentId: 's1', classId: 'c1', className: '1반', number: 7, displayName: '김하늘',
    }
    saveSession(session)
    expect(loadSession()).toEqual(session)
  })

  it('저장된 것이 없으면 null', () => {
    expect(loadSession()).toBeNull()
  })

  it('망가진 값이 들어 있으면 null 을 주고 지운다', () => {
    localStorage.setItem('classlog.session', '{깨진 JSON')
    expect(loadSession()).toBeNull()
    expect(localStorage.getItem('classlog.session')).toBeNull()
  })

  it('clearSession 이 지운다', () => {
    saveSession({
      studentId: 's1', classId: 'c1', className: '1반', number: 7, displayName: '김하늘',
    })
    clearSession()
    expect(loadSession()).toBeNull()
  })
})
