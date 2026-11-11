package com.blooming.backend.post.dto;

import java.util.Set;

import com.blooming.backend.post.ApplyField;
import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.PrepPeriod;
import com.blooming.backend.post.Stage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PostCreateRequest(
        @NotNull(message = "결과를 골라주세요") ResultType resultType,
        @NotNull(message = "도전 유형을 골라주세요") ChallengeType challengeType,
        @NotNull(message = "진행 단계를 골라주세요") Stage stage,
        @NotBlank(message = "제목을 입력해주세요") @Size(max = 100, message = "제목은 100자 이내예요") String title,
        @NotEmpty(message = "요인 태그를 1개 이상 골라주세요") Set<FactorTag> factorTags,
        String goodPoints,
        String badPoints,
        @NotBlank(message = "배운 점을 입력해주세요") String lessons,
        String nextPlan,
        PrepPeriod prepPeriod,
        ApplyField applyField) {
}