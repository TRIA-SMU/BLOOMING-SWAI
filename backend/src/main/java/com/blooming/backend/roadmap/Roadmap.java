package com.blooming.backend.roadmap;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

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

/** AI 로드맵. 본인만 볼 수 있다. 항목은 줄바꿈(\n)으로 이어서 저장 */
@Entity
@Table(name = "roadmaps")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Roadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeType challengeType;

    /** 유지할 행동 */
    @Column(columnDefinition = "TEXT")
    private String keepItems;

    /** 개선할 행동 */
    @Column(columnDefinition = "TEXT")
    private String improveItems;

    /** 새로 시도할 행동 */
    @Column(columnDefinition = "TEXT")
    private String tryItems;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Roadmap(User user, ChallengeType challengeType, List<String> keep, List<String> improve, List<String> tryNew) {
        this.user = user;
        this.challengeType = challengeType;
        this.keepItems = String.join("\n", keep);
        this.improveItems = String.join("\n", improve);
        this.tryItems = String.join("\n", tryNew);
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public List<String> keepList() {
        return split(keepItems);
    }

    public List<String> improveList() {
        return split(improveItems);
    }

    public List<String> tryList() {
        return split(tryItems);
    }

    private static List<String> split(String s) {
        if (s == null || s.isBlank()) {
            return List.of();
        }
        return Arrays.stream(s.split("\n")).filter(x -> !x.isBlank()).toList();
    }
}
