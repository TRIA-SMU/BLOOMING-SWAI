package com.blooming.backend.global.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.blooming.backend.global.exception.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * @LoginUser Long userId 에 로그인한 사용자 id를 넣어 준다.
 *
 * 1) Authorization: Bearer {토큰} 이 있으면 → 토큰에서 id
 * 2) 개발 모드(app.auth.dev-mode=true)일 때만:
 *    X-User-Id 헤더가 있으면 그 id, 아무것도 없으면 1번 데모 사용자
 * 3) 개발 모드가 꺼져 있고 토큰이 없으면 401
 */
@Component
@RequiredArgsConstructor
public class LoginUserArgumentResolver implements HandlerMethodArgumentResolver {

    private static final String DEV_HEADER = "X-User-Id";
    private static final Long DEFAULT_USER_ID = 1L;

    private final JwtProvider jwtProvider;

    @Value("${app.auth.dev-mode:true}")
    private boolean devMode;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginUser.class)
                && Long.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        String auth = webRequest.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            Long userId = jwtProvider.verify(auth.substring(7).trim());
            if (userId == null) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 만료됐어요. 다시 로그인해 주세요");
            }
            return userId;
        }

        if (!devMode) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요");
        }

        String value = webRequest.getHeader(DEV_HEADER);
        if (value == null || value.isBlank()) {
            return DEFAULT_USER_ID;
        }
        try {
            return Long.valueOf(value.trim());
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("X-User-Id 헤더는 숫자여야 해요");
        }
    }
}
