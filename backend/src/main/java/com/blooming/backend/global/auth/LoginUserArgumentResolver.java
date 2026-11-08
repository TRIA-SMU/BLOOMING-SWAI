package com.blooming.backend.global.auth;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.blooming.backend.global.exception.ApiException;

/**
 * [임시] 가짜 로그인.
 * 요청 헤더 X-User-Id 값을 로그인한 사용자 id로 쓴다. 헤더가 없으면 1번 데모 사용자.
 * 구글 로그인 + JWT를 붙이면 이 클래스 안쪽만 바뀌고, 컨트롤러 코드(@LoginUser)는 그대로 쓴다.
 */
@Component
public class LoginUserArgumentResolver implements HandlerMethodArgumentResolver {

    private static final String HEADER = "X-User-Id";
    private static final Long DEFAULT_USER_ID = 1L;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(LoginUser.class)
                && Long.class.equals(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        String value = webRequest.getHeader(HEADER);
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
