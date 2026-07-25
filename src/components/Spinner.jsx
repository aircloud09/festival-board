export default function Spinner({ label = '불러오는 중' }) {
  return (
    <div className="flex justify-center py-8" role="status" aria-label={label}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  )
}
