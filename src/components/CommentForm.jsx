import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const CONTENT_MAX = 500

export default function CommentForm({ postId, parentId = null, onCreated, onCancel }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmed = content.trim()
    if (!trimmed) {
      setError('내용을 입력해주세요.')
      return
    }
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        parent_id: parentId,
        content: trimmed,
        is_anonymous: isAnonymous,
      })
      if (insertError) throw insertError

      setContent('')
      onCreated()
    } catch (err) {
      console.error('[comment-form] 등록 실패', err)
      setError('댓글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit} noValidate>
      <textarea
        className="input min-h-20 resize-y"
        placeholder={parentId ? '답글을 입력하세요' : '댓글을 입력하세요'}
        value={content}
        maxLength={CONTENT_MAX}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          익명
        </label>

        <div className="flex items-center gap-2">
          <span className="text-[13px] text-ink-soft">
            {content.length} / {CONTENT_MAX}
          </span>
          {onCancel ? (
            <button className="btn-ghost" type="button" onClick={onCancel} disabled={submitting}>
              취소
            </button>
          ) : null}
          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>

      {error ? <p className="text-[13px] text-danger">{error}</p> : null}
    </form>
  )
}
