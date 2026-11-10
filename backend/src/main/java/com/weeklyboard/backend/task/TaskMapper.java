package com.weeklyboard.backend.task;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

/**
 * task 테이블 MyBatis 매퍼
 * 실제 SQL 은 resources/mapper/TaskMapper.xml 에 있다.
 */
@Mapper
public interface TaskMapper {

    /** 전체 업무 (칼럼 내 순서대로) */
    List<Task> findAll();

    Optional<Task> findById(Long id);

    /** 해당 칼럼의 다음 순서 번호 (맨 아래에 추가할 위치) */
    int nextPosition(TaskStatus status);

    /** 해당 칼럼의 카드 수 (excludeId 카드는 제외) */
    int countByStatus(@Param("status") TaskStatus status, @Param("excludeId") Long excludeId);

    /** 등록 — 실행 후 task.id 에 생성된 키가 채워진다 */
    void insert(Task task);

    /** 제목/담당자/설명/상태/순서 수정 */
    void update(Task task);

    void delete(Long id);

    /**
     * 카드가 빠진 자리 메우기
     * status 칼럼에서 position 보다 뒤에 있는 카드들의 순서를 1씩 당긴다.
     */
    void shiftUpAfter(@Param("status") TaskStatus status,
                      @Param("position") int position,
                      @Param("excludeId") Long excludeId);

    /**
     * 카드가 들어갈 자리 만들기
     * status 칼럼에서 position 이상인 카드들의 순서를 1씩 민다.
     */
    void shiftDownFrom(@Param("status") TaskStatus status,
                       @Param("position") int position,
                       @Param("excludeId") Long excludeId);

    /** 상태와 순서만 변경 */
    void updatePosition(@Param("id") Long id,
                        @Param("status") TaskStatus status,
                        @Param("position") int position);
}
