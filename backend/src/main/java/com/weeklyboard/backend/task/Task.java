package com.weeklyboard.backend.task;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * 업무 카드 도메인 객체 (task 테이블 1행)
 *
 * MyBatis 가 조회 결과를 이 객체에 담고,
 * 컨트롤러가 그대로 JSON 으로 응답한다.
 *
 * 주의: DB 컬럼명은 sort_order 이지만 SQL 에서 "AS position" 으로 별칭을 주어
 *       프론트엔드와 같은 이름(position)으로 맞춘다.
 */
@Getter
@Setter
@NoArgsConstructor
public class Task {

    private Long id;
    private String title;
    private String assignee;
    private String description;
    private TaskStatus status;

    /** 같은 칼럼 안에서의 순서 (0부터) */
    private int position;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
