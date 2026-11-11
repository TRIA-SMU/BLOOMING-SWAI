# 마이페이지와 내 글 관리

- 최신 Figma Make ZIP의 프로필 카드, 요약 4칸, 내 경험 필터·목록·편집 버튼을 사용한다.
- 프로필 메뉴 또는 `/#mypage`에서 진입한다. 로그인 확인 후에만 `GET /api/posts/me`를 호출하며, 사용자 ID별 page key로 이전 계정 데이터를 폐기한다.
- nickname, helpedCount, posts[].helpfulCount/growthStage/status를 실제 응답으로 표시한다. helpedCount는 받은 반응 합계여서 고유 사용자 수(명)로 표시하지 않는다.
- 내 글은 최신순이며, 성공과 실패·중단을 필터링한다. HIDDEN 글도 본인 목록에서 ‘검토 중’으로 표시한다. 목록 글 클릭 시 기존 상세 모달을 연다.
- 사진·소개·저장한 글·임시저장 API가 없어 해당 편집·탭·가짜 데이터는 제공하지 않는다. 닉네임은 기존 닉네임 변경 화면으로 연결한다.
- 수정 버튼은 `GET /api/posts/{id}`로 기존 전체 내용을 가져와 WriteModal의 edit 모드에 채운다. authorId를 현재 사용자와 확인한다.
- `PUT /api/posts/{id}` 성공 후 실제 응답을 목록에 반영하고 내 글·게시판의 갱신 키를 올린다. 결과를 바꾸면 요인 태그를 다시 선택해야 한다. 서버가 반응·성장·공개/검토 상태를 유지한다.
- 수정하지 않고 닫을 때는 바로 닫힌다. 내용을 바꾸고 닫으면 미저장 내용 폐기를 확인한다. 저장 실패 시 수정 폼을 유지한다.
- 삭제 확인 창은 native dialog를 사용한다. 기본 포커스는 취소다. 저장 중 중복 요청·닫기를 막고, `DELETE /api/posts/{id}`의 204 후 목록과 요약을 갱신한다.
- 로딩·조회 실패/재시도·수정 내용 조회 실패/재시도·빈 목록·필터 0건·비로그인 상태를 제공한다. 화면 이탈 시 조회 요청을 취소한다.
- 체크리스트 관리와 AI 로드맵 바로가기를 연결한다.

## 디자인 확인

개발 서버에서 로그인 없이 확인할 수 있다. 실제 API·토큰·저장소를 사용하지 않으며 배포 빌드에서 제외한다.

- `http://localhost:5173/?preview=mypage`
- `http://localhost:5173/?preview=mypage&state=empty`
- `http://localhost:5173/?preview=mypage&state=error` (수정·삭제 오류)
- `http://localhost:5173/?preview=mypage&state=load-error` (조회 오류)

## 검증

```powershell
npm run build
npm run lint
node --experimental-strip-types --test tests/*.test.mjs
node --experimental-strip-types scripts/verify-mypage-api.mjs
```

실제 연동 검증은 localhost:8080 개발용 서버에서 검증 글을 만들고 내 글 조회·수정·결과에 따른 게시판 이동·반응 유지·검토 중 유지·타인 변경 거부를 확인한다. 마지막에 검증 글과 연결된 반응·신고만 삭제하고 다시 조회한다.
