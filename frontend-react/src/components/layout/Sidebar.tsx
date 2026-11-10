import Icon from '../common/Icon'
import Avatar from '../common/Avatar'
import type { TabKey } from '../../types'

export interface AssigneeSummary {
  name: string
  count: number
}

interface Props {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  assignees: AssigneeSummary[]
  selectedAssignee: string | null
  onSelectAssignee: (name: string | null) => void
  totalCount: number
  /** 모바일에서 사이드바가 열려 있는지 */
  open: boolean
  onClose: () => void
}

/**
 * 좌측 사이드바
 *
 * 구성:
 *  1. 워크스페이스 이름
 *  2. 보기 메뉴 (업무 보드 / 주간보고) — 헤더 탭과 같은 상태를 공유
 *  3. 담당자 목록 — 클릭하면 보드를 해당 담당자 업무만 보이도록 필터링
 *
 * 모바일(768px 이하)에서는 화면 밖에 숨어 있다가 햄버거 버튼으로 열린다.
 */
export default function Sidebar({
  activeTab,
  onTabChange,
  assignees,
  selectedAssignee,
  onSelectAssignee,
  totalCount,
  open,
  onClose,
}: Props) {
  // 메뉴 선택 후 모바일에서는 사이드바를 닫아 본문이 보이게 한다.
  const selectTab = (tab: TabKey) => {
    onTabChange(tab)
    onClose()
  }

  const selectAssignee = (name: string | null) => {
    onSelectAssignee(name)
    onTabChange('board') // 담당자 필터는 보드에서만 의미가 있으므로 보드로 이동
    onClose()
  }

  return (
    <>
      {/* 모바일 전용 반투명 배경 — 클릭하면 사이드바 닫힘 */}
      <div className={`sidebar-backdrop${open ? ' is-open' : ''}`} onClick={onClose} />

      <aside className={`sidebar${open ? ' is-open' : ''}`} aria-label="사이드바">
        <div className="sidebar__brand">
          <span className="sidebar__logo">W</span>
          <span className="sidebar__title">Weekly Board</span>
          <button type="button" className="icon-button sidebar__close" onClick={onClose} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>

        <nav className="sidebar__section">
          <p className="sidebar__label">보기</p>
          <button
            type="button"
            className={`sidebar__item${activeTab === 'board' ? ' is-active' : ''}`}
            onClick={() => selectTab('board')}
          >
            <Icon name="board" />
            <span>업무 보드</span>
          </button>
          <button
            type="button"
            className={`sidebar__item${activeTab === 'report' ? ' is-active' : ''}`}
            onClick={() => selectTab('report')}
          >
            <Icon name="report" />
            <span>주간보고</span>
          </button>
        </nav>

        <div className="sidebar__section">
          <p className="sidebar__label">담당자</p>
          <button
            type="button"
            className={`sidebar__item${selectedAssignee === null ? ' is-active' : ''}`}
            onClick={() => selectAssignee(null)}
          >
            <Icon name="user" />
            <span>전체</span>
            <span className="sidebar__count">{totalCount}</span>
          </button>
          {assignees.map((a) => (
            <button
              key={a.name}
              type="button"
              className={`sidebar__item${selectedAssignee === a.name ? ' is-active' : ''}`}
              onClick={() => selectAssignee(a.name)}
            >
              <Avatar name={a.name} size={18} />
              <span className="sidebar__name">{a.name}</span>
              <span className="sidebar__count">{a.count}</span>
            </button>
          ))}
          {assignees.length === 0 && <p className="sidebar__hint">업무에 담당자를 지정하면 여기에 표시됩니다.</p>}
        </div>
      </aside>
    </>
  )
}
