package com.blooming.backend.global.exception;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/** 서비스에서 던지면 GlobalExceptionHandler가 {"message": "..."} 형태로 바꿔서 응답한다. */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
}
