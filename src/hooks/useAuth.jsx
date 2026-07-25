import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  // 세션 복원과 프로필 조회가 모두 끝나야 loading이 false가 됩니다.
  const [sessionLoading, setSessionLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

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
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)

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
        if (active) setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

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
    return { error }
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading: sessionLoading || profileLoading,
      signUp,
      signIn,
      signOut,
    }),
    [user, profile, sessionLoading, profileLoading, signUp, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth()는 AuthProvider 안에서만 쓸 수 있습니다.')
  return ctx
}
