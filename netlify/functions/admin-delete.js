import { errorResponse, HttpError, jsonResponse, requireAdmin, requireMethod } from './_shared/admin.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async (req) => {
  try {
    requireMethod(req, 'POST')
    const { supabase } = await requireAdmin(req)

    let body
    try {
      body = await req.json()
    } catch {
      throw new HttpError(400, '요청 형식이 올바르지 않습니다.')
    }

    const type = body?.type
    const id = body?.id

    if (type !== 'post' && type !== 'comment') {
      throw new HttpError(400, 'type은 post 또는 comment여야 합니다.')
    }
    if (typeof id !== 'string' || !UUID_RE.test(id)) {
      throw new HttpError(400, 'id가 올바르지 않습니다.')
    }

    const table = type === 'post' ? 'posts' : 'comments'
    const deletedAt = new Date().toISOString()

    // 실제 DELETE가 아니라 소프트 삭제입니다.
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .select('id, deleted_at')
      .maybeSingle()

    if (error) throw new HttpError(500, '삭제에 실패했습니다.')
    if (!data) throw new HttpError(404, '대상을 찾을 수 없습니다.')

    return jsonResponse({ id: data.id, deleted_at: data.deleted_at })
  } catch (err) {
    return errorResponse(err)
  }
}
