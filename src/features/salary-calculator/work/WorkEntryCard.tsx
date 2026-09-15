"use client"

import { MoreHorizontal, Pencil } from "lucide-react"

import type { WorkEntry } from "@/types/salary"
import { clampMinutes, diffMinutes, formatMinutesToHours } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type WorkEntryCardProps = {
  entry: WorkEntry
  onEdit: (entry: WorkEntry) => void
  onDelete: (entry: WorkEntry) => void
}

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"]

export function WorkEntryCard({ entry, onEdit, onDelete }: WorkEntryCardProps) {
  const date = new Date(`${entry.date}T00:00:00`)
  const workedMinutes = clampMinutes(diffMinutes(entry.startTime, entry.endTime) - entry.breakMinutes)

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">
            {entry.date} ({weekdayLabels[date.getDay()]})
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {entry.startTime} ~ {entry.endTime} · 휴게 {entry.breakMinutes}분
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            인정 근무시간 {formatMinutesToHours(workedMinutes)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="min-h-10 min-w-10" aria-label={`${entry.date} 근무 기록 수정`} onClick={() => onEdit(entry)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="min-h-10 min-w-10" aria-label={`${entry.date} 근무 기록 더보기`} onClick={() => onDelete(entry)}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
