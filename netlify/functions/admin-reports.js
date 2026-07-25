import { errorResponse, HttpError, jsonResponse, requireAdmin, requireMethod } from './_shared/admin.js'

export default async (req) => {
  try {
    requireMethod(req, 'GET')
    const { supabase } = await requireAdmin(req)

    const { data: reports, error } = await supabase
      .from('reports')
      .select(
        'id, target_type, target_id, created_at, reporter:profiles!reports_reporter_id_fkey(id, name, student_id)'
      )
      .order('created_at', { ascending: false })

    if (error) throw new HttpError(500, '신고 목록을 불러오지 못했습니다.')

    const rows = reports ?? []
    const postIds = rows.filter((r) => r.target_type === 'post').map((r) => r.target_id)
    const commentIds = rows.filter((r) => r.target_type === 'comment').map((r) => r.target_id)

    // target_id는 posts/comments 중 어느 쪽이든 가리키므로 종류별로 나눠 조회합니다.
    const [postsResult, commentsResult] = await Promise.all([
      postIds.length
        ? supabase.from('posts').select('id, title, content, deleted_at').in('id', postIds)
        : Promise.resolve({ data: [], error: null }),
      commentIds.length
        ? supabase.from('comments').select('id, post_id, content, deleted_at').in('id', commentIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (postsResult.error || commentsResult.error) {
      throw new HttpError(500, '신고 대상을 불러오지 못했습니다.')
    }

    const postMap = new Map((postsResult.data ?? []).map((p) => [p.id, p]))
    const commentMap = new Map((commentsResult.data ?? []).map((c) => [c.id, c]))

    const result = rows.map((report) => {
      const target =
        report.target_type === 'post'
          ? postMap.get(report.target_id)
          : commentMap.get(report.target_id)

      return {
        id: report.id,
        target_type: report.target_type,
        target_id: report.target_id,
        created_at: report.created_at,
        reporter_name: report.reporter?.name ?? '',
        reporter_student_id: report.reporter?.student_id ?? '',
        target_title: target?.title ?? null,
        target_content: target?.content ?? null,
        target_post_id: report.target_type === 'post' ? report.target_id : (target?.post_id ?? null),
        target_deleted_at: target?.deleted_at ?? null,
      }
    })

    return jsonResponse(result)
  } catch (err) {
    return errorResponse(err)
  }
}
