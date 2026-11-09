package com.blooming.backend.user;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.blooming.backend.global.auth.LoginUser;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    public record MeResponse(Long id, String nickname) {
        static MeResponse from(User user) {
            return new MeResponse(user.getId(), user.getNickname());
        }
    }

    public record NicknameRequest(
            @NotBlank(message = "닉네임을 입력해 주세요")
            @Size(min = 2, max = 12, message = "닉네임은 2~12자로 정해 주세요")
            String nickname) {
    }

    /** 내 정보 (닉네임만 돌려준다. 이메일은 내보내지 않음) */
    @GetMapping
    public MeResponse me(@LoginUser Long userId) {
        return MeResponse.from(userService.getUser(userId));
    }

    /** 닉네임 정하기/바꾸기 */
    @PatchMapping("/nickname")
    public MeResponse changeNickname(@LoginUser Long userId, @Valid @RequestBody NicknameRequest request) {
        return MeResponse.from(userService.changeNickname(userId, request.nickname()));
    }
}
