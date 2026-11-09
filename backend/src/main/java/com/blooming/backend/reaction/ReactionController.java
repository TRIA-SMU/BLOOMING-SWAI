package com.blooming.backend.reaction;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.blooming.backend.global.auth.LoginUser;
import com.blooming.backend.reaction.ReactionService.HelpfulResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/posts/{postId}/helpful")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    /** 내가 눌렀는지 + 현재 수 + 성장 단계 */
    @GetMapping
    public HelpfulResponse status(@LoginUser Long userId, @PathVariable Long postId) {
        return reactionService.getStatus(userId, postId);
    }

    /** 도움이 돼요 누르기 */
    @PostMapping
    public HelpfulResponse add(@LoginUser Long userId, @PathVariable Long postId) {
        return reactionService.add(userId, postId);
    }

    /** 도움이 돼요 취소 */
    @DeleteMapping
    public HelpfulResponse cancel(@LoginUser Long userId, @PathVariable Long postId) {
        return reactionService.cancel(userId, postId);
    }
}
