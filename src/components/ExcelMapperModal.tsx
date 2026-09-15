import { useEffect, useMemo, useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Download, FileUp } from "lucide-react"

import { downloadWorkTemplate } from "@/lib/excelTemplate"
import { validateWorkTime } from "@/lib/workTimeValidation"
import type { WorkEntry } from "@/types/salary"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

class ExcelInputError extends Error {}

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
  selectedMonth: string
  onImport: (entries: WorkEntry[], hourlyWage?: number, skippedCount?: number) => void
}

function formatDate(value: unknown) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return ""
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`
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

export function ExcelMapperModal({ open, onOpenChange, onImport, selectedMonth }: ExcelMapperModalProps) {
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [reading, setReading] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<unknown[][]>([])
  const [mapping, setMapping] = useState<Partial<Record<FieldKey, string>>>({})
  const fileInput = useRef<HTMLInputElement>(null)
  const readRequest = useRef(0)
  const readingRef = useRef(false)
  const submitted = useRef(false)
  useEffect(() => {
    ++readRequest.current
    readingRef.current = false
    submitted.current = false
    setReading(false)
    setHeaders([])
    setRows([])
    setMapping({})
    setError("")
    setNotice("")
  }, [open])

  const mappingFields = useMemo(() => Object.keys(FIELD_LABELS) as FieldKey[], [])

  const handleFile = async (file: File | null) => {
    if (!file || readingRef.current) return
    const request = ++readRequest.current
    readingRef.current = true
    setReading(true)
    setError("")
    setNotice("")
    setHeaders([])
    setRows([])
    setMapping({})
    try {
      if (!/\.xlsx?$/i.test(file.name)) throw new ExcelInputError(".xlsx 또는 .xls 파일을 선택해 주세요.")
      const data = await file.arrayBuffer()
      if (request !== readRequest.current) return
      const workbook = XLSX.read(data, { type: "array" })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!worksheet) throw new ExcelInputError("첫 번째 시트에 근무 기록을 작성해 주세요.")
      const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, blankrows: false })
      const [firstRow, ...restRows] = sheetRows
      const nextHeaders = Array.from(firstRow || [], (header) => String(header ?? "").trim())
      const nonemptyRows = restRows.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
      if (!nextHeaders.length || !nonemptyRows.length) throw new ExcelInputError("첫 행에는 열 이름, 다음 행부터는 근무 기록을 작성해 주세요.")
      if (nextHeaders.some((header) => !header) || new Set(nextHeaders).size !== nextHeaders.length) {
        throw new ExcelInputError("열 이름은 빈칸이나 중복 없이 작성해 주세요.")
      }
      setHeaders(nextHeaders)
      setRows(nonemptyRows)
      const nextMapping: Partial<Record<FieldKey, string>> = {}
      mappingFields.forEach((field) => {
        if (nextHeaders.includes(FIELD_LABELS[field])) nextMapping[field] = FIELD_LABELS[field]
      })
      setMapping(nextMapping)
      setNotice(`${nonemptyRows.length}개 행을 읽었어요. 아래 열 연결을 확인해 주세요.`)
    } catch (cause) {
      if (request !== readRequest.current) return
      setError(cause instanceof ExcelInputError
        ? `파일을 불러오지 못했어요. ${cause.message}`
        : "파일을 읽을 수 없어요. Excel 파일 형식과 내용을 확인해 주세요.")
    } finally {
      if (request === readRequest.current) {
        readingRef.current = false
        setReading(false)
        if (fileInput.current) fileInput.current.value = ""
      }
    }
  }

  const handleImport = () => {
    if (submitted.current || readingRef.current) return
    setError("")
    const required: FieldKey[] = ["date", "startTime", "endTime", "breakMinutes"]
    if (required.some((field) => !mapping[field])) {
      setError("날짜, 출근, 퇴근, 휴게(분) 열을 모두 연결해 주세요.")
      return
    }
    const selectedHeaders = mappingFields.map((field) => mapping[field]).filter(Boolean)
    if (new Set(selectedHeaders).size !== selectedHeaders.length) {
      setError("같은 열을 여러 항목에 연결할 수 없어요.")
      return
    }
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
    const accepted = entries.filter((entry) => {
      const date = new Date(`${entry.date}T00:00:00`)
      return /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && !Number.isNaN(date.getTime()) &&
        formatDate(date) === entry.date && Object.keys(validateWorkTime(entry)).length === 0
    })
    if (!accepted.length) {
      setError("불러올 수 있는 근무가 없어요. 날짜, 출퇴근 시간, 휴게시간 형식을 확인해 주세요.")
      return
    }
    submitted.current = true
    onImport(accepted, Number.isFinite(wageValue) && wageValue > 0 ? wageValue : undefined, entries.length - accepted.length)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excel로 근무 가져오기</DialogTitle>
          <DialogDescription>
            양식을 작성하거나 기존 파일의 열을 연결해 근무를 가져오세요.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-0 space-y-4">
          <ol className="list-inside list-decimal space-y-1 text-sm leading-6 text-slate-600">
            <li>Excel 양식을 다운로드하세요.</li>
            <li>예시 2행을 지우거나 수정해 날짜와 근무시간을 작성하세요.</li>
            <li>작성한 파일을 불러오고 열 연결을 확인하세요.</li>
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => {
              try { downloadWorkTemplate(selectedMonth); setNotice("입력 양식을 다운로드했어요. 예시 행을 수정해 주세요."); setError("") }
              catch { setError("양식을 다운로드하지 못했어요. 다시 시도해 주세요.") }
            }}><Download className="h-4 w-4" /> Excel 양식 다운로드</Button>
            <Button type="button" variant="outline" disabled={reading} onClick={() => fileInput.current?.click()}><FileUp className="h-4 w-4" /> {reading ? "파일 읽는 중..." : "Excel 파일 불러오기"}</Button>
            <input ref={fileInput} type="file" aria-label="Excel 파일" accept=".xlsx,.xls" className="sr-only" disabled={reading} onChange={(event) => void handleFile(event.target.files?.[0] || null)} />
          </div>
          <p className="text-sm text-slate-500">날짜는 YYYY-MM-DD, 시간은 HH:mm, 휴게시간은 분으로 입력하세요. 시급 열은 선택 사항이에요.</p>
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">가져오면 현재 저장된 전체 근무 목록이 파일의 기록으로 교체돼요. 기존 월의 급여 조건은 유지돼요.</p>
          {notice && <p role="status" aria-live="polite" className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
          {reading && <p role="status" aria-live="polite" className="text-sm text-slate-600">파일을 읽고 있어요.</p>}
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {headers.length > 0 && (
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              {mappingFields.map((field) => (
                <div key={field} className="space-y-2">
                  <p id={`excel-${field}-label`} className="text-sm font-medium text-slate-700">{FIELD_LABELS[field]}{field === "hourlyWage" ? " (선택)" : " (필수)"}</p>
                  <Select
                    value={mapping[field] ?? "__none__"}
                    onValueChange={(value) => { setError(""); setMapping((prev) => ({ ...prev, [field]: value === "__none__" ? undefined : value })) }}
                  >
                    <SelectTrigger aria-labelledby={`excel-${field}-label`}>
                      <SelectValue placeholder="헤더 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">연결 안 함</SelectItem>
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
            <Button disabled={reading || !rows.length || ["date", "startTime", "endTime", "breakMinutes"].some((field) => !mapping[field as FieldKey])} onClick={handleImport}>
              근무 가져오기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
