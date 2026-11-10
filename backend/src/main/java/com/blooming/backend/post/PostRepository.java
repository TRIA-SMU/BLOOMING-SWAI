package com.blooming.backend.post;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findAllByStatusOrderByCreatedAtDesc(PostStatus status);

    List<Post> findAllByAuthorIdOrderByCreatedAtDesc(Long authorId);

    long countByAuthorId(Long authorId);
    @Query("""
            select p from Post p
            where p.status = :status
              and p.resultType = :resultType
              and (:challengeType is null or p.challengeType = :challengeType)
              and (:keyword is null
                   or p.title like concat('%', :keyword, '%')
                   or p.goodPoints like concat('%', :keyword, '%')
                   or p.badPoints like concat('%', :keyword, '%')
                   or p.lessons like concat('%', :keyword, '%')
                   or p.nextPlan like concat('%', :keyword, '%'))
            """)
    Page<Post> search(@Param("status") PostStatus status,
                      @Param("resultType") ResultType resultType,
                      @Param("challengeType") ChallengeType challengeType,
                      @Param("keyword") String keyword,
                      Pageable pageable);

    List<Post> findAllByAuthorIdOrderByCreatedAtDesc(Long authorId);

    @Query("select coalesce(sum(p.helpfulCount), 0) from Post p where p.author.id = :authorId")
    long sumHelpfulCountByAuthorId(@Param("authorId") Long authorId);
}
