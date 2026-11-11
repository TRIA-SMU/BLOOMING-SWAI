package com.blooming.backend.global.config;

import java.util.List;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PostgreSQL(배포 DB) 전용.
 * Hibernate는 enum 칼럼을 처음 만들 때 "이 값들만 허용"하는 CHECK 제약을 같이 건다.
 * 그런데 ddl-auto=update는 enum에 값을 추가해도 이 제약을 고치지 않아서, 새 값(예: 새 요인 태그)을 저장하면 500이 난다.
 * 서버가 켜질 때 enum 칼럼의 CHECK 제약을 지워서 새 값도 저장되게 한다. (값 검증은 자바 enum이 한다)
 * H2(로컬)에서는 아무것도 하지 않는다.
 */
@Slf4j
@Component
@Order(0)
@RequiredArgsConstructor
public class EnumCheckConstraintCleaner implements ApplicationRunner {

    private static final List<String> TABLES = List.of(
            "post_factor_tags", "posts", "checklist_items", "roadmaps", "reports", "users");

    private final DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) {
        try {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            String product = jdbc.execute((java.sql.Connection c) -> c.getMetaData().getDatabaseProductName());
            if (product == null || !product.toLowerCase().contains("postgres")) {
                return;
            }
            for (String table : TABLES) {
                List<String> names = jdbc.queryForList("""
                        select con.conname from pg_constraint con
                        join pg_class rel on rel.oid = con.conrelid
                        where rel.relname = ? and con.contype = 'c'
                        """, String.class, table);
                for (String name : names) {
                    jdbc.execute("alter table " + table + " drop constraint if exists \"" + name.replace("\"", "") + "\"");
                    log.info("CHECK 제약 삭제: {}.{}", table, name);
                }
            }
        } catch (RuntimeException e) {
            log.warn("CHECK 제약 정리 실패 (서비스는 계속 실행): {}", e.toString());
        }
    }
}
