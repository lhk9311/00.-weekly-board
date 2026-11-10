import axios from 'axios'

/**
 * 공통 axios 인스턴스
 *
 * 실행 흐름:
 *  - 개발환경: 브라우저 → Vite(5173) → vite.config.ts 프록시 → Spring Boot(8080)
 *  - 배포환경: React 빌드 결과물을 Spring Boot 와 같은 도메인에서 서비스하므로
 *              '/api' 상대경로가 그대로 동작한다.
 */
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

/**
 * 에러 객체에서 사용자에게 보여줄 메시지를 꺼낸다.
 * 서버가 { message } 형태로 응답하면 그 문구를, 아니면 기본 문구를 사용한다.
 */
export function getErrorMessage(err: unknown, fallback = '요청 처리 중 오류가 발생했습니다.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
    if (!err.response) return '서버에 연결할 수 없습니다. 백엔드 실행 여부를 확인해 주세요.'
  }
  return fallback
}
