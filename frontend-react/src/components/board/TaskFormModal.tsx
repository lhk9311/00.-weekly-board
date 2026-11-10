import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Icon from '../common/Icon'
import { STATUSES, STATUS_LABEL } from '../../types'
import type { Task, TaskInput, TaskStatus } from '../../types'

interface Props {
  /** 수정할 업무. null 이면 새 업무 생성 모드 */
  task: Task | null
  /** 생성 모드에서 기본 선택될 상태 (칼럼의 + 버튼으로 열었을 때) */
  defaultStatus: TaskStatus
  /** 담당자 입력 자동완성 후보 */
  assigneeOptions: string[]
  onSubmit: (input: TaskInput) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

/**
 * 업무 생성/수정 모달
 *
 * 실행 흐름:
 *  1. 열릴 때 task 가 있으면 값을 채우고(수정), 없으면 빈 폼(생성)
 *  2. 저장 → onSubmit (App 에서 API 호출) → 성공하면 App 이 모달을 닫음
 *  3. 실패하면 모달은 그대로 두고 에러 문구를 표시
 */
export default function TaskFormModal({ task, defaultStatus, assigneeOptions, onSubmit, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [assignee, setAssignee] = useState(task?.assignee ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus)
  const [description, setDescription] = useState(task?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // 열리면 제목 입력칸에 포커스, ESC 로 닫기
  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        assignee: assignee.trim() || null,
        description: description.trim() || null,
        status,
      })
    } catch {
      setError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || !window.confirm('이 업무를 삭제할까요?')) return
    setSubmitting(true)
    try {
      await onDelete()
    } catch {
      setError('삭제하지 못했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <header className="modal__header">
          <h2 id="task-modal-title">{task ? '업무 수정' : '새 업무'}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </header>

        <div className="modal__body">
          <label className="field">
            <span className="field__label">제목</span>
            <input
              ref={titleRef}
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="무엇을 해야 하나요?"
              maxLength={200}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">담당자</span>
              <input
                className="input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="이름"
                list="assignee-options"
                maxLength={50}
              />
              {/* 기존 담당자 이름 자동완성 */}
              <datalist id="assignee-options">
                {assigneeOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span className="field__label">상태</span>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field__label">설명</span>
            <textarea
              className="input input--textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="세부 내용 (선택)"
              rows={4}
              maxLength={2000}
            />
          </label>

          {error && <p className="field__error">{error}</p>}
        </div>

        <footer className="modal__footer">
          {task && onDelete && (
            <button type="button" className="btn btn--danger-ghost" onClick={handleDelete} disabled={submitting}>
              삭제
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={submitting}>
            취소
          </button>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? '저장 중…' : '저장'}
          </button>
        </footer>
      </form>
    </div>
  )
}
