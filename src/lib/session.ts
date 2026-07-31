import { supabase } from './supabase'
import { isValidClassCode, normalizeClassCode } from './classCode'

const STORAGE_KEY = 'classlog.session'

export type StudentSession = {
  studentId: string
  classId: string
  className: string
  number: number
  displayName: string
}

async function ensureSignedIn(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error(`익명 로그인에 실패했습니다: ${error.message}`)
}

export async function enterClass(
  code: string,
  number: number,
  displayName: string,
): Promise<StudentSession> {
  const normalized = normalizeClassCode(code)
  if (!isValidClassCode(normalized)) {
    throw new Error('학급 코드는 6자리 영문·숫자입니다.')
  }
  const name = displayName.trim()
  if (!name) throw new Error('이름을 입력해 주세요.')

  await ensureSignedIn()

  const { data, error } = await supabase.rpc('enter_class', {
    p_code: normalized,
    p_number: number,
    p_name: name,
  })
  if (error) throw new Error(error.message)

  const row = (data as { student_id: string; class_id: string; class_name: string }[])?.[0]
  if (!row) throw new Error('학급 정보를 받지 못했습니다.')

  const session: StudentSession = {
    studentId: row.student_id,
    classId: row.class_id,
    className: row.class_name,
    number,
    displayName: name,
  }
  saveSession(session)
  return session
}

export function saveSession(session: StudentSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function loadSession(): StudentSession | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StudentSession
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
