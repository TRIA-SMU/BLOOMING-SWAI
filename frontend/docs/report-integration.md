# 신고 팝업

업데이트된 피그마 ZIP의 신고 팝업 구조·CSS를 기준으로 구현했다. 브랜치는 feat/frontend-report이며 로그인 작업을 포함한 최신 dev가 기반이다.

## 사용자 흐름

로그인한 사용자가 다른 사람의 후기 상세에서 신고를 누르면 사유 선택 팝업이 열린다. 자신의 글에는 버튼을 비활성화하고 안내한다. 기타 설명은 선택이며 최대 200자다. 다른 사유로 전환하면 설명을 API 요청에 포함하지 않는다.

POST /api/posts/{postId}/report로 영문 사유 코드(DEFAMATION, PERSONAL_INFO, SPAM, ETC)를 보낸다. 요청 중 중복 클릭과 닫기를 막는다. 성공 시 신고 팝업을 닫고 상세 화면에 안내를 표시하며 목록을 새로 조회한다. 409는 이미 신고한 상태로 안내하고 재제출을 막는다. 다른 오류는 입력을 유지하고 서버 메시지를 표시한다.

Escape·취소·닫기·배경 클릭으로 닫을 수 있다. native dialog로 키보드 포커스를 내부에 유지하고 닫은 뒤 신고 버튼으로 돌려준다. 상세 dialog 안에서 열릴 때 배경 스크롤 잠금을 중복 해제하지 않는다.

숨김 여부는 서버가 판단한다. 클라이언트에서 신고 수를 추정하지 않으며 서버 목록의 PUBLIC 필터와 상세 접근 제어를 사용한다.

## 디자인 미리보기

프론트 개발 서버를 실행하고 아래 주소를 연다. 로그인이나 실제 신고 없이 팝업만 확인할 수 있으며 배포 빌드에서는 제공하지 않는다.

- http://localhost:5173/?preview=report
- http://localhost:5173/?preview=report&state=duplicate
- http://localhost:5173/?preview=report&state=error

## 검사

`npm run build`, `npm run lint`, `node --experimental-strip-types --test tests/*.test.mjs`를 실행한다.

백엔드가 로컬 개발 모드로 실행 중이면 `node --experimental-strip-types scripts/verify-report-api.mjs`로 실제 API를 확인할 수 있다. 스크립트는 직접 만든 테스트 글만 신고하고 삭제한다. 기본 데모 사용자 1~4가 필요하다. 실제 사용자의 게시글은 건드리지 않는다.
