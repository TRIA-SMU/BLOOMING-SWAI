package com.blooming.backend.user;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.post.ApplyField;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.post.PrepPeriod;

import lombok.RequiredArgsConstructor;

/**
 * 데모 글에 준비 기간·지원 분야를 채운다 (요인 분석 필터 시연용).
 * 데모 사용자(@blooming.local)가 쓴 글 중 값이 비어 있는 글만 채우고, 실제 사용자 글은 건드리지 않는다.
 * 글 번호로 정해지는 값이라 서버를 다시 켜도 같은 값이 나온다.
 */
@Component
@Order(10)
@RequiredArgsConstructor
public class DemoDetailsBackfill implements ApplicationRunner {

    private static final PrepPeriod[] PERIODS = PrepPeriod.values();
    private static final ApplyField[] FIELDS = {
            ApplyField.PLANNING, ApplyField.DEVELOPMENT, ApplyField.DESIGN,
            ApplyField.MARKETING, ApplyField.DATA, ApplyField.ETC };

    private final PostRepository postRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (Post post : postRepository.findAll()) {
            if (post.getPrepPeriod() != null || post.getApplyField() != null) {
                continue;
            }
            String email = post.getAuthor().getEmail();
            if (email == null || !email.endsWith("@blooming.local")) {
                continue;
            }
            long id = post.getId();
            post.changeDetails(PERIODS[(int) (id % PERIODS.length)], FIELDS[(int) ((id / 2) % FIELDS.length)]);
        }
    }
}
