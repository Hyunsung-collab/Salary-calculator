export const SALARY_UI_PREFERENCES_KEY = "salary-calculator-ui-preferences"

export type SalarySetupStep = "settings" | "work" | "result"

export type SalaryUiPreferences = {
  introCompleted: boolean
  setupCompleted: boolean
  setupStep: SalarySetupStep
  hadStoredPreferences: boolean
}

function getDefaultPreferences(): SalaryUiPreferences {
  return {
    introCompleted: false,
    setupCompleted: false,
    setupStep: "settings",
    hadStoredPreferences: false
  }
}

function normalizeSetupStep(value: unknown): SalarySetupStep {
  if (value === "settings" || value === "work" || value === "result") return value
  if (value === "salary") return "result"
  return "settings"
}

function isSalaryUiPreferences(value: unknown): value is SalaryUiPreferences {
  if (!value || typeof value !== "object") return false
  const preferences = value as Record<string, unknown>
  return typeof preferences.setupCompleted === "boolean"
}

export function loadSalaryUiPreferences(): SalaryUiPreferences {
  if (typeof window === "undefined") return getDefaultPreferences()
  try {
    const raw = window.localStorage.getItem(SALARY_UI_PREFERENCES_KEY)
    if (!raw) return getDefaultPreferences()
    const parsed: unknown = JSON.parse(raw)
    if (!isSalaryUiPreferences(parsed)) return getDefaultPreferences()

    return {
      introCompleted: typeof parsed.introCompleted === "boolean" ? parsed.introCompleted : true,
      setupCompleted: parsed.setupCompleted,
      setupStep: normalizeSetupStep((parsed as Record<string, unknown>).setupStep),
      hadStoredPreferences: true
    }
  } catch {
    return getDefaultPreferences()
  }
}

export function saveSalaryUiPreferences(preferences: Partial<Omit<SalaryUiPreferences, "hadStoredPreferences">>) {
  if (typeof window === "undefined") return
  const current = loadSalaryUiPreferences()
  window.localStorage.setItem(
    SALARY_UI_PREFERENCES_KEY,
    JSON.stringify({
      introCompleted: preferences.introCompleted ?? current.introCompleted,
      setupCompleted: preferences.setupCompleted ?? current.setupCompleted,
      setupStep: preferences.setupStep ?? current.setupStep
    })
  )
}
