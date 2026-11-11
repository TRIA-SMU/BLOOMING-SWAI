package com.blooming.backend.checklist;

import java.time.LocalDateTime;

import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.user.User;

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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 내 준비 체크리스트 항목. 본인만 볼 수 있다 */
@Entity
@Table(name = "checklist_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    /** 어떤 도전을 준비하는 체크리스트인지 (선택) */
    @Enumerated(EnumType.STRING)
    private ChallengeType challengeType;

    @Column(nullable = false, length = 100)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChecklistSource source;

    @Column(nullable = false)
    private boolean done = false;

    /** 로드맵 단계 시점 (예: "지원 1주 전"). 로드맵에서 담은 항목만 있다 */
    @Column(length = 30)
    private String phase;

    /** 로드맵 단계 순서 (1부터). 로드맵에서 담은 항목만 있다 */
    private Integer stepOrder;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ChecklistItem(User user, ChallengeType challengeType, String content, ChecklistSource source) {
        this.user = user;
        this.challengeType = challengeType;
        this.content = content;
        this.source = source;
    }

    public ChecklistItem(User user, ChallengeType challengeType, String content, ChecklistSource source,
            String phase, Integer stepOrder) {
        this(user, challengeType, content, source);
        this.phase = phase;
        this.stepOrder = stepOrder;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public boolean isOwnedBy(Long userId) {
        return user.getId().equals(userId);
    }

    public void changeContent(String content) {
        this.content = content;
    }

    public void changeDone(boolean done) {
        this.done = done;
    }
}
