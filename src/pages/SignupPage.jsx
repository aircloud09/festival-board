import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { FESTIVAL_NAME, SCHOOL_NAME, STUDENT_ID_LENGTH, STUDENT_ID_PATTERN } from '../lib/config'
import Spinner from '../components/Spinner'

function translateSignupError(message) {
  const text = (message ?? '').toLowerCase()
  if (text.includes('already registered') || text.includes('already been registered')) {
    return '이미 가입된 이메일입니다.'
  }
  // 학번 unique 제약 위반으로 트리거가 실패하면 Supabase가 이 메시지를 냅니다.
  if (text.includes('database error saving new user')) {
    return '이미 가입된 학번입니다.'
  }
  return '가입에 실패했습니다. 잠시 후 다시 시도해주세요.'
}

export default function SignupPage() {
  const { user, loading, signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner />
  if (user) return <Navigate to="/" replace />

  function validate() {
    const errors = {}
    const trimmedName = name.trim()

    if (trimmedName.length < 1 || trimmedName.length > 20) {
      errors.name = '이름은 1~20자로 입력해주세요.'
    }
    if (!STUDENT_ID_PATTERN.test(studentId)) {
      errors.studentId = `학번은 숫자 ${STUDENT_ID_LENGTH}자리로 입력해주세요.`
    }
    if (!email.includes('@')) {
      errors.email = '이메일 형식이 올바르지 않습니다.'
    }
    if (password.length < 6) {
      errors.password = '비밀번호는 6자 이상이어야 합니다.'
    }
    if (password !== passwordConfirm) {
      errors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      // 1) 학번 중복 사전 확인 — 트리거 실패로 인한 불친절한 500 에러를 피하기 위함
      const { data: taken, error: rpcError } = await supabase.rpc('is_student_id_taken', {
        sid: studentId,
      })
      if (rpcError) {
        setFormError('가입에 실패했습니다. 잠시 후 다시 시도해주세요.')
        return
      }
      if (taken) {
        setFieldErrors((prev) => ({ ...prev, studentId: '이미 가입된 학번입니다.' }))
        return
      }

      // 2) 실제 가입
      const { error } = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        studentId,
      })
      if (error) {
        setFormError(translateSignupError(error.message))
        return
      }

      navigate('/', { replace: true })
    } catch (err) {
      console.error('[signup] 실패', err)
      setFormError('가입에 실패했습니다. 잠시 후 다시 시도해주세요.')
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
        <p className="mt-1 text-[13px] text-ink-soft">회원가입</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <Field label="이름" error={fieldErrors.name}>
            <input
              className="input"
              type="text"
              value={name}
              maxLength={20}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="학번" error={fieldErrors.studentId}>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              value={studentId}
              maxLength={STUDENT_ID_LENGTH}
              placeholder={'0'.repeat(STUDENT_ID_LENGTH)}
              onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </Field>

          <Field label="이메일" error={fieldErrors.email}>
            <input
              className="input"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="비밀번호" error={fieldErrors.password}>
            <input
              className="input"
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Field label="비밀번호 확인" error={fieldErrors.passwordConfirm}>
            <input
              className="input"
              type="password"
              value={passwordConfirm}
              autoComplete="new-password"
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </Field>

          {formError ? <p className="text-[13px] text-danger">{formError}</p> : null}

          <button className="btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="mt-4 text-center text-[13px] text-ink-soft">
          이미 계정이 있나요?{' '}
          <Link className="text-brand hover:underline" to="/login">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[13px] text-ink-soft">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[13px] text-danger">{error}</span> : null}
    </label>
  )
}
