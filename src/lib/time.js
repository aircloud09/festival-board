// 상대시간 표시 — 라이브러리 없이 직접 구현
// 방금 전 / n분 전 / n시간 전 / n일 전 / YYYY.MM.DD
export function relativeTime(value) {
  if (!value) return ''
  const then = new Date(value)
  if (Number.isNaN(then.getTime())) return ''

  const diffSec = Math.floor((Date.now() - then.getTime()) / 1000)

  if (diffSec < 60) return '방금 전'
  if (diffSec < 60 * 60) return `${Math.floor(diffSec / 60)}분 전`
  if (diffSec < 60 * 60 * 24) return `${Math.floor(diffSec / 3600)}시간 전`
  if (diffSec < 60 * 60 * 24 * 7) return `${Math.floor(diffSec / 86400)}일 전`
  return formatDate(then)
}

export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd}`
}

export function formatDateTime(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(d)} ${hh}:${mi}`
}

// CSV 파일명 등에 쓰는 YYYYMMDD
export function compactToday() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${mm}${dd}`
}
