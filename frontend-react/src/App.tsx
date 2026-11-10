import { useCallback, useMemo, useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import type { AssigneeSummary } from './components/layout/Sidebar'
import Header from './components/layout/Header'
import TaskBoard from './components/board/TaskBoard'
import TaskFormModal from './components/board/TaskFormModal'
import WeeklyReportEditor from './components/WeeklyReportEditor'
import Icon from './components/common/Icon'
import { useTasks } from './hooks/useTasks'
import { useToast } from './hooks/useToast'
import { getErrorMessage } from './api/client'
import type { TabKey, Task, TaskInput, TaskStatus } from './types'
import './App.css'

/** 업무 모달의 열림 상태: 닫힘 / 생성(기본 상태 지정) / 수정(대상 업무) */
type ModalState = { mode: 'closed' } | { mode: 'create'; status: TaskStatus } | { mode: 'edit'; task: Task }

/**
 * 애플리케이션 최상위 화면
 *
 * [화면 구성]
 *  ┌──────────┬──────────────────────────────┐
 *  │ Sidebar  │ Header (탭 전환 + 액션 버튼)   │
 *  │          ├──────────────────────────────┤
 *  │          │ TaskBoard  또는  주간보고 에디터 │
 *  └──────────┴──────────────────────────────┘
 *
 * [상태 관리]
 *  - 업무 목록(useTasks): 보드와 주간보고(보드에서 가져오기)가 함께 쓰므로 여기서 관리
 *  - 탭, 담당자 필터, 모달, 모바일 사이드바 열림 여부
 *
 * 두 탭은 모두 마운트된 채로 hidden 으로만 전환한다.
 * → 탭을 오가도 에디터의 작성 중 내용·실행 취소 기록이 사라지지 않는다.
 */
function App() {
  const { toast, notify } = useToast()
  const { tasks, loading, loadError, reload, create, update, remove, move } = useTasks(notify)

  const [tab, setTab] = useState<TabKey>('board')
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 사이드바 담당자 목록 (업무 수 많은 순)
  const assignees = useMemo<AssigneeSummary[]>(() => {
    const counts = new Map<string, number>()
    for (const t of tasks) if (t.assignee) counts.set(t.assignee, (counts.get(t.assignee) ?? 0) + 1)
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'))
  }, [tasks])

  const closeModal = useCallback(() => setModal({ mode: 'closed' }), [])

  /** 모달 저장 → 생성 또는 수정 API 호출 */
  const handleSubmit = async (input: TaskInput) => {
    try {
      if (modal.mode === 'edit') {
        await update(modal.task.id, input)
        notify('업무를 수정했습니다.')
      } else {
        await create(input)
        notify('업무를 추가했습니다.')
      }
      closeModal()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
      throw err // 모달이 에러 상태를 표시하도록 다시 던짐
    }
  }

  const handleDelete = async () => {
    if (modal.mode !== 'edit') return
    try {
      await remove(modal.task.id)
      notify('업무를 삭제했습니다.')
      closeModal()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
      throw err
    }
  }

  return (
    <div className="app">
      <Sidebar
        activeTab={tab}
        onTabChange={setTab}
        assignees={assignees}
        selectedAssignee={assigneeFilter}
        onSelectAssignee={setAssigneeFilter}
        totalCount={tasks.length}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <Header
          activeTab={tab}
          onTabChange={setTab}
          onMenuClick={() => setSidebarOpen(true)}
          actions={
            tab === 'board' && (
              <>
                {assigneeFilter && (
                  <button type="button" className="filter-chip" onClick={() => setAssigneeFilter(null)} title="필터 해제">
                    담당자: {assigneeFilter}
                    <Icon name="close" size={12} />
                  </button>
                )}
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setModal({ mode: 'create', status: 'TODO' })}>
                  <Icon name="plus" size={14} />
                  <span className="hide-sm">새 업무</span>
                </button>
              </>
            )
          }
        />

        <main className="content">
          <div hidden={tab !== 'board'} className="content__board">
            <TaskBoard
              tasks={tasks}
              loading={loading}
              loadError={loadError}
              onRetry={reload}
              assigneeFilter={assigneeFilter}
              onMove={move}
              onAdd={(status) => setModal({ mode: 'create', status })}
              onOpen={(task) => setModal({ mode: 'edit', task })}
            />
          </div>
          <div hidden={tab !== 'report'} className="content__report">
            <WeeklyReportEditor tasks={tasks} notify={notify} active={tab === 'report'} />
          </div>
        </main>
      </div>

      {modal.mode !== 'closed' && (
        <TaskFormModal
          // key 를 바꿔 다른 카드를 열 때마다 폼 상태를 새로 초기화
          key={modal.mode === 'edit' ? `edit-${modal.task.id}` : `create-${modal.status}`}
          task={modal.mode === 'edit' ? modal.task : null}
          defaultStatus={modal.mode === 'create' ? modal.status : 'TODO'}
          assigneeOptions={assignees.map((a) => a.name)}
          onSubmit={handleSubmit}
          onDelete={modal.mode === 'edit' ? handleDelete : undefined}
          onClose={closeModal}
        />
      )}

      {toast && (
        <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App
