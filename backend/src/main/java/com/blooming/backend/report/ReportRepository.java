package com.blooming.backend.report;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    void deleteAllByPostId(Long postId);
}
