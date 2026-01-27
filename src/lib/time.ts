export const MINUTES_PER_DAY = 24 * 60
export const HALF_HOUR_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? "00" : "30"
  return `${String(hour).padStart(2, "0")}:${minute}`
})

export function parseTimeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number)
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0
  }
  return hour * 60 + minute
}

export function diffMinutes(start: string, end: string) {
  const startMinutes = parseTimeToMinutes(start)
  const endMinutes = parseTimeToMinutes(end)
  if (endMinutes >= startMinutes) {
    return endMinutes - startMinutes
  }
  return endMinutes + MINUTES_PER_DAY - startMinutes
}

export function getNightMinutes(start: string, end: string) {
  const startMinutes = parseTimeToMinutes(start)
  const endMinutes = parseTimeToMinutes(end)
  const segments: Array<[number, number]> = []

  if (endMinutes >= startMinutes) {
    segments.push([startMinutes, endMinutes])
  } else {
    segments.push([startMinutes, MINUTES_PER_DAY])
    segments.push([0, endMinutes])
  }

  const nightSegments: Array<[number, number]> = [
    [22 * 60, MINUTES_PER_DAY],
    [0, 6 * 60]
  ]

  return segments.reduce((total, [segStart, segEnd]) => {
    const overlap = nightSegments.reduce((sum, [nightStart, nightEnd]) => {
      const startOverlap = Math.max(segStart, nightStart)
      const endOverlap = Math.min(segEnd, nightEnd)
      return sum + Math.max(0, endOverlap - startOverlap)
    }, 0)
    return total + overlap
  }, 0)
}

export function clampMinutes(minutes: number) {
  return Math.max(0, Math.round(minutes))
}

export function formatMinutesToHours(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}시간 ${mins}분`
}

export function getWeekKey(date: string) {
  const target = new Date(`${date}T00:00:00`)
  const day = target.getDay()
  const diff = (day + 6) % 7
  const monday = new Date(target)
  monday.setDate(target.getDate() - diff)
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(
    monday.getDate()
  ).padStart(2, "0")}`
}
