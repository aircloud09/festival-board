import { useNavigate } from 'react-router-dom'
import { relativeTime } from '../lib/time'

export default function PostCard({ post }) {
  const navigate = useNavigate()

  return (
    <article
      className="card cursor-pointer transition-colors hover:bg-canvas"
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/post/${post.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/post/${post.id}`)
        }
      }}
    >
      <h2 className="truncate text-[17px] font-bold text-ink">{post.title}</h2>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-ink-soft">
        <span>{post.author_name}</span>
        <span aria-hidden="true">·</span>
        <span>{relativeTime(post.created_at)}</span>
        <span aria-hidden="true">·</span>
        <span>♡ {post.like_count ?? 0}</span>
        <span aria-hidden="true">·</span>
        <span>💬 {post.comment_count ?? 0}</span>
      </div>
    </article>
  )
}
