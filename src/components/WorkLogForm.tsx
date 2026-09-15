import { Plus, Trash2 } from "lucide-react"

import type { WorkEntry } from "@/types/salary"
import { HALF_HOUR_OPTIONS } from "@/lib/time"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type WorkLogFormProps = {
  entries: WorkEntry[]
  onChange: (entries: WorkEntry[]) => void
}

function createEntry(): WorkEntry {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  return {
    id,
    date: "",
    startTime: "",
    endTime: "",
    breakMinutes: 0
  }
}

export function WorkLogForm({ entries, onChange }: WorkLogFormProps) {
  const updateEntry = (id: string, patch: Partial<WorkEntry>) => {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  const addEntry = () => {
    onChange([...entries, createEntry()])
  }

  const removeEntry = (id: string) => {
    onChange(entries.filter((entry) => entry.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto md:block">
        <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>날짜</TableHead>
            <TableHead>출근</TableHead>
            <TableHead>퇴근</TableHead>
            <TableHead>휴게(분)</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-slate-400">
                근무 행을 추가해주세요.
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Input
                    type="date"
                    value={entry.date ?? ""}
                    onChange={(event) => updateEntry(entry.id, { date: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    value={entry.startTime ?? ""}
                    onChange={(event) => updateEntry(entry.id, { startTime: event.target.value })}
                  >
                    <option value="">선택</option>
                    {HALF_HOUR_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    value={entry.endTime ?? ""}
                    onChange={(event) => updateEntry(entry.id, { endTime: event.target.value })}
                  >
                    <option value="">선택</option>
                    {HALF_HOUR_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="w-28">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={Number.isFinite(entry.breakMinutes) ? entry.breakMinutes : 0}
                    className="w-24"
                    onChange={(event) =>
                      updateEntry(entry.id, { breakMinutes: Number(event.target.value) })
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-10 min-w-10"
                    aria-label="근무 기록 삭제"
                    onClick={() => removeEntry(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        </Table>
      </div>
      <div className="space-y-3 md:hidden">
        {entries.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 py-10 text-center text-slate-400">
            근무 행을 추가해주세요.
          </div>
        ) : (
          entries.map((entry, index) => (
            <div key={entry.id} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-700">근무 기록 {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${index + 1}번 근무 기록 삭제`}
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <label htmlFor={`mobile-date-${entry.id}`} className="text-sm text-slate-600">
                  날짜
                </label>
                <Input
                  id={`mobile-date-${entry.id}`}
                  type="date"
                  value={entry.date ?? ""}
                  onChange={(event) => updateEntry(entry.id, { date: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor={`mobile-start-${entry.id}`} className="text-sm text-slate-600">
                    출근
                  </label>
                  <select
                    id={`mobile-start-${entry.id}`}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={entry.startTime ?? ""}
                    onChange={(event) => updateEntry(entry.id, { startTime: event.target.value })}
                  >
                    <option value="">선택</option>
                    {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor={`mobile-end-${entry.id}`} className="text-sm text-slate-600">
                    퇴근
                  </label>
                  <select
                    id={`mobile-end-${entry.id}`}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={entry.endTime ?? ""}
                    onChange={(event) => updateEntry(entry.id, { endTime: event.target.value })}
                  >
                    <option value="">선택</option>
                    {HALF_HOUR_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor={`mobile-break-${entry.id}`} className="text-sm text-slate-600">
                  휴게(분)
                </label>
                <Input
                  id={`mobile-break-${entry.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={Number.isFinite(entry.breakMinutes) ? entry.breakMinutes : 0}
                  onChange={(event) => updateEntry(entry.id, { breakMinutes: Number(event.target.value) })}
                />
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-end">
        <Button type="button" className="min-h-10" onClick={addEntry}>
          <Plus className="h-4 w-4" /> 근무 행 추가
        </Button>
      </div>
    </div>
  )
}
