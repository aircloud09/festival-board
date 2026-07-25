import { useCallback, useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import { deleteTarget, fetchComments, fetchPosts, fetchReports, fetchUsers } from '../lib/adminApi'
import { compactToday, formatDateTime } from '../lib/time'

const TABS = [
  { key: 'users', label: '회원' },
  { key: 'posts', label: '게시글' },
  { key: 'comments', label: '댓글' },
  { key: 'reports', label: '신고' },
]

const LOADERS = {
  users: fetchUsers,
  posts: fetchPosts,
  comments: fetchComments,
  reports: fetchReports,
}

export default function AdminPage() {
  const [tab, setTab] = useState('users')
  // 탭별로 한 번만 불러오고 캐시합니다.
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    async (key) => {
      setLoading(true)
      setError('')
      try {
        const rows = await LOADERS[key]()
        setData((prev) => ({ ...prev, [key]: rows }))
      } catch (err) {
        console.error('[admin] 조회 실패', err)
        setError(err.message ?? '불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (data[tab] === undefined) load(tab)
  }, [tab, data, load])

  async function handleDelete(type, id) {
    if (!window.confirm('이 항목을 삭제하시겠습니까?')) return
    try {
      const result = await deleteTarget(type, id)
      const key = type === 'post' ? 'posts' : 'comments'
      setData((prev) => {
        const next = { ...prev }
        if (next[key]) {
          next[key] = next[key].map((row) =>
            row.id === id ? { ...row, deleted_at: result.deleted_at } : row
          )
        }
        if (next.reports) {
          next.reports = next.reports.map((row) =>
            row.target_type === type && row.target_id === id
              ? { ...row, target_deleted_at: result.deleted_at }
              : row
          )
        }
        return next
      })
    } catch (err) {
      console.error('[admin] 삭제 실패', err)
      window.alert(err.message ?? '삭제에 실패했습니다.')
    }
  }

  const rows = data[tab] ?? []

  return (
    <Layout>
      <h1 className="text-[17px] font-bold">관리자</h1>

      <div className="mt-3 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] ${
              tab === t.key ? 'bg-brand text-white' : 'border border-line bg-surface text-ink'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-[13px] text-danger">{error}</p> : null}

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-3">
          {tab === 'users' ? <UsersTab rows={rows} /> : null}
          {tab === 'posts' ? (
            <ContentTab rows={rows} type="post" onDelete={handleDelete} />
          ) : null}
          {tab === 'comments' ? (
            <ContentTab rows={rows} type="comment" onDelete={handleDelete} />
          ) : null}
          {tab === 'reports' ? <ReportsTab rows={rows} onDelete={handleDelete} /> : null}
        </div>
      )}
    </Layout>
  )
}

