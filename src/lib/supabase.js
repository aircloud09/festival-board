import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error(
    '[supabase] 환경변수가 없습니다. 프로젝트 루트의 .env.local에 ' +
      'VITE_SUPABASE_URL 과 VITE_SUPABASE_ANON_KEY 를 넣고 개발 서버를 다시 시작하세요.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '')
