package com.blooming.backend.post;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.RequestParam;

import com.blooming.backend.global.auth.LoginUser;
import com.blooming.backend.post.dto.PostCreateRequest;
import com.blooming.backend.post.dto.PostResponse;
import com.blooming.backend.post.dto.PostSummaryResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@LoginUser Long userId, @Valid @RequestBody PostCreateRequest req) {
        return postService.create(userId, req);
    }

    @GetMapping("/{id}")
    public PostResponse get(@PathVariable Long id) {
        return postService.get(id);
    }

    @GetMapping
    public Page<PostSummaryResponse> list(
            @RequestParam ResultType resultType,
            @RequestParam(required = false) ChallengeType challengeType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return postService.list(resultType, challengeType, keyword, sort, page, size);
    }
}