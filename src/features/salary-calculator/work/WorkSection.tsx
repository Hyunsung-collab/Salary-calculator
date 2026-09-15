"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarPlus, FileSpreadsheet, Plus, Trash2 } from "lucide-react"

import type { SalarySettings, WorkEntry } from "@/types/salary"
import { clampMinutes, diffMinutes, formatMinutesToHours } from "@/lib/time"
import { findWorkEntryConflict } from "@/salary/workEntryConflicts"
import type { ActionToastTone } from "@/components/ui/action-toast"
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
import { WorkTemplateForm, type AddWorkEntriesResult } from "@/features/salary-calculator/WorkTemplateForm"

type WorkSectionProps = {
  entries: WorkEntry[]
  settings: SalarySettings
  selectedMonth: string
  monthLabel: string
  onChange: (entries: WorkEntry[], materializedEntries?: WorkEntry[]) => void
  onAddEntries: (entries: WorkEntry[]) => AddWorkEntriesResult
  openEditorRequestId: number | null
  onEditorRequestHandled: () => void
  onOpenExcel: () => void
  onFeedback: (messages: string[], tone?: ActionToastTone) => void
}

export function WorkSection({
  entries,
  settings,
  selectedMonth,
  monthLabel,
  onChange,
  onAddEntries,
  openEditorRequestId,
  onEditorRequestHandled,
  onOpenExcel,
  onFeedback
}: WorkSectionProps) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<WorkEntry | null>(null)
  const [templateOpen, setTemplateOpen] = useState(false)


  const monthEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.date.startsWith(selectedMonth))
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [entries, selectedMonth]
  )
  const shortMonthLabel = `${Number(selectedMonth.slice(5, 7))}월`
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

  useEffect(() => {
    if (openEditorRequestId === null) return
    openNew()
    onEditorRequestHandled()
  }, [openEditorRequestId, onEditorRequestHandled])

  const saveEntry = (savedEntry: WorkEntry) => {
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

    const nextEntries = editingEntry
      ? entries.map((entry) => (entry.id === savedEntry.id ? savedEntry : entry))
      : [...entries, savedEntry]

    onChange(nextEntries, [savedEntry])
    onFeedback([editingEntry ? "근무 기록을 수정했어요." : `${Number(savedEntry.date.slice(5, 7))}월 ${Number(savedEntry.date.slice(8))}일 근무를 추가했어요.`])
    return { ok: true as const }
  }

  const confirmDelete = () => {
    if (!deleteEntry) return
    onChange(entries.filter((entry) => entry.id !== deleteEntry.id))
    setDeleteEntry(null)
    onFeedback(["근무 기록을 삭제했어요."])
  }

  const handleTemplateComplete = (
    result: AddWorkEntriesResult,
    messages: string[],
    tone: ActionToastTone
  ) => {
    if (result.addedCount > 0) {
      setTemplateOpen(false)
      onFeedback(messages, tone)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">근무</p>
          <h1 className="mt-1 text-2xl font-semibold">{monthLabel} 근무 기록</h1>
          <p className="mt-1 text-sm text-slate-500">선택한 달의 실제 근무 기록입니다.</p>
        </div>
        {monthEntries.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="min-h-11" onClick={openNew}>
              <Plus className="h-4 w-4" /> 근무 추가
            </Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setTemplateOpen(true)}>
              <CalendarPlus className="h-4 w-4" /> 이번 달 근무 만들기
            </Button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">근무일</p>
            <p className="mt-1 text-lg font-semibold">{new Set(monthEntries.map((entry) => entry.date)).size}일</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">총 인정 근무시간</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{formatMinutesToHours(totalMinutes)}</p>
          </CardContent>
        </Card>
      </div>

      {monthEntries.length === 0 ? (
        <Card>
          <CardContent className="space-y-5 p-8 text-center">
            <div className="space-y-2">
              <p className="font-medium text-slate-700">{monthLabel}에는 아직 근무 기록이 없어요.</p>
              <p className="text-sm text-slate-500">
                평소 근무가 반복된다면 이번 달 일정을 한 번에 만들 수 있어요.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button type="button" className="min-h-11" onClick={() => setTemplateOpen(true)}>
                <CalendarPlus className="h-4 w-4" /> {shortMonthLabel} 근무 만들기
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={openNew}>
                <Plus className="h-4 w-4" /> 근무 하나 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section aria-labelledby="work-entry-list-title" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="work-entry-list-title" className="text-lg font-semibold text-slate-900">
              이번 달 근무
            </h2>
            <p className="text-sm text-slate-500">{monthEntries.length}개 기록</p>
          </div>
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
        </section>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onOpenExcel}>
          <FileSpreadsheet className="h-4 w-4" /> Excel 불러오기
        </Button>
      </div>

      <WorkEntryEditor
        open={editorOpen}
        entry={editingEntry}
        settings={settings}
        selectedMonth={selectedMonth}
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

      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{monthLabel} 근무 만들기</DialogTitle>
            <DialogDescription>
              반복되는 근무 요일과 시간을 선택해 이번 달 근무 기록을 한 번에 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <WorkTemplateForm
            selectedMonth={selectedMonth}
            onAddEntries={onAddEntries}
            onComplete={handleTemplateComplete}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
