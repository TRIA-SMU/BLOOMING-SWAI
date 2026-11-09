package com.blooming.backend.global.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.blooming.backend.ai.SimpleJson;

import lombok.extern.slf4j.Slf4j;

/**
 * 로그인 토큰(JWT, HS256) 만들기/검사하기. 토큰에는 사용자 id와 만료 시간만 들어간다(이메일 X).
 * 비밀키는 application-secret.properties 의 app.jwt.secret (32자 이상). 없으면 서버가 켜질 때마다 임시로 만든다.
 */
@Slf4j
@Component
public class JwtProvider {

    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();
    private static final String HEADER = ENC.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final byte[] key;
    private final long expireSeconds;

    public JwtProvider(@Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expire-hours:24}") long expireHours) {
        if (secret == null || secret.length() < 32) {
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            this.key = random;
            log.warn("app.jwt.secret is missing or shorter than 32 chars. Using a temporary key (tokens reset on restart).");
        } else {
            this.key = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.expireSeconds = expireHours * 3600;
    }

    public String create(Long userId) {
        long exp = Instant.now().getEpochSecond() + expireSeconds;
        String payload = ENC.encodeToString(("{\"sub\":\"" + userId + "\",\"exp\":" + exp + "}")
                .getBytes(StandardCharsets.UTF_8));
        String unsigned = HEADER + "." + payload;
        return unsigned + "." + sign(unsigned);
    }

    /** 올바른 토큰이면 사용자 id, 아니면 null */
    public Long verify(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            String expected = sign(parts[0] + "." + parts[1]);
            if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8))) {
                return null;
            }
            Map<String, Object> claims = SimpleJson.parseMap(new String(DEC.decode(parts[1]), StandardCharsets.UTF_8));
            long exp = ((Number) claims.get("exp")).longValue();
            if (Instant.now().getEpochSecond() > exp) {
                return null;
            }
            return Long.valueOf(claims.get("sub").toString());
        } catch (RuntimeException e) {
            return null;
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return ENC.encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("JWT 서명 실패", e);
        }
    }
}
