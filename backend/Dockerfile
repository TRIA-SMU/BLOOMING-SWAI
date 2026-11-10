# ===== 1단계: 빌드 =====
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew bootJar -x test --no-daemon

# ===== 2단계: 실행 =====
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# 배포 서버에서는 prod 설정(MySQL, 개발 모드 끔)으로 켠다
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

# 배포 서비스가 PORT 환경 변수를 주면 그 포트로, 없으면 8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
