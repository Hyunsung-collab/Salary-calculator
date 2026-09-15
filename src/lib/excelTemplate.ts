import * as XLSX from "xlsx"
import { getMonthStartDate } from "@/lib/month"

export const EXCEL_TEMPLATE_FILENAME = "급여계산기_근무기록_입력양식.xlsx"
export const EXCEL_TEMPLATE_HEADERS = ["날짜", "출근", "퇴근", "휴게(분)"]

export function createWorkTemplateWorkbook(selectedMonth: string) {
  const sheet = XLSX.utils.aoa_to_sheet([
    EXCEL_TEMPLATE_HEADERS,
    [getMonthStartDate(selectedMonth), "09:00", "18:00", 60],
    [`${selectedMonth}-02`, "13:00", "22:00", 60]
  ])
  sheet["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }]
  // Text dates/times survive Excel locale conversion and match the existing parser.
  for (const address of ["A2", "A3", "B2", "B3", "C2", "C3"]) sheet[address].z = "@"
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, "근무 기록")
  return workbook
}

export function downloadWorkTemplate(selectedMonth: string) {
  XLSX.writeFile(createWorkTemplateWorkbook(selectedMonth), EXCEL_TEMPLATE_FILENAME)
}
