import { errorResponse, HttpError, jsonResponse, requireAdmin, requireMethod } from './_shared/admin.js'

export default async (req) => {
  try {
    requireMethod(req, 'GET')
    const { supabase } = await requireAdmin(req)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, student_id, email, created_at')
      .order('created_at', { ascending: true })

    if (error) throw new HttpError(500, '회원 목록을 불러오지 못했습니다.')

    return jsonResponse(data ?? [])
  } catch (err) {
    return errorResponse(err)
  }
}
