"use client"

import { useEffect, useRef, useState } from "react"
import { FileDown, FileSpreadsheet, FileUp, RotateCcw } from "lucide-react"

import type { SalarySettings, WorkEntry } from "@/types/salary"
import { useSalary } from "@/hooks/useSalary"
import { ExcelMapperModal } from "@/components/ExcelMapperModal"
import { WorkLogForm } from "@/components/WorkLogForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalaryResultSection } from "@/features/salary-calculator/SalaryResultSection"
import { SalarySettingsForm } from "@/features/salary-calculator/SalarySettingsForm"
import { WorkTemplateForm } from "@/features/salary-calculator/WorkTemplateForm"
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
    if (!window.confirm("근무 기록과 급여 설정을 모두 초기화할까요?")) return
    setEntries([])
    setSettings(defaultSettings)
    clearSalaryData()
    setLastSavedAt(null)
    setStorageError("")
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
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setMapperOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" /> 엑셀 매핑
            </Button>
            <Button variant="outline" onClick={() => downloadSalaryBackup(entries, settings)}>
              <FileDown className="h-4 w-4" /> JSON 백업
            </Button>
            <Button variant="outline" onClick={() => backupInputRef.current?.click()}>
              <FileUp className="h-4 w-4" /> JSON 복원
            </Button>
            <input
              ref={backupInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void handleBackupRestore(event.target.files?.[0])}
            />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>근무 기록 입력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SalarySettingsForm settings={settings} onChange={setSettings} />
                <WorkLogForm entries={entries} onChange={setEntries} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
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
                <Button type="button" variant="outline" onClick={resetData}>
                  <RotateCcw className="h-4 w-4" /> 전체 초기화
                </Button>
              </CardContent>
            </Card>
            <WorkTemplateForm onAddEntries={(newEntries) => setEntries((prev) => [...prev, ...newEntries])} />
          </div>
          <SalaryResultSection breakdown={breakdown} settings={settings} entries={entries} />
        </div>
      </section>

      <ExcelMapperModal
        open={mapperOpen}
        onOpenChange={setMapperOpen}
        onImport={handleImport}
      />
    </main>
  )
}
