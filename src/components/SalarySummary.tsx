import { formatCurrency } from "@/lib/format"
import { formatMinutesToHours } from "@/lib/time"
import type { SalaryBreakdown } from "@/types/salary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SalarySummaryProps = {
  breakdown: SalaryBreakdown
}

export function SalarySummary({ breakdown }: SalarySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>실시간 예상 급여</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">총 근무시간</p>
            <p className="text-lg font-semibold">{formatMinutesToHours(breakdown.totalWorkMinutes)}</p>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500">주휴수당 시간</p>
            <p className="text-lg font-semibold">
              {formatMinutesToHours(breakdown.weeklyAllowanceMinutes)}
            </p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>기본급</span>
            <span className="font-medium text-slate-900">{formatCurrency(breakdown.basePay)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>연장수당</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(breakdown.overtimePay)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>야간수당</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(breakdown.nightPay)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>주휴수당</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(breakdown.weeklyAllowancePay)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>추가수당</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(breakdown.bonusAllowance)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>식대(비과세)</span>
            <span className="font-medium text-slate-900">
              {formatCurrency(breakdown.nonTaxableMealPay)}
            </span>
          </div>
        </div>
        <div className="rounded-md bg-slate-900 p-4 text-white">
          <p className="text-xs uppercase text-slate-300">세전 합계</p>
          <p className="text-xl font-semibold">{formatCurrency(breakdown.grossPay)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
