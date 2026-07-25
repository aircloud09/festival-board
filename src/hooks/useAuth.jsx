import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  // 프로필 조회가 끝난 사용자의 id. user는 있는데 이 값이 다르면 아직 조회 중입니다.
  // (별도 boolean으로 두면 effect가 실행되기 전 한 프레임 동안 loading=false + profile=null이
  //  되어, 관리자가 /admin을 새로고침할 때 ProtectedRoute가 잘못 리다이렉트합니다)
  const [profileFor, setProfileFor] = useState(null)

  // 1) 마운트 시 세션 복원 + 이후 인증 상태 변화 구독
  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setUser(data.session?.user ?? null)
      })
      .catch((err) => {
        console.error('[auth] 세션 복원 실패', err)
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setSessionLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // 2) 로그인 사용자의 profiles 행 조회 (RLS로 본인 행만 보입니다)
  const userId = user?.id ?? null
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setProfileFor(null)
      return
    }
    if (profileFor === userId) return

    let active = true

    supabase
      .from('profiles')
      .select('id, name, student_id, email, is_admin, created_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('[auth] 프로필 조회 실패', error)
          setProfile(null)
        } else {
          setProfile(data ?? null)
        }
      })
      .finally(() => {
        // 성공/실패 모두 "이 사용자에 대한 조회는 끝났다"로 표시합니다.
        if (active) setProfileFor(userId)
      })

    return () => {
      active = false
    }
  }, [userId, profileFor])

  const signUp = useCallback(async ({ email, password, name, studentId }) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { name, student_id: studentId } },
    })
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    return supabase.auth.signInWithPassword({ email, password })
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setProfileFor(null)
    return { error }
  }, [])

  // 로그인 상태인데 그 사용자의 프로필 조회가 끝나지 않았으면 아직 loading입니다.
  const profilePending = Boolean(userId) && profileFor !== userId

  const value = useMemo(
    () => ({
      user,
      userId,
      profile,
      loading: sessionLoading || profilePending,
      signUp,
      signIn,
      signOut,
    }),
    [user, userId, profile, sessionLoading, profilePending, signUp, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth()는 AuthProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
