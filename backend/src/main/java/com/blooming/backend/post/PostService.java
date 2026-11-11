package com.blooming.backend.post;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

import com.blooming.backend.global.exception.ApiException;
import com.blooming.backend.post.dto.PostCreateRequest;
import com.blooming.backend.post.dto.PostResponse;
import com.blooming.backend.post.dto.PostSummaryResponse;
import com.blooming.backend.user.User;
import com.blooming.backend.user.UserRepository;
import com.blooming.backend.reaction.ReactionRepository;
import com.blooming.backend.report.ReportRepository;
import com.blooming.backend.post.dto.MyPageResponse;
import com.blooming.backend.post.dto.AnalysisResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final ReportRepository reportRepository;

    @Transactional
    public PostResponse create(Long userId, PostCreateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없어요"));

        Post post = Post.builder()
                .author(user)
                .resultType(req.resultType())
                .challengeType(req.challengeType())
                .stage(req.stage())
                .title(req.title())
                .goodPoints(req.goodPoints())
                .badPoints(req.badPoints())
                .lessons(req.lessons())
                .nextPlan(req.nextPlan())
                .factorTags(req.factorTags())
                .build();

        return PostResponse.from(postRepository.save(post));
    }

    @Transactional(readOnly = true)
    public PostResponse get(Long userId, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> ApiException.notFound("글을 찾을 수 없어요"));
        if (post.getStatus() == PostStatus.HIDDEN && !post.isWrittenBy(userId)) {
            throw ApiException.notFound("글을 찾을 수 없어요");
        }
        return PostResponse.from(post);
    }

    @Transactional(readOnly = true)
    public Page<PostSummaryResponse> list(ResultType resultType, ChallengeType challengeType,
                                          String keyword, String sort, int page, int size) {
        Sort order = "helpful".equals(sort)
                ? Sort.by(Sort.Direction.DESC, "helpfulCount").and(Sort.by(Sort.Direction.DESC, "createdAt"))
                : Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), order);
        String kw = (keyword == null || keyword.isBlank()) ? "" : keyword.trim();

        return postRepository.search(PostStatus.PUBLIC, resultType, challengeType, kw, pageable)
                .map(PostSummaryResponse::from);
    }

    @Transactional
    public PostResponse update(Long userId, Long postId, PostCreateRequest req) {
        Post post = getOwnPost(userId, postId);
        post.update(req.resultType(), req.challengeType(), req.stage(), req.title(),
                req.goodPoints(), req.badPoints(), req.lessons(), req.nextPlan(), req.factorTags());
        return PostResponse.from(post);
    }

    @Transactional
    public void delete(Long userId, Long postId) {
        Post post = getOwnPost(userId, postId);
        reportRepository.deleteAllByPostId(postId);
        reactionRepository.deleteAllByPostId(postId);
        postRepository.delete(post);
    }

    private Post getOwnPost(Long userId, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> ApiException.notFound("글을 찾을 수 없어요"));
        if (!post.isWrittenBy(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "내 글만 수정·삭제할 수 있어요");
        }
        return post;
    }

    @Transactional(readOnly = true)
    public MyPageResponse myPage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없어요"));
        var posts = postRepository.findAllByAuthorIdOrderByCreatedAtDesc(userId).stream()
                .map(MyPageResponse.MyPostResponse::from)
                .toList();
        return new MyPageResponse(user.getNickname(), postRepository.sumHelpfulCountByAuthorId(userId), posts);
    }

    @Transactional(readOnly = true)
    public AnalysisResponse analyze(ChallengeType challengeType, String keyword) {
        String kw = (keyword == null || keyword.isBlank()) ? "" : keyword.trim();
        List<Post> posts = postRepository.findForAnalysis(PostStatus.PUBLIC, challengeType, kw);

        List<Post> success = posts.stream().filter(p -> p.getResultType() == ResultType.SUCCESS).toList();
        List<Post> failure = posts.stream().filter(p -> p.getResultType() != ResultType.SUCCESS).toList();

        Map<FactorTag, int[]> counts = new EnumMap<>(FactorTag.class);
        for (Post p : success) {
            for (FactorTag t : p.getFactorTags()) {
                counts.computeIfAbsent(t, k -> new int[2])[0]++;
            }
        }
        for (Post p : failure) {
            for (FactorTag t : p.getFactorTags()) {
                counts.computeIfAbsent(t, k -> new int[2])[1]++;
            }
        }

        List<AnalysisResponse.FactorStat> factors = new ArrayList<>();
        counts.forEach((tag, c) -> factors.add(new AnalysisResponse.FactorStat(
                tag, c[0], percent(c[0], success.size()), c[1], percent(c[1], failure.size()))));
        factors.sort(Comparator.comparingInt((AnalysisResponse.FactorStat f) -> f.successCount() + f.failureCount())
                .reversed());

        FactorTag top = factors.isEmpty() ? null : factors.get(0).tag();
        List<AnalysisResponse.FactorStat> top5 = factors.size() > 5 ? factors.subList(0, 5) : factors;

        List<PostSummaryResponse> related = posts.stream()
                .sorted(Comparator.comparingInt(Post::getHelpfulCount).reversed())
                .limit(3)
                .map(PostSummaryResponse::from)
                .toList();

        return new AnalysisResponse(posts.size(), success.size(), failure.size(), top, List.copyOf(top5), related);
    }

    private int percent(int part, int total) {
        return total == 0 ? 0 : Math.round(part * 100f / total);
    }
}