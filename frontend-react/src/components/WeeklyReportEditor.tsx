import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import Icon from './common/Icon'
import type { IconName } from './common/Icon'
import * as reportApi from '../api/reportApi'
import { getErrorMessage } from '../api/client'
import { addWeeks, currentWeekStart, formatWeekRange, formatWeekTitle } from '../utils/week'
import { STATUSES, STATUS_LABEL } from '../types'
import type { Task } from '../types'
import './report.css'

/** 아직 작성하지 않은 주에 보여줄 기본 양식 */
const TEMPLATE = `
  <h2>금주 진행사항</h2><ul><li><p></p></li></ul>
  <h2>차주 예정사항</h2><ul><li><p></p></li></ul>
  <h2>이슈 및 공유사항</h2><p></p>
`

/** 자동 저장 대기 시간: 입력이 멈추고 1.5초 뒤 저장 */
const AUTOSAVE_DELAY = 1500

type SaveState = 'loading' | 'saved' | 'dirty' | 'saving' | 'error'

interface Props {
  /** 보드의 업무 목록 — "보드에서 가져오기" 에 사용 */
  tasks: Task[]
  notify: (msg: string, type?: 'error' | 'success') => void
  /** 이 탭이 화면에 보이는지 (Ctrl+S 단축키를 보일 때만 동작시키기 위함) */
  active: boolean
}

/** HTML 특수문자 이스케이프 (업무 제목을 에디터에 넣을 때 사용) */
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * 주간보고 작성 컴포넌트
 *
 * [실행 흐름]
 *  1. weekStart(월요일 날짜)가 바뀌면 서버에서 해당 주 보고서를 불러와 에디터에 채운다.
 *     저장된 내용이 없으면 기본 양식(TEMPLATE)을 넣는다.
 *  2. 사용자가 입력하면 상태를 'dirty' 로 바꾸고, 1.5초 동안 추가 입력이 없으면 자동 저장한다.
 *  3. 저장 버튼 / Ctrl+S 로 즉시 저장할 수도 있다.
 *  4. 다른 주로 이동할 때 저장 안 된 내용이 있으면 먼저 저장한 뒤 이동한다.
 *
 * 기존 버전은 localStorage 에만 저장했는데, 이번에 PUT /api/reports/{weekStart} 로 DB 저장으로 바꿨다.
 */
