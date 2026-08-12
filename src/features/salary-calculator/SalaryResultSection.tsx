"use client"

import { useEffect, useState } from "react"
import { FileText, Printer, Settings2 } from "lucide-react"

import { formatCurrency } from "@/lib/format"
import { formatMinutesToHours } from "@/lib/time"
import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"
import { PayslipPreview } from "@/components/PayslipPreview"
import { PayslipReport } from "@/components/PayslipReport"
import { ActionToast } from "@/components/ui/action-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { SalarySettingsForm } from "@/features/salary-calculator/SalarySettingsForm"

type SalaryResultSectionProps = {
  breakdown: SalaryBreakdown
  settings: SalarySettings
  entries: WorkEntry[]
  selectedMonth: string
  monthLabel: string
  hasMonthSettingsSnapshot: boolean
  onUpdateMonthSettings: (month: string, settings: SalarySettings) => void
}

const payments: Array<[string, string, keyof SalaryBreakdown]> = [
  ["기본급", "인정 근무시간과 시급을 기준으로 계산", "basePay"],
  ["주휴수당", "주휴수당 설정이 켜진 경우 계산", "weeklyAllowancePay"],
  ["연장수당", "연장 근무시간과 가산 배율 기준", "overtimePay"],
  ["야간수당", "야간 근무시간과 가산 배율 기준", "nightPay"],
  ["추가수당", "고정 추가수당 설정이 켜진 경우 반영", "bonusAllowance"],
  ["식대(비과세)", "설정된 비과세 식대", "nonTaxableMealPay"]
]

const deductions: Array<[string, string, keyof SalaryBreakdown]> = [
  ["국민연금", "공제 적용 및 국민연금 설정 기준", "pension"],
  ["건강보험", "공제 적용 및 건강보험 설정 기준", "healthInsurance"],
  ["장기요양", "건강보험 공제액 기준", "longTermCare"],
  ["고용보험", "공제 적용 및 고용보험 설정 기준", "employmentInsurance"],
  ["소득세", "간이 계산 방식으로 추정", "incomeTax"],
  ["지방소득세", "소득세 설정 기준", "localIncomeTax"]
]

export function SalaryResultSection({
  breakdown,
  settings,
  entries,
  selectedMonth,
  monthLabel,
  hasMonthSettingsSnapshot,
  onUpdateMonthSettings
}: SalaryResultSectionProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsDraft, setSettingsDraft] = useState<SalarySettings>(settings)
  const [feedback, setFeedback] = useState<string[]>([])
  const workDays = new Set(entries.map((entry) => entry.date)).size

  useEffect(() => {
    if (settingsOpen) {
      setSettingsDraft({ ...settings })
    }
  }, [settings, settingsOpen])

  useEffect(() => {
    if (feedback.length === 0) return
    const timeout = window.setTimeout(() => setFeedback([]), 3000)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const saveMonthSettings = () => {
    onUpdateMonthSettings(selectedMonth, settingsDraft)
    setSettingsOpen(false)
    setFeedback([`${monthLabel} 급여 조건을 수정했어요.`])
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="salary-result-heading">
        <Card className="border-slate-900 bg-slate-900 text-white">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-sm text-slate-300">{monthLabel} 급여</p>
              <h2 id="salary-result-heading" className="mt-2 break-words text-4xl font-semibold tabular-nums sm:text-5xl">
                {formatCurrency(breakdown.netPay)}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                예상 실수령액 = 총 지급액에서 예상 공제를 제외한 금액입니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4 sm:grid-cols-4">
              <Metric label="총 지급액" value={formatCurrency(breakdown.grossPay)} />
              <Metric label="총 공제액" value={formatCurrency(breakdown.totalDeductions)} />
              <Metric label="근무일" value={`${workDays}일`} />
              <Metric label="총 근무시간" value={formatMinutesToHours(breakdown.totalWorkMinutes)} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="payment-breakdown-title">
        <Card>
          <CardHeader>
            <CardTitle id="payment-breakdown-title">지급 내역</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.map(([label, description, key]) => (
              <BreakdownRow
                key={label}
                label={label}
                description={description}
                value={formatCurrency(breakdown[key])}
              />
            ))}
            <TotalRow label="지급 합계" value={formatCurrency(breakdown.grossPay)} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="deduction-breakdown-title">
        <Card>
          <CardHeader>
            <CardTitle id="deduction-breakdown-title">공제 내역</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deductions.map(([label, description, key]) => (
              <BreakdownRow
                key={label}
                label={label}
                description={description}
                value={formatCurrency(breakdown[key])}
              />
            ))}
            <TotalRow label="공제 합계" value={formatCurrency(breakdown.totalDeductions)} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="salary-settings-title">
        <Card>
          <CardHeader>
            <CardTitle id="salary-settings-title">{monthLabel} 계산 기준</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!hasMonthSettingsSnapshot && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                아직 이 달의 급여 조건이 확정되지 않았어요. 현재 기본 급여 조건을 기준으로 미리 보여드리고 있어요.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <BasisMetric label="시급" value={formatCurrency(settings.hourlyWage)} />
              <BasisMetric label="주휴수당" value={settings.applyWeeklyAllowance ? "적용" : "미적용"} />
              <BasisMetric
                label="연장수당"
                value={settings.applyOvertime ? `${settings.overtimeMultiplier}배 적용` : "미적용"}
              />
              <BasisMetric
                label="야간수당"
                value={settings.applyNight ? `${settings.nightMultiplier}배 적용` : "미적용"}
              />
              <BasisMetric label="공제" value={settings.applyDeductions ? "선택 공제 적용" : "미적용"} />
              <BasisMetric label="식대" value={formatCurrency(settings.mealAllowance)} />
              <BasisMetric
                label="추가수당"
                value={settings.applyBonusAllowance ? formatCurrency(settings.bonusAllowance) : "미적용"}
              />
              <BasisMetric label="계산 월" value={monthLabel} />
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
                <Settings2 className="h-4 w-4" /> 이 달 급여 조건 수정
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="payslip-title">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="payslip-title" className="text-lg font-semibold text-slate-900">급여명세서</h2>
            <p className="mt-1 text-sm text-slate-500">
              아래 명세서는 {monthLabel} 근무 기록과 계산 기준으로 생성됩니다.
            </p>
          </div>
          <div className="no-print">
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> 급여명세서 PDF 출력
            </Button>
          </div>
        </div>
        <PayslipPreview breakdown={breakdown} settings={settings} monthLabel={monthLabel} />
      </section>

      <section className="print-only px-10 py-8">
        <PayslipReport
          breakdown={breakdown}
          settings={settings}
          entries={entries}
          selectedMonth={selectedMonth}
        />
      </section>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{monthLabel} 급여 조건 수정</DialogTitle>
            <DialogDescription>
              이 변경은 선택한 달의 계산 기준에만 저장됩니다. 기본 급여 조건과 다른 달의 계산 기준은 바뀌지 않아요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <SalarySettingsForm settings={settingsDraft} onChange={setSettingsDraft} />
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                취소
              </Button>
              <Button type="button" onClick={saveMonthSettings}>
                <FileText className="h-4 w-4" /> 저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {feedback.length > 0 && <ActionToast messages={feedback} />}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 break-words font-medium tabular-nums">{value}</p>
    </div>
  )
}

function BasisMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium text-slate-900">{value}</p>
    </div>
  )
}

function BreakdownRow({
  label,
  description,
  value
}: {
  label: string
  description: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <span className="shrink-0 text-right font-medium tabular-nums">{value}</span>
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 font-semibold">
      <span>{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  )
}
