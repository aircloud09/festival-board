import { supabase } from './supabase'

const BASE = '/.netlify/functions'

async function request(path, options = {}) {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error('권한이 없습니다.')

  const res = await fetch(`${BASE}/${path}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      authorization: `Bearer ${data.session.access_token}`,
    },
  })

  if (res.status === 401 || res.status === 403) throw new Error('권한이 없습니다.')

  if (!res.ok) {
    let message = '요청 처리에 실패했습니다.'
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // 응답 본문이 JSON이 아니면 기본 메시지를 씁니다.
    }
    throw new Error(message)
  }

  return res.json()
}

export function fetchUsers() {
  return request('admin-users')
}

export function fetchPosts() {
  return request('admin-posts')
}

export function fetchComments() {
  return request('admin-comments')
}

export function fetchReports() {
  return request('admin-reports')
}

export function deleteTarget(type, id) {
  return request('admin-delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type, id }),
  })
}
