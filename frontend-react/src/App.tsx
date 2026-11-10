
import WeeklyReportEditor from './components/WeeklyReportEditor'
import './App.css'

/**
 * React 애플리케이션의 최상위 화면
 *
 * 현재는 주간보고 에디터만 표시한다.
 * 추후 드래그 앤 드롭 업무 보드를 추가할 예정
 */
function App() {
    return (
        <main>
            <WeeklyReportEditor />
        </main>
    )
}

export default App
