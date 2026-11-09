package com.blooming.backend.ai;

import java.util.List;

import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

/** 프롬프트에 넣을 한글 이름과 AI가 고를 수 있는 요인 태그 목록 */
public final class PromptLabels {

    /** AI는 이 목록 안에서만 태그를 고른다 (팀에서 태그 바꾸면 여기도 같이) */
    public static final List<String> FACTOR_TAGS = List.of("사용자 조사", "역할 분담", "일정 관리", "준비 부족", "기타");

    private PromptLabels() {
    }

    /** AI 답에서 꺼낸 글자 정리: 앞뒤 공백, 남아 있는 따옴표(\" 포함), 줄바꿈 제거 */
    public static String clean(Object value) {
        if (value == null) {
            return "";
        }
        String s = value.toString().replace("\\\"", "\"").replace("\n", " ").trim();
        while (s.length() >= 1 && (s.startsWith("\"") || s.startsWith("'"))) {
            s = s.substring(1).trim();
        }
        while (s.length() >= 1 && (s.endsWith("\"") || s.endsWith("'"))) {
            s = s.substring(0, s.length() - 1).trim();
        }
        return s;
    }

    public static String result(ResultType type) {
        if (type == null) return "미정";
        return switch (type) {
            case SUCCESS -> "성공";
            case FAILURE -> "실패";
            case STOPPED -> "중단";
        };
    }

    public static String challenge(ChallengeType type) {
        if (type == null) return "미정";
        return switch (type) {
            case CONTEST -> "공모전";
            case ACTIVITY -> "대외활동";
            case INTERN -> "인턴";
            case JOB -> "취업";
            case PROJECT -> "프로젝트";
            case ETC -> "기타";
        };
    }

    public static String stage(Stage stage) {
        if (stage == null) return "미정";
        return switch (stage) {
            case DOCUMENT -> "서류";
            case INTERVIEW -> "면접";
            case PRESENTATION -> "발표";
            case PRELIMINARY -> "예선";
            case FINAL -> "본선";
            case ETC -> "기타";
        };
    }
}
