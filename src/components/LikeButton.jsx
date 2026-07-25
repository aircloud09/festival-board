import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function LikeButton({ postId, initialCount = 0, initialLiked = false }) {
  const { user } = useAuth()
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(initialLiked)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (pending || !user) return

    const prevLiked = liked
    const prevCount = count

    // 낙관적 업데이트 — UI를 먼저 바꾸고 서버에 요청
    setLiked(!prevLiked)
    setCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1)
    setPending(true)

    try {
      const { error } = prevLiked
        ? await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id)
        : await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
      if (error) throw error
    } catch (err) {
      console.error('[like] 실패', err)
      setLiked(prevLiked)
      setCount(prevCount)
      window.alert('좋아요 처리에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      className={`inline-flex items-center gap-1 text-[13px] ${
        liked ? 'text-like' : 'text-ink-soft'
      }`}
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label="좋아요"
    >
      <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
