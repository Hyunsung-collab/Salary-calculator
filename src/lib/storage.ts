import type { SalarySettings, WorkEntry } from "@/types/salary"
import { getMonthKeysFromEntries, isMonthKey, type MonthKey } from "@/lib/month"

export const SALARY_STORAGE_KEY = "salary-calculator-data"

export type SavedSalaryDataV1 = {
  version: 1
  entries: WorkEntry[]
  settings: SalarySettings
  savedAt: string
}

export type SavedSalaryDataV2 = {
  version: 2
  entries: WorkEntry[]
  defaultSettings: SalarySettings
  settingsByMonth: Record<MonthKey, SalarySettings>
  savedAt: string
}

export type SavedSalaryData = SavedSalaryDataV2

export type LoadedSalaryData = SavedSalaryDataV2 & {
  migratedFromVersion?: 1
}

export type SalaryDataLoadResult = {
  data: LoadedSalaryData | null
  error?: string
  hadStoredData: boolean
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

export function isSalarySettings(value: unknown): value is SalarySettings {
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

function isSettingsByMonth(value: unknown): value is Record<MonthKey, SalarySettings> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  return Object.entries(value as Record<string, unknown>).every(
    ([month, settings]) => isMonthKey(month) && isSalarySettings(settings)
  )
}

export function isSavedSalaryDataV1(value: unknown): value is SavedSalaryDataV1 {
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

export function isSavedSalaryDataV2(value: unknown): value is SavedSalaryDataV2 {
  if (!value || typeof value !== "object") return false
  const data = value as Record<string, unknown>
  return (
    data.version === 2 &&
    typeof data.savedAt === "string" &&
    Array.isArray(data.entries) &&
    data.entries.every(isWorkEntry) &&
    isSalarySettings(data.defaultSettings) &&
    isSettingsByMonth(data.settingsByMonth)
  )
}

export function isSavedSalaryData(value: unknown): value is SavedSalaryData {
  return isSavedSalaryDataV2(value)
}

function cloneSettings(settings: SalarySettings): SalarySettings {
  return { ...settings }
}

function migrateSalaryDataV1(data: SavedSalaryDataV1): LoadedSalaryData {
  const settingsByMonth = getMonthKeysFromEntries(data.entries).reduce<Record<MonthKey, SalarySettings>>(
    (result, month) => {
      result[month] = cloneSettings(data.settings)
      return result
    },
    {}
  )

  return {
    version: 2,
    entries: data.entries,
    defaultSettings: cloneSettings(data.settings),
    settingsByMonth,
    savedAt: data.savedAt,
    migratedFromVersion: 1
  }
}

export function normalizeSalaryData(value: unknown): LoadedSalaryData | null {
  if (isSavedSalaryDataV2(value)) return value
  if (isSavedSalaryDataV1(value)) return migrateSalaryDataV1(value)
  return null
}

export function loadSalaryData(): SalaryDataLoadResult {
  if (typeof window === "undefined") return { data: null, hadStoredData: false }
  try {
    const raw = window.localStorage.getItem(SALARY_STORAGE_KEY)
    if (!raw) return { data: null, hadStoredData: false }
    const parsed: unknown = JSON.parse(raw)
    const data = normalizeSalaryData(parsed)
    return data
      ? { data, hadStoredData: true }
      : {
          data: null,
          error: "저장된 급여 데이터 형식이 올바르지 않아 자동 복원을 건너뛰었습니다.",
          hadStoredData: true
        }
  } catch {
    return {
      data: null,
      error: "저장된 급여 데이터를 읽을 수 없어 자동 복원을 건너뛰었습니다.",
      hadStoredData: true
    }
  }
}

export function saveSalaryData(
  entries: WorkEntry[],
  defaultSettings: SalarySettings,
  settingsByMonth: Record<MonthKey, SalarySettings>
): SavedSalaryData {
  const data: SavedSalaryData = {
    version: 2,
    entries,
    defaultSettings,
    settingsByMonth,
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
  const normalized = normalizeSalaryData(parsed)
  if (!normalized) {
    throw new Error("지원하지 않는 백업 파일 형식입니다.")
  }
  const { migratedFromVersion: _migratedFromVersion, ...data } = normalized
  return data
}

export function downloadSalaryBackup(
  entries: WorkEntry[],
  defaultSettings: SalarySettings,
  settingsByMonth: Record<MonthKey, SalarySettings>
) {
  const data = {
    version: 2 as const,
    entries,
    defaultSettings,
    settingsByMonth,
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
