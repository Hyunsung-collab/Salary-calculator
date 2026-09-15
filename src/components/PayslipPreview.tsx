import { formatCurrency } from "@/lib/format"
import { formatMinutesToHours } from "@/lib/time"
import type { SalaryBreakdown, SalarySettings } from "@/types/salary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PayslipPreviewProps = {
  breakdown: SalaryBreakdown
  settings: SalarySettings
  monthLabel: string
}

export function PayslipPreview({ breakdown, settings, monthLabel }: PayslipPreviewProps) {
  return (
    <Card className="print:border-none print:shadow-none">
      <CardHeader>
        <CardTitle>{monthLabel} 급여명세서 미리보기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 text-sm text-slate-600">
            <p>기본 시급: {formatCurrency(settings.hourlyWage)}</p>
            <p>연장 가산: {settings.overtimeMultiplier}배</p>
            <p>야간 가산: {settings.nightMultiplier}배</p>
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <p>총 근무: {formatMinutesToHours(breakdown.totalWorkMinutes)}</p>
            <p>연장: {formatMinutesToHours(breakdown.overtimeMinutes)}</p>
            <p>야간: {formatMinutesToHours(breakdown.nightMinutes)}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-100 p-4">
            <p className="text-xs uppercase text-slate-400">지급 내역</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>기본급</span>
                <span>{formatCurrency(breakdown.basePay)}</span>
              </div>
              <div className="flex justify-between">
                <span>연장수당</span>
                <span>{formatCurrency(breakdown.overtimePay)}</span>
              </div>
              <div className="flex justify-between">
                <span>야간수당</span>
                <span>{formatCurrency(breakdown.nightPay)}</span>
              </div>
              <div className="flex justify-between">
                <span>주휴수당</span>
                <span>{formatCurrency(breakdown.weeklyAllowancePay)}</span>
              </div>
              <div className="flex justify-between">
                <span>추가수당</span>
                <span>{formatCurrency(breakdown.bonusAllowance)}</span>
              </div>
              <div className="flex justify-between">
                <span>식대(비과세)</span>
                <span>{formatCurrency(breakdown.nonTaxableMealPay)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 font-semibold">
                <div className="flex justify-between">
                  <span>지급 합계</span>
                  <span>{formatCurrency(breakdown.grossPay)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-slate-100 p-4">
            <p className="text-xs uppercase text-slate-400">공제 내역</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>국민연금</span>
                <span>{formatCurrency(breakdown.pension)}</span>
              </div>
              <div className="flex justify-between">
                <span>건강보험</span>
                <span>{formatCurrency(breakdown.healthInsurance)}</span>
              </div>
              <div className="flex justify-between">
                <span>장기요양</span>
                <span>{formatCurrency(breakdown.longTermCare)}</span>
              </div>
              <div className="flex justify-between">
                <span>고용보험</span>
                <span>{formatCurrency(breakdown.employmentInsurance)}</span>
              </div>
              <div className="flex justify-between">
                <span>소득세(간이)</span>
                <span>{formatCurrency(breakdown.incomeTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>지방소득세</span>
                <span>{formatCurrency(breakdown.localIncomeTax)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 font-semibold">
                <div className="flex justify-between">
                  <span>공제 합계</span>
                  <span>{formatCurrency(breakdown.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-md bg-slate-900 p-4 text-white">
          <p className="text-xs uppercase text-slate-300">실수령액</p>
          <p className="text-2xl font-semibold">{formatCurrency(breakdown.netPay)}</p>
          <p className="mt-2 text-xs text-slate-300">
            2026년 요율 가정 및 간이세액표 방식으로 계산됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
