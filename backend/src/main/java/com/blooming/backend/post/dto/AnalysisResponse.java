package com.blooming.backend.post.dto;

import java.util.List;

import com.blooming.backend.post.FactorTag;

public record AnalysisResponse(
        int totalCount,
        int successCount,
        int failureCount,
        FactorTag topFactor,
        List<FactorStat> factors,
        List<PostSummaryResponse> relatedPosts) {

    /** 요인 하나: 성공 쪽/실패·중단 쪽 언급 건수와 비율(%) */
    public record FactorStat(
            FactorTag tag,
            int successCount,
            int successRate,
            int failureCount,
            int failureRate) {
    }
}