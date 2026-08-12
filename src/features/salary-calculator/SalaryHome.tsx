"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Plus } from "lucide-react"

import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"
import { clampMinutes, diffMinutes, formatMinutesToHours } from "@/lib/time"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ActionToast, type ActionToastTone } from "@/components/ui/action-toast"
import { SalarySettingsForm } from "@/features/salary-calculator/SalarySettingsForm"
import { StorageStatus } from "@/features/salary-calculator/StorageStatus"
import { WorkTemplateForm, type AddWorkEntriesResult } from "@/features/salary-calculator/WorkTemplateForm"

type SetupStep = "settings" | "work" | "result"

type SalaryHomeProps = {
  entries: WorkEntry[]
  settings: SalarySettings
  breakdown: SalaryBreakdown
  monthLabel: string
  selectedMonth: string
  lastSavedAt: string | null
  onGoToWork: () => void
  onStartFirstWork: () => void
  onGoToSalary: () => void
  onGoToSettings: () => void
  setupSettings: SalarySettings
  onSetupSettingsChange: (settings: SalarySettings) => void
  onConfirmSetupSettings: () => void
  onAddTemplateEntries: (entries: WorkEntry[]) => AddWorkEntriesResult
  onStartSetupDirectWork: () => void
  onCompleteSetup: () => void
  showGuidedSetup: boolean
  setupStep: SetupStep
}

type SetupFeedback = {
  messages: string[]
  tone: ActionToastTone
}

const setupSteps: Array<[SetupStep, string]> = [
  ["settings", "급여 조건"],
  ["work", "근무 기록"],
  ["result", "예상 급여"]
]

function getEntryMinutes(entry: WorkEntry) {
  if (!entry.date || !entry.startTime || !entry.endTime) return 0
  return clampMinutes(diffMinutes(entry.startTime, entry.endTime) - clampMinutes(entry.breakMinutes))
}

function formatEntryDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${date}T00:00:00`))
}

export function SalaryHome({
  entries,
  settings,
  breakdown,
  monthLabel,
  selectedMonth,
  lastSavedAt,
  onGoToWork,
  onStartFirstWork,
  onGoToSalary,
  onGoToSettings,
  setupSettings,
  onSetupSettingsChange,
  onConfirmSetupSettings,
  onAddTemplateEntries,
  onStartSetupDirectWork,
  onCompleteSetup,
  showGuidedSetup,
  setupStep
}: SalaryHomeProps) {
  const [setupFeedback, setSetupFeedback] = useState<SetupFeedback | null>(null)
  const recentEntries = [...entries]
    .filter((entry) => entry.date && entry.startTime && entry.endTime)
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
    .slice(0, 3)
  const hasSettings = settings.hourlyWage > 0
  const workDays = new Set(entries.map((entry) => entry.date)).size
  const hasMonthEntries = entries.length > 0
  const shortMonthLabel = `${Number(selectedMonth.slice(5, 7))}월`

  useEffect(() => {
    if (!setupFeedback) return
    const timeout = window.setTimeout(() => setSetupFeedback(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [setupFeedback])

  const handleTemplateComplete = (
    result: AddWorkEntriesResult,
    messages: string[],
    tone: ActionToastTone
  ) => {
    setSetupFeedback({ messages, tone })
    if (result.addedCount > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  if (showGuidedSetup) {
    return (
      <div className="space-y-5">
        <section aria-labelledby="guided-setup-title" className="space-y-5">
          <header className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{monthLabel} 급여 계산</p>
            <h1 id="guided-setup-title" className="text-2xl font-semibold tracking-tight text-slate-900">
              급여 계산을 시작해볼게요
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              급여 조건을 확인하고 이번 달 근무를 만들면 예상 급여까지 바로 이어서 확인할 수 있어요.
            </p>
          </header>

          <ol className="grid grid-cols-3 gap-2 text-sm text-slate-700">
            {setupSteps.map(([step, label], index) => {
              const active = setupStep === step
              return (
                <li
                  key={step}
                  className={`flex min-h-12 items-center gap-2 rounded-md px-2 py-2 sm:px-3 ${
                    active ? "bg-slate-900 text-white" : "bg-white text-slate-600"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      active ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 text-xs font-medium sm:text-sm">{label}</span>
                </li>
              )
            })}
          </ol>

          {setupStep === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle>급여 조건 확인</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm leading-6 text-slate-600">
                  실제 근무 기록과 이 조건을 기준으로 {monthLabel} 예상 급여를 계산합니다.
                </p>
                <SalarySettingsForm settings={setupSettings} onChange={onSetupSettingsChange} />
                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <Button type="button" onClick={onConfirmSetupSettings}>
                    다음: 근무 기록
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {setupStep === "work" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-2 p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-slate-900">이번 달에는 어떻게 근무하시나요?</h2>
                  <p className="text-sm leading-6 text-slate-600">
                    반복되는 요일과 시간이 있다면 한 번에 {monthLabel} 근무 기록을 만들 수 있어요.
                  </p>
                </CardContent>
              </Card>

              <WorkTemplateForm
                selectedMonth={selectedMonth}
                onAddEntries={onAddTemplateEntries}
                onComplete={handleTemplateComplete}
              />

              <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <p className="font-medium text-slate-800">근무 일정이 매번 다른가요?</p>
                    <p className="mt-1 text-sm text-slate-500">직접 근무 기록을 하나 추가해서 시작할 수 있어요.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={onStartSetupDirectWork}>
                    직접 근무 기록하기
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {setupStep === "result" && (
            <Card className="overflow-hidden border-slate-900 bg-slate-900 text-white">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div>
                  <p className="text-sm text-slate-300">{monthLabel} 예상 실수령액</p>
                  <p className="mt-2 break-words text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                    {formatCurrency(breakdown.netPay)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    현재 등록한 근무 기록과 급여 조건을 기준으로 계산했어요.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">총 지급액</p>
                    <p className="mt-1 break-words font-medium tabular-nums">{formatCurrency(breakdown.grossPay)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">예상 공제</p>
                    <p className="mt-1 break-words font-medium tabular-nums">{formatCurrency(breakdown.totalDeductions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">근무일</p>
                    <p className="mt-1 font-medium tabular-nums">{workDays}일</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">근무시간</p>
                    <p className="mt-1 font-medium tabular-nums">{formatMinutesToHours(breakdown.totalWorkMinutes)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" className="bg-white text-slate-900 hover:bg-slate-100" onClick={onCompleteSetup}>
                    시작 완료
                  </Button>
                  <Button type="button" variant="outline" className="border-slate-500 bg-slate-900 text-white hover:bg-slate-800" onClick={onGoToSalary}>
                    급여 자세히 보기 <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {setupFeedback && <ActionToast messages={setupFeedback.messages} tone={setupFeedback.tone} />}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="monthly-pay-heading">
        <Card className="overflow-hidden border-slate-900 bg-slate-900 text-white">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-sm text-slate-300">{monthLabel} 예상 급여</p>
              <h1 id="monthly-pay-heading" className="mt-2 break-words text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                {formatCurrency(breakdown.netPay)}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                현재 기록된 근무 기준 예상 실수령액입니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
              <div>
                <p className="text-xs text-slate-400">총 지급액</p>
                <p className="mt-1 break-words font-medium tabular-nums">
                  {formatCurrency(breakdown.grossPay)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">예상 공제</p>
                <p className="mt-1 break-words font-medium tabular-nums">
                  {formatCurrency(breakdown.totalDeductions)}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" className="bg-white text-slate-900 hover:bg-slate-100" onClick={onStartFirstWork}>
                <Plus className="h-4 w-4" /> 근무 추가
              </Button>
              <Button type="button" variant="outline" className="border-slate-500 bg-slate-900 text-white hover:bg-slate-800" onClick={onGoToSalary}>
                급여 자세히 보기 <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {!hasMonthEntries && (
        <Card>
          <CardContent className="space-y-5 p-6 text-center">
            <div className="space-y-2">
              <p className="font-medium text-slate-700">{monthLabel}에는 아직 근무 기록이 없어요.</p>
              <p className="text-sm text-slate-500">
                근무를 추가하면 예상 급여와 근무 요약이 바로 업데이트됩니다.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button type="button" onClick={onGoToWork}>
                {shortMonthLabel} 근무 만들기
              </Button>
              <Button type="button" variant="outline" onClick={onStartFirstWork}>
                근무 하나 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="monthly-work-title">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 id="monthly-work-title" className="text-lg font-semibold">
              이번 달 근무
            </h2>
            <p className="mt-1 text-sm text-slate-500">예상 급여에 반영된 근무 요약입니다.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onGoToWork}>
            전체 근무 보기
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["근무일", `${workDays}일`],
            ["총 근무시간", formatMinutesToHours(breakdown.totalWorkMinutes)],
            ["야간시간", formatMinutesToHours(breakdown.nightMinutes)],
            ["연장시간", formatMinutesToHours(breakdown.overtimeMinutes)]
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

      {hasMonthEntries && (
      <section aria-labelledby="recent-entries-title">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle id="recent-entries-title">최근 근무 기록</CardTitle>
            <Button type="button" variant="ghost" size="sm" onClick={onGoToWork}>
              전체 보기
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{formatEntryDate(entry.date)}</p>
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
          </CardContent>
        </Card>
      </section>
      )}

      <StorageStatus lastSavedAt={lastSavedAt} />

      <p className="sr-only">
        현재 선택한 달 기준 실수령액은 {formatCurrency(breakdown.netPay)}입니다.
      </p>
    </div>
  )
}
