"use client"

import { useEffect, useMemo, useState } from "react"

import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"
import { calculateSalary } from "@/salary/calculateSalary"
import {
  HALF_HOUR_OPTIONS,
  clampMinutes,
  diffMinutes,
  formatMinutesToHours,
  getNightMinutes
} from "@/lib/time"
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
  onOpenChange: (open: boolean) => void
  onSave: (entry: WorkEntry) => void
}

type DraftEntry = Omit<WorkEntry, "id">

const today = () => {
  const value = new Date()
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

function emptyDraft(): DraftEntry {
  return { date: today(), startTime: "09:00", endTime: "18:00", breakMinutes: 60 }
}

function getPreviewBreakdown(draft: DraftEntry, settings: SalarySettings): SalaryBreakdown | null {
  if (!draft.date || !draft.startTime || !draft.endTime) return null
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
  onOpenChange,
  onSave
}: WorkEntryEditorProps) {
  const [draft, setDraft] = useState<DraftEntry>(emptyDraft)
  const [errors, setErrors] = useState<Partial<Record<keyof DraftEntry, string>>>({})

  useEffect(() => {
    if (open) {
      setDraft(entry ? { ...entry } : emptyDraft())
      setErrors({})
    }
  }, [entry, open])

  const preview = useMemo(() => getPreviewBreakdown(draft, settings), [draft, settings])
  const crossesMidnight =
    Boolean(draft.startTime && draft.endTime) && draft.endTime < draft.startTime
  const nightMinutes =
    draft.startTime && draft.endTime ? getNightMinutes(draft.startTime, draft.endTime) : 0

  const updateDraft = <K extends keyof DraftEntry>(key: K, value: DraftEntry[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }))
    setErrors((previous) => ({ ...previous, [key]: undefined }))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof DraftEntry, string>> = {}
    if (!draft.date) nextErrors.date = "날짜를 선택해 주세요."
    if (!draft.startTime) nextErrors.startTime = "출근 시간을 선택해 주세요."
    if (!draft.endTime) nextErrors.endTime = "퇴근 시간을 선택해 주세요."
    if (!Number.isFinite(draft.breakMinutes) || draft.breakMinutes < 0) {
      nextErrors.breakMinutes = "휴게시간은 0분 이상이어야 합니다."
    }
    if (!nextErrors.startTime && !nextErrors.endTime && !preview) {
      nextErrors.endTime = "퇴근 시간과 휴게시간을 확인해 주세요."
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave({ id: entry?.id ?? createId(), ...draft })
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

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">근무 템플릿</legend>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraft((previous) => ({ ...previous, startTime: "09:00", endTime: "18:00", breakMinutes: 60 }))}
              >
                기본 근무
              </Button>
              <Button type="button" variant="outline" onClick={() => setDraft((previous) => ({ ...previous }))}>
                직접 입력
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              저장된 이름 있는 템플릿은 아직 없어요. 기존 기본 근무값을 빠른 선택으로 제공합니다.
            </p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="work-entry-start">출근 시간</Label>
              <select
                id="work-entry-start"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={draft.startTime}
                aria-invalid={Boolean(errors.startTime)}
                aria-describedby={errors.startTime ? "work-entry-start-error" : undefined}
                onChange={(event) => updateDraft("startTime", event.target.value)}
              >
                <option value="">선택</option>
                {HALF_HOUR_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              {errors.startTime && <p id="work-entry-start-error" className="text-sm text-red-600">{errors.startTime}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-entry-end">퇴근 시간</Label>
              <select
                id="work-entry-end"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={draft.endTime}
                aria-invalid={Boolean(errors.endTime)}
                aria-describedby={errors.endTime ? "work-entry-end-error" : undefined}
                onChange={(event) => updateDraft("endTime", event.target.value)}
              >
                <option value="">선택</option>
                {HALF_HOUR_OPTIONS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              {errors.endTime && <p id="work-entry-end-error" className="text-sm text-red-600">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work-entry-break">휴게시간(분)</Label>
            <Input
              id="work-entry-break"
              type="number"
              inputMode="numeric"
              min={0}
              value={draft.breakMinutes}
              aria-invalid={Boolean(errors.breakMinutes)}
              aria-describedby={errors.breakMinutes ? "work-entry-break-error" : undefined}
              onChange={(event) => updateDraft("breakMinutes", Number(event.target.value))}
            />
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
