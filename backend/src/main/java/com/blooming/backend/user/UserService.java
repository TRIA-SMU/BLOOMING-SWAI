package com.blooming.backend.user;

import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.global.exception.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public record LoginResult(User user, boolean newUser) {
    }

    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없어요"));
    }

    /** 구글 로그인: 이메일로 찾고, 없으면 임시 닉네임(새싹1234)으로 새로 만든다 */
    @Transactional
    public LoginResult loginWithEmail(String email) {
        return userRepository.findByEmail(email)
                .map(user -> new LoginResult(user, false))
                .orElseGet(() -> new LoginResult(
                        userRepository.save(new User(email, randomNickname(), Role.USER)), true));
    }

    @Transactional
    public User changeNickname(Long userId, String nickname) {
        User user = getUser(userId);
        String trimmed = nickname.trim();
        if (trimmed.equals(user.getNickname())) {
            return user;
        }
        if (userRepository.existsByNickname(trimmed)) {
            throw ApiException.conflict("이미 사용 중인 닉네임이에요");
        }
        user.changeNickname(trimmed);
        return user;
    }

    private String randomNickname() {
        for (int i = 0; i < 20; i++) {
            String candidate = "새싹" + ThreadLocalRandom.current().nextInt(1000, 10000);
            if (!userRepository.existsByNickname(candidate)) {
                return candidate;
            }
        }
        return "새싹" + System.currentTimeMillis() % 1000000;
    }
}
