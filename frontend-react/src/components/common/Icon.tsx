/**
 * 아이콘 모음 (외부 아이콘 라이브러리 없이 인라인 SVG 사용)
 * stroke 색은 currentColor 를 따르므로 부모의 color 로 색을 바꾼다.
 */
const PATHS = {
  board: 'M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z',
  report: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5',
  plus: 'M12 5v14M5 12h14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0',
  import: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-4',
  redo: 'M15 14l5-5-5-5M20 9H9a5 5 0 000 10h4',
  bulletList: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  orderedList: 'M10 6h10M10 12h10M10 18h10M4 5l1.5-1V9M3.5 14.5c.5-1 2.5-1 2.5.5 0 1-2.5 2-2.5 3h2.5',
  quote: 'M5 5v14M10 7h9M10 12h9M10 17h6',
  divider: 'M4 12h16',
} as const

export type IconName = keyof typeof PATHS

export default function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
