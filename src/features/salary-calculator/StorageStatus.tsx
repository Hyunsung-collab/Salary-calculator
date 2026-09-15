"use client"

type StorageStatusProps = {
  lastSavedAt: string | null
  error?: string
}

export function StorageStatus({ lastSavedAt, error }: StorageStatusProps) {
  if (error) {
    return <p role="status" className="text-sm text-red-700">저장하지 못했어요. 다시 시도해 주세요.</p>
  }

  if (!lastSavedAt) {
    return <p role="status" className="text-sm text-slate-500">저장 준비 중이에요.</p>
  }

  return (
    <p role="status" className="text-sm text-slate-600">
      이 기기에 저장됐어요 · {new Date(lastSavedAt).toLocaleString("ko-KR")}
    </p>
  )
}
