"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"
import { calculateSalary } from "@/salary/calculateSalary"
import { getDefaultDateForMonth } from "@/lib/month"
import {
  clampMinutes,
  diffMinutes,
  formatMinutesToHours,
  getNightMinutes
} from "@/lib/time"
import { validateWorkTime, isValidTime } from "@/lib/workTimeValidation"
import { TimeInput, TimeInputModeControl, type TimeInputMode } from "@/features/salary-calculator/TimeInput"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type WorkEntryEditorProps = {
  open: boolean
  entry: WorkEntry | null
  settings: SalarySettings
  selectedMonth: string
  onOpenChange: (open: boolean) => void
  onSave: (entry: WorkEntry) => WorkEntrySaveResult
}

type DraftEntry = Omit<WorkEntry, "id">
type WorkEntrySaveResult =
  | { ok: true }
  | { ok: false; messages: string[] }

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

function emptyDraft(selectedMonth: string): DraftEntry {
  return { date: getDefaultDateForMonth(selectedMonth), startTime: "09:00", endTime: "18:00", breakMinutes: 60 }
}

function getPreviewBreakdown(draft: DraftEntry, settings: SalarySettings): SalaryBreakdown | null {
  if (!draft.date || Object.keys(validateWorkTime(draft)).length > 0) return null
  const workedMinutes = clampMinutes(
    diffMinutes(draft.startTime, draft.endTime) - clampMinutes(draft.breakMinutes)
  )
  if (workedMinutes <= 0) return null
  return calculateSalary([{ ...draft, id: "preview" }], settings)
}

export function WorkEntryEditor({
  open,
  entry,
  settings,
  selectedMonth,
  onOpenChange,
  onSave
}: WorkEntryEditorProps) {
  const submitted = useRef(false)
  const [timeInputMode, setTimeInputMode] = useState<TimeInputMode>("select")
  const [draft, setDraft] = useState<DraftEntry>(() => emptyDraft(selectedMonth))
  const [errors, setErrors] = useState<Partial<Record<keyof DraftEntry, string>>>({})
  const [formMessages, setFormMessages] = useState<string[]>([])
  const [noBreak, setNoBreak] = useState(false)
  const [lastBreakMinutes, setLastBreakMinutes] = useState(60)

  useEffect(() => {
    if (open) {
      submitted.current = false
      const nextDraft = entry ? { ...entry } : emptyDraft(selectedMonth)
      setDraft(nextDraft)
      setNoBreak(nextDraft.breakMinutes === 0)
      setLastBreakMinutes(nextDraft.breakMinutes > 0 ? nextDraft.breakMinutes : 60)
      setErrors({})
      setFormMessages([])
    }
  }, [entry, open, selectedMonth])

  const preview = useMemo(() => getPreviewBreakdown(draft, settings), [draft, settings])
  const crossesMidnight =
    isValidTime(draft.startTime) && isValidTime(draft.endTime) && draft.endTime < draft.startTime
  const nightMinutes =
    isValidTime(draft.startTime) && isValidTime(draft.endTime) ? getNightMinutes(draft.startTime, draft.endTime) : 0

  const updateDraft = <K extends keyof DraftEntry>(key: K, value: DraftEntry[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
    setFormMessages([])
  }

  const updateBreakMinutes = (value: number) => {
    updateDraft("breakMinutes", value)
    if (Number.isFinite(value) && value > 0) {
      setLastBreakMinutes(value)
    }
  }

  const toggleNoBreak = (checked: boolean) => {
    setNoBreak(checked)
    setDraft((previous) => {
      if (checked) {
        if (previous.breakMinutes > 0) {
          setLastBreakMinutes(previous.breakMinutes)
        }
        return { ...previous, breakMinutes: 0 }
      }
      return { ...previous, breakMinutes: lastBreakMinutes || 60 }
    })
    setErrors((previous) => ({ ...previous, breakMinutes: undefined }))
    setFormMessages([])
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof DraftEntry, string>> = validateWorkTime(draft)
    if (!draft.date) nextErrors.date = "날짜를 선택해 주세요."
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (submitted.current || !validate()) return
    submitted.current = true
    const result = onSave({ id: entry?.id ?? createId(), ...draft })
    if (!result.ok) {
      submitted.current = false
      setFormMessages(result.messages)
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{entry ? "근무 기록 수정" : "근무 기록 추가"}</DialogTitle>
          <DialogDescription>
            날짜와 시간을 확인한 뒤 저장하면 홈과 급여 결과에 바로 반영됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="work-entry-date">날짜</Label>
            <Input
              id="work-entry-date"
              type="date"
              value={draft.date}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "work-entry-date-error" : undefined}
              onChange={(event) => updateDraft("date", event.target.value)}
            />
            {errors.date && <p id="work-entry-date-error" className="text-sm text-red-600">{errors.date}</p>}
          </div>

          <TimeInputModeControl mode={timeInputMode} onChange={setTimeInputMode} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TimeInput label="출근 시간" value={draft.startTime} mode={timeInputMode} onChange={(value) => updateDraft("startTime", value)} error={errors.startTime} />
            <TimeInput label="퇴근 시간" value={draft.endTime} mode={timeInputMode} onChange={(value) => updateDraft("endTime", value)} error={errors.endTime} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-entry-break">휴게시간(분)</Label>
            <Input
              id="work-entry-break"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.breakMinutes}
              disabled={noBreak}
              aria-invalid={Boolean(errors.breakMinutes)}
              aria-describedby={errors.breakMinutes ? "work-entry-break-error" : undefined}
              onChange={(event) => updateBreakMinutes(Number(event.target.value))}
            />
            <label className="flex min-h-10 items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={noBreak}
                onChange={(event) => toggleNoBreak(event.target.checked)}
              />
              휴게시간 없음
            </label>
            {errors.breakMinutes && <p id="work-entry-break-error" className="text-sm text-red-600">{errors.breakMinutes}</p>}
          </div>

          {crossesMidnight && (
            <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              퇴근 시간이 출근 시간보다 이르므로 다음 날 퇴근으로 계산해요.
            </p>
          )}

          <div className="rounded-md bg-slate-50 p-4 text-sm">
            <p className="font-medium text-slate-700">예상 인정 근무시간</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {preview ? formatMinutesToHours(preview.totalWorkMinutes) : "시간을 입력해 주세요."}
            </p>
            {preview && (
              <div className="mt-2 space-y-1 text-slate-600">
                <p>{nightMinutes > 0 ? "야간 근무 포함" : "야간 근무 없음"}</p>
                <p>{preview.overtimeMinutes > 0 ? "연장 근무 포함" : "연장 근무 없음"}</p>
              </div>
            )}
          </div>

          {formMessages.length > 0 && (
            <div role="alert" className="space-y-1 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {formMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="button" onClick={handleSave}>
              {entry ? "수정 저장" : "근무 기록 저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
