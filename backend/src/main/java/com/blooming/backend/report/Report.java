package com.blooming.backend.report;

import java.time.LocalDateTime;

import com.blooming.backend.post.Post;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 신고 한 건. 한 사람은 글 하나에 한 번만 신고할 수 있게 (user, post) 유니크 */
@Entity
@Table(name = "reports", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "post_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason;

    /** '기타'일 때 적는 내용 (선택) */
    @Column(length = 200)
    private String detail;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public Report(User user, Post post, ReportReason reason, String detail) {
        this.user = user;
        this.post = post;
        this.reason = reason;
        this.detail = detail;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
