import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { FESTIVAL_NAME, SCHOOL_NAME } from '../lib/config'

export default function Layout({ children }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
    } catch (err) {
      console.error('[layout] 로그아웃 실패', err)
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <Link className="min-w-0 truncate text-[15px] font-bold text-ink" to="/">
            {SCHOOL_NAME} {FESTIVAL_NAME} 게시판
          </Link>

          <nav className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-[13px] text-ink-soft sm:inline">
                  {profile?.name ?? ''}
                </span>
                {profile?.is_admin ? (
                  <Link className="btn-ghost" to="/admin">
                    관리자
                  </Link>
                ) : null}
                <button className="btn-ghost" type="button" onClick={handleSignOut}>
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link className="btn-ghost" to="/login">
                  로그인
                </Link>
                <Link className="btn-ghost" to="/signup">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">{children}</main>
    </div>
  )
}
