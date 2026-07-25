import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import PostCard from '../components/PostCard'
import PostForm from '../components/PostForm'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 20

export default function BoardPage() {
  const { user, loading: authLoading } = useAuth()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const fetchPage = useCallback(async (offset) => {
    const { data, error: queryError } = await supabase
      .from('posts_public')
      .select('id, author_name, title, created_at, like_count, comment_count')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (queryError) throw queryError
    return data ?? []
  }, [])

  const loadFirstPage = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await fetchPage(0)
      setPosts(rows)
      setHasMore(rows.length === PAGE_SIZE)
    } catch (err) {
      console.error('[board] 목록 조회 실패', err)
      setError('게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [fetchPage])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setPosts([])
      return
    }
    loadFirstPage()
  }, [authLoading, user, loadFirstPage])

  async function handleLoadMore() {
    setLoadingMore(true)
    setError('')
    try {
      const rows = await fetchPage(posts.length)
      setPosts((prev) => [...prev, ...rows])
      setHasMore(rows.length === PAGE_SIZE)
    } catch (err) {
      console.error('[board] 추가 조회 실패', err)
      setError('게시글을 더 불러오지 못했습니다.')
    } finally {
      setLoadingMore(false)
    }
  }

  if (authLoading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className="card text-center">
          <p className="text-[15px]">로그인이 필요합니다.</p>
          <p className="mt-1 text-[13px] text-ink-soft">
            학교 계정 정보로 가입하면 게시판을 이용할 수 있습니다.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link className="btn-primary" to="/login">
              로그인
            </Link>
            <Link className="btn-ghost" to="/signup">
              회원가입
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {error ? <p className="mb-3 text-[13px] text-danger">{error}</p> : null}

      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <div className="card text-center text-[15px] text-ink-soft">첫 글을 남겨보세요.</div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {!loading && hasMore ? (
        <div className="mt-4 flex justify-center">
          <button className="btn-ghost" type="button" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? '불러오는 중...' : '더 보기'}
          </button>
        </div>
      ) : null}

      <button
        className="fixed bottom-5 right-5 z-20 h-14 w-14 rounded-full bg-brand text-2xl font-bold
          text-white shadow-lg transition-colors hover:bg-brand-dark"
        type="button"
        aria-label="글쓰기"
        onClick={() => setFormOpen(true)}
      >
        +
      </button>

      {formOpen ? (
        <PostForm onClose={() => setFormOpen(false)} onCreated={loadFirstPage} />
      ) : null}
    </Layout>
  )
}
