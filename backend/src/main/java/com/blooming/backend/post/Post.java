package com.blooming.backend.post;

import java.time.LocalDateTime;

import com.blooming.backend.user.User;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 게시글 (담당: 민성)
 * 연수가 도움이 돼요/신고를 붙이려고 기본 틀만 먼저 만들었음. 필드는 자유롭게 추가·수정해도 되고,
 * helpfulCount, reportCount, status 세 칸과 그 메서드만 이름을 유지해 주세요.
 * 요인 태그(PostTag)는 아직 없음.
 */
@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResultType resultType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeType challengeType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Stage stage;

    @Column(nullable = false, length = 100)
    private String title;

    /** 잘된 점 */
    @Column(columnDefinition = "TEXT")
    private String goodPoints;

    /** 아쉬운 점 */
    @Column(columnDefinition = "TEXT")
    private String badPoints;

    /** 배운 점 */
    @Column(columnDefinition = "TEXT")
    private String lessons;

    /** 다음 도전에서 유지하거나 개선할 점 */
    @Column(columnDefinition = "TEXT")
    private String nextPlan;

    @ElementCollection
    @CollectionTable(name = "post_factor_tags", joinColumns = @JoinColumn(name = "post_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "tag")
    private Set<FactorTag> factorTags = new HashSet<>();

    // ===== 연수(도움이 돼요/신고)와 같이 쓰는 칸 =====
    @Column(nullable = false)
    private int helpfulCount = 0;

    @Column(nullable = false)
    private int reportCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status = PostStatus.PUBLIC;
    // ===========================================

    /** 준비 기간 (선택) */
    @Enumerated(EnumType.STRING)
    private PrepPeriod prepPeriod;

    /** 지원 분야 (선택) */
    @Enumerated(EnumType.STRING)
    private ApplyField applyField;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Builder
    public Post(User author, ResultType resultType, ChallengeType challengeType, Stage stage, String title,
                String goodPoints, String badPoints, String lessons, String nextPlan, Set<FactorTag> factorTags) {
        this.author = author;
        this.resultType = resultType;
        this.challengeType = challengeType;
        this.stage = stage;
        this.title = title;
        this.goodPoints = goodPoints;
        this.badPoints = badPoints;
        this.lessons = lessons;
        this.nextPlan = nextPlan;
        if (factorTags != null) {
            this.factorTags = new HashSet<>(factorTags);
        }
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /** 준비 기간·지원 분야 저장 (둘 다 선택 항목이라 null 가능) */
    public void changeDetails(PrepPeriod prepPeriod, ApplyField applyField) {
        this.prepPeriod = prepPeriod;
        this.applyField = applyField;
    }

    public boolean isWrittenBy(Long userId) {
        return author.getId().equals(userId);
    }

    public GrowthStage getGrowthStage() {
        return GrowthStage.from(helpfulCount);
    }

    public void increaseHelpful() {
        this.helpfulCount++;
    }

    public void decreaseHelpful() {
        if (this.helpfulCount > 0) {
            this.helpfulCount--;
        }
    }

    /** 신고 1건 추가. 기준 개수 이상이면 숨김 처리 */
    public void addReport(int hideThreshold) {
        this.reportCount++;
        if (this.reportCount >= hideThreshold) {
            this.status = PostStatus.HIDDEN;
        }
    }

    public void restore() {
        this.status = PostStatus.PUBLIC;
        this.reportCount = 0;
    }

    /** 글 수정. 결과를 바꾸면 게시판이 바뀐다. 요인 태그는 결과와 상관없이 20개 중에서 다시 받는다 */
    public void update(ResultType resultType, ChallengeType challengeType, Stage stage, String title,
                       String goodPoints, String badPoints, String lessons, String nextPlan, Set<FactorTag> factorTags) {
        this.resultType = resultType;
        this.challengeType = challengeType;
        this.stage = stage;
        this.title = title;
        this.goodPoints = goodPoints;
        this.badPoints = badPoints;
        this.lessons = lessons;
        this.nextPlan = nextPlan;
        this.factorTags.clear();
        if (factorTags != null) {
            this.factorTags.addAll(factorTags);
        }
    }
}
