import { supabase } from './supabase'

export type SubmissionRow = {
  id: string
  activityId: string
  payload: unknown
  createdAt: string
  studentName: string
  studentNumber: number
}

type RawRow = {
  id: string
  activity_id: string
  payload: unknown
  created_at: string
  students: { display_name: string; number: number; class_id: string }
}

export async function saveSubmission(
  studentId: string,
  activityId: string,
  payload: unknown,
): Promise<void> {
  const { error } = await supabase.from('submissions').insert({
    student_id: studentId,
    activity_id: activityId,
    payload,
  })
  if (error) throw new Error(error.message)
}

/**
 * 이 학생이 이미 낸 활동의 id 목록. 같은 활동을 여러 번 냈어도 한 번만 센다.
 * RLS 가 자기 제출물만 보여주므로 남의 것은 섞이지 않는다.
 */
export async function listSubmittedActivityIds(studentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('activity_id')
    .eq('student_id', studentId)
  if (error) throw new Error(error.message)

  const seen = new Set<string>()
  for (const row of (data ?? []) as { activity_id: string }[]) seen.add(row.activity_id)
  return [...seen]
}

export async function listSubmissions(classId: string): Promise<SubmissionRow[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id, activity_id, payload, created_at, students!inner(display_name, number, class_id)')
    .eq('students.class_id', classId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    activityId: row.activity_id,
    payload: row.payload,
    createdAt: row.created_at,
    studentName: row.students.display_name,
    studentNumber: row.students.number,
  }))
}
