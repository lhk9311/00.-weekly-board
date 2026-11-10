import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Icon from '../common/Icon'
import { SortableTaskCard } from './TaskCard'
import { cardDndId } from './dndId'
import { STATUS_LABEL } from '../../types'
import type { Task, TaskStatus } from '../../types'

interface Props {
  status: TaskStatus
  tasks: Task[]
  onAdd: (status: TaskStatus) => void
  onOpen: (task: Task) => void
}

/**
 * 보드의 칼럼 하나 (예정 / 진행 중 / 완료)
 *
 * - useDroppable: 카드가 하나도 없는 빈 칼럼에도 드롭할 수 있게 칼럼 자체를 드롭 영역으로 등록
 * - SortableContext: 칼럼 안 카드들의 순서 정렬 범위
 */
export default function BoardColumn({ status, tasks, onAdd, onOpen }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section className={`column column--${status}`} aria-label={STATUS_LABEL[status]}>
      <header className="column__header">
        <span className="status-dot" />
        <h2 className="column__title">{STATUS_LABEL[status]}</h2>
        <span className="column__count">{tasks.length}</span>
        <button
          type="button"
          className="icon-button column__add"
          onClick={() => onAdd(status)}
          aria-label={`${STATUS_LABEL[status]}에 업무 추가`}
        >
          <Icon name="plus" />
        </button>
      </header>

      <SortableContext items={tasks.map((t) => cardDndId(t.id))} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`column__body${isOver ? ' is-over' : ''}`}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onOpen(task)} />
          ))}

          {tasks.length === 0 && <div className="column__empty">여기로 카드를 끌어오세요</div>}

          <button type="button" className="column__add-row" onClick={() => onAdd(status)}>
            <Icon name="plus" size={14} />
            업무 추가
          </button>
        </div>
      </SortableContext>
    </section>
  )
}
