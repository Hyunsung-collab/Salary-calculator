import type { SalarySettings, WorkEntry } from "@/types/salary"

export const SALARY_STORAGE_KEY = "salary-calculator-data"

export type SavedSalaryData = {
  version: 1
  entries: WorkEntry[]
  settings: SalarySettings
  savedAt: string
}

function isWorkEntry(value: unknown): value is WorkEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    typeof entry.startTime === "string" &&
    typeof entry.endTime === "string" &&
    typeof entry.breakMinutes === "number" &&
    Number.isFinite(entry.breakMinutes)
  )
}

function isSalarySettings(value: unknown): value is SalarySettings {
  if (!value || typeof value !== "object") return false
  const settings = value as Record<string, unknown>
  const numericKeys = [
    "hourlyWage",
    "bonusAllowance",
    "mealAllowance",
    "overtimeMultiplier",
    "nightMultiplier"
  ]
  const booleanKeys = [
    "applyOvertime",
    "applyNight",
    "applyWeeklyAllowance",
    "applyBonusAllowance",
    "applyDeductions",
    "applyPension",
    "applyHealthInsurance",
    "applyLongTermCare",
    "applyEmploymentInsurance",
    "applyIncomeTax",
    "applyLocalIncomeTax"
  ]
  return (
    numericKeys.every(
      (key) => typeof settings[key] === "number" && Number.isFinite(settings[key])
    ) && booleanKeys.every((key) => typeof settings[key] === "boolean")
  )
}

export function isSavedSalaryData(value: unknown): value is SavedSalaryData {
  if (!value || typeof value !== "object") return false
  const data = value as Record<string, unknown>
  return (
    data.version === 1 &&
    typeof data.savedAt === "string" &&
    Array.isArray(data.entries) &&
    data.entries.every(isWorkEntry) &&
    isSalarySettings(data.settings)
  )
}

export function loadSalaryData(): SavedSalaryData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SALARY_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isSavedSalaryData(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveSalaryData(entries: WorkEntry[], settings: SalarySettings): SavedSalaryData {
  const data: SavedSalaryData = {
    version: 1,
    entries,
    settings,
    savedAt: new Date().toISOString()
  }
  if (typeof window === "undefined") {
    throw new Error("브라우저에서만 데이터를 저장할 수 있습니다.")
  }
  window.localStorage.setItem(SALARY_STORAGE_KEY, JSON.stringify(data))
  return data
}

export function clearSalaryData() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(SALARY_STORAGE_KEY)
}

export function parseSalaryBackup(raw: string): SavedSalaryData {
  const parsed: unknown = JSON.parse(raw)
  if (!isSavedSalaryData(parsed)) {
    throw new Error("지원하지 않는 백업 파일 형식입니다.")
  }
  return parsed
}

export function downloadSalaryBackup(entries: WorkEntry[], settings: SalarySettings) {
  const data = {
    version: 1 as const,
    entries,
    settings,
    savedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "salary-calculator-backup.json"
  link.click()
  URL.revokeObjectURL(url)
}