function TableShell({ head, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
        <thead className="bg-canvas text-ink-soft">
          <tr>
            {head.map((label) => (
              <th key={label} className="whitespace-nowrap border-b border-line px-3 py-2 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function UsersTab({ rows }) {
  // 학번 기준 정렬
  const sorted = [...rows].sort((a, b) => a.student_id.localeCompare(b.student_id))

  function handleExport() {
    const header = ['이름', '학번', '이메일', '가입일']
    const lines = [header, ...sorted.map((u) => [u.name, u.student_id, u.email, formatDateTime(u.created_at)])]
    const csv = lines.map((cols) => cols.map(csvCell).join(',')).join('\r\n')

    // 엑셀 한글 깨짐 방지용 BOM
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `회원목록_${compactToday()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[13px] text-ink-soft">총 {sorted.length}명</p>
        <button className="btn-ghost" type="button" onClick={handleExport} disabled={sorted.length === 0}>
          CSV 내보내기
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="card text-[13px] text-ink-soft">회원이 없습니다.</div>
      ) : (
        <TableShell head={['이름', '학번', '이메일', '가입일']}>
          {sorted.map((user) => (
            <tr key={user.id} className="border-b border-line last:border-0">
              <td className="px-3 py-2">{user.name}</td>
              <td className="px-3 py-2">{user.student_id}</td>
              <td className="px-3 py-2">{user.email}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatDateTime(user.created_at)}</td>
            </tr>
          ))}
        </TableShell>
      )}
    </>
  )
}

function ContentTab({ rows, type, onDelete }) {
  if (rows.length === 0) {
    return (
      <div className="card text-[13px] text-ink-soft">
        {type === 'post' ? '게시글이 없습니다.' : '댓글이 없습니다.'}
      </div>
    )
  }

  return (
    <>
      <p className="mb-2 text-[13px] text-ink-soft">총 {rows.length}건</p>
      <TableShell head={['작성자', '학번', '내용', '작성일', '익명', '상태', '']}>
        {rows.map((row) => {
          const deleted = Boolean(row.deleted_at)
          return (
            <tr
              key={row.id}
              className={`border-b border-line last:border-0 ${deleted ? 'bg-canvas text-ink-soft' : ''}`}
            >
              <td className="whitespace-nowrap px-3 py-2">{row.author_name}</td>
              <td className="whitespace-nowrap px-3 py-2">{row.author_student_id}</td>
              {/* line-clamp는 display를 -webkit-box로 바꾸므로 display 유틸리티와 같이 쓰면 안 됩니다 */}
              <td className="max-w-[280px] px-3 py-2">
                {row.title ? <p className="truncate font-semibold">{row.title}</p> : null}
                <p className="line-clamp-2">{row.content}</p>
              </td>
              <td className="whitespace-nowrap px-3 py-2">{formatDateTime(row.created_at)}</td>
              <td className="whitespace-nowrap px-3 py-2">{row.is_anonymous ? '익명' : '실명'}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {deleted ? (
                  <span className="rounded bg-line px-2 py-0.5 text-[13px]">삭제됨</span>
                ) : (
                  '정상'
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {deleted ? null : (
                  <button
                    className="text-[13px] text-danger"
                    type="button"
                    onClick={() => onDelete(type, row.id)}
                  >
                    삭제
                  </button>
                )}
              </td>
            </tr>
          )
        })}
      </TableShell>
    </>
  )
}

function ReportsTab({ rows, onDelete }) {
  if (rows.length === 0) {
    return <div className="card text-[13px] text-ink-soft">접수된 신고가 없습니다.</div>
  }

  return (
    <>
      <p className="mb-2 text-[13px] text-ink-soft">총 {rows.length}건</p>
      <TableShell head={['신고자', '학번', '종류', '대상 내용', '신고일', '']}>
        {rows.map((report) => {
          const deleted = Boolean(report.target_deleted_at)
          return (
            <tr
              key={report.id}
              className={`border-b border-line last:border-0 ${deleted ? 'bg-canvas text-ink-soft' : ''}`}
            >
              <td className="whitespace-nowrap px-3 py-2">{report.reporter_name}</td>
              <td className="whitespace-nowrap px-3 py-2">{report.reporter_student_id}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {report.target_type === 'post' ? '게시글' : '댓글'}
              </td>
              <td className="max-w-[280px] px-3 py-2">
                {report.target_title ? (
                  <p className="truncate font-semibold">{report.target_title}</p>
                ) : null}
                <p className="line-clamp-2">
                  {report.target_content ?? '(대상을 찾을 수 없습니다)'}
                </p>
              </td>
              <td className="whitespace-nowrap px-3 py-2">{formatDateTime(report.created_at)}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {deleted ? (
                  <span className="rounded bg-line px-2 py-0.5 text-[13px]">삭제됨</span>
                ) : (
                  <button
                    className="text-[13px] text-danger"
                    type="button"
                    onClick={() => onDelete(report.target_type, report.target_id)}
                  >
                    대상 삭제
                  </button>
                )}
              </td>
            </tr>
          )
        })}
      </TableShell>
    </>
  )
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
