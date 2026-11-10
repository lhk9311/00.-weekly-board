/**
 * 프론트엔드 공통 타입 정의
 *
 * 백엔드(Spring Boot) API 의 JSON 응답 구조와 1:1로 맞춘다.
 * 필드명이 바뀌면 백엔드 DTO 와 이 파일을 함께 수정해야 한다.
 */

/** 업무 상태 — DB 의 task.status 컬럼 값과 동일 */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

/** 보드에 칼럼이 표시되는 순서 */
export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']

/** 화면에 보여줄 상태 이름 */
export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: '예정',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
}

/** 업무 카드 1건 */
export interface Task {
  id: number
  title: string
  assignee: string | null
  description: string | null
  status: TaskStatus
  /** 같은 칼럼 안에서의 순서 (0부터 시작) */
  position: number
  createdAt: string
  updatedAt: string
}

/** 업무 생성/수정 시 서버로 보내는 값 */
export interface TaskInput {
  title: string
  assignee: string | null
  description: string | null
  status: TaskStatus
}

/** 주간보고 1건 (주의 시작일=월요일 기준으로 1주 1건) */
export interface WeeklyReport {
  weekStart: string // 'YYYY-MM-DD'
  content: string | null // Tiptap 이 만든 HTML
  updatedAt: string | null
}

/** 현재 선택된 탭 */
export type TabKey = 'board' | 'report'
