"use client"

import { useState, type ChangeEvent } from "react"

import type { SalarySettings } from "@/types/salary"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  settings: SalarySettings
  onChange: (settings: SalarySettings) => void
}

type NumericKey =
  | "hourlyWage"
  | "bonusAllowance"
  | "mealAllowance"
  | "overtimeMultiplier"
  | "nightMultiplier"

const allowanceOptions: Array<[keyof SalarySettings, string]> = [
  ["applyOvertime", "연장수당 적용"],
  ["applyNight", "야간수당 적용"],
  ["applyWeeklyAllowance", "주휴수당 적용"],
  ["applyBonusAllowance", "추가수당 적용"]
]

const deductionOptions: Array<[keyof SalarySettings, string]> = [
  ["applyPension", "국민연금 적용"],
  ["applyHealthInsurance", "건강보험 적용"],
  ["applyLongTermCare", "장기요양 적용"],
  ["applyEmploymentInsurance", "고용보험 적용"],
  ["applyIncomeTax", "소득세 적용"],
  ["applyLocalIncomeTax", "지방소득세 적용"]
]

export function SalarySettingsForm({ settings, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<NumericKey, string>>>({})

  const updateNumber = (key: NumericKey, event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    const error = !Number.isFinite(value) || value < 0 ? "0 이상 숫자를 입력해 주세요." : undefined
    setErrors((previous) => ({ ...previous, [key]: error }))
    if (!error) onChange({ ...settings, [key]: value })
  }

  const updateBoolean = (key: keyof SalarySettings, event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...settings, [key]: event.target.checked })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-slate-800">기본 설정</h3>
        <p className="mt-1 text-sm text-slate-500">
          현재 계산기가 지원하는 시급과 기본 수당을 설정하세요.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <NumberField id="hourlyWage" label="기본 시급" value={settings.hourlyWage} error={errors.hourlyWage} onChange={(event) => updateNumber("hourlyWage", event)} />
        <NumberField id="mealAllowance" label="식대(비과세)" value={settings.mealAllowance} error={errors.mealAllowance} onChange={(event) => updateNumber("mealAllowance", event)} />
        <NumberField id="bonusAllowance" label="추가수당(고정)" value={settings.bonusAllowance} error={errors.bonusAllowance} disabled={!settings.applyBonusAllowance} onChange={(event) => updateNumber("bonusAllowance", event)} />
      </div>
      <div className="rounded-md border border-slate-200">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left font-semibold"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          고급 설정 <span aria-hidden="true">{advancedOpen ? "−" : "+"}</span>
        </button>
        {advancedOpen && (
          <div className="space-y-5 border-t border-slate-200 p-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              {allowanceOptions.map(([key, label]) => (
                <Toggle key={key} label={label} checked={settings[key] as boolean} onChange={(event) => updateBoolean(key, event)} />
              ))}
            </div>
            <div className="grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
              <NumberField id="overtimeMultiplier" label="연장수당 배율" value={settings.overtimeMultiplier} error={errors.overtimeMultiplier} onChange={(event) => updateNumber("overtimeMultiplier", event)} />
              <NumberField id="nightMultiplier" label="야간수당 배율" value={settings.nightMultiplier} error={errors.nightMultiplier} onChange={(event) => updateNumber("nightMultiplier", event)} />
            </div>
            <div className="grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-2">
              <Toggle label="공제 적용" checked={settings.applyDeductions} onChange={(event) => updateBoolean("applyDeductions", event)} />
              {deductionOptions.map(([key, label]) => (
                <Toggle key={key} label={label} checked={settings[key] as boolean} disabled={!settings.applyDeductions} onChange={(event) => updateBoolean(key, event)} />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              일급·월급·연봉, 휴일수당, 사용자 지정 공제는 현재 지원하지 않습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function NumberField({
  id,
  label,
  value,
  error,
  disabled,
  onChange
}: {
  id: NumericKey
  label: string
  value: number
  error?: string
  disabled?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" min={0} step="any" value={value} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={onChange} />
      {error && <p id={`${id}-error`} className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function Toggle({
  label,
  checked,
  disabled,
  onChange
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-slate-600">
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900" checked={checked} disabled={disabled} onChange={onChange} />
      {label}
    </label>
  )
}
