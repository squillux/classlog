import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Supabase 환경 변수가 없습니다. .env.local 에 VITE_SUPABASE_URL 과 ' +
      'VITE_SUPABASE_ANON_KEY 를 채운 뒤 개발 서버를 다시 시작하세요. ' +
      '(.env.example 참고)',
  )
}

export const supabase = createClient(url, anonKey)
