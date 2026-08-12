import { formatCurrency } from "@/lib/format"
import { getMonthParts } from "@/lib/month"
import { formatMinutesToHours } from "@/lib/time"
import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"

type PayslipReportProps = {
  breakdown: SalaryBreakdown
  settings: SalarySettings
  entries: WorkEntry[]
  selectedMonth: string
}

export function PayslipReport({ breakdown, settings, selectedMonth }: PayslipReportProps) {
  const reportDate = getMonthParts(selectedMonth)
  const taxableExtras = breakdown.overtimePay + breakdown.nightPay + breakdown.bonusAllowance
  const deductionSubtotal =
    breakdown.pension +
    breakdown.healthInsurance +
    breakdown.longTermCare +
    breakdown.employmentInsurance +
    breakdown.incomeTax +
    breakdown.localIncomeTax

  return (
    <div className="mx-auto max-w-4xl space-y-6 text-sm text-slate-900">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">간이 임금명세서</h1>
        <p className="text-slate-600">근로기준법 기준 참고용</p>
      </header>

      <table className="w-full border-collapse border border-slate-300">
        <tbody>
          <tr>
            <th className="w-40 border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              기본사항
            </th>
            <td className="border border-slate-300 px-3 py-2">
              근무 월: {reportDate.year}년 {reportDate.month}월
            </td>
          </tr>
          <tr>
            <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              근로시간수
            </th>
            <td className="border border-slate-300 px-3 py-2">
              {formatMinutesToHours(breakdown.totalWorkMinutes)}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-slate-300">
        <thead>
          <tr>
            <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              지급내역
            </th>
            <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              금액
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-3 py-2">시급</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(settings.hourlyWage)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">기본급</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.basePay)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">주휴수당</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.weeklyAllowancePay)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">기타 과세수당(연장/야간/추가)</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(taxableExtras)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">비과세 지급(식대)</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.nonTaxableMealPay)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2 font-semibold">지급계</td>
            <td className="border border-slate-300 px-3 py-2 font-semibold">
              {formatCurrency(breakdown.grossPay)}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-slate-300">
        <thead>
          <tr>
            <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              공제내역
            </th>
            <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              금액
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-3 py-2">국민연금</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.pension)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">건강보험</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.healthInsurance)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">장기요양</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.longTermCare)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">고용보험</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.employmentInsurance)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">소득세</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.incomeTax)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2">지방소득세</td>
            <td className="border border-slate-300 px-3 py-2">
              {formatCurrency(breakdown.localIncomeTax)}
            </td>
          </tr>
          <tr>
            <td className="border border-slate-300 px-3 py-2 font-semibold">공제계</td>
            <td className="border border-slate-300 px-3 py-2 font-semibold">
              {formatCurrency(deductionSubtotal)}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-slate-300">
        <tbody>
          <tr>
            <th className="w-40 border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              차감 지급액
            </th>
            <td className="border border-slate-300 px-3 py-2 font-semibold">
              {formatCurrency(breakdown.netPay)}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse border border-slate-300 text-xs text-slate-600">
        <thead>
          <tr>
            <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left font-medium">
              급여 계산방법
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-3 py-2 leading-relaxed">
              기본급 = 총 근무시간 × 시급 / 주휴수당 = 주 15시간 이상 근무 시 소정근로시간
              비례 / 연장·야간수당은 법정 가산율을 적용 / 공제는 2026년 요율 및 간이세액표
              기준 추정치입니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
