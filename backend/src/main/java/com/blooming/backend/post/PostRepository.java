package com.blooming.backend.post;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findAllByStatusOrderByCreatedAtDesc(PostStatus status);
}
