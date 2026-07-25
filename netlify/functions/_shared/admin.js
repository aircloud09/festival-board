import { createClient } from '@supabase/supabase-js'

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// service_role 클라이언트는 RLS를 무시합니다.
// 따라서 모든 함수는 requireAdmin을 통과한 뒤에만 쿼리해야 합니다.
function serviceClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // 키 값 자체는 절대 로그에 남기지 않습니다.
    throw new HttpError(500, '서버 설정이 올바르지 않습니다.')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export function errorResponse(err) {
  if (err instanceof HttpError) {
    return jsonResponse({ message: err.message }, err.status)
  }
  console.error('[admin] 예상치 못한 오류', err?.message ?? err)
  return jsonResponse({ message: '요청 처리에 실패했습니다.' }, 500)
}

export function requireMethod(req, method) {
  if (req.method !== method) {
    throw new HttpError(405, '허용되지 않은 메서드입니다.')
  }
}

export async function requireAdmin(req) {
  // 1) Authorization 헤더에서 Bearer 토큰 추출
  const header = req.headers.get('authorization') ?? ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : ''
  if (!token) throw new HttpError(401, '로그인이 필요합니다.')

  // 2) service_role 클라이언트로 토큰 검증
  const supabase = serviceClient()
  const { data, error } = await supabase.auth.getUser(token)

  // 3) 유효하지 않은 토큰
  if (error || !data?.user) throw new HttpError(401, '로그인이 필요합니다.')

  // 4) 관리자 여부 확인
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) throw new HttpError(500, '요청 처리에 실패했습니다.')
  if (!profile?.is_admin) throw new HttpError(403, '권한이 없습니다.')

  // 5) 통과
  return { supabase, user: data.user }
}
