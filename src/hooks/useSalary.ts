import { useMemo } from "react"

import { calculateSalary } from "@/salary/calculateSalary"
import { formatMinutesToHours } from "@/lib/time"
import type { SalarySettings, WorkEntry } from "@/types/salary"

export function useSalary(entries: WorkEntry[], settings: SalarySettings) {
  const breakdown = useMemo(() => calculateSalary(entries, settings), [entries, settings])

  return { breakdown, formatMinutesToHours }
}
