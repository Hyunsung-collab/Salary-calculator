import type { WorkEntry } from "@/types/salary"

export type MonthKey = string

export function isMonthKey(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
}

export function getCurrentMonthKey() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function shiftMonthKey(month: string, amount: number) {
  const date = new Date(`${month}-01T00:00:00`)
  date.setMonth(date.getMonth() + amount)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function getMonthStartDate(month: string) {
  return `${month}-01`
}

export function getMonthEndDate(month: string) {
  const end = new Date(`${month}-01T00:00:00`)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`
}

export function getMonthParts(month: string) {
  const [year, monthValue] = month.split("-").map(Number)
  return { year, month: monthValue }
}

export function getDefaultDateForMonth(month: string) {
  const today = new Date()
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`
  return todayValue.startsWith(month) ? todayValue : getMonthStartDate(month)
}

export function getEntriesForMonth(entries: WorkEntry[], month: string) {
  return entries.filter((entry) => entry.date.startsWith(month))
}

export function getMonthKeyFromDate(date: string): MonthKey | null {
  const month = date.slice(0, 7)
  return isMonthKey(month) ? month : null
}

export function getMonthKeysFromEntries(entries: WorkEntry[]) {
  return Array.from(
    new Set(
      entries
        .map((entry) => getMonthKeyFromDate(entry.date))
        .filter((month): month is MonthKey => Boolean(month))
    )
  )
}

export function formatMonthLabel(month: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(
    new Date(`${month}-01T00:00:00`)
  )
}
