"use client"

import type { ChangeEvent } from "react"

import type { SalarySettings } from "@/types/salary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SalarySettingsFormProps = {
  settings: SalarySettings
  onChange: (settings: SalarySettings) => void
}

export function SalarySettingsForm({ settings, onChange }: SalarySettingsFormProps) {
  const updateNumber = (key: "hourlyWage" | "bonusAllowance" | "mealAllowance", event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...settings, [key]: Number(event.target.value) })
  }

  const updateBoolean = (key: keyof SalarySettings, event: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...settings, [key]: event.target.checked })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hourlyWage">기본 시급</Label>
          <Input
            id="hourlyWage"
            type="number"
            inputMode="numeric"
            min={0}
            value={settings.hourlyWage ?? 0}
            onChange={(event) => updateNumber("hourlyWage", event)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bonusAllowance">추가수당(고정)</Label>
          <Input
            id="bonusAllowance"
            type="number"
            inputMode="numeric"
            min={0}
            value={settings.bonusAllowance ?? 0}
            disabled={!settings.applyBonusAllowance}
            onChange={(event) => updateNumber("bonusAllowance", event)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mealAllowance">식대(비과세)</Label>
          <Input
            id="mealAllowance"
            type="number"
            inputMode="numeric"
            min={0}
            value={settings.mealAllowance ?? 0}
            onChange={(event) => updateNumber("mealAllowance", event)}
          />
        </div>
      </div>
      <div className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
        <p className="font-medium text-slate-700">수당/공제 적용</p>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ["applyOvertime", "연장수당 적용"],
            ["applyNight", "야간수당 적용"],
            ["applyWeeklyAllowance", "주휴수당 적용"],
            ["applyBonusAllowance", "추가수당 적용"],
            ["applyDeductions", "공제 적용"]
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
                checked={settings[key as keyof SalarySettings] as boolean}
                onChange={(event) => updateBoolean(key as keyof SalarySettings, event)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="grid gap-3 border-t border-slate-200 pt-3 md:grid-cols-2">
          {[
            ["applyPension", "국민연금 적용"],
            ["applyHealthInsurance", "건강보험 적용"],
            ["applyLongTermCare", "장기요양 적용"],
            ["applyEmploymentInsurance", "고용보험 적용"],
            ["applyIncomeTax", "소득세 적용"],
            ["applyLocalIncomeTax", "지방소득세 적용"]
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
                checked={settings[key as keyof SalarySettings] as boolean}
                disabled={!settings.applyDeductions}
                onChange={(event) => updateBoolean(key as keyof SalarySettings, event)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </>
  )
}
