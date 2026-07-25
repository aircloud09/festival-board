import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function ReportButton({ targetType, targetId }) {
  const { user } = useAuth()
  const [reported, setReported] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (pending || reported || !user) return
    const label = targetType === 'post' ? '이 글을' : '이 댓글을'
    if (!window.confirm(`${label} 신고하시겠습니까?`)) return

    setPending(true)
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
      })

      if (error) {
        if (error.code === '23505') {
          setReported(true)
          window.alert('이미 신고한 글입니다.')
          return
        }
        throw error
      }

      setReported(true)
      window.alert('신고가 접수되었습니다.')
    } catch (err) {
      console.error('[report] 실패', err)
      window.alert('신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      className="text-[13px] text-ink-soft disabled:opacity-60"
      type="button"
      onClick={handleClick}
      disabled={reported || pending}
    >
      {reported ? '신고됨' : '신고'}
    </button>
  )
}
