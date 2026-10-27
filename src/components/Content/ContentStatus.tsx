import type { ReactNode } from "react"

export function ContentStatus({
  loading,
  error,
  onRetry,
  empty,
  children,
}: {
  loading: boolean
  error: string
  onRetry: () => void
  empty?: string
  children: ReactNode
}) {
  if (loading) {
    return <p className="text-sm text-stone-700 font-medium">Loading...</p>
  }

  if (error) {
    return (
      <div className="text-sm text-rose-800 font-medium bg-rose-50 border border-rose-200 p-3 rounded" role="alert">
        <p>{error}</p>
        <button type="button" className="inline-block mt-2 underline text-[var(--forest)] font-bold hover:text-[var(--dark)]" onClick={onRetry}>
          Retry
        </button>
      </div>
    )
  }

  if (empty) {
    return <p className="text-sm text-stone-700 font-medium">{empty}</p>
  }

  return children
}
