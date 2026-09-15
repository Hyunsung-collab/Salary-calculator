"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileDown, FileSpreadsheet, FileUp, RotateCcw } from "lucide-react"

import type { SalarySettings, WorkEntry } from "@/types/salary"
import { useSalary } from "@/hooks/useSalary"
import { ExcelMapperModal } from "@/components/ExcelMapperModal"
import { ActionToast, type ActionToastTone } from "@/components/ui/action-toast"
import { GuidedIntro } from "@/features/salary-calculator/GuidedIntro"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SalaryResultSection } from "@/features/salary-calculator/SalaryResultSection"
import { SalarySettingsForm } from "@/features/salary-calculator/SalarySettingsForm"
import type { AddWorkEntriesResult } from "@/features/salary-calculator/WorkTemplateForm"
import { MonthNavigator } from "@/features/salary-calculator/MonthNavigator"
import { SalaryAppNavigation, type AppSection } from "@/features/salary-calculator/SalaryAppNavigation"
import { SalaryHome } from "@/features/salary-calculator/SalaryHome"
import { StorageStatus } from "@/features/salary-calculator/StorageStatus"
import { WorkEntryEditor } from "@/features/salary-calculator/work/WorkEntryEditor"
import { WorkSection } from "@/features/salary-calculator/work/WorkSection"
import { findWorkEntryConflict } from "@/salary/workEntryConflicts"
import {
  formatMonthLabel,
  getCurrentMonthKey,
  getEntriesForMonth,
  getMonthKeysFromEntries,
  type MonthKey
} from "@/lib/month"
import { loadSalaryUiPreferences, saveSalaryUiPreferences, type SalarySetupStep } from "@/lib/uiPreferences"
import {
  clearSalaryData,
  downloadSalaryBackup,
  loadSalaryData,
  parseSalaryBackup,
  saveSalaryData
} from "@/lib/storage"

