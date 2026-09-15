"use client"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { isValidTime, normalizeTimeInput } from "@/lib/workTimeValidation"

export type TimeInputMode = "select" | "text"
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

export function TimeInputModeControl({ mode, onChange }: { mode: TimeInputMode; onChange: (mode: TimeInputMode) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">시간 입력 방식</legend>
      <div className="flex gap-2">
        <Button type="button" className="min-h-11 flex-1 sm:flex-none" variant={mode === "select" ? "default" : "outline"} aria-pressed={mode === "select"} onClick={() => onChange("select")}>시간 선택</Button>
        <Button type="button" className="min-h-11 flex-1 sm:flex-none" variant={mode === "text" ? "default" : "outline"} aria-pressed={mode === "text"} onClick={() => onChange("text")}>키보드 입력</Button>
      </div>
      <p className="text-sm text-slate-500">{mode === "select" ? "선택 모드 · 시와 분을 눌러 선택하세요." : "직접 입력 모드 · 키보드로 24시간제 시간을 입력하세요. (예: 09:30, 9:30, 0930)"}</p>
    </fieldset>
  )
}

export function TimeInput({ label, value, onChange, mode, error }: {
  label: string
  value: string
  onChange: (value: string) => void
  mode: TimeInputMode
  error?: string
}) {
  const id = useId()
  const [touched, setTouched] = useState(false)
  const valid = isValidTime(value)
  const [hour, minute] = valid ? value.split(":") : ["", ""]
  const message = error || (!valid && (touched || mode === "select") ? "시간을 00:00~23:59 형식으로 입력해 주세요." : undefined)
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      {mode === "text" ? (
        <Input aria-label={label} type="text" inputMode="text" autoComplete="off" placeholder="09:00" value={value} onChange={(event) => { setTouched(false); onChange(event.target.value) }} onBlur={() => { setTouched(true); onChange(normalizeTimeInput(value)) }} aria-invalid={Boolean(message)} aria-describedby={message ? id : undefined} className="min-h-11 min-w-0 text-base tabular-nums" />
      ) : (
        <div className="flex min-w-0 items-center gap-1">
          <select aria-label={`${label} 시`} value={hour} onChange={(event) => onChange(`${event.target.value}:${minute || "00"}`)} aria-invalid={Boolean(message)} aria-describedby={message ? id : undefined} className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            {!valid && <option value="" disabled>시</option>}
            {hours.map((h) => <option key={h} value={h}>{h}시</option>)}
          </select>
          <span aria-hidden="true">:</span>
          <select aria-label={`${label} 분`} value={minute} onChange={(event) => onChange(`${hour || "00"}:${event.target.value}`)} aria-invalid={Boolean(message)} aria-describedby={message ? id : undefined} className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
            {!valid && <option value="" disabled>분</option>}
            {minutes.map((m) => <option key={m} value={m}>{m}분</option>)}
          </select>
        </div>
      )}
      {message && <p id={id} className="text-sm text-red-600">{message}</p>}
    </fieldset>
  )
}
