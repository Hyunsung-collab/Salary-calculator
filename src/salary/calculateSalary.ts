import { clampMinutes, diffMinutes, getNightMinutes, getWeekKey } from "@/lib/time"
import type { SalaryBreakdown, SalarySettings, WorkEntry } from "@/types/salary"

const BASE_DAILY_MINUTES = 8 * 60
const WEEKLY_ALLOWANCE_THRESHOLD = 15 * 60

const SOCIAL_INSURANCE_RATES = {
  pension: 0.045,
  healthInsurance: 0.03545,
  longTermCare: 0.1295,
  employmentInsurance: 0.009
}

const TAX_BRACKETS = [
  { upTo: 14000000, rate: 0.06 },
  { upTo: 50000000, rate: 0.15 },
  { upTo: 88000000, rate: 0.24 },
  { upTo: 150000000, rate: 0.35 },
  { upTo: 300000000, rate: 0.38 },
  { upTo: 500000000, rate: 0.4 },
  { upTo: 1000000000, rate: 0.42 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.45 }
]

function calculateIncomeTax(monthlyIncome: number) {
  const annualIncome = monthlyIncome * 12
  let remaining = annualIncome
  let previousLimit = 0
  let tax = 0

  for (const bracket of TAX_BRACKETS) {
    const taxable = Math.min(remaining, bracket.upTo - previousLimit)
    if (taxable <= 0) break
    tax += taxable * bracket.rate
    remaining -= taxable
    previousLimit = bracket.upTo
  }

  return tax / 12
}

export function calculateSalary(entries: WorkEntry[], settings: SalarySettings): SalaryBreakdown {
  const weeklyTotals = new Map<string, { minutes: number; days: number }>()

  let totalWorkMinutes = 0
  let regularMinutes = 0
  let overtimeMinutes = 0
  let nightMinutes = 0

  entries.forEach((entry) => {
    if (!entry.date || !entry.startTime || !entry.endTime) return
    const rawMinutes = diffMinutes(entry.startTime, entry.endTime)
    const breakMinutes = clampMinutes(entry.breakMinutes)
    const workedMinutes = clampMinutes(rawMinutes - breakMinutes)
    if (workedMinutes <= 0) return

    const overtime = Math.max(0, workedMinutes - BASE_DAILY_MINUTES)
    const regular = workedMinutes - overtime
    const night = Math.min(workedMinutes, getNightMinutes(entry.startTime, entry.endTime))

    totalWorkMinutes += workedMinutes
    regularMinutes += regular
    overtimeMinutes += overtime
    nightMinutes += night

    const weekKey = getWeekKey(entry.date)
    const summary = weeklyTotals.get(weekKey) ?? { minutes: 0, days: 0 }
    weeklyTotals.set(weekKey, {
      minutes: summary.minutes + workedMinutes,
      days: summary.days + 1
    })
  })

  let weeklyAllowanceMinutes = 0
  weeklyTotals.forEach((summary) => {
    if (summary.minutes >= WEEKLY_ALLOWANCE_THRESHOLD && summary.days > 0) {
      weeklyAllowanceMinutes += Math.round(summary.minutes / summary.days)
    }
  })

  const hourlyWage = settings.hourlyWage || 0
  const basePay = (totalWorkMinutes / 60) * hourlyWage
  const overtimePay = settings.applyOvertime
    ? (overtimeMinutes / 60) * hourlyWage * (settings.overtimeMultiplier - 1)
    : 0
  const nightPay = settings.applyNight
    ? (nightMinutes / 60) * hourlyWage * (settings.nightMultiplier - 1)
    : 0
  const weeklyAllowancePay = settings.applyWeeklyAllowance
    ? (weeklyAllowanceMinutes / 60) * hourlyWage
    : 0
  const bonusAllowance = settings.applyBonusAllowance ? settings.bonusAllowance || 0 : 0
  const nonTaxableMealPay = settings.mealAllowance || 0
  const taxableGrossPay = basePay + overtimePay + nightPay + weeklyAllowancePay + bonusAllowance
  const grossPay = taxableGrossPay + nonTaxableMealPay

  const deductionsEnabled = settings.applyDeductions
  const pension = deductionsEnabled && settings.applyPension
    ? grossPay * SOCIAL_INSURANCE_RATES.pension
    : 0
  const healthInsurance = deductionsEnabled && settings.applyHealthInsurance
    ? grossPay * SOCIAL_INSURANCE_RATES.healthInsurance
    : 0
  const longTermCare = deductionsEnabled && settings.applyLongTermCare
    ? healthInsurance * SOCIAL_INSURANCE_RATES.longTermCare
    : 0
  const employmentInsurance = deductionsEnabled && settings.applyEmploymentInsurance
    ? grossPay * SOCIAL_INSURANCE_RATES.employmentInsurance
    : 0

  const taxableIncome = Math.max(
    0,
    taxableGrossPay - pension - healthInsurance - longTermCare - employmentInsurance
  )
  const incomeTax =
    deductionsEnabled && settings.applyIncomeTax ? calculateIncomeTax(taxableIncome) : 0
  const localIncomeTax =
    deductionsEnabled && settings.applyLocalIncomeTax ? incomeTax * 0.1 : 0

  const totalDeductions =
    pension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax
  const netPay = grossPay - totalDeductions

  return {
    totalWorkMinutes,
    regularMinutes,
    overtimeMinutes,
    nightMinutes,
    weeklyAllowanceMinutes,
    basePay,
    overtimePay,
    nightPay,
    weeklyAllowancePay,
    bonusAllowance,
    taxableGrossPay,
    nonTaxableMealPay,
    grossPay,
    pension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeductions,
    netPay
  }
}