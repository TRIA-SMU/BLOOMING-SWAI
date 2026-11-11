package com.blooming.backend.roadmap;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.ai.AiUsageLimiter;
import com.blooming.backend.ai.GeminiClient;
import com.blooming.backend.ai.PromptLabels;
import com.blooming.backend.global.exception.ApiException;
import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.user.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoadmapService {

    /** 로드맵을 받으려면 필요한 내 기록 수 */
    public static final int MIN_POSTS = 3;
    private static final int MAX_POSTS_IN_PROMPT = 10;

    private final RoadmapRepository roadmapRepository;
    private final PostRepository postRepository;
    private final UserService userService;
    private final GeminiClient geminiClient;
    private final AiUsageLimiter usageLimiter;

    public record RoadmapRequest(ChallengeType challengeType) {
    }

    public record RoadmapResponse(Long id, ChallengeType challengeType, List<String> keep, List<String> improve,
            List<String> tryNew, List<Roadmap.Step> steps, LocalDateTime createdAt) {
        static RoadmapResponse from(Roadmap r) {
            return new RoadmapResponse(r.getId(), r.getChallengeType(), r.keepList(), r.improveList(), r.tryList(),
                    r.stepList(), r.getCreatedAt());
        }
    }

    /** 로드맵 받을 수 있는지 (화면에서 버튼 활성화용) */
    public record Availability(boolean available, long myPostCount, long needMore) {
    }

    public Availability availability(Long userId) {
        long count = postRepository.countByAuthorId(userId);
        return new Availability(count >= MIN_POSTS, count, Math.max(0, MIN_POSTS - count));
    }

    public RoadmapResponse latest(Long userId, ChallengeType challengeType) {
        return roadmapRepository.findFirstByUserIdAndChallengeTypeOrderByCreatedAtDesc(userId, challengeType)
                .map(RoadmapResponse::from)
                .orElseThrow(() -> ApiException.notFound("아직 만든 로드맵이 없어요"));
    }

    @Transactional
    public RoadmapResponse create(Long userId, RoadmapRequest request) {
        if (request == null || request.challengeType() == null) {
            throw ApiException.badRequest("준비할 도전 유형을 골라 주세요");
        }
        List<Post> myPosts = postRepository.findAllByAuthorIdOrderByCreatedAtDesc(userId);
        if (myPosts.size() < MIN_POSTS) {
            throw ApiException.badRequest("로드맵은 기록이 " + MIN_POSTS + "개 이상일 때 만들 수 있어요. "
                    + (MIN_POSTS - myPosts.size()) + "개 더 기록해 주세요");
        }
        usageLimiter.check(userId);

        // 고른 도전 유형의 기록을 먼저 보여 준다 (다른 유형 기록은 참고용)
        String records = myPosts.stream()
                .sorted(Comparator.comparing((Post p) -> p.getChallengeType() != request.challengeType()))
                .limit(MAX_POSTS_IN_PROMPT)
                .map(p -> "- [%s / %s / %s] %s | 잘된 점: %s | 아쉬운 점: %s | 배운 점: %s".formatted(
                        PromptLabels.result(p.getResultType()), PromptLabels.challenge(p.getChallengeType()),
                        PromptLabels.stage(p.getStage()), p.getTitle(), nz(p.getGoodPoints()),
                        nz(p.getBadPoints()), nz(p.getLessons())))
                .collect(Collectors.joining("\n"));

        String prompt = """
                너는 청년의 다음 도전을 돕는 코치야.
                아래는 한 사람이 남긴 과거 도전 기록들이야. 이 사람이 다음에 '%s'에 도전하려고 해.
                기록에서 드러난 패턴을 바탕으로 로드맵을 JSON 하나로만 답해. 다른 말은 쓰지 마.

                규칙:
                - keep: 잘 해 왔으니 유지할 행동 3개
                - improve: 반복된 아쉬움을 고치기 위한 행동 3개
                - tryNew: 기록에 없던, 새로 시도해 볼 행동 3개
                - 각 항목은 체크리스트로 쓸 수 있게 "~하기"로 끝나는 30자 이내 행동 문장
                - steps: 위 행동들을 '%s' 준비 흐름에 맞춰 시간 순서대로 다시 배치한 6~8개 단계
                  - phase: 언제 할지 나타내는 10자 이내 시점 (예: 시작 전, 지원 2주 전, 면접 전날, 끝난 후)
                  - 같은 phase에 행동이 여러 개여도 된다. 앞 단계부터 순서대로 적는다
                  - 도전 유형의 실제 진행 순서를 따른다 (예: 인턴·취업은 서류 → 면접, 공모전은 기획 → 제작 → 발표)
                  - action: "~하기"로 끝나는 30자 이내 행동 문장
                - 고른 도전 유형과 맞지 않는 표현(예: 인턴인데 팀 발표 준비)은 그 유형에 맞게 바꿔 쓴다
                - 기록에 없는 사실을 지어내지 않는다

                형식: {"keep": [], "improve": [], "tryNew": [], "steps": [{"phase": "", "action": ""}]}

                [과거 기록]
                %s
                """.formatted(PromptLabels.challenge(request.challengeType()),
                PromptLabels.challenge(request.challengeType()), records);

        Map<String, Object> json = geminiClient.generateJson(prompt);

        Roadmap roadmap = new Roadmap(userService.getUser(userId), request.challengeType(),
                toList(json.get("keep")), toList(json.get("improve")), toList(json.get("tryNew")),
                toSteps(json.get("steps")));
        return RoadmapResponse.from(roadmapRepository.save(roadmap));
    }

    private static List<String> toList(Object value) {
        return value instanceof List<?> list
                ? list.stream().map(PromptLabels::clean).filter(item -> !item.isBlank()).limit(3).toList()
                : List.of();
    }

    private static List<Roadmap.Step> toSteps(Object value) {
        List<Roadmap.Step> steps = new ArrayList<>();
        if (!(value instanceof List<?> list)) {
            return steps;
        }
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> m)) {
                continue;
            }
            String phase = PromptLabels.clean(m.get("phase")).replace("\t", " ");
            String action = PromptLabels.clean(m.get("action")).replace("\t", " ");
            if (action.isBlank()) {
                continue;
            }
            if (phase.isBlank()) {
                phase = "다음 단계";
            }
            if (phase.length() > 20) {
                phase = phase.substring(0, 20);
            }
            steps.add(new Roadmap.Step(steps.size() + 1, phase, action));
            if (steps.size() >= 10) {
                break;
            }
        }
        return steps;
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }
}
