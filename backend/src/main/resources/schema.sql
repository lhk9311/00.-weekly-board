-- =========================================================
-- Weekly Board 테이블 정의 (PostgreSQL)
-- 애플리케이션 시작 시 자동 실행된다. (application.yml: spring.sql.init.mode=always)
-- IF NOT EXISTS 를 사용하므로 여러 번 실행해도 기존 데이터는 그대로 남는다.
-- =========================================================

-- 업무 카드
CREATE TABLE IF NOT EXISTS task (
    id          BIGSERIAL    PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    assignee    VARCHAR(50),
    description TEXT,
    -- 예정(TODO) / 진행 중(IN_PROGRESS) / 완료(DONE)
    status      VARCHAR(20)  NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    -- 같은 상태(칼럼) 안에서의 표시 순서, 0부터 시작
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 칼럼별 정렬 조회 / 순서 재배치 쿼리용 인덱스
CREATE INDEX IF NOT EXISTS idx_task_status_order ON task (status, sort_order);

-- 주간보고 (주의 시작일=월요일 1개당 1건)
CREATE TABLE IF NOT EXISTS weekly_report (
    id         BIGSERIAL   PRIMARY KEY,
    week_start DATE        NOT NULL UNIQUE,
    -- Tiptap 에디터가 만든 HTML
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
