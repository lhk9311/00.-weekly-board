# Weekly Board

주간회의용 업무 보드 + 주간보고 작성 도구

- **업무 보드**: 예정 / 진행 중 / 완료 칼럼 사이를 드래그 앤 드롭으로 이동 (모바일은 길게 눌러 드래그)
- **주간보고**: Tiptap 리치 텍스트 에디터, 주차별 저장, 입력 후 1.5초 자동 저장, Ctrl+S, "보드에서 가져오기"

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tiptap 3, dnd-kit, axios |
| Backend | Spring Boot 4, Java 17, MyBatis |
| Database | PostgreSQL |

## 폴더 구조

```
frontend-react/src
├── App.tsx                  화면 전체 구성 (사이드바 + 헤더 + 탭 본문), 업무 상태 보관
├── types.ts                 API 응답과 1:1 로 맞춘 타입
├── api/                     axios 호출 (client, taskApi, reportApi)
├── hooks/                   useTasks(업무 CRUD·이동), useToast(알림)
├── utils/                   주차 계산, 아바타 색상
└── components/
    ├── layout/              Sidebar, Header
    ├── board/               TaskBoard(드래그 앤 드롭), BoardColumn, TaskCard, TaskFormModal
    ├── common/              Icon, Avatar
    └── WeeklyReportEditor.tsx

backend/src/main
├── java/com/weeklyboard/backend
│   ├── task/                업무 API (Controller → Service → Mapper)
│   ├── report/              주간보고 API
│   └── common/              전역 예외 처리
└── resources
    ├── schema.sql           테이블 정의 (서버 시작 시 자동 실행)
    └── mapper/*.xml         MyBatis SQL
```

## API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/tasks` | 전체 업무 |
| POST | `/api/tasks` | 업무 등록 (칼럼 맨 아래) |
| PUT | `/api/tasks/{id}` | 업무 수정 |
| PATCH | `/api/tasks/{id}/move` | 이동 `{ status, position }` |
| DELETE | `/api/tasks/{id}` | 업무 삭제 |
| GET | `/api/reports/{weekStart}` | 주간보고 조회 (`2026-11-09` 형식, 다른 요일이 와도 월요일로 맞춤) |
| PUT | `/api/reports/{weekStart}` | 주간보고 저장 `{ content }` |

에러 응답은 모두 `{ "message": "..." }` 형태입니다.

## 로컬 실행

```bash
# 1. DB 생성 (최초 1회) — 테이블은 서버 시작 시 schema.sql 로 자동 생성됨
createdb -U postgres weekly_board

# 2. 백엔드 (8080)
cd backend
DB_PASSWORD=비밀번호 ./mvnw spring-boot:run      # Windows: set DB_PASSWORD=... 후 mvnw spring-boot:run

# 3. 프론트엔드 (5173) — /api 요청은 vite 프록시로 8080 에 전달
cd frontend-react
npm install
npm run dev
```

## 배포 (Cafe24)

React 빌드 결과를 Spring Boot 정적 폴더에 넣어 **jar 하나로** 배포합니다. 같은 도메인이라 CORS 설정이 필요 없습니다.

```bash
cd frontend-react && npm run build:backend     # → backend/src/main/resources/static
cd ../backend && ./mvnw -DskipTests package     # → target/backend-0.0.1-SNAPSHOT.jar

# 서버에서
DB_URL=jdbc:postgresql://호스트:5432/weekly_board \
DB_USERNAME=사용자 DB_PASSWORD=비밀번호 \
java -jar backend-0.0.1-SNAPSHOT.jar
```

배포 전 `DbTestController`, `TestController`(개발용 테스트 API)는 삭제를 권장합니다.