const appDefaultSettings: SalarySettings = {
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

type SetupStep = SalarySetupStep

function cloneSettings(settings: SalarySettings): SalarySettings {
  return { ...settings }
}

function materializeSettingsForEntries(
  currentSettingsByMonth: Record<MonthKey, SalarySettings>,
  targetEntries: WorkEntry[],
  baseSettings: SalarySettings
) {
  const months = getMonthKeysFromEntries(targetEntries)
  if (months.length === 0) return currentSettingsByMonth

  let changed = false
  const nextSettingsByMonth = { ...currentSettingsByMonth }
  months.forEach((month) => {
    if (!nextSettingsByMonth[month]) {
      nextSettingsByMonth[month] = cloneSettings(baseSettings)
      changed = true
    }
  })

  return changed ? nextSettingsByMonth : currentSettingsByMonth
}

export function SalaryCalculator() {
  const [entries, setEntries] = useState<WorkEntry[]>([])
  const [defaultSettings, setDefaultSettings] = useState<SalarySettings>(appDefaultSettings)
  const [settingsByMonth, setSettingsByMonth] = useState<Record<MonthKey, SalarySettings>>({})
  const [mapperOpen, setMapperOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [storageError, setStorageError] = useState("")
  const [resetOpen, setResetOpen] = useState(false)
  const [section, setSection] = useState<AppSection>("home")
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey)
  const [workEditorRequestId, setWorkEditorRequestId] = useState<number | null>(null)
  const [setupDirectEditorOpen, setSetupDirectEditorOpen] = useState(false)
  const [introCompleted, setIntroCompleted] = useState(false)
  const [feedback, setFeedback] = useState<{ id: number; messages: string[]; tone: ActionToastTone } | null>(null)
  const feedbackId = useRef(0)
  const notify = useCallback((messages: string[], tone: ActionToastTone = "success") => {
    setFeedback({ id: ++feedbackId.current, messages, tone })
  }, [])
  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 5000)
    return () => window.clearTimeout(timer)
  }, [feedback])
  const [setupCompleted, setSetupCompleted] = useState(false)
  const [setupStep, setSetupStep] = useState<SetupStep>("settings")
  const [setupSettingsDraft, setSetupSettingsDraft] = useState<SalarySettings>(appDefaultSettings)
  const backupInputRef = useRef<HTMLInputElement>(null)
  const skipNextAutoSaveRef = useRef(false)
  const selectedMonthEntries = getEntriesForMonth(entries, selectedMonth)
  const selectedMonthLabel = formatMonthLabel(selectedMonth)
  const selectedMonthSettings = settingsByMonth[selectedMonth] ?? defaultSettings
  const { breakdown } = useSalary(selectedMonthEntries, selectedMonthSettings)

  useEffect(() => {
    const loadResult = loadSalaryData()
    const saved = loadResult.data
    if (saved) {
      setEntries(saved.entries)
      setDefaultSettings(saved.defaultSettings)
      setSettingsByMonth(saved.settingsByMonth)
      setSetupSettingsDraft(saved.settingsByMonth[selectedMonth] ?? saved.defaultSettings)
      setLastSavedAt(saved.savedAt)
      if (saved.migratedFromVersion) {
        skipNextAutoSaveRef.current = true
      }
    }
    if (!saved && loadResult.hadStoredData) {
      skipNextAutoSaveRef.current = true
    }
    if (loadResult.error) {
      setStorageError(loadResult.error)
    }
    const preferences = loadSalaryUiPreferences()
    const legacyExistingUser = !preferences.hadStoredPreferences && Boolean(saved?.entries.length)
    const nextSetupCompleted = preferences.setupCompleted || legacyExistingUser ||
      (preferences.setupStep === "result" && Boolean(saved?.entries.length))
    setIntroCompleted(preferences.introCompleted || legacyExistingUser || nextSetupCompleted)
    setSetupCompleted(nextSetupCompleted)
    const resumedStep = preferences.setupStep === "result" ? "work" : preferences.setupStep
    setSetupStep(nextSetupCompleted ? "result" : saved ? resumedStep : "settings")
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false
      return
    }
    try {
      const saved = saveSalaryData(entries, defaultSettings, settingsByMonth)
      setLastSavedAt(saved.savedAt)
      setStorageError("")
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "자동 저장에 실패했습니다.")
    }
  }, [defaultSettings, entries, isHydrated, settingsByMonth])

  useEffect(() => {
    if (!isHydrated) return
    try {
      saveSalaryUiPreferences({ introCompleted, setupCompleted, setupStep })
    } catch {
      notify(["사용 단계 저장에 실패했어요. 새로고침하면 안내가 다시 나타날 수 있어요."], "error")
    }
  }, [introCompleted, isHydrated, setupCompleted, setupStep, notify])

  const materializeSettingsSnapshots = useCallback(
    (targetEntries: WorkEntry[], baseSettings = defaultSettings) => {
      setSettingsByMonth((previous) =>
        materializeSettingsForEntries(previous, targetEntries, baseSettings)
      )
    },
    [defaultSettings]
  )

  const updateMonthSettings = useCallback((month: MonthKey, settings: SalarySettings) => {
    setSettingsByMonth((previous) => ({
      ...previous,
      [month]: cloneSettings(settings)
    }))
  }, [])

  const handleImport = (imported: WorkEntry[], hourlyWage?: number, skippedCount = 0) => {
    const nextDefaultSettings = hourlyWage
      ? { ...defaultSettings, hourlyWage }
      : defaultSettings

    setEntries(imported)
    if (hourlyWage) {
      setDefaultSettings(nextDefaultSettings)
    }
    materializeSettingsSnapshots(imported, nextDefaultSettings)
    const importedMonths = getMonthKeysFromEntries(imported).sort()
    if (!importedMonths.includes(selectedMonth) && importedMonths.length) {
      setSelectedMonth(importedMonths[importedMonths.length - 1])
    }
    setSection("home")
    notify([skippedCount > 0 ? `${imported.length}개를 불러왔고, ${skippedCount}개는 형식을 확인해 주세요.` : `${imported.length}개의 근무 기록을 불러왔어요.`], skippedCount > 0 ? "warning" : "success")
  }

  const resetData = () => {
    try {
      clearSalaryData()
    } catch {
      setStorageError("초기화하지 못했어요. 이 기기의 저장소 접근 상태를 확인해 주세요.")
      setResetOpen(false)
      notify(["초기화하지 못했어요. 기존 데이터는 유지돼요."], "error")
      return
    }
    setEntries([])
    setDefaultSettings(appDefaultSettings)
    setSettingsByMonth({})
    setSetupCompleted(false)
    setSection("home")
    setSelectedMonth(getCurrentMonthKey())
    setSetupStep("settings")
    setSetupSettingsDraft(appDefaultSettings)
    setSetupDirectEditorOpen(false)
    setWorkEditorRequestId(null)
    setLastSavedAt(null)
    setStorageError("")
    setResetOpen(false)
    notify(["근무 기록과 급여 조건을 초기화했어요. 급여 조건부터 다시 입력해 주세요."])
  }

  const handleBackupRestore = async (file: File | undefined) => {
    if (!file) return
    try {
      const backup = parseSalaryBackup(await file.text())
      setEntries(backup.entries)
      setDefaultSettings(backup.defaultSettings)
      setSettingsByMonth(backup.settingsByMonth)
      setSetupSettingsDraft(backup.settingsByMonth[selectedMonth] ?? backup.defaultSettings)
      setStorageError("")
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "백업 파일을 읽을 수 없습니다.")
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = ""
    }
  }

  const addTemplateEntries = (newEntries: WorkEntry[]): AddWorkEntriesResult => {
    const acceptedEntries: WorkEntry[] = []

    newEntries.forEach((entry) => {
      const conflict = findWorkEntryConflict([...entries, ...acceptedEntries], entry)
      if (!conflict) {
        acceptedEntries.push(entry)
      }
    })

    if (acceptedEntries.length > 0) {
      setEntries([...entries, ...acceptedEntries])
      materializeSettingsSnapshots(acceptedEntries)
      if (!setupCompleted) {
        completeSetupAndStayHome()
      }
    }

    return {
      addedCount: acceptedEntries.length,
      skippedCount: newEntries.length - acceptedEntries.length
    }
  }

  const requestWorkEntryEditor = () => {
    setSection("work")
    setWorkEditorRequestId(Date.now())
  }

  const handleWorkEditorRequestHandled = useCallback(() => {
    setWorkEditorRequestId(null)
  }, [])

  const confirmSetupSettings = () => {
    setDefaultSettings(setupSettingsDraft)
    updateMonthSettings(selectedMonth, setupSettingsDraft)
    setSetupStep("work")
    setSection("home")
    notify(["급여 조건을 반영했어요. 이제 이번 달 근무를 입력해 주세요."])
  }

  const completeSetupAndStayHome = () => {
    setSetupStep("result")
    setSetupCompleted(true)
    setSection("home")
  }

  const openSetupDirectWorkEditor = () => {
    setSetupDirectEditorOpen(true)
  }

  const saveSetupDirectWorkEntry = (savedEntry: WorkEntry) => {
    const conflict = findWorkEntryConflict(entries, savedEntry, savedEntry.id)
    if (conflict) {
      return {
        ok: false as const,
        messages: [
          "기존 근무시간과 겹쳐요.",
          `기존 근무 ${conflict.entry.date} ${conflict.entry.startTime}~${conflict.entry.endTime}`,
          "겹치지 않는 시간으로 수정해주세요."
        ]
      }
    }

    setEntries([...entries, savedEntry])
    materializeSettingsSnapshots([savedEntry])
    setSelectedMonth(savedEntry.date.slice(0, 7))
    completeSetupAndStayHome()
    notify([`${Number(savedEntry.date.slice(5, 7))}월 ${Number(savedEntry.date.slice(8))}일 근무를 추가했어요.`])
    return { ok: true as const }
  }

  const handleEntriesChange = (nextEntries: WorkEntry[], materializedEntries: WorkEntry[] = []) => {
    setEntries(nextEntries)
    materializeSettingsSnapshots(materializedEntries)
    if (!setupCompleted && nextEntries.length > entries.length) {
      completeSetupAndStayHome()
    }
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12" aria-busy="true">
        <p role="status" className="text-center text-slate-500">급여 정보를 불러오는 중이에요.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-lg font-semibold text-slate-900">하이브리드 급여 계산기</p>
          {setupCompleted && <SalaryAppNavigation section={section} onSectionChange={setSection} />}
        </div>
      </div>

      {storageError && <div role="alert" className="mx-auto max-w-6xl px-4 pt-4 text-sm text-red-700">{storageError}</div>}
      <section className="mx-auto max-w-6xl px-4 py-6 pb-24 md:py-8 md:pb-8">
        {section !== "more" && setupCompleted && (
          <div className="mb-6">
            <MonthNavigator
              selectedMonth={selectedMonth}
              monthLabel={selectedMonthLabel}
              onSelectedMonthChange={setSelectedMonth}
            />
          </div>
        )}

        {section === "home" && (
          <SalaryHome
            entries={selectedMonthEntries}
            settings={selectedMonthSettings}
            breakdown={breakdown}
            monthLabel={selectedMonthLabel}
            lastSavedAt={lastSavedAt}
            onGoToWork={() => setSection("work")}
            onStartFirstWork={requestWorkEntryEditor}
            onGoToSalary={() => setSection("salary")}
            onGoToSettings={() => setSection("more")}
            selectedMonth={selectedMonth}
            setupSettings={setupSettingsDraft}
            onSetupSettingsChange={setSetupSettingsDraft}
            onConfirmSetupSettings={confirmSetupSettings}
            onAddTemplateEntries={addTemplateEntries}
            onStartSetupDirectWork={openSetupDirectWorkEditor}
            showGuidedSetup={!setupCompleted}
            setupStep={setupStep}
            onFeedback={notify}
          />
        )}

        {section === "work" && (
          <WorkSection
            entries={entries}
            settings={selectedMonthSettings}
            selectedMonth={selectedMonth}
            monthLabel={selectedMonthLabel}
            onChange={handleEntriesChange}
            onAddEntries={addTemplateEntries}
            openEditorRequestId={workEditorRequestId}
            onEditorRequestHandled={handleWorkEditorRequestHandled}
            onOpenExcel={() => setMapperOpen(true)}
            onFeedback={notify}
          />
        )}

        {section === "salary" && (
          <div className="space-y-6">
            <header>
              <p className="text-sm font-medium text-slate-500">급여</p>
              <h1 className="mt-1 text-2xl font-semibold">{selectedMonthLabel} 급여 상세</h1>
              <p className="mt-1 text-sm text-slate-500">선택한 달 기준 예상 급여입니다.</p>
            </header>
            <SalaryResultSection
              breakdown={breakdown}
              settings={selectedMonthSettings}
              entries={selectedMonthEntries}
              selectedMonth={selectedMonth}
              monthLabel={selectedMonthLabel}
              hasMonthSettingsSnapshot={Boolean(settingsByMonth[selectedMonth])}
              onUpdateMonthSettings={updateMonthSettings}
              onFeedback={notify}
            />
          </div>
        )}

        {section === "more" && (
          <div className="space-y-6">
            <header>
              <p className="text-sm font-medium text-slate-500">설정</p>
              <h1 className="mt-1 text-2xl font-semibold">설정 및 데이터 관리</h1>
            </header>
            <Card>
              <CardHeader>
                <CardTitle>급여 기본 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-slate-500">
                  새로운 급여월을 시작할 때 사용할 기본 조건이에요. 이미 생성된 과거 월의 계산 조건은 바뀌지 않아요.
                </p>
                <SalarySettingsForm settings={defaultSettings} onChange={setDefaultSettings} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>데이터 관리</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setMapperOpen(true)}>
                    <FileSpreadsheet className="h-4 w-4" /> Excel 불러오기
                  </Button>
                  <Button variant="outline" onClick={() => downloadSalaryBackup(entries, defaultSettings, settingsByMonth)}>
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
                  <StorageStatus lastSavedAt={lastSavedAt} error={storageError} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {!introCompleted && <GuidedIntro onComplete={() => setIntroCompleted(true)} />}
      <ExcelMapperModal
        open={mapperOpen}
        onOpenChange={setMapperOpen}
        onImport={handleImport}
        selectedMonth={selectedMonth}
      />
      <WorkEntryEditor
        open={setupDirectEditorOpen}
        entry={null}
        settings={selectedMonthSettings}
        selectedMonth={selectedMonth}
        onOpenChange={setSetupDirectEditorOpen}
        onSave={saveSetupDirectWorkEntry}
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
            <Button type="button" variant="destructive" onClick={resetData}>초기화</Button>
          </div>
        </DialogContent>
      </Dialog>
      {feedback && <ActionToast key={feedback.id} messages={feedback.messages} tone={feedback.tone} />}
    </main>
  )
}
