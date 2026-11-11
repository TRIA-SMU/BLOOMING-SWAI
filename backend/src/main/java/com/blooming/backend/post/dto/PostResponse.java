package com.blooming.backend.post.dto;

import java.time.LocalDateTime;
import java.util.Set;

import com.blooming.backend.post.ApplyField;
import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.GrowthStage;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostStatus;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.PrepPeriod;
import com.blooming.backend.post.Stage;

public record PostResponse(
        Long id,
        Long authorId,
        String authorNickname,
        ResultType resultType,
        ChallengeType challengeType,
        Stage stage,
        String title,
        Set<FactorTag> factorTags,
        String goodPoints,
        String badPoints,
        String lessons,
        String nextPlan,
        int helpfulCount,
        GrowthStage growthStage,
        PostStatus status,
        PrepPeriod prepPeriod,
        ApplyField applyField,
        LocalDateTime createdAt) {

    public static PostResponse from(Post p) {
        return new PostResponse(
                p.getId(),
                p.getAuthor().getId(),
                p.getAuthor().getNickname(),
                p.getResultType(),
                p.getChallengeType(),
                p.getStage(),
                p.getTitle(),
                Set.copyOf(p.getFactorTags()),
                p.getGoodPoints(),
                p.getBadPoints(),
                p.getLessons(),
                p.getNextPlan(),
                p.getHelpfulCount(),
                p.getGrowthStage(),
                p.getStatus(),
                p.getPrepPeriod(),
                p.getApplyField(),
                p.getCreatedAt());
    }
}