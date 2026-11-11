package com.blooming.backend.ai;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.blooming.backend.global.exception.ApiException;

import lombok.extern.slf4j.Slf4j;

/**
 * Gemini API 호출. 프롬프트를 보내고 JSON 응답을 Map으로 돌려준다.
 * API 키는 서버에만 있고 프론트로 절대 내보내지 않는다.
 *
 * - 연결 5초, 응답 40초가 넘으면 포기한다 (무한 대기 방지)
 * - Gemini가 바쁘다고(429, 5xx) 하면 2초 뒤 한 번 더 시도한다
 * - 생각 시간을 줄이는 설정(thinkingLevel=low)을 먼저 쓰고, 모델이 그 설정을 거부하면 빼고 다시 보낸다
 */
@Slf4j
@Component
public class GeminiClient {

    private static final String FAIL_MESSAGE = "AI 분석이 잠시 안 돼요. 잠시 후 다시 시도하거나 직접 입력해 주세요";

    private final RestClient restClient;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash-lite}")
    private String model;

    public GeminiClient() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(40));
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(factory)
                .build();
    }

    public Map<String, Object> generateJson(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI 키가 설정되지 않았어요 (application-secret.properties 확인)");
        }

        long start = System.currentTimeMillis();
        String raw = callWithRetry(prompt);
        log.info("Gemini OK ({}ms)", System.currentTimeMillis() - start);

        try {
            String text = extractText(raw);
            return SimpleJson.parseMap(stripCodeFence(text));
        } catch (RuntimeException e) {
            log.warn("Gemini PARSE FAIL: {} / raw: {}", e.toString(), shorten(raw));
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, FAIL_MESSAGE);
        }
    }

    private String callWithRetry(String prompt) {
        boolean useThinkingLow = true;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                return call(prompt, useThinkingLow);
            } catch (RestClientResponseException e) {
                int status = e.getStatusCode().value();
                log.warn("Gemini CALL FAIL (try {}): {} {}", attempt, status, shorten(e.getResponseBodyAsString()));
                if (status == 400 && useThinkingLow) {
                    // 모델이 thinkingLevel 설정을 모르면 빼고 다시
                    useThinkingLow = false;
                    continue;
                }
                if ((status == 429 || status >= 500) && attempt < 3) {
                    sleep(2000);
                    continue;
                }
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, FAIL_MESSAGE);
            } catch (RestClientException e) {
                // 시간 초과, 네트워크 끊김 등
                log.warn("Gemini CALL FAIL (try {}): {} / cause: {}", attempt, e.getMessage(),
                        e.getMostSpecificCause().toString());
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, FAIL_MESSAGE);
            }
        }
        throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, FAIL_MESSAGE);
    }

    private String call(String prompt, boolean useThinkingLow) {
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("temperature", 0.3);
        if (useThinkingLow) {
            generationConfig.put("thinkingConfig", Map.of("thinkingLevel", "low"));
        }

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", generationConfig);

        return restClient.post()
                .uri("/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);
    }

    /** candidates[0].content.parts 중 text가 있는 마지막 조각 꺼내기 */
    @SuppressWarnings("unchecked")
    private String extractText(String raw) {
        Map<String, Object> root = SimpleJson.parseMap(raw);
        List<Object> candidates = (List<Object>) root.get("candidates");
        Map<String, Object> content = (Map<String, Object>) ((Map<String, Object>) candidates.get(0)).get("content");
        List<Object> parts = (List<Object>) content.get("parts");
        String text = null;
        for (Object part : parts) {
            Object t = ((Map<String, Object>) part).get("text");
            if (t != null) {
                text = t.toString();
            }
        }
        if (text == null) {
            throw new IllegalStateException("text 없음");
        }
        return text;
    }

    private String stripCodeFence(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            t = t.replaceFirst("^```(json)?", "");
            int end = t.lastIndexOf("```");
            if (end >= 0) {
                t = t.substring(0, end);
            }
        }
        return t.trim();
    }

    private static String shorten(String s) {
        if (s == null) {
            return "";
        }
        String oneLine = s.replace("\n", " ");
        return oneLine.length() > 300 ? oneLine.substring(0, 300) + "..." : oneLine;
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
