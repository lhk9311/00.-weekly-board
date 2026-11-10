package com.weeklyboard.backend.common;

/**
 * 요청한 데이터가 없을 때 던지는 예외
 * GlobalExceptionHandler 가 받아서 404 응답으로 바꾼다.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
