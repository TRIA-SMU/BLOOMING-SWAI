package com.blooming.backend.checklist;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blooming.backend.post.ChallengeType;

public interface ChecklistRepository extends JpaRepository<ChecklistItem, Long> {

    List<ChecklistItem> findAllByUserIdOrderByCreatedAtAsc(Long userId);

    List<ChecklistItem> findAllByUserIdAndChallengeTypeOrderByCreatedAtAsc(Long userId, ChallengeType challengeType);
}
