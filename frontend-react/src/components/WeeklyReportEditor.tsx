
import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// 브라우저에 임시 저장할 때 사용하는 키
const STORAGE_KEY = 'weekly-board-report'

/**
 * 주간보고 작성 컴포넌트
 *
 * 주요 기능:
 * 1. Tiptap 에디터에서 글 작성
 * 2. 굵게, 제목, 목록 등 서식 변경
 * 3. localStorage에 작성 내용 저장
 * 4. 새로고침 시 저장된 내용 복원
 *
 * 아직 PostgreSQL과 연결하지 않은 상태이며,
 * 다음 단계에서 REST API로 저장 방식을 교체할 예정
 */
export default function WeeklyReportEditor() {

    // 저장 결과 메시지를 화면에 표시하기 위한 상태
    const [message, setMessage] = useState('')

    // Tiptap 에디터 객체 생성
    const editor = useEditor({
        // 기본 문단, 제목, 목록, 굵게 등의 기능 제공
        extensions: [StarterKit],

        // 기존 저장 데이터가 있다면 복원
        // 없다면 주간보고 기본 양식 표시
        content:
            localStorage.getItem(STORAGE_KEY) ??
            `
        <h2>금주 진행사항</h2>
        <p></p>
        <h2>차주 예정사항</h2>
        <p></p>
      `,
    })

    /**
     * 임시 저장 함수
     *
     * editor.getHTML()은 에디터의 내용을
     * HTML 문자열 형태로 반환한다.
     */
    const saveReport = () => {
        // 에디터가 생성되지 않았다면 실행하지 않음
        if (!editor) return

        // 현재 에디터 내용을 HTML로 가져오기
        const html = editor.getHTML()

        // 브라우저 저장소에 HTML 문자열 저장
        localStorage.setItem(STORAGE_KEY, html)

        // 저장 결과 표시
        setMessage('주간보고가 임시 저장되었습니다.')
    }

    // 에디터 초기화 전에는 아무것도 렌더링하지 않음
    if (!editor) return null

    return (
        <section className="report-container">
            <h1>주간보고</h1>

            {/* 에디터 서식 변경 버튼 */}
            <div className="editor-toolbar">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    굵게
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    기울임
                </button>

                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    제목
                </button>

                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    목록
                </button>

                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                >
                    번호 목록
                </button>
            </div>

            {/* 실제 글을 입력하는 Tiptap 편집 영역 */}
            <EditorContent editor={editor} />

            {/* 저장 버튼 */}
            <button
                type="button"
                className="save-button"
                onClick={saveReport}
            >
                임시 저장
            </button>

            {/* 저장 결과 메시지 */}
            <p>{message}</p>
        </section>
    )
}
