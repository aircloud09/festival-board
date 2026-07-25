import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import LikeButton from '../components/LikeButton'
import ReportButton from '../components/ReportButton'
import CommentForm from '../components/CommentForm'
import CommentItem from '../components/CommentItem'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { relativeTime } from '../lib/time'

// parent_id 기준으로 1단계 트리를 만듭니다. (대댓글의 대댓글은 없음)
function buildTree(rows) {
  const roots = []
  const byId = new Map()

  rows.forEach((row) => {
    byId.set(row.id, { ...row, children: [] })
  })

  rows.forEach((row) => {
    const node = byId.get(row.id)
    const parent = row.parent_id ? byId.get(row.parent_id) : null
    // 부모가 삭제되어 목록에 없으면 최상위로 올려 답글이 사라지지 않게 합니다.
    if (parent) parent.children.push(node)
    else roots.push(node)
  })

  return roots
}

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadComments = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('comments_public')
      .select('id, post_id, parent_id, author_name, content, created_at, is_mine')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    if (queryError) throw queryError
    setComments(buildTree(data ?? []))
  }, [id])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotFound(false)
    try {
      const { data, error: postError } = await supabase
        .from('posts_public')
        .select(
          'id, author_name, title, content, created_at, like_count, comment_count, liked_by_me, is_mine'
        )
        .eq('id', id)
        .maybeSingle()

      if (postError) throw postError
      if (!data) {
        setNotFound(true)
        return
      }

      setPost(data)
      await loadComments()
    } catch (err) {
      console.error('[post-detail] 조회 실패', err)
      setError('게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [id, loadComments])

  useEffect(() => {
    if (authLoading || !user) return
    loadAll()
  }, [authLoading, user, loadAll])

  async function refreshComments() {
    try {
      await loadComments()
    } catch (err) {
      console.error('[post-detail] 댓글 조회 실패', err)
      setError('댓글을 불러오지 못했습니다.')
    }
  }

  async function handleDeletePost() {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (updateError) throw updateError
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[post-detail] 삭제 실패', err)
      window.alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeleteComment(commentId) {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return
    try {
      const { error: updateError } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)
      if (updateError) throw updateError
      await refreshComments()
    } catch (err) {
      console.error('[post-detail] 댓글 삭제 실패', err)
      window.alert('댓글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
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
          <div className="mt-4 flex justify-center gap-2">
            <Link className="btn-primary" to="/login">
              로그인
            </Link>
            <Link className="btn-ghost" to="/">
              목록으로
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    )
  }

  if (notFound) {
    return (
      <Layout>
        <div className="card text-center">
          <p className="text-[15px]">삭제되었거나 존재하지 않는 게시글입니다.</p>
          <Link className="btn-ghost mt-4" to="/">
            목록으로
          </Link>
        </div>
      </Layout>
    )
  }

  if (error && !post) {
    return (
      <Layout>
        <div className="card text-center">
          <p className="text-[15px] text-danger">{error}</p>
          <Link className="btn-ghost mt-4" to="/">
            목록으로
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Link className="text-[13px] text-ink-soft hover:underline" to="/">
        ← 목록으로
      </Link>

      <article className="card mt-2">
        <h1 className="text-[17px] font-bold">{post.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-soft">
          <span>{post.author_name}</span>
          <span aria-hidden="true">·</span>
          <span>{relativeTime(post.created_at)}</span>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-[15px]">{post.content}</p>

        <div className="mt-4 flex items-center gap-4 border-t border-line pt-3">
          <LikeButton
            postId={post.id}
            initialCount={post.like_count ?? 0}
            initialLiked={Boolean(post.liked_by_me)}
          />
          <ReportButton targetType="post" targetId={post.id} />
          {post.is_mine ? (
            <button
              className="text-[13px] text-danger"
              type="button"
              onClick={handleDeletePost}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          ) : null}
        </div>
      </article>

      <section className="card mt-3">
        <h2 className="text-[15px] font-bold">댓글</h2>

        {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}

        <div className="divide-y divide-line">
          {comments.length === 0 ? (
            <p className="py-4 text-[13px] text-ink-soft">첫 댓글을 남겨보세요.</p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
                onChanged={refreshComments}
                onDelete={handleDeleteComment}
              />
            ))
          )}
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <CommentForm postId={post.id} onCreated={refreshComments} />
        </div>
      </section>
    </Layout>
  )
}
