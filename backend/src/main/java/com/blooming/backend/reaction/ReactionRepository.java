package com.blooming.backend.reaction;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    Optional<Reaction> findByUserIdAndPostId(Long userId, Long postId);

    void deleteAllByPostId(Long postId);
}
