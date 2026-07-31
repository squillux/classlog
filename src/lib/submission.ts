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
