package com.weeklyboard.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * PostgreSQL 데이터베이스 연결 확인용 컨트롤러
 *
 * 역할:
 * 1. HTTP 요청을 받는다.
 * 2. Spring이 관리하는 DataSource를 이용해 DB에 접속한다.
 * 3. 실제 연결된 데이터베이스 이름을 반환한다.
 *
 * 주의: 개발환경에서만 사용하고 배포 전 삭제한다.
 */
@RestController
public class DbTestController {

    // Spring Boot가 application.yml 설정을 바탕으로 생성한
    // DB 커넥션 풀(DataSource)을 참조한다.
    private final DataSource dataSource;

    /**
     * 생성자 주입 방식
     *
     * Spring 컨테이너가 관리하는 DataSource 객체를
     * 생성자의 매개변수로 전달받는다.
     */
    public DbTestController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * GET /api/test/db 요청 처리
     *
     * @return DB 연결 성공 여부와 데이터베이스 제품명
     * @throws SQLException DB 연결에 실패한 경우 발생
     */
    @GetMapping("/api/test/db")
    public String testDb() throws SQLException {

        // 커넥션 풀에서 DB 연결을 가져온다.
        // try-with-resources를 사용하면 작업 종료 후
        // Connection이 자동 close되어 풀에 반환된다.
        try (Connection conn = dataSource.getConnection()) {

            // JDBC 메타데이터에서 DB 제품명을 가져온다.
            String dbName =
                    conn.getMetaData().getDatabaseProductName();

            // 연결에 성공하면 PostgreSQL이라는 문자열을 반환한다.
            return "DB Connected: " + dbName;
        }
    }
}
