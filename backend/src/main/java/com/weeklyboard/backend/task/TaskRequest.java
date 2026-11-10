package com.weeklyboard.backend.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 업무 생성/수정 요청 본문
 *
 * POST /api/tasks, PUT /api/tasks/{id} 에서 사용한다.
 * 컨트롤러의 @Valid 가 아래 제약조건을 검사하고,
 * 위반하면 GlobalExceptionHandler 가 400 응답을 돌려준다.
 */
public record TaskRequest(
        @NotBlank(message = "제목을 입력해 주세요.")
        @Size(max = 200, message = "제목은 200자 이하로 입력해 주세요.")
        String title,

        @Size(max = 50, message = "담당자는 50자 이하로 입력해 주세요.")
        String assignee,

        @Size(max = 2000, message = "설명은 2000자 이하로 입력해 주세요.")
        String description,

        @NotNull(message = "상태를 선택해 주세요.")
        TaskStatus status
) {
}
