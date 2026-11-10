import type { ReactNode } from 'react'
import Icon from '../common/Icon'
import type { TabKey } from '../../types'

interface Props {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onMenuClick: () => void
  /** 우측 영역에 표시할 버튼 (탭마다 다름) */
  actions?: ReactNode
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'board', label: '업무 보드' },
  { key: 'report', label: '주간보고' },
]

/**
 * 상단 헤더
 *
 * 좌측: (모바일) 햄버거 버튼 + 탭 전환
 * 우측: 현재 탭에 맞는 액션 버튼 (예: 보드 → "새 업무")
 *
 * 탭 상태 자체는 App 이 가지고 있고, 헤더는 선택 이벤트만 올려 보낸다.
 */
export default function Header({ activeTab, onTabChange, onMenuClick, actions }: Props) {
  return (
    <header className="header">
      <button type="button" className="icon-button header__menu" onClick={onMenuClick} aria-label="메뉴 열기">
        <Icon name="menu" size={18} />
      </button>

      <div className="tabs" role="tablist" aria-label="화면 전환">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tabs__item${activeTab === tab.key ? ' is-active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="header__actions">{actions}</div>
    </header>
  )
}
