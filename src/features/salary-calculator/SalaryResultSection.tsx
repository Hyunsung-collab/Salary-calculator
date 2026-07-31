"use client"

import { Printer } from "lucide-react"

import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"
import { PayslipPreview } from "@/components/PayslipPreview"
import { PayslipReport } from "@/components/PayslipReport"
import { SalarySummary } from "@/components/SalarySummary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SalaryResultSectionProps = {
  breakdown: SalaryBreakdown
  settings: SalarySettings
  entries: WorkEntry[]
}

export function SalaryResultSection({
  breakdown,
  settings,
  entries
}: SalaryResultSectionProps) {
  return (
    <>
      <div className="space-y-6">
        <SalarySummary breakdown={breakdown} />
        <Card>
          <CardHeader>
            <CardTitle>계산 기준 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>주 15시간 이상 근무 시 주휴수당이 자동 반영됩니다.</p>
            <p>연장(8시간 초과) 및 야간(22시~06시) 근무는 1.5배 가산입니다.</p>
            <p>공제는 2026년 요율 가정, 소득세는 간이세액표 기반 추정치입니다.</p>
          </CardContent>
        </Card>
      </div>
      <div className="no-print flex justify-end">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> PDF 출력
        </Button>
      </div>
      <PayslipPreview breakdown={breakdown} settings={settings} />
      <section className="print-only px-10 py-8">
        <PayslipReport breakdown={breakdown} settings={settings} entries={entries} />
      </section>
    </>
  )
}
