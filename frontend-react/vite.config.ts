import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 개발 서버 설정
export default defineConfig({
  plugins: [react()],

  server: {
    // React 개발 서버 포트
    port: 5173,

    // 개발환경에서 /api로 시작하는 요청을
    // Spring Boot 서버(8080)로 전달한다.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',

        // 프록시 요청의 Origin 헤더를 대상 서버에 맞춘다.
        changeOrigin: true,
      },
    },
  },
})
