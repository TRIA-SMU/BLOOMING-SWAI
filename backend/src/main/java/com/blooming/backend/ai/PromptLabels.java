package com.blooming.backend.ai;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

/** 프롬프트에 넣을 한글 이름과 AI가 고를 수 있는 요인 태그 목록 */
public final class PromptLabels {

    /**
     * AI가 고를 수 있는 요인 태그: 한글 이름 → 게시글에 저장하는 FactorTag (민성 post/FactorTag와 맞춤)
     * 팀에서 태그를 바꾸면 여기도 같이 바꾼다.
     */
    public static final Map<String, FactorTag> FACTOR_TAG_MAP = new LinkedHashMap<>();

    static {
        FACTOR_TAG_MAP.put("사용자 조사", FactorTag.USER_RESEARCH);
        FACTOR_TAG_MAP.put("역할 분담", FactorTag.ROLE_DIVISION);
        FACTOR_TAG_MAP.put("일정 관리", FactorTag.SCHEDULE_MANAGEMENT);
        FACTOR_TAG_MAP.put("준비 부족", FactorTag.LACK_OF_PREP);
        FACTOR_TAG_MAP.put("기타", FactorTag.ETC);
    }

    /** 프롬프트에 넣는 한글 태그 목록 */
    public static final List<String> FACTOR_TAGS = List.copyOf(FACTOR_TAG_MAP.keySet());

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
