"use client"

import { ArrowRight, Plus } from "lucide-react"

import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"
import { calculateSalary } from "@/salary/calculateSalary"
import { clampMinutes, diffMinutes, formatMinutesToHours } from "@/lib/time"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SalaryHomeProps = {
  entries: WorkEntry[]
  settings: SalarySettings
  breakdown: SalaryBreakdown
  lastSavedAt: string | null
  onGoToWork: () => void
  onGoToSalary: () => void
  onGoToSettings: () => void
}

function getCurrentMonthEntries(entries: WorkEntry[]) {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  return entries.filter((entry) => entry.date.startsWith(monthKey))
}

function getEntryMinutes(entry: WorkEntry) {
  if (!entry.date || !entry.startTime || !entry.endTime) return 0
  return clampMinutes(diffMinutes(entry.startTime, entry.endTime) - clampMinutes(entry.breakMinutes))
}

function getMonthLabel() {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date())
}

export function SalaryHome({
  entries,
  settings,
  breakdown,
  lastSavedAt,
  onGoToWork,
  onGoToSalary,
  onGoToSettings
}: SalaryHomeProps) {
  const monthEntries = getCurrentMonthEntries(entries)
  const monthlyBreakdown = calculateSalary(monthEntries, settings)
  const recentEntries = [...monthEntries]
    .filter((entry) => entry.date && entry.startTime && entry.endTime)
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
    .slice(0, 5)
  const hasSettings = settings.hourlyWage > 0

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-slate-500">{getMonthLabel()}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          이번 달 급여를 한눈에 확인하세요
        </h1>
      </header>

      <Card className="overflow-hidden border-slate-900 bg-slate-900 text-white">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-sm text-slate-300">이번 달 예상 실수령액</p>
            <p className="mt-2 break-words text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {formatCurrency(monthlyBreakdown.netPay)}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              현재 기록 기준으로 자동 계산됩니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
            <div>
              <p className="text-xs text-slate-400">총 지급액</p>
              <p className="mt-1 break-words font-medium tabular-nums">
                {formatCurrency(monthlyBreakdown.grossPay)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">예상 공제액</p>
              <p className="mt-1 break-words font-medium tabular-nums">
                {formatCurrency(monthlyBreakdown.totalDeductions)}
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" className="w-full bg-white text-slate-900 hover:bg-slate-100" onClick={onGoToSalary}>
            급여 상세 보기 <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <section aria-labelledby="monthly-summary-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="monthly-summary-title" className="text-lg font-semibold">
            이번 달 근무 요약
          </h2>
          <span className="text-sm text-slate-500">{monthEntries.length}개 기록</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["근무일", `${new Set(monthEntries.map((entry) => entry.date)).size}일`],
            ["총 근무시간", formatMinutesToHours(monthlyBreakdown.totalWorkMinutes)],
            ["야간시간", formatMinutesToHours(monthlyBreakdown.nightMinutes)],
            ["연장시간", formatMinutesToHours(monthlyBreakdown.overtimeMinutes)]
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 break-words text-lg font-semibold tabular-nums">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={onGoToWork}>
        <Plus className="h-4 w-4" /> 오늘 근무 추가
      </Button>

      {!hasSettings && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900">급여 조건을 먼저 설정하면 예상 급여가 계산됩니다.</p>
            <Button type="button" variant="outline" onClick={onGoToSettings}>
              급여 조건 확인
            </Button>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="recent-entries-title">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle id="recent-entries-title">최근 근무 기록</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={onGoToWork}>
              전체 보기
            </Button>
          </CardHeader>
          <CardContent>
            {recentEntries.length === 0 ? (
              <div className="space-y-3 rounded-md border border-dashed border-slate-200 p-6 text-center">
                <p className="font-medium text-slate-700">아직 이번 달 근무 기록이 없어요.</p>
                <p className="text-sm text-slate-500">
                  급여 조건을 확인하고 첫 근무를 기록하면 예상 급여가 자동으로 계산돼요.
                </p>
                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                  <Button type="button" onClick={onGoToWork}>첫 근무 기록하기</Button>
                  <Button type="button" variant="outline" onClick={onGoToSettings}>급여 조건 확인</Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{entry.date}</p>
                      <p className="text-sm text-slate-500">
                        {entry.startTime} ~ {entry.endTime} · 휴게 {entry.breakMinutes}분
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">
                      {formatMinutesToHours(getEntryMinutes(entry))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-slate-500">
        {lastSavedAt
          ? `이 기기에 자동 저장됨 · ${new Date(lastSavedAt).toLocaleString("ko-KR")}`
          : "저장 준비 중"}
      </p>

      <p className="sr-only">
        현재 전체 기록 기준 실수령액은 {formatCurrency(breakdown.netPay)}입니다.
      </p>
    </div>
  )
}
