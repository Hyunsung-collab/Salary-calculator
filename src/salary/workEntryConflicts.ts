import { diffMinutes, parseTimeToMinutes } from "@/lib/time"
import type { WorkEntry } from "@/types/salary"

type WorkEntryInterval = {
  start: number
  end: number
}

export type WorkEntryConflict = {
  entry: WorkEntry
}

function getDateStartMinutes(date: string) {
  const value = new Date(`${date}T00:00:00`)
  if (Number.isNaN(value.getTime())) return null
  return Math.floor(value.getTime() / 60000)
}

function getWorkEntryInterval(entry: WorkEntry): WorkEntryInterval | null {
  if (!entry.date || !entry.startTime || !entry.endTime) return null

  const dateStart = getDateStartMinutes(entry.date)
  if (dateStart === null) return null

  const start = dateStart + parseTimeToMinutes(entry.startTime)
  const end = start + diffMinutes(entry.startTime, entry.endTime)
  if (end <= start) return null

  return { start, end }
}

function intervalsOverlap(a: WorkEntryInterval, b: WorkEntryInterval) {
  return a.start < b.end && b.start < a.end
}

export function findWorkEntryConflict(
  entries: WorkEntry[],
  candidate: WorkEntry,
  ignoredEntryId?: string
): WorkEntryConflict | null {
  const candidateInterval = getWorkEntryInterval(candidate)
  if (!candidateInterval) return null

  const conflictingEntry = entries.find((entry) => {
    if (entry.id === ignoredEntryId) return false
    const entryInterval = getWorkEntryInterval(entry)
    return entryInterval ? intervalsOverlap(entryInterval, candidateInterval) : false
  })

  return conflictingEntry ? { entry: conflictingEntry } : null
}
