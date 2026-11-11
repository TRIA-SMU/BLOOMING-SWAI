package com.blooming.backend.ai;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.blooming.backend.global.exception.ApiException;

/** 사용자별 하루 AI 호출 횟수 제한 (서버 메모리에 저장, 재시작하면 초기화) */
@Component
public class AiUsageLimiter {

    private final Map<String, Integer> usage = new ConcurrentHashMap<>();

    @Value("${gemini.daily-limit:20}")
    private int dailyLimit;

    public void check(Long userId) {
        String key = userId + ":" + LocalDate.now();
        int count = usage.merge(key, 1, Integer::sum);
        if (count > dailyLimit) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "오늘은 AI를 " + dailyLimit + "번까지 쓸 수 있어요. 내일 다시 써 주세요");
        }
    }
}
