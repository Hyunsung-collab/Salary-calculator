export type WorkEntry = {
  id: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
}

export type SalarySettings = {
  hourlyWage: number
  bonusAllowance: number
  mealAllowance: number
  overtimeMultiplier: number
  nightMultiplier: number
  applyOvertime: boolean
  applyNight: boolean
  applyWeeklyAllowance: boolean
  applyBonusAllowance: boolean
  applyDeductions: boolean
  applyPension: boolean
  applyHealthInsurance: boolean
  applyLongTermCare: boolean
  applyEmploymentInsurance: boolean
  applyIncomeTax: boolean
  applyLocalIncomeTax: boolean
}

export type SalaryBreakdown = {
  totalWorkMinutes: number
  regularMinutes: number
  overtimeMinutes: number
  nightMinutes: number
  weeklyAllowanceMinutes: number
  basePay: number
  overtimePay: number
  nightPay: number
  weeklyAllowancePay: number
  bonusAllowance: number
  taxableGrossPay: number
  nonTaxableMealPay: number
  grossPay: number
  pension: number
  healthInsurance: number
  longTermCare: number
  employmentInsurance: number
  incomeTax: number
  localIncomeTax: number
  totalDeductions: number
  netPay: number
}
