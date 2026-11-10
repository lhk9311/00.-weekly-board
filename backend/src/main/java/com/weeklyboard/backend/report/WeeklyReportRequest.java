package com.weeklyboard.backend.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 주간보고 저장 요청 본문 — PUT /api/reports/{weekStart}
 *
 * @param content 에디터 HTML (약 1MB 까지 허용)
 */
public record WeeklyReportRequest(
        @NotNull(message = "내용이 없습니다.")
        @Size(max = 1_000_000, message = "보고서 내용이 너무 깁니다.")
        String content
) {
}