export default function WeeklyReportEditor({ tasks, notify, active }: Props) {
  const [weekStart, setWeekStart] = useState(currentWeekStart)
  const [saveState, setSaveState] = useState<SaveState>('loading')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // Tiptap 의 onUpdate 콜백은 에디터 생성 시점에 고정되므로,
  // 최신 값이 필요한 것들은 ref 로 들고 다닌다.
  const weekRef = useRef(weekStart)
  const stateRef = useRef<SaveState>('loading')
  const timerRef = useRef<number | undefined>(undefined)
  const saveRef = useRef<() => Promise<void>>(async () => {})

  const changeState = (s: SaveState) => {
    stateRef.current = s
    setSaveState(s)
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: '내용을 입력하세요…' }),
    ],
    content: '',
    editable: false, // 첫 로딩이 끝나면 편집 가능으로 전환
    // 내용이 바뀔 때마다 호출 → 자동 저장 예약
    onUpdate: () => {
      if (stateRef.current === 'loading') return
      changeState('dirty')
      window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => void saveRef.current(), AUTOSAVE_DELAY)
    },
  })

  /** 현재 에디터 내용을 서버에 저장 */
  const save = useCallback(async () => {
    if (!editor) return
    window.clearTimeout(timerRef.current)
    const week = weekRef.current
    const html = editor.getHTML()
    changeState('saving')
    try {
      const saved = await reportApi.saveReport(week, html)
      // 저장 도중 다른 주로 넘어갔다면 화면 상태는 건드리지 않는다.
      if (weekRef.current !== week) return
      setSavedAt(saved.updatedAt)
      // 저장 중에 또 입력이 들어왔다면 dirty 유지
      changeState(editor.getHTML() === html ? 'saved' : 'dirty')
    } catch (err) {
      changeState('error')
      notify(getErrorMessage(err, '주간보고를 저장하지 못했습니다.'), 'error')
    }
  }, [editor, notify])

  // 자동 저장 타이머에서 항상 최신 save 함수를 부르도록 ref 갱신
  useEffect(() => {
    saveRef.current = save
  }, [save])

  // weekStart 가 바뀌면 해당 주 보고서 불러오기
  useEffect(() => {
    if (!editor) return
    let cancelled = false // 빠르게 주를 넘길 때 이전 응답이 늦게 도착하는 경우 무시
    weekRef.current = weekStart
    changeState('loading')
    editor.setEditable(false, false) // 두 번째 인자 false: update 이벤트를 발생시키지 않음

    reportApi
      .fetchReport(weekStart)
      .then((report) => {
        if (cancelled) return
        editor.commands.setContent(report.content || TEMPLATE, { emitUpdate: false })
        setSavedAt(report.updatedAt)
        changeState('saved')
      })
      .catch((err) => {
        if (cancelled) return
        editor.commands.setContent(TEMPLATE, { emitUpdate: false })
        setSavedAt(null)
        changeState('error')
        notify(getErrorMessage(err, '주간보고를 불러오지 못했습니다.'), 'error')
      })
      .finally(() => {
        if (!cancelled) editor.setEditable(true, false)
      })

    return () => {
      cancelled = true
    }
  }, [editor, weekStart, notify])

  /** 주 이동 — 저장 안 된 내용이 있으면 먼저 저장 */
  const goToWeek = async (next: string) => {
    if (next === weekStart) return
    if (stateRef.current === 'dirty' || stateRef.current === 'saving') await save()
    setWeekStart(next)
  }

  // Ctrl+S / Cmd+S 단축키 (주간보고 탭이 보일 때만)
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void saveRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  // 저장 안 된 채로 창을 닫으려 하면 브라우저 경고 표시
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stateRef.current === 'dirty' || stateRef.current === 'saving') e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  /**
   * 보드에서 가져오기
   * 현재 보드의 업무를 상태별 목록으로 만들어 커서가 있는 블록 바로 아래에 삽입한다.
   */
  const importFromBoard = () => {
    if (!editor) return
    if (tasks.length === 0) {
      notify('보드에 등록된 업무가 없습니다.', 'error')
      return
    }
    // 완료 → 진행 중 → 예정 순서가 보고서 흐름에 자연스럽다.
    const order = [...STATUSES].reverse()
    const html = order
      .map((status) => {
        const items = tasks
          .filter((t) => t.status === status)
          .sort((a, b) => a.position - b.position)
          .map((t) => `<li><p>${escapeHtml(t.title)}${t.assignee ? ` (${escapeHtml(t.assignee)})` : ''}</p></li>`)
        if (items.length === 0) return ''
        return `<h3>${STATUS_LABEL[status]}</h3><ul>${items.join('')}</ul>`
      })
      .join('')
    // 커서가 목록 안에 있으면 그 안에 중첩되어 들어가므로,
    // 커서가 속한 "최상위 블록"의 바로 뒤에 삽입한다.
    const { $from } = editor.state.selection
    const insertPos = $from.depth > 0 ? $from.after(1) : $from.pos
    editor.chain().focus().insertContentAt(insertPos, html).run()
    notify('보드의 업무를 가져왔습니다.')
  }

  const isCurrentWeek = weekStart === currentWeekStart()

  return (
    <div className="report">
      {/* 주 선택 바 */}
      <div className="report__weekbar">
        <div className="week-nav">
          <button type="button" className="icon-button" onClick={() => goToWeek(addWeeks(weekStart, -1))} aria-label="이전 주">
            <Icon name="chevronLeft" />
          </button>
          <button type="button" className="icon-button" onClick={() => goToWeek(addWeeks(weekStart, 1))} aria-label="다음 주">
            <Icon name="chevronRight" />
          </button>
          {!isCurrentWeek && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => goToWeek(currentWeekStart())}>
              이번 주
            </button>
          )}
        </div>
        <SaveIndicator state={saveState} savedAt={savedAt} />
      </div>

      <article className="report__paper">
        <header className="report__head">
          <p className="report__range">
            {formatWeekRange(weekStart)}
            {isCurrentWeek && <span className="pill">이번 주</span>}
          </p>
          <h1 className="report__title">{formatWeekTitle(weekStart)} 주간보고</h1>
        </header>

        {editor && <Toolbar editor={editor} onImport={importFromBoard} onSave={() => void save()} saving={saveState === 'saving'} />}

        <div className={`report__editor${saveState === 'loading' ? ' is-loading' : ''}`}>
          <EditorContent editor={editor} />
        </div>
      </article>
    </div>
  )
}

