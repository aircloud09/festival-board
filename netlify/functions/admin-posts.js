import { errorResponse, HttpError, jsonResponse, requireAdmin, requireMethod } from './_shared/admin.js'

export default async (req) => {
  try {
    requireMethod(req, 'GET')
    const { supabase } = await requireAdmin(req)

    // 삭제된 글도 포함 — 선생님이 원본 확인을 요청할 수 있기 때문
    const { data, error } = await supabase
      .from('posts')
      .select(
        'id, title, content, is_anonymous, deleted_at, created_at, author:profiles!posts_user_id_fkey(id, name, student_id)'
      )
      .order('created_at', { ascending: false })

    if (error) throw new HttpError(500, '게시글 목록을 불러오지 못했습니다.')

    const rows = (data ?? []).map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      is_anonymous: post.is_anonymous,
      deleted_at: post.deleted_at,
      created_at: post.created_at,
      author_name: post.author?.name ?? '',
      author_student_id: post.author?.student_id ?? '',
    }))

    return jsonResponse(rows)
  } catch (err) {
    return errorResponse(err)
  }
}
