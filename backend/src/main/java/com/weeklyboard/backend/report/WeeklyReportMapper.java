package com.weeklyboard.backend.report;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.Optional;

/**
 * weekly_report 테이블 MyBatis 매퍼
 * SQL: resources/mapper/WeeklyReportMapper.xml
 */
@Mapper
public interface WeeklyReportMapper {

    Optional<WeeklyReport> findByWeekStart(LocalDate weekStart);

    /** 없으면 INSERT, 있으면 UPDATE (PostgreSQL ON CONFLICT) */
    void upsert(@Param("weekStart") LocalDate weekStart, @Param("content") String content);
}
