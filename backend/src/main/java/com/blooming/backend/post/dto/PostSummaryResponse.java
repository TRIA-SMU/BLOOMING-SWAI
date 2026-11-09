package com.blooming.backend.post.dto;

import java.time.LocalDateTime;
import java.util.Set;

import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.GrowthStage;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

public record PostSummaryResponse(
        Long id,
        String authorNickname,
        ResultType resultType,
        ChallengeType challengeType,
        Stage stage,
        String title,
        Set<FactorTag> factorTags,
        int helpfulCount,
        GrowthStage growthStage,
        LocalDateTime createdAt) {

    public static PostSummaryResponse from(Post p) {
        return new PostSummaryResponse(
                p.getId(),
                p.getAuthor().getNickname(),
                p.getResultType(),
                p.getChallengeType(),
                p.getStage(),
                p.getTitle(),
                Set.copyOf(p.getFactorTags()),
                p.getHelpfulCount(),
                p.getGrowthStage(),
                p.getCreatedAt());
    }
}