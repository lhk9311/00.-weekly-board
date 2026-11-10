import { useCallback, useEffect, useState } from 'react'
import * as taskApi from '../api/taskApi'
import { getErrorMessage } from '../api/client'
import { STATUSES } from '../types'
import type { Task, TaskInput, TaskStatus } from '../types'

/** 칼럼(상태)별로 묶은 업무 목록 */
export type Columns = Record<TaskStatus, Task[]>

/** 업무 배열 → 칼럼별 배열 (각 칼럼은 position 오름차순) */
export function groupByStatus(tasks: Task[]): Columns {
  const columns: Columns = { TODO: [], IN_PROGRESS: [], DONE: [] }
  for (const t of tasks) columns[t.status].push(t)
  for (const s of STATUSES) columns[s].sort((a, b) => a.position - b.position)
  return columns
}

/** 칼럼별 배열 → 업무 배열 (status, position 을 배열 위치 기준으로 다시 매김) */
function flattenColumns(columns: Columns): Task[] {
  return STATUSES.flatMap((status) =>
    columns[status].map((t, index) => ({ ...t, status, position: index })),
  )
}

/**
 * 업무 목록 상태 관리 훅
 *
 * 역할:
 *  - 화면 진입 시 서버에서 업무 목록을 불러온다.
 *  - 생성/수정/삭제/이동 API 를 호출하고 화면 상태를 갱신한다.
 *  - 이동은 "낙관적 업데이트": 화면을 먼저 바꾸고, 서버 저장이 실패하면 다시 불러와 되돌린다.
 *
 * 업무 보드와 주간보고(보드에서 가져오기) 양쪽에서 같은 데이터를 쓰므로 App 에서 한 번만 호출한다.
 */
export function useTasks(notify: (msg: string, type?: 'error' | 'success') => void) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  /** 서버에서 전체 목록 다시 불러오기 */
  const reload = useCallback(async () => {
    try {
      const data = await taskApi.fetchTasks()
      setTasks(data)
      setLoadError(null)
    } catch (err) {
      setLoadError(getErrorMessage(err, '업무 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  // 최초 1회 로딩
  useEffect(() => {
    void reload()
  }, [reload])

  /** 생성: 서버가 돌려준 최종 데이터(id, position 포함)를 목록에 추가 */
  const create = useCallback(async (input: TaskInput) => {
    const created = await taskApi.createTask(input)
    setTasks((prev) => [...prev, created])
    return created
  }, [])

  /**
   * 수정: 상태(칼럼)가 바뀌면 서버가 position 을 다시 매기므로
   * 다른 카드 순서도 바뀔 수 있다 → 이 경우 전체를 다시 불러온다.
   */
  const update = useCallback(
    async (id: number, input: TaskInput) => {
      const before = tasks.find((t) => t.id === id)
      const updated = await taskApi.updateTask(id, input)
      if (before && before.status !== updated.status) {
        await reload()
      } else {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      }
      return updated
    },
    [tasks, reload],
  )

  /** 삭제: 같은 칼럼의 뒤쪽 카드 순서가 당겨지므로 로컬에서도 재계산 */
  const remove = useCallback(async (id: number) => {
    await taskApi.deleteTask(id)
    setTasks((prev) => flattenColumns(groupByStatus(prev.filter((t) => t.id !== id))))
  }, [])

  /**
   * 이동(드래그 앤 드롭 완료 시 호출)
   * @param id        옮긴 업무 id
   * @param nextColumns 드롭 직후의 칼럼 상태 (보드가 계산해서 넘겨줌)
   */
  const move = useCallback(
    async (id: number, nextColumns: Columns) => {
      // 1) 화면 먼저 반영
      const nextTasks = flattenColumns(nextColumns)
      setTasks(nextTasks)

      // 2) 옮긴 카드의 최종 위치를 서버에 저장
      const moved = nextTasks.find((t) => t.id === id)
      if (!moved) return
      try {
        await taskApi.moveTask(id, moved.status, moved.position)
      } catch (err) {
        // 3) 실패 시 서버 기준으로 되돌림
        notify(getErrorMessage(err, '이동 내용을 저장하지 못했습니다.'), 'error')
        await reload()
      }
    },
    [notify, reload],
  )

  return { tasks, loading, loadError, reload, create, update, remove, move }
}
