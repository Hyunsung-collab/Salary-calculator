"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, FileSpreadsheet, Plus, Trash2 } from "lucide-react"

import type { SalarySettings, WorkEntry } from "@/types/salary"
import { clampMinutes, diffMinutes, formatMinutesToHours } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { WorkEntryCard } from "@/features/salary-calculator/work/WorkEntryCard"
import { WorkEntryEditor } from "@/features/salary-calculator/work/WorkEntryEditor"
import { WorkTemplateForm } from "@/features/salary-calculator/WorkTemplateForm"

type WorkSectionProps = {
  entries: WorkEntry[]
  settings: SalarySettings
  onChange: (entries: WorkEntry[]) => void
  onAddEntries: (entries: WorkEntry[]) => void
  onOpenExcel: () => void
}

function currentMonth() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T00:00:00`)
  date.setMonth(date.getMonth() + amount)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function WorkSection({
  entries,
  settings,
  onChange,
  onAddEntries,
  onOpenExcel
}: WorkSectionProps) {
  const [month, setMonth] = useState(currentMonth)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<WorkEntry | null>(null)

  const monthEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.date.startsWith(month))
        .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`)),
    [entries, month]
  )
  const totalMinutes = monthEntries.reduce(
    (total, entry) => total + clampMinutes(
      (entry.endTime && entry.startTime ? diffMinutes(entry.startTime, entry.endTime) : 0) -
        entry.breakMinutes
    ),
    0
  )

  const openNew = () => {
    setEditingEntry(null)
    setEditorOpen(true)
  }

  const saveEntry = (savedEntry: WorkEntry) => {
    onChange(
      editingEntry
        ? entries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry))
        : [...entries, savedEntry]
    )
  }

  const confirmDelete = () => {
    if (!deleteEntry) return
    onChange(entries.filter((entry) => entry.id !== deleteEntry.id))
    setDeleteEntry(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">근무</p>
          <h1 className="mt-1 text-2xl font-semibold">근무 기록</h1>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" aria-label="이전 달" onClick={() => setMonth((value) => shiftMonth(value, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="font-semibold">{month.replace("-", "년 ")}월</p>
          <Button type="button" variant="outline" size="sm" aria-label="다음 달" onClick={() => setMonth((value) => shiftMonth(value, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">근무일</p><p className="mt-1 text-lg font-semibold">{new Set(monthEntries.map((entry) => entry.date)).size}일</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">총 인정 근무시간</p><p className="mt-1 text-lg font-semibold tabular-nums">{formatMinutesToHours(totalMinutes)}</p></CardContent></Card>
        <Button type="button" className="col-span-2 min-h-11 sm:col-span-1" onClick={openNew}><Plus className="h-4 w-4" /> 근무 추가</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onOpenExcel}><FileSpreadsheet className="h-4 w-4" /> Excel 불러오기</Button>
      </div>

      <WorkTemplateForm onAddEntries={onAddEntries} />

      {monthEntries.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <p className="font-medium text-slate-700">이 달에는 근무 기록이 없어요.</p>
            <p className="text-sm text-slate-500">근무 추가 버튼으로 첫 기록을 남겨 보세요.</p>
            <Button type="button" onClick={openNew}>첫 근무 기록하기</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {monthEntries.map((entry) => (
            <WorkEntryCard
              key={entry.id}
              entry={entry}
              onEdit={(value) => { setEditingEntry(value); setEditorOpen(true) }}
              onDelete={setDeleteEntry}
            />
          ))}
        </div>
      )}

      <WorkEntryEditor
        open={editorOpen}
        entry={editingEntry}
        settings={settings}
        onOpenChange={setEditorOpen}
        onSave={saveEntry}
      />

      <Dialog open={Boolean(deleteEntry)} onOpenChange={(open) => !open && setDeleteEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>근무 기록을 삭제할까요?</DialogTitle>
            <DialogDescription>
              {deleteEntry?.date} {deleteEntry?.startTime}~{deleteEntry?.endTime} 기록이 이번 달 급여에서 제외됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteEntry(null)}>취소</Button>
            <Button type="button" variant="default" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> 삭제</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
