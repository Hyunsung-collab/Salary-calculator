"use client"

import { useMemo, useState } from "react"
import { FileSpreadsheet, Printer } from "lucide-react"

import type { SalarySettings, WorkEntry } from "@/types/salary"
import { useSalary } from "@/hooks/useSalary"
import { HALF_HOUR_OPTIONS } from "@/lib/time"
import { ExcelMapperModal } from "@/components/ExcelMapperModal"
import { WorkLogForm } from "@/components/WorkLogForm"
import { SalarySummary } from "@/components/SalarySummary"
import { PayslipPreview } from "@/components/PayslipPreview"
import { PayslipReport } from "@/components/PayslipReport"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const defaultSettings: SalarySettings = {
  hourlyWage: 10320,
  bonusAllowance: 0,
  mealAllowance: 0,
  overtimeMultiplier: 1.5,
  nightMultiplier: 1.5,
  applyOvertime: false,
  applyNight: false,
  applyWeeklyAllowance: false,
  applyBonusAllowance: false,
  applyDeductions: false,
  applyPension: false,
  applyHealthInsurance: false,
  applyLongTermCare: false,
  applyEmploymentInsurance: false,
  applyIncomeTax: false,
  applyLocalIncomeTax: false
}

export default function HomePage() {
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [settings, setSettings] = useState<SalarySettings>(defaultSettings)
  const [mapperOpen, setMapperOpen] = useState(false)
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")
  const [templateWeekdays, setTemplateWeekdays] = useState<number[]>([])
  const [templateByDay, setTemplateByDay] = useState<
    Record<number, { startTime: string; endTime: string; breakMinutes: number }>
  >({})

  const { breakdown } = useSalary(entries, settings)
  const weekdayLabels = useMemo(
    () => ["일", "월", "화", "수", "목", "금", "토"],
    []
  )

  const handleImport = (imported: WorkEntry[], hourlyWage?: number) => {
    setEntries(imported)
    if (hourlyWage) {
      setSettings((prev) => ({ ...prev, hourlyWage }))
    }
  }

  const defaultTemplate = useMemo(
    () => ({ startTime: "09:00", endTime: "18:00", breakMinutes: 60 }),
    []
  )

  const createEntry = (date: string, day: number): WorkEntry => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`
    const template = templateByDay[day] ?? defaultTemplate
    return {
      id,
      date,
      startTime: template.startTime,
      endTime: template.endTime,
      breakMinutes: template.breakMinutes
    }
  }

  const addTemplateEntries = () => {
    if (!rangeStart || !rangeEnd || templateWeekdays.length === 0) return
    const start = new Date(`${rangeStart}T00:00:00`)
    const end = new Date(`${rangeEnd}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return
    if (start > end) return

    const formatLocalDate = (value: Date) =>
      `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
        value.getDate()
      ).padStart(2, "0")}`

    const newEntries: WorkEntry[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const day = cursor.getDay()
      if (templateWeekdays.includes(day)) {
        const date = formatLocalDate(cursor)
        newEntries.push(createEntry(date, day))
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    setEntries((prev) => [...prev, ...newEntries])
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 no-print">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">하이브리드 급여 계산기</h1>
            <p className="text-sm text-slate-500">
              수동 입력 or 엑셀 임포트를 함께 사용한 급여 계산기
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMapperOpen(true)} className="no-print">
              <FileSpreadsheet className="h-4 w-4" /> 엑셀 매핑
            </Button>
            <Button onClick={() => window.print()} className="no-print">
              <Printer className="h-4 w-4" /> PDF 출력
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>근무 기록 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourlyWage">기본 시급</Label>
                  <Input
                    id="hourlyWage"
                    type="number"
                    min={0}
                    value={settings.hourlyWage ?? 0}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, hourlyWage: Number(event.target.value) }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonusAllowance">추가수당(고정)</Label>
                  <Input
                    id="bonusAllowance"
                    type="number"
                    min={0}
                    value={settings.bonusAllowance ?? 0}
                    disabled={!settings.applyBonusAllowance}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        bonusAllowance: Number(event.target.value)
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mealAllowance">식대(비과세)</Label>
                  <Input
                    id="mealAllowance"
                    type="number"
                    min={0}
                    value={settings.mealAllowance ?? 0}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        mealAllowance: Number(event.target.value)
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-4 rounded-md border border-slate-100 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-700">고정 근무 일괄 입력</p>
                  <p className="text-xs text-slate-500">
                    정규 근무는 일괄 추가, 대타는 아래에서 개별 입력하세요.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rangeStart">적용 시작일</Label>
                    <Input
                      id="rangeStart"
                      type="date"
                      value={rangeStart}
                      onChange={(event) => setRangeStart(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rangeEnd">적용 종료일</Label>
                    <Input
                      id="rangeEnd"
                      type="date"
                      value={rangeEnd}
                      onChange={(event) => setRangeEnd(event.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>근무 요일</Label>
                    <div className="flex flex-wrap gap-2">
                      {weekdayLabels.map((label, idx) => (
                        <label
                          key={label}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                            templateWeekdays.includes(idx)
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={templateWeekdays.includes(idx)}
                            onChange={(event) => {
                              setTemplateWeekdays((prev) =>
                                event.target.checked
                                  ? [...prev, idx]
                                  : prev.filter((day) => day !== idx)
                              )
                              setTemplateByDay((prev) => {
                                if (event.target.checked) {
                                  return {
                                    ...prev,
                                    [idx]: prev[idx] ?? defaultTemplate
                                  }
                                }
                                const next = { ...prev }
                                delete next[idx]
                                return next
                              })
                            }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="space-y-2">
                      <Label>요일별 시간 설정</Label>
                      {templateWeekdays.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          요일을 선택하면 해당 요일별 시간 설정이 표시됩니다.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {templateWeekdays.map((day) => {
                            const template = templateByDay[day] ?? defaultTemplate
                            return (
                              <div
                                key={day}
                                className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 md:grid-cols-[80px_1fr_1fr_1fr]"
                              >
                                <div className="flex items-center text-sm font-medium text-slate-700">
                                  {weekdayLabels[day]}요일
                                </div>
                                <select
                                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                  value={template.startTime}
                                  onChange={(event) =>
                                    setTemplateByDay((prev) => ({
                                      ...prev,
                                      [day]: { ...template, startTime: event.target.value }
                                    }))
                                  }
                                >
                                  {HALF_HOUR_OPTIONS.map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                  value={template.endTime}
                                  onChange={(event) =>
                                    setTemplateByDay((prev) => ({
                                      ...prev,
                                      [day]: { ...template, endTime: event.target.value }
                                    }))
                                  }
                                >
                                  {HALF_HOUR_OPTIONS.map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                                <Input
                                  type="number"
                                  min={0}
                                  value={template.breakMinutes ?? 0}
                                  onChange={(event) =>
                                    setTemplateByDay((prev) => ({
                                      ...prev,
                                      [day]: { ...template, breakMinutes: Number(event.target.value) }
                                    }))
                                  }
                                />
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={addTemplateEntries}
                    disabled={!rangeStart || !rangeEnd || templateWeekdays.length === 0}
                  >
                    선택 요일 일괄 추가
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-4 text-sm">
                <p className="font-medium text-slate-700">수당/공제 적용</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyOvertime}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, applyOvertime: event.target.checked }))
                      }
                    />
                    연장수당 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyNight}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, applyNight: event.target.checked }))
                      }
                    />
                    야간수당 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyWeeklyAllowance}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyWeeklyAllowance: event.target.checked
                        }))
                      }
                    />
                    주휴수당 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyBonusAllowance}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyBonusAllowance: event.target.checked
                        }))
                      }
                    />
                    추가수당 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyDeductions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyDeductions: event.target.checked
                        }))
                      }
                    />
                    공제 적용
                  </label>
                </div>
                <div className="grid gap-3 border-t border-slate-200 pt-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyPension}
                      disabled={!settings.applyDeductions}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, applyPension: event.target.checked }))
                      }
                    />
                    국민연금 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyHealthInsurance}
                      disabled={!settings.applyDeductions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyHealthInsurance: event.target.checked
                        }))
                      }
                    />
                    건강보험 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyLongTermCare}
                      disabled={!settings.applyDeductions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyLongTermCare: event.target.checked
                        }))
                      }
                    />
                    장기요양 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyEmploymentInsurance}
                      disabled={!settings.applyDeductions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyEmploymentInsurance: event.target.checked
                        }))
                      }
                    />
                    고용보험 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyIncomeTax}
                      disabled={!settings.applyDeductions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyIncomeTax: event.target.checked
                        }))
                      }
                    />
                    소득세 적용
                  </label>
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={settings.applyLocalIncomeTax}
                      disabled={!settings.applyDeductions}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          applyLocalIncomeTax: event.target.checked
                        }))
                      }
                    />
                    지방소득세 적용
                  </label>
                </div>
              </div>
              <WorkLogForm entries={entries} onChange={setEntries} />
            </CardContent>
          </Card>

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
        </div>

        <PayslipPreview breakdown={breakdown} settings={settings} />
      </section>

      <section className="print-only px-10 py-8">
        <PayslipReport breakdown={breakdown} settings={settings} entries={entries} />
      </section>

      <ExcelMapperModal
        open={mapperOpen}
        onOpenChange={setMapperOpen}
        onImport={handleImport}
      />
    </main>
  )
}
