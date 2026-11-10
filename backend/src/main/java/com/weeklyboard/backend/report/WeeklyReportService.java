package com.weeklyboard.backend.report;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

/**
 * 주간보고 비즈니스 로직
 *
 * 어떤 날짜가 들어와도 그 주의 월요일로 맞춘 뒤 처리한다.
 * (예: 2026-11-12(목) → 2026-11-09(월))
 * 그래서 같은 주에 보고서가 2건 생기지 않는다.
 */
@Service
@RequiredArgsConstructor
public class WeeklyReportService {

    private final WeeklyReportMapper weeklyReportMapper;

    /** 조회 — 없으면 내용이 빈 보고서 객체 반환 (프론트에서 기본 양식 표시) */
    @Transactional(readOnly = true)
    public WeeklyReport find(LocalDate date) {
        LocalDate weekStart = toMonday(date);
        return weeklyReportMapper.findByWeekStart(weekStart)
                .orElseGet(() -> new WeeklyReport(weekStart, null, null));
    }

    /** 저장 (upsert) 후 저장된 결과 반환 */
    @Transactional
    public WeeklyReport save(LocalDate date, String content) {
        LocalDate weekStart = toMonday(date);
        weeklyReportMapper.upsert(weekStart, content);
        return weeklyReportMapper.findByWeekStart(weekStart).orElseThrow();
    }

    private LocalDate toMonday(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
