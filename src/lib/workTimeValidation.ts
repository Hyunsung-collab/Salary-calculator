import { diffMinutes } from "@/lib/time"
import type { WorkEntry } from "@/types/salary"

export type WorkTime = Pick<WorkEntry, "startTime" | "endTime" | "breakMinutes">
export type WorkTimeErrors = Partial<Record<keyof WorkTime, string>>

export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function validateWorkTime(value: WorkTime): WorkTimeErrors {
  const errors: WorkTimeErrors = {}
  if (!isValidTime(value.startTime)) errors.startTime = "출근 시간을 00:00~23:59 형식으로 입력해 주세요."
  if (!isValidTime(value.endTime)) errors.endTime = "퇴근 시간을 00:00~23:59 형식으로 입력해 주세요."
  if (!Number.isInteger(value.breakMinutes) || value.breakMinutes < 0) {
    errors.breakMinutes = "휴게시간은 0 이상의 정수(분)로 입력해 주세요."
  } else if (!errors.startTime && !errors.endTime && diffMinutes(value.startTime, value.endTime) <= value.breakMinutes) {
    errors.endTime = "휴게시간을 뺀 근무시간이 0분보다 길어야 해요."
  }
  return errors
}