/** 저장 상태 표시 (우측 상단) */
function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: string | null }) {
  const time = savedAt
    ? new Date(savedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null

  const text: Record<SaveState, string> = {
    loading: '불러오는 중…',
    saving: '저장 중…',
    dirty: '변경사항 있음',
    saved: time ? `저장됨 · ${time}` : '새 보고서',
    error: '저장 실패',
  }
  return <span className={`save-indicator save-indicator--${state}`}>{text[state]}</span>
}

/**
 * 서식 툴바
 * useEditorState 로 "현재 커서 위치에 굵게가 적용됐는지" 같은 상태를 구독해 버튼 활성 표시를 갱신한다.
 * (Tiptap v3 는 기본적으로 입력마다 컴포넌트를 다시 그리지 않으므로 이 방식이 필요)
 */
function Toolbar({ editor, onImport, onSave, saving }: { editor: Editor; onImport: () => void; onSave: () => void; saving: boolean }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()

  // 글자 버튼(B, I, S, H2, H3)
  const textButtons: { label: string; title: string; active: boolean; run: () => void; className?: string }[] = [
    { label: 'H2', title: '큰 제목', active: s.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: 'H3', title: '작은 제목', active: s.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    { label: 'B', title: '굵게 (Ctrl+B)', active: s.bold, run: () => chain().toggleBold().run(), className: 'is-bold' },
    { label: 'I', title: '기울임 (Ctrl+I)', active: s.italic, run: () => chain().toggleItalic().run(), className: 'is-italic' },
    { label: 'S', title: '취소선', active: s.strike, run: () => chain().toggleStrike().run(), className: 'is-strike' },
  ]

  // 아이콘 버튼(목록, 인용, 구분선)
  const iconButtons: { icon: IconName; title: string; active: boolean; run: () => void }[] = [
    { icon: 'bulletList', title: '글머리 목록', active: s.bullet, run: () => chain().toggleBulletList().run() },
    { icon: 'orderedList', title: '번호 목록', active: s.ordered, run: () => chain().toggleOrderedList().run() },
    { icon: 'quote', title: '인용', active: s.quote, run: () => chain().toggleBlockquote().run() },
    { icon: 'divider', title: '구분선', active: false, run: () => chain().setHorizontalRule().run() },
  ]

  return (
    <div className="toolbar" role="toolbar" aria-label="서식">
      <div className="toolbar__group">
        {textButtons.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            aria-pressed={b.active}
            className={`tool-btn ${b.className ?? ''}${b.active ? ' is-active' : ''}`}
            onClick={b.run}
          >
            {b.label}
          </button>
        ))}
      </div>
      <span className="toolbar__sep" />
      <div className="toolbar__group">
        {iconButtons.map((b) => (
          <button
            key={b.icon}
            type="button"
            title={b.title}
            aria-label={b.title}
            aria-pressed={b.active}
            className={`tool-btn${b.active ? ' is-active' : ''}`}
            onClick={b.run}
          >
            <Icon name={b.icon} />
          </button>
        ))}
      </div>
      <span className="toolbar__sep" />
      <div className="toolbar__group">
        <button type="button" className="tool-btn" title="실행 취소" aria-label="실행 취소" disabled={!s.canUndo} onClick={() => chain().undo().run()}>
          <Icon name="undo" />
        </button>
        <button type="button" className="tool-btn" title="다시 실행" aria-label="다시 실행" disabled={!s.canRedo} onClick={() => chain().redo().run()}>
          <Icon name="redo" />
        </button>
      </div>

      <span className="spacer" />

      <button type="button" className="btn btn--ghost btn--sm" onClick={onImport} title="보드의 업무를 상태별 목록으로 삽입">
        <Icon name="import" size={14} />
        보드에서 가져오기
      </button>
      <button type="button" className="btn btn--primary btn--sm" onClick={onSave} disabled={saving}>
        저장
      </button>
    </div>
  )
}
