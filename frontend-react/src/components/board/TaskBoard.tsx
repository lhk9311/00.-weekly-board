import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import BoardColumn from './BoardColumn'
import { TaskCard } from './TaskCard'
import { cardDndId } from './dndId'
import { groupByStatus } from '../../hooks/useTasks'
import type { Columns } from '../../hooks/useTasks'
import { STATUSES } from '../../types'
import type { Task, TaskStatus } from '../../types'
import './board.css'

interface Props {
  tasks: Task[]
  loading: boolean
  loadError: string | null
  onRetry: () => void
  /** null 이면 전체, 값이 있으면 해당 담당자 카드만 표시 */
  assigneeFilter: string | null
  onMove: (id: number, nextColumns: Columns) => void
  onAdd: (status: TaskStatus) => void
  onOpen: (task: Task) => void
}

/** 'task-12' → 12 */
const toTaskId = (dndId: UniqueIdentifier) => Number(String(dndId).replace('task-', ''))
const isColumnId = (id: UniqueIdentifier): id is TaskStatus => STATUSES.includes(id as TaskStatus)

/**
 * 업무 보드 (드래그 앤 드롭)
 *
 * [실행 흐름]
 *  1. onDragStart : 드래그 시작 시점의 칼럼 상태를 복사해 dragColumns 에 보관
 *  2. onDragOver  : 카드가 "다른 칼럼" 위로 올라가면 dragColumns 안에서 카드를 그 칼럼으로 옮김
 *                   (그래야 다른 칼럼 안에서도 위/아래 순서 미리보기가 동작함)
 *  3. onDragEnd   : 같은 칼럼 안 순서 변경을 마무리하고, 위치가 실제로 바뀌었으면 onMove 로 서버 저장 요청
 *  4. 드래그가 끝나면 dragColumns 를 비우고 다시 props.tasks 기준으로 그림
 *
 * 담당자 필터가 걸려 있어도 순서 계산은 "필터 전 전체 칼럼"에서 카드 id 기준으로 하므로
 * 숨겨진 카드의 순서가 꼬이지 않는다.
 */
