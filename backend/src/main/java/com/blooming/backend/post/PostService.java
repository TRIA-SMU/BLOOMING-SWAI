package com.blooming.backend.post;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.blooming.backend.global.exception.ApiException;
import com.blooming.backend.post.dto.PostCreateRequest;
import com.blooming.backend.post.dto.PostResponse;
import com.blooming.backend.post.dto.PostSummaryResponse;
import com.blooming.backend.user.User;
import com.blooming.backend.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;

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
    public PostResponse get(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> ApiException.notFound("글을 찾을 수 없어요"));
        return PostResponse.from(post);
    }

    @Transactional(readOnly = true)
    public Page<PostSummaryResponse> list(ResultType resultType, ChallengeType challengeType,
                                          String keyword, String sort, int page, int size) {
        Sort order = "helpful".equals(sort)
                ? Sort.by(Sort.Direction.DESC, "helpfulCount").and(Sort.by(Sort.Direction.DESC, "createdAt"))
                : Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), order);
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();

        return postRepository.search(PostStatus.PUBLIC, resultType, challengeType, kw, pageable)
                .map(PostSummaryResponse::from);
    }
}