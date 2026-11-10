package com.weeklyboard.backend.report;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * 주간보고 (weekly_report 테이블 1행)
 *
 * weekStart(월요일 날짜)가 곧 보고서의 키다. 한 주에 1건만 존재한다.
 * 아직 작성하지 않은 주를 조회하면 content, updatedAt 이 null 인 객체를 응답한다.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReport {

    private LocalDate weekStart;

    /** Tiptap 에디터 HTML */
    private String content;

    private OffsetDateTime updatedAt;
}
