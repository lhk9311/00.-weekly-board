/**
 * 주(week) 계산 유틸
 *
 * 주간보고는 "월요일 날짜"를 키로 저장한다.
 * toISOString() 은 UTC 기준이라 한국 시간 새벽에 날짜가 하루 밀리므로,
 * 로컬 시간 기준으로 직접 'YYYY-MM-DD' 를 만든다.
 */

/** 주어진 날짜가 속한 주의 월요일(00:00) */
export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0=일 ~ 6=토
  const diff = day === 0 ? -6 : 1 - day // 일요일은 지난 주 월요일로
  d.setDate(d.getDate() + diff)
  return d
}

/** Date → 'YYYY-MM-DD' (로컬 기준) */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 'YYYY-MM-DD' → Date (로컬 기준) */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 주 이동 (weeks 가 음수면 이전 주) */
export function addWeeks(iso: string, weeks: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + weeks * 7)
  return toISODate(d)
}

/** 이번 주 월요일 */
export function currentWeekStart(): string {
  return toISODate(getWeekStart(new Date()))
}

/** 화면 표시용: '11월 9일 – 11월 13일' (월~금) */
export function formatWeekRange(iso: string): string {
  const start = fromISODate(iso)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`
  return `${fmt(start)} – ${fmt(end)}`
}

/** 화면 표시용: '2026년 11월 2주차' (해당 월요일이 그 달의 몇 번째 월요일인지) */
export function formatWeekTitle(iso: string): string {
  const start = fromISODate(iso)
  const nth = Math.ceil(start.getDate() / 7)
  return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${nth}주차`
}
