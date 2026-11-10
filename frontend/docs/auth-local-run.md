# VS Code에서 로그인 화면 확인

## 프론트 화면 실행

VS Code의 파일 메뉴에서 BLOOMING-SWAI 폴더를 연다. 터미널 메뉴의 새 터미널에서 다음을 실행한다.

```powershell
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 연다. localhost와 127.0.0.1은 CORS 및 토큰 저장소가 서로 다르므로 localhost로 통일한다. 헤더의 로그인 버튼을 누르면 피그마 원본의 로그인 페이지가 열린다. 로그인·회원가입 화면은 원본의 420px 카드와 문구·배치·스타일을 사용한다.

로그인 카드 하단의 닉네임 화면 미리보기 버튼으로 키 없이 디자인과 길이 검증을 확인할 수 있다. 또는 http://localhost:5173/?preview=nickname 을 연다. 닉네임은 원본에 독립 화면이 없어 같은 카드·입력 스타일을 적용했다. 미리보기는 개발 서버에서만 제공하며 실제 계정이나 로그인 상태를 바꾸지 않는다. 프론트만 실행했을 때 게시판은 백엔드 연결 오류가 보일 수 있지만 로그인 디자인은 확인할 수 있다.

5173 포트 사용 중 오류가 나면 이미 실행 중인 화면을 먼저 확인한다. 서버를 중복으로 켜지 않는다. 실행 중인 터미널에서 Ctrl+C로 종료할 수 있다.

## 백엔드 실행

터미널의 + 버튼으로 두 번째 PowerShell 터미널을 연다. 저장소 루트에서 실행한다.

```powershell
cd backend
.\gradlew.bat bootRun
```

JDK 17이 설치 또는 감지되지 않는 현재 PC에서는 작업 폴더에 받은 JDK를 명시해서 실행할 수 있다. 아래 명령은 backend 폴더 기준이다. 시스템 Java 설정은 변경하지 않는다.

```powershell
& 'C:\Users\sheve\OneDrive\문서\SWAI\blooming-tools\jdk17\jdk-17.0.21+9\bin\java.exe' -classpath gradle/wrapper/gradle-wrapper.jar org.gradle.wrapper.GradleWrapperMain bootRun
```

## 실제 구글 로그인에 필요한 백엔드 설정

`backend/src/main/resources/application-secret.properties.example`을 참고해 팀의 구글 OAuth 설정을 로컬 `application-secret.properties`에 넣는다. 실제 설정 파일은 Git 제외 대상이다. Google 클라이언트 시크릿과 JWT 서명 키는 프론트에 넣지 않는다.

- Google 승인된 리디렉션 URI: http://localhost:8080/login/oauth2/code/google
- 백엔드 app.frontend-url: http://localhost:5173
- 로그인 시작: http://localhost:8080/oauth2/authorization/google
- 프론트 콜백: http://localhost:5173/oauth/callback

기본 로컬 로그인 시작은 백엔드 8080으로 직접 이동한다. 다른 환경은 `.env.local`의 VITE_AUTH_BASE_URL과 VITE_API_BASE_URL을 설정하고 프론트 서버를 재시작한다. Google 테스트 사용자 등록 등 OAuth 프로젝트의 접근 설정은 해당 프로젝트 담당자가 확인한다.

키가 없으면 백엔드의 Google 로그인 기능이 비활성화된다. 이때 화면 미리보기는 가능하지만 실제 구글 인증은 확인할 수 없다.

## 로그인 동작

콜백에서 토큰을 저장하고 주소에서 쿼리를 제거한 뒤 /api/me로 유효성을 확인한다. 첫 가입은 닉네임 설정을 완료해야 글 작성 등을 이어갈 수 있다. 새로고침 후에도 미완료 상태가 유지된다. 닉네임 길이·중복 오류는 입력칸 아래에 표시한다.

로그아웃 및 401은 저장한 토큰과 사용자 상태를 지우고 비로그인 UI로 전환한다. 401 시 로그인 페이지를 표시한다. 토큰이 없을 때 서버 개발 모드가 반환하는 1번 사용자를 프론트 로그인으로 인정하지 않는다. 서버가 JWT 폐기 API를 제공하지 않으므로 로그아웃은 현재 브라우저의 토큰을 제거하는 방식이다.

토큰 만료로 로그인이 필요해진 경우 작성 중인 입력은 앱 메모리에 보존한다. 구글 인증은 페이지를 이동하므로 인증 이동 또는 새로고침 시 메모리의 글쓰기 입력은 초기화된다.

## 검사

```powershell
npm run build
npm run lint
node --experimental-strip-types --test tests/*.test.mjs
```

실제 구글 계정 인증은 OAuth 키가 설정된 환경에서 별도로 확인한다. 콜백 성공·실패, 닉네임 API 계약은 자동 테스트로 확인한다.
