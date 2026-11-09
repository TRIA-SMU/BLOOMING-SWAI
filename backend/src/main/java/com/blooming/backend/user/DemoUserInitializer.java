package com.blooming.backend.user;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

/**
 * 구글 로그인 붙이기 전까지 쓸 데모 사용자.
 * 서버가 켜질 때 사용자가 한 명도 없으면 1번(새벽코딩), 2번(도토리)을 만든다.
 * 도움이 돼요는 본인 글에 못 누르니까 테스트용으로 2명을 둔다.
 */
@Component
@RequiredArgsConstructor
public class DemoUserInitializer implements ApplicationRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        userRepository.save(new User("demo1@blooming.local", "새벽코딩", Role.USER));
        userRepository.save(new User("demo2@blooming.local", "도토리", Role.USER));
    }
}
