package com.weeklyboard.backend.report;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 주간보고 REST API
 *
 *  GET /api/reports/{weekStart}   해당 주 보고서 조회 (weekStart: YYYY-MM-DD)
 *  PUT /api/reports/{weekStart}   해당 주 보고서 저장 (없으면 생성, 있으면 덮어쓰기)
 *
 * 프론트엔드는 입력이 멈추고 1.5초 뒤 자동으로 PUT 을 호출한다.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class WeeklyReportController {

    private final WeeklyReportService weeklyReportService;

    @GetMapping("/{weekStart}")
    public WeeklyReport get(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return weeklyReportService.find(weekStart);
    }

    @PutMapping("/{weekStart}")
    public WeeklyReport save(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
                             @Valid @RequestBody WeeklyReportRequest request) {
        return weeklyReportService.save(weekStart, request.content());
    }
}
