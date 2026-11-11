package com.blooming.backend.roadmap;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blooming.backend.post.ChallengeType;

public interface RoadmapRepository extends JpaRepository<Roadmap, Long> {

    Optional<Roadmap> findFirstByUserIdAndChallengeTypeOrderByCreatedAtDesc(Long userId, ChallengeType challengeType);
}
