"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { shiftMonthKey } from "@/lib/month"
import { Button } from "@/components/ui/button"

type MonthNavigatorProps = {
  selectedMonth: string
  monthLabel: string
  onSelectedMonthChange: (month: string) => void
}

export function MonthNavigator({
  selectedMonth,
  monthLabel,
  onSelectedMonthChange
}: MonthNavigatorProps) {
  return (
    <div className="no-print flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="이전 달"
        onClick={() => onSelectedMonthChange(shiftMonthKey(selectedMonth, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p className="font-semibold text-slate-900">{monthLabel}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="다음 달"
        onClick={() => onSelectedMonthChange(shiftMonthKey(selectedMonth, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
