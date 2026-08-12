"use client"

import { useEffect, useMemo, useState } from "react"

import type { WorkEntry } from "@/types/salary"
import { HALF_HOUR_OPTIONS } from "@/lib/time"
import { ActionToast, type ActionToastTone } from "@/components/ui/action-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type WorkTemplate = {
  startTime: string
  endTime: string
  breakMinutes: number
}

export type AddWorkEntriesResult = {
  addedCount: number
  skippedCount: number
}

type WorkTemplateFormProps = {
  onAddEntries: (entries: WorkEntry[]) => AddWorkEntriesResult
}

type TemplateFeedback = {
  messages: string[]
  tone: ActionToastTone
}

export function WorkTemplateForm({ onAddEntries }: WorkTemplateFormProps) {
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")
  const [templateWeekdays, setTemplateWeekdays] = useState<number[]>([])
  const [templateByDay, setTemplateByDay] = useState<Record<number, WorkTemplate>>({})
  const [feedback, setFeedback] = useState<TemplateFeedback | null>(null)
  const weekdayLabels = useMemo(() => ["일", "월", "화", "수", "목", "금", "토"], [])
  const defaultTemplate = useMemo(
    () => ({ startTime: "09:00", endTime: "18:00", breakMinutes: 60 }),
    []
  )

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const createEntry = (date: string, day: number): WorkEntry => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    const template = templateByDay[day] ?? defaultTemplate
    return { id, date, ...template }
  }

  const addTemplateEntries = () => {
    if (!rangeStart || !rangeEnd || templateWeekdays.length === 0) return
    const start = new Date(`${rangeStart}T00:00:00`)
    const end = new Date(`${rangeEnd}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return

    const formatLocalDate = (value: Date) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
        value.getDate()
      ).padStart(2, "0")}`
    const newEntries: WorkEntry[] = []
    const cursor = new Date(start)

    while (cursor <= end) {
      const day = cursor.getDay()
      if (templateWeekdays.includes(day)) {
        newEntries.push(createEntry(formatLocalDate(cursor), day))
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    if (newEntries.length === 0) return

    const result = onAddEntries(newEntries)
    const messages: string[] = []

    if (result.addedCount > 0) {
      messages.push(`${result.addedCount}건의 근무를 추가했어요.`)
    } else if (result.skippedCount > 0) {
      messages.push("추가된 근무가 없어요.")
    }

    if (result.skippedCount > 0) {
      messages.push(`${result.skippedCount}건은 기존 근무시간과 겹쳐 제외했어요.`)
    }

    if (messages.length > 0) {
      setFeedback({
        messages,
        tone: result.skippedCount > 0 ? "warning" : "success"
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>고정 근무 일괄 입력</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500">
          정규 근무는 일괄 추가, 대타는 아래에서 개별 입력하세요.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rangeStart">적용 시작일</Label>
            <Input id="rangeStart" type="date" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rangeEnd">적용 종료일</Label>
            <Input id="rangeEnd" type="date" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>근무 요일</Label>
            <div className="flex flex-wrap gap-2">
              {weekdayLabels.map((label, idx) => (
                <label
                  key={label}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                    templateWeekdays.includes(idx)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={templateWeekdays.includes(idx)}
                    onChange={(event) => {
                      setTemplateWeekdays((prev) =>
                        event.target.checked ? [...prev, idx] : prev.filter((day) => day !== idx)
                      )
                      setTemplateByDay((prev) => {
                        if (event.target.checked) {
                          return { ...prev, [idx]: prev[idx] ?? defaultTemplate }
                        }
                        const next = { ...prev }
                        delete next[idx]
                        return next
                      })
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="space-y-2">
              <Label>요일별 시간 설정</Label>
              {templateWeekdays.length === 0 ? (
                <p className="text-xs text-slate-500">
                  요일을 선택하면 해당 요일별 시간 설정이 표시됩니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {templateWeekdays.map((day) => {
                    const template = templateByDay[day] ?? defaultTemplate
                    return (
                      <div
                        key={day}
                        className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[80px_1fr_1fr_1fr]"
                      >
                        <div className="flex items-center text-sm font-medium text-slate-700">
                          {weekdayLabels[day]}요일
                        </div>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                          value={template.startTime}
                          onChange={(event) =>
                            setTemplateByDay((prev) => ({
                              ...prev,
                              [day]: { ...template, startTime: event.target.value }
                            }))
                          }
                        >
                          {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                          value={template.endTime}
                          onChange={(event) =>
                            setTemplateByDay((prev) => ({
                              ...prev,
                              [day]: { ...template, endTime: event.target.value }
                            }))
                          }
                        >
                          {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={template.breakMinutes ?? 0}
                          onChange={(event) =>
                            setTemplateByDay((prev) => ({
                              ...prev,
                              [day]: { ...template, breakMinutes: Number(event.target.value) }
                            }))
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={addTemplateEntries}
            disabled={!rangeStart || !rangeEnd || templateWeekdays.length === 0}
          >
            선택 요일 일괄 추가
          </Button>
        </div>
      </CardContent>
      {feedback && <ActionToast messages={feedback.messages} tone={feedback.tone} />}
    </Card>
  )
}
