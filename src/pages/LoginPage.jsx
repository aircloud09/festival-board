import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FESTIVAL_NAME, SCHOOL_NAME } from '../lib/config'
import Spinner from '../components/Spinner'

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner />
  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const { error } = await signIn({ email: email.trim(), password })
      if (error) {
        setFormError('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[login] 실패', err)
      setFormError('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <h1 className="text-[17px] font-bold">
          {SCHOOL_NAME} {FESTIVAL_NAME} 게시판
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">로그인</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <label className="block">
            <span className="mb-1 block text-[13px] text-ink-soft">이메일</span>
            <input
              className="input"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[13px] text-ink-soft">비밀번호</span>
            <input
              className="input"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {formError ? <p className="text-[13px] text-danger">{formError}</p> : null}

          <button className="btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-4 text-center text-[13px] text-ink-soft">
          계정이 없나요?{' '}
          <Link className="text-brand hover:underline" to="/signup">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
