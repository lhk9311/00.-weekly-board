import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Avatar from '../common/Avatar'
import { STATUS_LABEL } from '../../types'
import type { Task } from '../../types'
import { cardDndId } from './dndId'


interface CardProps {
  task: Task
  onClick?: () => void
  /** 드래그 중 마우스를 따라다니는 복제 카드인지 */
  overlay?: boolean
}

/**
 * 업무 카드 (표시 전용)
 * 제목 / 설명 미리보기 / 상태 배지 / 담당자를 보여준다.
 */
export function TaskCard({ task, onClick, overlay }: CardProps) {
  return (
    <div className={`task-card${overlay ? ' is-overlay' : ''}`} onClick={onClick}>
      <p className="task-card__title">{task.title}</p>
      {task.description && <p className="task-card__desc">{task.description}</p>}
      <div className="task-card__footer">
        <span className={`status-badge status-badge--${task.status}`}>
          <span className="status-dot" />
          {STATUS_LABEL[task.status]}
        </span>
        <span className="task-card__assignee">
          {task.assignee && <span className="task-card__assignee-name">{task.assignee}</span>}
          <Avatar name={task.assignee} />
        </span>
      </div>
    </div>
  )
}

/**
 * 드래그 가능한 업무 카드
 *
 * useSortable 이 반환하는 listeners(마우스/터치 이벤트)와 transform(이동 좌표)을
 * 카드 래퍼에 연결한다. 클릭과 드래그 구분은 TaskBoard 의 센서 설정(5px 이상 움직이면 드래그)으로 처리한다.
 */
export function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDndId(task.id),
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card-wrap${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
      {...listeners}
      // Enter 키로도 카드를 열 수 있게 (Space 는 키보드 드래그에 사용)
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e)
        if (e.key === 'Enter') onClick()
      }}
    >
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}
