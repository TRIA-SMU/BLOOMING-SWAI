package com.blooming.backend.global.auth;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.blooming.backend.user.UserService;
import com.blooming.backend.user.UserService.LoginResult;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

/**
 * 구글 로그인 성공 → 이메일로 회원 조회/생성 → JWT 발급 → 프론트로 이동
 * 프론트 주소: {app.frontend-url}/oauth/callback?token=...&newUser=true|false
 * newUser=true 면 프론트에서 닉네임 정하기 화면을 띄우면 된다.
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtProvider jwtProvider;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        if (email == null || email.isBlank()) {
            response.sendRedirect(frontendUrl + "/oauth/callback?error=no_email");
            return;
        }

        LoginResult result = userService.loginWithEmail(email);
        String token = jwtProvider.create(result.user().getId());

        // 로그인 과정에서만 쓴 세션은 정리 (이후는 토큰으로만 인증)
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        response.sendRedirect(frontendUrl + "/oauth/callback?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8)
                + "&newUser=" + result.newUser());
    }
}
