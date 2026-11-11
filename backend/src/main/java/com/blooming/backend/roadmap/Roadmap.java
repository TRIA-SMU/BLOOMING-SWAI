package com.blooming.backend.roadmap;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    /** 순서대로 할 단계. 한 줄 = "시점\t행동" (예: "지원 1주 전\t이력서 검토받기") */
    @Column(columnDefinition = "TEXT")
    private String stepItems;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 로드맵 한 단계 */
    public record Step(int order, String phase, String action) {
    }

    public Roadmap(User user, ChallengeType challengeType, List<String> keep, List<String> improve, List<String> tryNew) {
        this.user = user;
        this.challengeType = challengeType;
        this.keepItems = String.join("\n", keep);
        this.improveItems = String.join("\n", improve);
        this.tryItems = String.join("\n", tryNew);
    }

    public Roadmap(User user, ChallengeType challengeType, List<String> keep, List<String> improve, List<String> tryNew,
            List<Step> steps) {
        this(user, challengeType, keep, improve, tryNew);
        this.stepItems = String.join("\n", steps.stream().map(st -> st.phase() + "\t" + st.action()).toList());
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

    /**
     * 순서대로 할 단계. 예전에 만든 로드맵(단계 없음)은 유지 → 개선 → 새로 시도 순서로 만들어 준다.
     */
    public List<Step> stepList() {
        List<Step> steps = new ArrayList<>();
        List<String> lines = split(stepItems);
        if (!lines.isEmpty()) {
            for (String line : lines) {
                int tab = line.indexOf('\t');
                String phase = tab < 0 ? "다음 단계" : line.substring(0, tab);
                String action = tab < 0 ? line : line.substring(tab + 1);
                steps.add(new Step(steps.size() + 1, phase, action));
            }
            return steps;
        }
        for (String a : keepList()) {
            steps.add(new Step(steps.size() + 1, "지금처럼 이어가기", a));
        }
        for (String a : improveList()) {
            steps.add(new Step(steps.size() + 1, "아쉬운 점 고치기", a));
        }
        for (String a : tryList()) {
            steps.add(new Step(steps.size() + 1, "새로 해 보기", a));
        }
        return steps;
    }

    private static List<String> split(String s) {
        if (s == null || s.isBlank()) {
            return List.of();
        }
        return Arrays.stream(s.split("\n")).filter(x -> !x.isBlank()).toList();
    }
}
