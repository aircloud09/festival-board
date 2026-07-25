import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const TITLE_MAX = 50
const CONTENT_MAX = 1000
const COOLDOWN_SEC = 30
const COOLDOWN_KEY = 'festival-board:last-post-at'

// 시크릿 모드 등에서 localStorage 접근이 막히면 예외가 나므로 감싸둡니다.
function readLastPostAt() {
  try {
    return window.localStorage.getItem(COOLDOWN_KEY)
  } catch {
    return null
  }
}

function writeLastPostAt(value) {
  try {
    window.localStorage.setItem(COOLDOWN_KEY, value)
  } catch {
    // 저장이 막힌 환경에서는 도배 방지만 동작하지 않고 글 등록은 정상 진행됩니다.
  }
}

function remainingCooldown() {
  const raw = readLastPostAt()
  if (!raw) return 0
  const last = Number(raw)
  if (!Number.isFinite(last)) return 0
  const passed = Math.floor((Date.now() - last) / 1000)
  return Math.max(0, COOLDOWN_SEC - passed)
}

export default function PostForm({ onClose, onCreated }) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(() => remainingCooldown())

  // 도배 방지 남은 시간 카운트다운
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown(remainingCooldown())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  // ESC로 닫기
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle || !trimmedContent) {
      setError('제목과 본문을 모두 입력해주세요.')
      return
    }
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        title: trimmedTitle,
        content: trimmedContent,
        is_anonymous: isAnonymous,
      })
      if (insertError) throw insertError

      writeLastPostAt(String(Date.now()))
      onCreated()
      onClose()
    } catch (err) {
      console.error('[post-form] 등록 실패', err)
      setError('글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const blocked = submitting || cooldown > 0

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-t-xl bg-surface p-4 sm:rounded-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold">글쓰기</h2>
          <button
            className="btn-ghost"
            type="button"
            onClick={onClose}
            aria-label="닫기"
            disabled={submitting}
          >
            닫기
          </button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <input
              className="input"
              type="text"
              placeholder="제목"
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="mt-1 text-right text-[13px] text-ink-soft">
              {title.length} / {TITLE_MAX}
            </p>
          </div>

          <div>
            <textarea
              className="input min-h-40 resize-y"
              placeholder="본문"
              value={content}
              maxLength={CONTENT_MAX}
              onChange={(e) => setContent(e.target.value)}
            />
            <p className="mt-1 text-right text-[13px] text-ink-soft">
              {content.length} / {CONTENT_MAX}
            </p>
          </div>

          <label className="flex items-center gap-2 text-[15px]">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            익명으로 작성
          </label>

          {error ? <p className="text-[13px] text-danger">{error}</p> : null}

          <button className="btn-primary w-full" type="submit" disabled={blocked}>
            {submitting
              ? '등록 중...'
              : cooldown > 0
                ? `${cooldown}초 후에 등록할 수 있습니다`
                : '등록'}
          </button>
        </form>
      </div>
    </div>
  )
}
