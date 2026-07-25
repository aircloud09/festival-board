import { useState } from 'react'
import CommentForm from './CommentForm'
import ReportButton from './ReportButton'
import { relativeTime } from '../lib/time'

export default function CommentItem({ comment, postId, onChanged, onDelete }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const isTopLevel = !comment.parent_id
  const children = comment.children ?? []

  return (
    <div>
      <div className="py-3">
        <div className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-soft">
          <span className="font-semibold text-ink">{comment.author_name}</span>
          <span aria-hidden="true">·</span>
          <span>{relativeTime(comment.created_at)}</span>
        </div>

        <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink">{comment.content}</p>

        <div className="mt-2 flex items-center gap-3">
          {isTopLevel ? (
            <button
              className="text-[13px] text-ink-soft"
              type="button"
              onClick={() => setReplyOpen((prev) => !prev)}
            >
              {replyOpen ? '답글 취소' : '답글'}
            </button>
          ) : null}
          <ReportButton targetType="comment" targetId={comment.id} />
          {comment.is_mine ? (
            <button
              className="text-[13px] text-danger"
              type="button"
              onClick={() => onDelete(comment.id)}
            >
              삭제
            </button>
          ) : null}
        </div>

        {replyOpen ? (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCreated={() => {
                setReplyOpen(false)
                onChanged()
              }}
              onCancel={() => setReplyOpen(false)}
            />
          </div>
        ) : null}
      </div>

      {children.length > 0 ? (
        <div className="ml-2 border-l-2 border-line pl-6">
          {children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              postId={postId}
              onChanged={onChanged}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
