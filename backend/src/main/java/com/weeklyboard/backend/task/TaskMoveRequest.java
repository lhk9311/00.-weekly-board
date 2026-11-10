package com.weeklyboard.backend.task;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 업무 이동 요청 본문 — PATCH /api/tasks/{id}/move
 *
 * 드래그 앤 드롭이 끝난 뒤 "어느 칼럼(status)의 몇 번째(position)"에 놓였는지를 전달한다.
 *
 * @param status   이동할 칼럼
 * @param position 이동할 칼럼 안에서의 위치 (0 = 맨 위)
 */
public record TaskMoveRequest(
        @NotNull(message = "상태를 지정해 주세요.")
        TaskStatus status,

        @Min(value = 0, message = "위치는 0 이상이어야 합니다.")
        int position
) {
}
