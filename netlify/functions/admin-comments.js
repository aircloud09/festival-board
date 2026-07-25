import { errorResponse, HttpError, jsonResponse, requireAdmin, requireMethod } from './_shared/admin.js'

export default async (req) => {
  try {
    requireMethod(req, 'GET')
    const { supabase } = await requireAdmin(req)

    const { data, error } = await supabase
      .from('comments')
      .select(
        'id, post_id, parent_id, content, is_anonymous, deleted_at, created_at, author:profiles!comments_user_id_fkey(id, name, student_id)'
      )
      .order('created_at', { ascending: false })

    if (error) throw new HttpError(500, '댓글 목록을 불러오지 못했습니다.')

    const rows = (data ?? []).map((comment) => ({
      id: comment.id,
      post_id: comment.post_id,
      parent_id: comment.parent_id,
      content: comment.content,
      is_anonymous: comment.is_anonymous,
      deleted_at: comment.deleted_at,
      created_at: comment.created_at,
      author_name: comment.author?.name ?? '',
      author_student_id: comment.author?.student_id ?? '',
    }))

    return jsonResponse(rows)
  } catch (err) {
    return errorResponse(err)
  }
}
