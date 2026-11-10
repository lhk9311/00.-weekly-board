import { api } from './client'
import type { Task, TaskInput, TaskStatus } from '../types'

/**
 * 업무(Task) REST API 호출 모음
 * 백엔드: com.weeklyboard.backend.task.TaskController
 */

/** 전체 업무 조회 — GET /api/tasks (상태, 순서 기준 정렬되어 옴) */
export async function fetchTasks(): Promise<Task[]> {
  const { data } = await api.get<Task[]>('/tasks')
  return data
}

/** 업무 생성 — POST /api/tasks (해당 칼럼의 맨 아래에 추가됨) */
export async function createTask(input: TaskInput): Promise<Task> {
  const { data } = await api.post<Task>('/tasks', input)
  return data
}

/** 업무 수정 — PUT /api/tasks/{id} */
export async function updateTask(id: number, input: TaskInput): Promise<Task> {
  const { data } = await api.put<Task>(`/tasks/${id}`, input)
  return data
}

/** 업무 삭제 — DELETE /api/tasks/{id} */
export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`)
}

/**
 * 업무 이동 — PATCH /api/tasks/{id}/move
 * 드래그 앤 드롭이 끝났을 때 "어느 칼럼의 몇 번째"로 옮겼는지 전달한다.
 * 다른 카드들의 순서 재정렬은 서버가 트랜잭션 안에서 처리한다.
 */
export async function moveTask(id: number, status: TaskStatus, position: number): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}/move`, { status, position })
  return data
}
