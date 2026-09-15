"use client"

import { useState } from "react"
import type { WorkEntry } from "@/types/salary"
import { formatMonthLabel, getMonthStartDate, getMonthEndDate } from "@/lib/month"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function WorkCalendar({ selectedMonth, entries, onGoToWork }: {
  selectedMonth: string
  entries: WorkEntry[]
  onGoToWork: () => void
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const firstWeekday = (new Date(`${getMonthStartDate(selectedMonth)}T00:00:00`).getDay() + 6) % 7
  const days = Number(getMonthEndDate(selectedMonth).slice(-2))
  const cells = Math.ceil((firstWeekday + days) / 7) * 7
  const byDate = new Map<string, WorkEntry[]>()
  entries.forEach((entry) => {
    if (entry.date.startsWith(`${selectedMonth}-`)) {
      byDate.set(entry.date, [...(byDate.get(entry.date) ?? []), entry])
    }
  })
  const dateEntries = selectedDate ? [...(byDate.get(selectedDate) ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime)) : []

  return (
    <section aria-labelledby="work-calendar-title">
      <Card>
        <CardHeader className="space-y-2 p-4 sm:p-6">
          <CardTitle id="work-calendar-title">{formatMonthLabel(selectedMonth)} 근무 캘린더</CardTitle>
          <p className="text-sm text-slate-500">근무일을 누르면 시간과 휴게시간을 확인할 수 있어요.</p>
        </CardHeader>
        <CardContent className="space-y-4 px-2 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-7 gap-1" aria-label={`${formatMonthLabel(selectedMonth)} 달력`}>
            {["월", "화", "수", "목", "금", "토", "일"].map((day) => <div key={day} className="py-2 text-center text-sm font-medium text-slate-500">{day}</div>)}
            {Array.from({ length: cells }, (_, index) => {
              const day = index - firstWeekday + 1
              if (day < 1 || day > days) return <div key={`empty-${index}`} aria-hidden="true" />
              const date = `${selectedMonth}-${String(day).padStart(2, "0")}`
              const work = byDate.get(date) ?? []
              return (
                <button key={date} type="button" disabled={!work.length} aria-label={`${date}, ${work.length ? `근무 ${work.length}건` : "근무 없음"}`} aria-pressed={selectedDate === date} onClick={() => setSelectedDate(date)} className={`min-h-20 min-w-0 rounded-md border px-0.5 py-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 sm:min-h-24 sm:px-2 ${selectedDate === date ? "border-slate-900 bg-slate-900 text-white" : work.length ? "border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100" : "border-transparent text-slate-400"}`}>
                  <span className="block text-base font-medium tabular-nums">{day}</span>
                  {work.length > 0 && <span className="mt-1 block text-xs font-medium sm:text-sm">{work.length > 1 ? `${work.length}건` : "근무"}</span>}
                  {work.length === 1 && <span className="mt-1 hidden text-xs tabular-nums lg:block">{work[0].startTime}~{work[0].endTime}{work[0].endTime < work[0].startTime ? " (+1일)" : ""}</span>}
                </button>
              )
            })}
          </div>
          {selectedDate && (
            <div className="space-y-3 rounded-md bg-slate-50 p-4" aria-live="polite">
              <h3 className="font-semibold">{Number(selectedDate.slice(-2))}일 근무 · {dateEntries.length}건</h3>
              <ul className="space-y-2">
                {dateEntries.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-medium tabular-nums">{entry.startTime} ~ {entry.endTime}{entry.endTime < entry.startTime ? " (다음 날)" : ""}</span>
                    <span className="text-slate-600">휴게 {entry.breakMinutes}분</span>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" onClick={onGoToWork}>근무 수정</Button>
            </div>
          )}
          <p className="px-2 text-xs text-slate-500">출근 날짜 기준으로 표시해요. 자정을 넘긴 근무는 상세에서 다음 날 퇴근으로 표시됩니다.</p>
        </CardContent>
      </Card>
    </section>
  )
}
