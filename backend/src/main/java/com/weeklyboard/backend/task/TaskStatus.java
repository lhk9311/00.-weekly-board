package com.weeklyboard.backend.task;

/**
 * 업무 상태 (보드의 칼럼)
 *
 * DB task.status 컬럼에는 enum 이름(TODO 등)이 문자열로 저장된다.
 * (MyBatis 기본 EnumTypeHandler 사용)
 * 프론트엔드 types.ts 의 TaskStatus 와 값이 같아야 한다.
 */
public enum TaskStatus {
    TODO,        // 예정
    IN_PROGRESS, // 진행 중
    DONE         // 완료
}
