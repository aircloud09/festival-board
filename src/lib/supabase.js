import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.error(
    '[supabase] 환경변수가 없습니다. 프로젝트 루트의 .env.local에 ' +
      'VITE_SUPABASE_URL 과 VITE_SUPABASE_ANON_KEY 를 넣고 개발 서버를 다시 시작하세요.'
  )
}

// 값이 없을 때 createClient가 예외를 던지면 화면이 통째로 하얗게 남습니다.
// 형식만 맞춘 자리표시자로 클라이언트를 만들고, 안내 화면은 main.jsx에서 보여줍니다.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
