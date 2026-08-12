"use client"

import { useEffect, useMemo, useState } from "react"

import type { WorkEntry } from "@/types/salary"
import { getMonthEndDate, getMonthStartDate } from "@/lib/month"
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
  selectedMonth: string
  onAddEntries: (entries: WorkEntry[]) => AddWorkEntriesResult
  onComplete?: (result: AddWorkEntriesResult, messages: string[], tone: ActionToastTone) => void
}

type TemplateFeedback = {
  messages: string[]
  tone: ActionToastTone
}

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"]
const orderedWeekdays = [1, 2, 3, 4, 5, 6, 0]

const createDefaultTemplate = (): WorkTemplate => ({
  startTime: "09:00",
  endTime: "18:00",
  breakMinutes: 60
})

function sortWeekdays(days: number[]) {
  return orderedWeekdays.filter((day) => days.includes(day))
}

export function WorkTemplateForm({ selectedMonth, onAddEntries, onComplete }: WorkTemplateFormProps) {
  const [rangeStart, setRangeStart] = useState(() => getMonthStartDate(selectedMonth))
  const [rangeEnd, setRangeEnd] = useState(() => getMonthEndDate(selectedMonth))
  const [templateWeekdays, setTemplateWeekdays] = useState<number[]>([])
  const [commonTemplate, setCommonTemplate] = useState<WorkTemplate>(createDefaultTemplate)
  const [lastCommonBreakMinutes, setLastCommonBreakMinutes] = useState(60)
  const [commonNoBreak, setCommonNoBreak] = useState(false)
  const [templateByDay, setTemplateByDay] = useState<Record<number, WorkTemplate>>({})
  const [customWeekdayTemplatesOpen, setCustomWeekdayTemplatesOpen] = useState(false)
  const [feedback, setFeedback] = useState<TemplateFeedback | null>(null)
  const selectedWeekdays = useMemo(() => sortWeekdays(templateWeekdays), [templateWeekdays])

  useEffect(() => {
    setRangeStart(getMonthStartDate(selectedMonth))
    setRangeEnd(getMonthEndDate(selectedMonth))
  }, [selectedMonth])

  useEffect(() => {
    if (!feedback) return
    const timeout = window.setTimeout(() => setFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const getTemplateForDay = (day: number) =>
    customWeekdayTemplatesOpen ? templateByDay[day] ?? commonTemplate : commonTemplate

  const createEntry = (date: string, day: number): WorkEntry => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    const template = getTemplateForDay(day)
    return { id, date, ...template }
  }

  const updateCommonTemplate = (patch: Partial<WorkTemplate>) => {
    setCommonTemplate((previous) => ({ ...previous, ...patch }))
  }

  const toggleCommonNoBreak = (checked: boolean) => {
    setCommonNoBreak(checked)
    setCommonTemplate((previous) => {
      if (checked) {
        if (previous.breakMinutes > 0) {
          setLastCommonBreakMinutes(previous.breakMinutes)
        }
        return { ...previous, breakMinutes: 0 }
      }
      return { ...previous, breakMinutes: lastCommonBreakMinutes || 60 }
    })
  }

  const initializeCustomTemplates = () => {
    setTemplateByDay((previous) => {
      const next = { ...previous }
      selectedWeekdays.forEach((day) => {
        next[day] = next[day] ?? commonTemplate
      })
      return next
    })
    setCustomWeekdayTemplatesOpen(true)
  }

  const updateTemplateForDay = (day: number, patch: Partial<WorkTemplate>) => {
    setTemplateByDay((previous) => {
      const current = previous[day] ?? commonTemplate
      return {
        ...previous,
        [day]: { ...current, ...patch }
      }
    })
  }

  const toggleWeekday = (day: number, checked: boolean) => {
    setTemplateWeekdays((previous) =>
      checked ? sortWeekdays([...previous, day]) : previous.filter((value) => value !== day)
    )
    setTemplateByDay((previous) => {
      if (checked) {
        return customWeekdayTemplatesOpen
          ? { ...previous, [day]: previous[day] ?? commonTemplate }
          : previous
      }
      const next = { ...previous }
      delete next[day]
      return next
    })
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
      const tone = result.skippedCount > 0 ? "warning" : "success"
      if (onComplete) {
        onComplete(result, messages, tone)
      } else {
        setFeedback({ messages, tone })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>이번 달 근무 만들기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500">
          반복되는 근무 요일과 시간을 한 번에 등록해요.
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
              {orderedWeekdays.map((day) => (
                <label
                  key={day}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                    templateWeekdays.includes(day)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={templateWeekdays.includes(day)}
                    onChange={(event) => toggleWeekday(day, event.target.checked)}
                  />
                  {weekdayLabels[day]}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label>공통 근무시간</Label>
            <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-3">
              <select
                aria-label="공통 출근 시간"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                value={commonTemplate.startTime}
                onChange={(event) => updateCommonTemplate({ startTime: event.target.value })}
              >
                {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
              <select
                aria-label="공통 퇴근 시간"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                value={commonTemplate.endTime}
                onChange={(event) => updateCommonTemplate({ endTime: event.target.value })}
              >
                {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
              <div className="space-y-2">
                <Input
                  aria-label="공통 휴게시간 분"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={commonTemplate.breakMinutes}
                  disabled={commonNoBreak}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    updateCommonTemplate({ breakMinutes: value })
                    if (Number.isFinite(value) && value > 0) {
                      setLastCommonBreakMinutes(value)
                    }
                  }}
                />
                <label className="flex min-h-10 items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    checked={commonNoBreak}
                    onChange={(event) => toggleCommonNoBreak(event.target.checked)}
                  />
                  휴게시간 없음
                </label>
              </div>
            </div>
          </div>
        </div>

        {templateWeekdays.length > 0 && (
          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">요일별 예외 설정</p>
                <p className="text-xs text-slate-500">
                  특정 요일만 시간이 다를 때 열어서 수정하세요.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  customWeekdayTemplatesOpen
                    ? setCustomWeekdayTemplatesOpen(false)
                    : initializeCustomTemplates()
                }
                aria-expanded={customWeekdayTemplatesOpen}
              >
                요일별로 다르게 설정 {customWeekdayTemplatesOpen ? "접기" : "열기"}
              </Button>
            </div>

            {customWeekdayTemplatesOpen && (
              <div className="space-y-3">
                {selectedWeekdays.map((day) => {
                  const template = templateByDay[day] ?? commonTemplate
                  return (
                    <div
                      key={day}
                      className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[80px_1fr_1fr_1fr]"
                    >
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        {weekdayLabels[day]}요일
                      </div>
                      <select
                        aria-label={`${weekdayLabels[day]}요일 출근 시간`}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                        value={template.startTime}
                        onChange={(event) => updateTemplateForDay(day, { startTime: event.target.value })}
                      >
                        {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                      <select
                        aria-label={`${weekdayLabels[day]}요일 퇴근 시간`}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                        value={template.endTime}
                        onChange={(event) => updateTemplateForDay(day, { endTime: event.target.value })}
                      >
                        {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                      <Input
                        aria-label={`${weekdayLabels[day]}요일 휴게시간 분`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={template.breakMinutes ?? 0}
                        onChange={(event) =>
                          updateTemplateForDay(day, { breakMinutes: Number(event.target.value) })
                        }
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={addTemplateEntries}
            disabled={!rangeStart || !rangeEnd || templateWeekdays.length === 0}
          >
            이번 달 근무 만들기
          </Button>
        </div>
      </CardContent>
      {!onComplete && feedback && <ActionToast messages={feedback.messages} tone={feedback.tone} />}
    </Card>
  )
}
