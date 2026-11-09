package com.blooming.backend.roadmap;

import java.time.LocalDateTime;
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
            List<String> tryNew, LocalDateTime createdAt) {
        static RoadmapResponse from(Roadmap r) {
            return new RoadmapResponse(r.getId(), r.getChallengeType(), r.keepList(), r.improveList(), r.tryList(),
                    r.getCreatedAt());
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

        String records = myPosts.stream()
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
                - 기록에 없는 사실을 지어내지 않는다

                형식: {"keep": [], "improve": [], "tryNew": []}

                [과거 기록]
                %s
                """.formatted(PromptLabels.challenge(request.challengeType()), records);

        Map<String, Object> json = geminiClient.generateJson(prompt);

        Roadmap roadmap = new Roadmap(userService.getUser(userId), request.challengeType(),
                toList(json.get("keep")), toList(json.get("improve")), toList(json.get("tryNew")));
        return RoadmapResponse.from(roadmapRepository.save(roadmap));
    }

    private static List<String> toList(Object value) {
        return value instanceof List<?> list
                ? list.stream().map(PromptLabels::clean).filter(item -> !item.isBlank()).limit(3).toList()
                : List.of();
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }
}
