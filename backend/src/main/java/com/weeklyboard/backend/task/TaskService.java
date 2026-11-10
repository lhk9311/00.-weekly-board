package com.weeklyboard.backend.task;

import com.weeklyboard.backend.common.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 업무 비즈니스 로직
 *
 * 핵심은 "칼럼 안 순서(position) 관리"다.
 * 한 칼럼의 카드 순서는 항상 0, 1, 2 ... 로 빈틈없이 유지한다.
 *
 *   이동 예) 예정 칼럼 1번 카드를 진행 중 칼럼 0번 자리로
 *     1. 예정 칼럼에서 1번 뒤의 카드들을 한 칸씩 당김   (2→1, 3→2 ...)
 *     2. 진행 중 칼럼에서 0번부터 카드들을 한 칸씩 밈   (0→1, 1→2 ...)
 *     3. 옮긴 카드를 (진행 중, 0) 으로 변경
 *
 * 여러 UPDATE 가 하나라도 실패하면 순서가 꼬이므로 @Transactional 로 묶는다.
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskMapper taskMapper;

    @Transactional(readOnly = true)
    public List<Task> findAll() {
        return taskMapper.findAll();
    }

    /** 등록: 해당 칼럼의 맨 아래에 추가 */
    @Transactional
    public Task create(TaskRequest request) {
        Task task = new Task();
        apply(task, request);
        task.setStatus(request.status());
        task.setPosition(taskMapper.nextPosition(request.status()));
        taskMapper.insert(task);
        return getOrThrow(task.getId()); // created_at 등 DB 기본값까지 채워서 반환
    }

    /**
     * 수정
     * 상태가 바뀐 경우: 원래 칼럼의 빈자리를 메우고, 새 칼럼의 맨 아래로 보낸다.
     */
    @Transactional
    public Task update(Long id, TaskRequest request) {
        Task task = getOrThrow(id);
        apply(task, request);

        if (task.getStatus() != request.status()) {
            taskMapper.shiftUpAfter(task.getStatus(), task.getPosition(), id);
            task.setPosition(taskMapper.nextPosition(request.status()));
            task.setStatus(request.status());
        }

        taskMapper.update(task);
        return getOrThrow(id);
    }

    /** 이동 (드래그 앤 드롭) */
    @Transactional
    public Task move(Long id, TaskMoveRequest request) {
        Task task = getOrThrow(id);

        // 1. 원래 칼럼에서 빠진 자리 메우기
        taskMapper.shiftUpAfter(task.getStatus(), task.getPosition(), id);

        // 2. 목표 위치 보정: 칼럼 카드 수보다 큰 값이 오면 맨 끝으로
        int count = taskMapper.countByStatus(request.status(), id);
        int position = Math.min(request.position(), count);

        // 3. 새 칼럼에 들어갈 자리 만들고 이동
        taskMapper.shiftDownFrom(request.status(), position, id);
        taskMapper.updatePosition(id, request.status(), position);

        return getOrThrow(id);
    }

    /** 삭제 후 같은 칼럼의 뒤쪽 카드 순서 당기기 */
    @Transactional
    public void delete(Long id) {
        Task task = getOrThrow(id);
        taskMapper.delete(id);
        taskMapper.shiftUpAfter(task.getStatus(), task.getPosition(), id);
    }

    private Task getOrThrow(Long id) {
        return taskMapper.findById(id)
                .orElseThrow(() -> new NotFoundException("업무를 찾을 수 없습니다. (id=" + id + ")"));
    }

    /** 요청 값 → 도메인 (빈 문자열은 null 로 정리) */
    private void apply(Task task, TaskRequest request) {
        task.setTitle(request.title().trim());
        task.setAssignee(blankToNull(request.assignee()));
        task.setDescription(blankToNull(request.description()));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
