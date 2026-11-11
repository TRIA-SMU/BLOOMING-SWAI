package com.blooming.backend.reaction;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.global.exception.ApiException;
import com.blooming.backend.post.GrowthStage;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.user.User;
import com.blooming.backend.user.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final UserService userService;

    public record HelpfulResponse(Long postId, boolean helped, int helpfulCount, GrowthStage growthStage,
            String growthLabel) {
        static HelpfulResponse of(Post post, boolean helped) {
            GrowthStage stage = post.getGrowthStage();
            return new HelpfulResponse(post.getId(), helped, post.getHelpfulCount(), stage, stage.getLabel());
        }
    }

    public HelpfulResponse getStatus(Long userId, Long postId) {
        Post post = getPost(postId);
        return HelpfulResponse.of(post, reactionRepository.existsByUserIdAndPostId(userId, postId));
    }

    @Transactional
    public HelpfulResponse add(Long userId, Long postId) {
        Post post = getPost(postId);
        if (post.isWrittenBy(userId)) {
            throw ApiException.badRequest("내 글에는 도움이 돼요를 누를 수 없어요");
        }
        if (reactionRepository.existsByUserIdAndPostId(userId, postId)) {
            throw ApiException.conflict("이미 도움이 돼요를 눌렀어요");
        }
        User user = userService.getUser(userId);
        reactionRepository.save(new Reaction(user, post));
        post.increaseHelpful();
        return HelpfulResponse.of(post, true);
    }

    @Transactional
    public HelpfulResponse cancel(Long userId, Long postId) {
        Post post = getPost(postId);
        Reaction reaction = reactionRepository.findByUserIdAndPostId(userId, postId)
                .orElseThrow(() -> ApiException.notFound("누른 적이 없어요"));
        reactionRepository.delete(reaction);
        post.decreaseHelpful();
        return HelpfulResponse.of(post, false);
    }

    private Post getPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> ApiException.notFound("게시글을 찾을 수 없어요"));
    }
}