export default function TaskBoard({ tasks, loading, loadError, onRetry, assigneeFilter, onMove, onAdd, onOpen }: Props) {
  // 드래그 중에만 사용하는 임시 칼럼 상태 (null 이면 드래그 중 아님)
  const [dragColumns, setDragColumns] = useState<Columns | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const baseColumns = useMemo(() => groupByStatus(tasks), [tasks])
  const columns = dragColumns ?? baseColumns

  // 담당자 필터 적용 (표시용)
  const visible = useCallback(
    (list: Task[]) => (assigneeFilter ? list.filter((t) => t.assignee === assigneeFilter) : list),
    [assigneeFilter],
  )

  /**
   * 충돌 감지(어느 카드/칼럼 위에 있는지 판단) 전략
   *
   * 기본 closestCorners 를 쓰면, 카드가 다른 칼럼으로 넘어가면서 칼럼 높이가 바뀌고
   * → 판정이 원래 칼럼으로 되돌아가고 → 다시 넘어가는 무한 반복이 생긴다.
   * 그래서 dnd-kit 공식 예제(Multiple containers)와 같은 방식을 쓴다.
   *  1. 포인터가 실제로 올라가 있는 대상을 우선 (없으면 겹치는 영역 기준)
   *  2. 칼럼 위라면, 그 칼럼 안에서 가장 가까운 카드로 좁힌다
   *  3. 방금 칼럼을 옮긴 직후 한 프레임은 이전 판정을 유지한다
   */
  const lastOverId = useRef<UniqueIdentifier | null>(null)
  const movedToNewColumn = useRef(false)

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerHits = pointerWithin(args)
      const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args)
      let overId = getFirstCollision(hits, 'id')

      if (overId != null) {
        if (isColumnId(overId)) {
          const cardIds = new Set<UniqueIdentifier>(visible(columns[overId]).map((t) => cardDndId(t.id)))
          if (cardIds.size > 0) {
            overId =
              closestCenter({
                ...args,
                droppableContainers: args.droppableContainers.filter((c) => cardIds.has(c.id)),
              })[0]?.id ?? overId
          }
        }
        lastOverId.current = overId
        return [{ id: overId }]
      }

      if (movedToNewColumn.current) lastOverId.current = args.active.id
      return lastOverId.current ? [{ id: lastOverId.current }] : []
    },
    [columns, visible],
  )

  // 칼럼 이동이 화면에 반영된 다음 프레임에 가드 해제
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      movedToNewColumn.current = false
    })
    return () => cancelAnimationFrame(raf)
  }, [dragColumns])

  /**
   * 입력 센서
   *  - 마우스: 5px 이상 움직여야 드래그 시작 (그 전에는 클릭 → 카드 편집)
   *  - 터치: 0.2초 길게 누르면 드래그 시작 (그냥 스와이프는 화면 스크롤)
   *  - 키보드: 카드에 포커스 후 Space → 방향키 → Space
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /** dnd id(카드 또는 칼럼)가 현재 어느 칼럼에 속하는지 */
  const findColumn = (cols: Columns, id: UniqueIdentifier): TaskStatus | null => {
    if (isColumnId(id)) return id
    const taskId = toTaskId(id)
    return STATUSES.find((s) => cols[s].some((t) => t.id === taskId)) ?? null
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDragColumns(baseColumns)
    setActiveTask(tasks.find((t) => t.id === toTaskId(active.id)) ?? null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const prev = dragColumns
    // 직전 칼럼 이동이 아직 화면에 반영되지 않았다면 무시 (이동 → 재판정 → 이동 무한 반복 방지)
    if (!over || !prev || movedToNewColumn.current) return
    const from = findColumn(prev, active.id)
    const to = findColumn(prev, over.id)
    if (!from || !to || from === to) return // 같은 칼럼 안 이동은 onDragEnd 에서 처리

    const activeId = toTaskId(active.id)
    const moving = prev[from].find((t) => t.id === activeId)
    if (!moving) return

    // 놓을 위치: 카드 위면 그 카드 자리, 칼럼 빈 공간이면 맨 끝
    const toList = prev[to]
    const overIndex = isColumnId(over.id) ? toList.length : toList.findIndex((t) => t.id === toTaskId(over.id))
    const insertAt = overIndex < 0 ? toList.length : overIndex

    movedToNewColumn.current = true
    setDragColumns({
      ...prev,
      [from]: prev[from].filter((t) => t.id !== activeId),
      [to]: [...toList.slice(0, insertAt), { ...moving, status: to }, ...toList.slice(insertAt)],
    })
  }

  const resetDrag = () => {
    setDragColumns(null)
    setActiveTask(null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const current = dragColumns
    if (!over || !current) return resetDrag()

    const activeId = toTaskId(active.id)
    const column = findColumn(current, active.id)
    if (!column) return resetDrag()

    // 같은 칼럼 안에서의 최종 순서 정리
    let next = current
    const list = current[column]
    const oldIndex = list.findIndex((t) => t.id === activeId)
    const newIndex = isColumnId(over.id) ? list.length - 1 : list.findIndex((t) => t.id === toTaskId(over.id))
    if (newIndex >= 0 && oldIndex !== newIndex) {
      next = { ...current, [column]: arrayMove(list, oldIndex, newIndex) }
    }

    // 원래 위치와 비교해 실제로 바뀐 경우에만 저장
    const original = tasks.find((t) => t.id === activeId)
    const finalIndex = next[column].findIndex((t) => t.id === activeId)
    const originalIndex = original ? baseColumns[original.status].findIndex((t) => t.id === activeId) : -1
    if (original && (original.status !== column || originalIndex !== finalIndex)) {
      onMove(activeId, next)
    }
    resetDrag()
  }

  if (loading) {
    return (
      <div className="board">
        {STATUSES.map((s) => (
          <div key={s} className="column column--skeleton">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--card" />
            <div className="skeleton skeleton--card" />
          </div>
        ))}
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="board-error">
        <p>{loadError}</p>
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      // 드래그 중 매 프레임 카드/칼럼 위치를 다시 측정한다.
      // (카드가 칼럼을 옮기면 다른 카드 위치가 바뀌는데, 옛 위치로 판정하면 칼럼 사이를 왕복하게 됨)
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={resetDrag}
    >
      <div className="board">
        {STATUSES.map((status) => (
          <BoardColumn key={status} status={status} tasks={visible(columns[status])} onAdd={onAdd} onOpen={onOpen} />
        ))}
      </div>

      {/* 드래그 중 포인터를 따라다니는 카드 복제본 */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' }}>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
