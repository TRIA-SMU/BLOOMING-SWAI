package com.blooming.backend.post.dto;

import java.util.List;

public record MyPageResponse(
        String nickname,
        long helpedCount,
        List<MyPostResponse> posts) {

    /** 내 글 한 건: 도움이 돼요 수 + 성장 단계 + 상태(검토 중 안내용) 포함 */
    public record MyPostResponse(
            Long id,
            com.blooming.backend.post.ResultType resultType,
            com.blooming.backend.post.ChallengeType challengeType,
            com.blooming.backend.post.Stage stage,
            String title,
            int helpfulCount,
            com.blooming.backend.post.GrowthStage growthStage,
            com.blooming.backend.post.PostStatus status,
            java.time.LocalDateTime createdAt) {

        public static MyPostResponse from(com.blooming.backend.post.Post p) {
            return new MyPostResponse(p.getId(), p.getResultType(), p.getChallengeType(), p.getStage(),
                    p.getTitle(), p.getHelpfulCount(), p.getGrowthStage(), p.getStatus(), p.getCreatedAt());
        }
    }
}