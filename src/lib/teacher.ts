import { supabase } from './supabase'
import { generateClassCode } from './classCode'

export type ClassRow = { id: string; code: string; name: string }

export async function signInTeacher(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function createClass(name: string): Promise<ClassRow> {
  const { data: userData } = await supabase.auth.getUser()
  const teacherId = userData.user?.id
  if (!teacherId) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('classes')
    .insert({ name: name.trim(), code: generateClassCode(), teacher_id: teacherId })
    .select('id, code, name')
    .single()
  if (error) throw new Error(error.message)
  return data as ClassRow
}

/**
 * 학급을 지운다. 스키마의 on delete cascade 때문에 그 학급의 학생과
 * 제출물도 함께 사라진다. 부르는 쪽에서 반드시 확인을 받아야 한다.
 */
export async function deleteClass(id: string): Promise<void> {
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listClasses(): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('id, code, name')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ClassRow[]
}
