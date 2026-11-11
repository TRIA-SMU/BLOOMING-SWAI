package com.blooming.backend.post;

import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findAllByStatusOrderByCreatedAtDesc(PostStatus status);

    List<Post> findAllByAuthorIdOrderByCreatedAtDesc(Long authorId);

    long countByAuthorId(Long authorId);

    boolean existsByTitle(String title);
    @Query("""
            select p from Post p
            where p.status = :status
              and p.resultType = :resultType
              and (:challengeType is null or p.challengeType = :challengeType)
              and (:keyword = ''
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

    @Query("select coalesce(sum(p.helpfulCount), 0) from Post p where p.author.id = :authorId")
    long sumHelpfulCountByAuthorId(@Param("authorId") Long authorId);

    /** 분석 대상 글 (공개 글만, 도전 유형 기준, 키워드는 선택) */
    @Query("""
            select distinct p from Post p
            left join fetch p.factorTags
            where p.status = :status
              and p.challengeType = :challengeType
              and (:keyword = ''
                   or p.title like concat('%', :keyword, '%')
                   or p.goodPoints like concat('%', :keyword, '%')
                   or p.badPoints like concat('%', :keyword, '%')
                   or p.lessons like concat('%', :keyword, '%')
                   or p.nextPlan like concat('%', :keyword, '%'))
            """)
    List<Post> findForAnalysis(@Param("status") PostStatus status,
                               @Param("challengeType") ChallengeType challengeType,
                               @Param("keyword") String keyword);
}
