package com.blooming.backend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.global.exception.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없어요"));
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
}
