package com.weeklyboard.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * React와 Spring Boot 간의 통신을 테스트하는 컨트롤러
 *
 * @RestController
 * - HTTP 요청을 처리하는 Spring MVC 컨트롤러
 * - 반환한 객체를 JSON 응답으로 직렬화한다.
 */
@RestController
public class TestController {

    /**
     * GET /api/test 요청 처리
     *
     * React에서 이 API를 호출하면
     * 서버가 메시지와 상태를 JSON으로 반환한다.
     */
    @GetMapping("/api/test")
    public Map<String, String> test() {

        // Map의 키와 값이 JSON 속성으로 변환된다.
        return Map.of(
                "message", "Spring Boot 연결 성공!",
                "status", "SUCCESS"
        );
    }
}
