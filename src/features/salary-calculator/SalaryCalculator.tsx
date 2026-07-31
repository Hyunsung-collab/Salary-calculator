"use client"

import { useEffect, useRef, useState } from "react"
import { FileDown, FileSpreadsheet, FileUp, RotateCcw } from "lucide-react"

import type { SalarySettings, WorkEntry } from "@/types/salary"
import { useSalary } from "@/hooks/useSalary"
import { ExcelMapperModal } from "@/components/ExcelMapperModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SalaryResultSection } from "@/features/salary-calculator/SalaryResultSection"
import { SalarySettingsForm } from "@/features/salary-calculator/SalarySettingsForm"
import { WorkTemplateForm } from "@/features/salary-calculator/WorkTemplateForm"
import { SalaryAppNavigation, type AppSection } from "@/features/salary-calculator/SalaryAppNavigation"
import { SalaryHome } from "@/features/salary-calculator/SalaryHome"
import { WorkSection } from "@/features/salary-calculator/work/WorkSection"
import {
  clearSalaryData,
  downloadSalaryBackup,
  loadSalaryData,
  parseSalaryBackup,
  saveSalaryData
} from "@/lib/storage"

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

export function SalaryCalculator() {
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [settings, setSettings] = useState<SalarySettings>(defaultSettings)
  const [mapperOpen, setMapperOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [storageError, setStorageError] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const [section, setSection] = useState<AppSection>("home")
  const backupInputRef = useRef<HTMLInputElement>(null)
  const { breakdown } = useSalary(entries, settings)

  useEffect(() => {
    const saved = loadSalaryData()
    if (saved) {
      setEntries(saved.entries)
      setSettings(saved.settings)
      setLastSavedAt(saved.savedAt)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    try {
      const saved = saveSalaryData(entries, settings)
      setLastSavedAt(saved.savedAt)
      setStorageError("")
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "자동 저장에 실패했습니다.")
    }
  }, [entries, isHydrated, settings])

  const handleImport = (imported: WorkEntry[], hourlyWage?: number) => {
    setEntries(imported)
    if (hourlyWage) {
      setSettings((prev) => ({ ...prev, hourlyWage }))
    }
  }

  const resetData = () => {
    setEntries([])
    setSettings(defaultSettings)
    clearSalaryData()
    setLastSavedAt(null)
    setStorageError("")
    setResetOpen(false)
  }

  const handleBackupRestore = async (file: File | undefined) => {
    if (!file) return
    try {
      const backup = parseSalaryBackup(await file.text())
      setEntries(backup.entries)
      setSettings(backup.settings)
      setStorageError("")
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "백업 파일을 읽을 수 없습니다.")
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = ""
    }
  }

  const addTemplateEntries = (newEntries: WorkEntry[]) =>
    setEntries((prev) => [...prev, ...newEntries])

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-lg font-semibold text-slate-900">하이브리드 급여 계산기</p>
          <SalaryAppNavigation section={section} onSectionChange={setSection} />
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-6 pb-24 md:py-8 md:pb-8">
        {section === "home" && (
          <SalaryHome
            entries={entries}
            settings={settings}
            breakdown={breakdown}
            lastSavedAt={lastSavedAt}
            onGoToWork={() => setSection("work")}
            onGoToSalary={() => setSection("salary")}
            onGoToSettings={() => setSection("more")}
          />
        )}

        {section === "work" && (
          <WorkSection
            entries={entries}
            settings={settings}
            onChange={setEntries}
            onAddEntries={addTemplateEntries}
            onOpenExcel={() => setMapperOpen(true)}
          />
        )}

        {section === "salary" && (
          <div className="space-y-6">
            <header>
              <p className="text-sm font-medium text-slate-500">급여</p>
              <h1 className="mt-1 text-2xl font-semibold">급여 상세</h1>
            </header>
            <SalaryResultSection breakdown={breakdown} settings={settings} entries={entries} />
          </div>
        )}

        {section === "more" && (
          <div className="space-y-6">
            <header>
              <p className="text-sm font-medium text-slate-500">전체</p>
              <h1 className="mt-1 text-2xl font-semibold">설정 및 데이터 관리</h1>
            </header>
            <Card>
              <CardHeader>
                <CardTitle>급여 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SalarySettingsForm settings={settings} onChange={setSettings} />
              </CardContent>
            </Card>
            <WorkTemplateForm onAddEntries={addTemplateEntries} />
            <Card>
              <CardHeader>
                <CardTitle>데이터 관리</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setMapperOpen(true)}>
                    <FileSpreadsheet className="h-4 w-4" /> Excel 불러오기
                  </Button>
                  <Button variant="outline" onClick={() => downloadSalaryBackup(entries, settings)}>
                    <FileDown className="h-4 w-4" /> JSON 백업
                  </Button>
                  <Button variant="outline" onClick={() => backupInputRef.current?.click()}>
                    <FileUp className="h-4 w-4" /> JSON 복원
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setResetOpen(true)}>
                    <RotateCcw className="h-4 w-4" /> 전체 초기화
                  </Button>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(event) => void handleBackupRestore(event.target.files?.[0])}
                  />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-700">
                    {lastSavedAt ? "이 기기에 자동 저장됨" : "저장 준비 중"}
                  </p>
                  {lastSavedAt && (
                    <p className="text-xs text-slate-500">
                      마지막 저장: {new Date(lastSavedAt).toLocaleString("ko-KR")}
                    </p>
                  )}
                  {storageError && <p className="text-xs text-red-600">{storageError}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <ExcelMapperModal
        open={mapperOpen}
        onOpenChange={setMapperOpen}
        onImport={handleImport}
      />
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>모든 데이터를 초기화할까요?</DialogTitle>
            <DialogDescription>
              근무 기록과 급여 설정이 이 기기에서 삭제되고 기본 설정으로 돌아갑니다.
              JSON 백업 파일은 삭제되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>취소</Button>
            <Button type="button" onClick={resetData}>초기화</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
