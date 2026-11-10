package com.weeklyboard.backend.task;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 업무 보드 REST API
 *
 *  GET    /api/tasks            전체 조회
 *  POST   /api/tasks            등록
 *  PUT    /api/tasks/{id}       수정
 *  PATCH  /api/tasks/{id}/move  이동 (드래그 앤 드롭)
 *  DELETE /api/tasks/{id}       삭제
 *
 * 컨트롤러는 요청 검증(@Valid)과 응답만 담당하고, 로직은 TaskService 에 둔다.
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public List<Task> list() {
        return taskService.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@Valid @RequestBody TaskRequest request) {
        return taskService.create(request);
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return taskService.update(id, request);
    }

    @PatchMapping("/{id}/move")
    public Task move(@PathVariable Long id, @Valid @RequestBody TaskMoveRequest request) {
        return taskService.move(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taskService.delete(id);
    }
}
