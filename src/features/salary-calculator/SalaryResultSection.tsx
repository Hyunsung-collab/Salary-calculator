"use client"

import { Printer } from "lucide-react"

import { formatCurrency } from "@/lib/format"
import { formatMinutesToHours } from "@/lib/time"
import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"
import { PayslipPreview } from "@/components/PayslipPreview"
import { PayslipReport } from "@/components/PayslipReport"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SalaryResultSectionProps = {
  breakdown: SalaryBreakdown
  settings: SalarySettings
  entries: WorkEntry[]
}

const payments: Array<[string, string, keyof SalaryBreakdown]> = [
  ["기본급", "인정 근무시간 × 기본 시급", "basePay"],
  ["주휴수당", "주간 기준을 충족한 시간에 적용", "weeklyAllowancePay"],
  ["연장수당", "계산된 연장 근무시간에 적용", "overtimePay"],
  ["야간수당", "야간으로 분류된 시간에 적용", "nightPay"],
  ["추가수당", "추가수당 설정이 켜진 경우 적용", "bonusAllowance"],
  ["식대(비과세)", "설정된 비과세 식대", "nonTaxableMealPay"]
]

const deductions: Array<[string, string, keyof SalaryBreakdown]> = [
  ["국민연금", "국민연금 설정이 켜진 경우 적용", "pension"],
  ["건강보험", "건강보험 설정이 켜진 경우 적용", "healthInsurance"],
  ["장기요양", "장기요양 설정이 켜진 경우 적용", "longTermCare"],
  ["고용보험", "고용보험 설정이 켜진 경우 적용", "employmentInsurance"],
  ["소득세", "간이 계산 방식으로 추정", "incomeTax"],
  ["지방소득세", "현재 소득세 계산 설정에 따라 적용", "localIncomeTax"]
]

export function SalaryResultSection({ breakdown, settings, entries }: SalaryResultSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-900 bg-slate-900 text-white">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-sm text-slate-300">예상 실수령액</p>
            <p className="mt-2 break-words text-4xl font-semibold tabular-nums sm:text-5xl">
              {formatCurrency(breakdown.netPay)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4 sm:grid-cols-3">
            <Metric label="총 지급액" value={formatCurrency(breakdown.grossPay)} />
            <Metric label="총 공제액" value={formatCurrency(breakdown.totalDeductions)} />
            <Metric label="총 근무시간" value={formatMinutesToHours(breakdown.totalWorkMinutes)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>급여 내역</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <BreakdownDisclosure title="지급 내역" rows={payments} breakdown={breakdown} total={breakdown.grossPay} open />
          <BreakdownDisclosure title="공제 내역" rows={deductions} breakdown={breakdown} total={breakdown.totalDeductions} />
          <details>
            <summary className="cursor-pointer font-semibold">계산 기준 및 적용 설정</summary>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>기본 시급: {formatCurrency(settings.hourlyWage)}</p>
              <p>연장수당: {settings.applyOvertime ? `${settings.overtimeMultiplier}배 적용` : "미적용"}</p>
              <p>야간수당: {settings.applyNight ? `${settings.nightMultiplier}배 적용` : "미적용"}</p>
              <p>주휴수당: {settings.applyWeeklyAllowance ? "적용" : "미적용"}</p>
              <p>공제: {settings.applyDeductions ? "선택한 공제 적용" : "미적용"}</p>
            </div>
          </details>
        </CardContent>
      </Card>

      <div className="no-print flex justify-end">
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> PDF 출력</Button>
      </div>
      <PayslipPreview breakdown={breakdown} settings={settings} />
      <section className="print-only px-10 py-8">
        <PayslipReport breakdown={breakdown} settings={settings} entries={entries} />
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-slate-400">{label}</p><p className="mt-1 break-words font-medium tabular-nums">{value}</p></div>
}

function BreakdownDisclosure({
  title,
  rows,
  breakdown,
  total,
  open = false
}: {
  title: string
  rows: Array<[string, string, keyof SalaryBreakdown]>
  breakdown: SalaryBreakdown
  total: number
  open?: boolean
}) {
  return (
    <details open={open}>
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-3 space-y-3">
        {rows.map(([label, description, key]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="min-w-0"><p className="font-medium">{label}</p><p className="text-xs text-slate-500">{description}</p></div>
            <span className="shrink-0 text-right font-medium tabular-nums">{formatCurrency(breakdown[key])}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold"><span>{title.replace(" 내역", " 합계")}</span><span className="tabular-nums">{formatCurrency(total)}</span></div>
      </div>
    </details>
  )
}
