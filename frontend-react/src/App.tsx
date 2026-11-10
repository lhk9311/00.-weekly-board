import { useState } from 'react'
import axios from 'axios'

/**
 * Spring Boot에서 응답하는 JSON 데이터의 타입
 *
 * TypeScript interface를 사용하면
 * 응답 데이터의 필드와 타입을 미리 정의할 수 있다.
 */
interface ApiResponse {
  message: string
  status: string
}

function App() {

  // API 요청 결과 메시지를 저장하는 상태
  const [message, setMessage] = useState('아직 요청하지 않았습니다.')

  // API 호출 중인지 관리하는 상태
  const [loading, setLoading] = useState(false)

  /**
   * Spring Boot API 호출 함수
   *
   * async/await를 사용해서 비동기 HTTP 요청을 처리한다.
   */
  const fetchMessage = async () => {

    // API 요청 시작
    setLoading(true)

    try {
      // Vite Proxy를 통해 Spring Boot API 호출
      // <ApiResponse>는 응답 데이터의 TypeScript 타입
      const response = await axios.get<ApiResponse>('/api/test')

      // 응답 JSON에서 message 필드를 추출해 상태에 저장
      setMessage(response.data.message)

    } catch (error) {

      // 요청 실패 시 브라우저 개발자 콘솔에 오류 출력
      console.error('API 호출 오류:', error)

      // 사용자에게 실패 메시지 출력
      setMessage('서버 연결 실패')

    } finally {

      // 성공·실패와 상관없이 로딩 상태 종료
      setLoading(false)
    }
  }

  return (
      <main style={{ padding: '40px' }}>
        <h1>Weekly Board</h1>

        <p>React + Spring Boot 연동 테스트</p>

        {/* 버튼 클릭 시 fetchMessage 함수 실행 */}
        <button onClick={fetchMessage} disabled={loading}>
          {loading ? '요청 중...' : 'API 호출'}
        </button>

        {/* API 응답 결과를 화면에 표시 */}
        <p>{message}</p>
      </main>
  )
}

export default App
