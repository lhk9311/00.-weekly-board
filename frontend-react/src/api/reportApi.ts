import { api } from './client'
import type { WeeklyReport } from '../types'

/**
 * 주간보고 REST API 호출 모음
 * 백엔드: com.weeklyboard.backend.report.WeeklyReportController
 */

/**
 * 특정 주의 보고서 조회 — GET /api/reports/{weekStart}
 * 아직 작성하지 않은 주는 content 가 null 로 내려온다.
 */
export async function fetchReport(weekStart: string): Promise<WeeklyReport> {
  const { data } = await api.get<WeeklyReport>(`/reports/${weekStart}`)
  return data
}

/**
 * 보고서 저장 — PUT /api/reports/{weekStart}
 * 없으면 새로 만들고, 있으면 덮어쓴다(upsert).
 */
export async function saveReport(weekStart: string, content: string): Promise<WeeklyReport> {
  const { data } = await api.put<WeeklyReport>(`/reports/${weekStart}`, { content })
  return data
}
