package com.blooming.backend.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.blooming.backend.global.exception.ApiException;
import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

import lombok.RequiredArgsConstructor;

/**
 * 글쓰기 화면의 'AI로 정리하기'.
 * 아직 저장 안 된 글 내용을 받아서 태그 후보와 정리를 '제안'만 한다. 저장은 사용자가 확정한 뒤 게시글 API로.
 * 닉네임·이메일 같은 식별 정보는 AI에 보내지 않는다.
 */
@Service
@RequiredArgsConstructor
public class AiAnalysisService {

    private final GeminiClient geminiClient;
    private final AiUsageLimiter usageLimiter;

    public record AnalyzeRequest(ResultType resultType, ChallengeType challengeType, Stage stage, String title,
            String goodPoints, String badPoints, String lessons, String nextPlan) {
    }

    /**
     * suggestedTags: 글 저장 API에 그대로 넣을 수 있는 FactorTag (예: SCHEDULE_MANAGEMENT)
     * suggestedTagLabels: 화면에 보여줄 한글 이름 (예: 일정 관리), suggestedTags와 순서가 같다
     */
    public record AnalyzeResponse(String summary, List<FactorTag> suggestedTags, List<String> suggestedTagLabels,
            List<String> keyLessons, String nextTip) {
    }

    public AnalyzeResponse analyze(Long userId, AnalyzeRequest req) {
        if (req == null || (isBlank(req.goodPoints()) && isBlank(req.badPoints()) && isBlank(req.lessons()))) {
            throw ApiException.badRequest("잘된 점, 아쉬운 점, 배운 점 중 하나는 적어 주세요");
        }
        usageLimiter.check(userId);

        String prompt = """
                너는 청년들의 도전 경험을 정리해 주는 도우미야.
                아래 경험 기록을 읽고 JSON 하나로만 답해. 다른 말은 쓰지 마.

                규칙:
                - suggestedTags: 아래 태그 목록 안에서만 1~3개 고른다. 목록에 없는 말은 절대 쓰지 않는다.
                  태그 목록: %s
                - 원인을 단정하지 말고 "~했을 수 있어요"처럼 부드럽게 쓴다.
                - summary: 이 경험을 한 문장(40자 이내)으로 요약
                - keyLessons: 다른 사람이 참고할 핵심 배움 2~3개 (각 30자 이내)
                - nextTip: 다음 도전에서 해 볼 만한 행동 한 문장

                형식: {"summary": "", "suggestedTags": [], "keyLessons": [], "nextTip": ""}

                [경험 기록]
                결과: %s / 도전 유형: %s / 진행 단계: %s
                제목: %s
                잘된 점: %s
                아쉬운 점: %s
                배운 점: %s
                다음 도전 계획: %s
                """.formatted(String.join(", ", PromptLabels.FACTOR_TAGS),
                PromptLabels.result(req.resultType()), PromptLabels.challenge(req.challengeType()),
                PromptLabels.stage(req.stage()), orEmpty(req.title()), orEmpty(req.goodPoints()),
                orEmpty(req.badPoints()), orEmpty(req.lessons()), orEmpty(req.nextPlan()));

        Map<String, Object> json = geminiClient.generateJson(prompt);

        List<String> labels = toStringList(json.get("suggestedTags"), 3).stream()
                .filter(PromptLabels.FACTOR_TAG_MAP::containsKey)
                .distinct()
                .toList();
        List<FactorTag> tags = labels.stream().map(PromptLabels.FACTOR_TAG_MAP::get).toList();

        return new AnalyzeResponse(
                str(json.get("summary")),
                tags,
                labels,
                toStringList(json.get("keyLessons"), 3),
                str(json.get("nextTip")));
    }

    static List<String> toStringList(Object value, int max) {
        List<String> result = new ArrayList<>();
        if (value instanceof List<?> list) {
            for (Object o : list) {
                String item = PromptLabels.clean(o);
                if (!item.isBlank() && result.size() < max) {
                    result.add(item);
                }
            }
        }
        return result;
    }

    static String str(Object value) {
        return PromptLabels.clean(value);
    }

    static String orEmpty(String s) {
        return s == null ? "" : s;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
