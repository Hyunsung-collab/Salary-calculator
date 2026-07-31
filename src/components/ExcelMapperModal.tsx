import { useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { FileUp } from "lucide-react"

import type { WorkEntry } from "@/types/salary"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type FieldKey = "date" | "startTime" | "endTime" | "breakMinutes" | "hourlyWage"

const FIELD_LABELS: Record<FieldKey, string> = {
  date: "날짜",
  startTime: "출근",
  endTime: "퇴근",
  breakMinutes: "휴게(분)",
  hourlyWage: "시급"
}

type ExcelMapperModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (entries: WorkEntry[], hourlyWage?: number) => void
}

function formatDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return ""
    const iso = new Date(parsed.y, parsed.m - 1, parsed.d)
    return iso.toISOString().slice(0, 10)
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return ""
    if (trimmed.includes("-")) {
      return trimmed.slice(0, 10)
    }
    if (trimmed.includes(".")) {
      const [y, m, d] = trimmed.split(".")
      if (y && m && d) {
        const year = y.length === 2 ? `20${y}` : y
        return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
      }
    }
  }
  return ""
}

function formatTime(value: unknown) {
  if (value instanceof Date) {
    return value.toTimeString().slice(0, 5)
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return ""
    return `${String(parsed.H).padStart(2, "0")}:${String(parsed.M).padStart(2, "0")}`
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return ""
    if (trimmed.includes(":")) {
      const [h, m] = trimmed.split(":")
      return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`
    }
  }
  return ""
}

function parseNumber(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value.replace(/,/g, ""))
  return 0
}

export function ExcelMapperModal({ open, onOpenChange, onImport }: ExcelMapperModalProps) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({})

  const mappingFields = useMemo(() => Object.keys(FIELD_LABELS) as FieldKey[], [])

  const handleFile = async (file: File | null) => {
    if (!file) return
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: "array" })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const sheetRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    const [firstRow, ...restRows] = sheetRows
    setHeaders(((firstRow as any[]) || []).map((header) => String(header)))
    setRows(restRows)
    setMapping({})
  }

  const handleImport = () => {
    const entries: WorkEntry[] = rows.map((row) => {
      const getValue = (field: FieldKey) => {
        const header = mapping[field]
        if (!header) return undefined
        const idx = headers.indexOf(header)
        return idx >= 0 ? row[idx] : undefined
      }

      return {
        id: `${Date.now()}-${Math.random()}`,
        date: formatDate(getValue("date")),
        startTime: formatTime(getValue("startTime")),
        endTime: formatTime(getValue("endTime")),
        breakMinutes: parseNumber(getValue("breakMinutes"))
      }
    })

    const wageValue = parseNumber(rows[0]?.[headers.indexOf(mapping.hourlyWage || "")])
    onImport(
      entries.filter((entry) => entry.date && entry.startTime && entry.endTime),
      wageValue > 0 ? wageValue : undefined
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>엑셀 컬럼 매핑</DialogTitle>
          <DialogDescription>
            업로드한 파일의 헤더를 선택해 근무 입력 항목과 연결하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-4">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 hover:border-slate-400">
            <FileUp className="h-4 w-4" /> 엑셀 파일 업로드
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0] || null)}
            />
          </label>
          {headers.length > 0 && (
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              {mappingFields.map((field) => (
                <div key={field} className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">{FIELD_LABELS[field]}</p>
                  <Select
                    value={mapping[field] ?? ""}
                    onValueChange={(value) => setMapping((prev) => ({ ...prev, [field]: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="헤더 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
            <Button disabled={!headers.length} onClick={handleImport}>
              매핑 적용
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
