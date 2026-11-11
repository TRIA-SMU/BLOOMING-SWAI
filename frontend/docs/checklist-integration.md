# 체크리스트 관리

- 최신 Figma Make ZIP의 유형별 카드, 진행률 막대, 2열 체크 항목 배치를 사용한다. 모바일에서는 1열로 표시한다.
- 헤더의 체크리스트, 분석 화면의 ‘체크리스트에서 관리’, `/#checklist`로 진입한다.
- 실제 로그인 상태를 확인한 뒤에만 `GET /api/checklist`를 호출한다. 사용자 ID를 페이지 key로 사용해 계정 변경 시 이전 사용자 데이터를 폐기한다.
- 현재 API에는 활동명·계획 ID가 없어 `challengeType`별로 묶는다. 유형이 null인 항목은 ‘공통 준비’로 묶는다. 유형 필터는 조회된 내 항목에 적용한다.
- `POST /api/checklist`: 직접 입력한 항목은 `source: CUSTOM`과 선택한 유형을 전송한다.
- `PATCH /api/checklist/{id}`: 완료·취소는 done만, 문장 수정은 content만 전송한다. 공백을 제거한 1~100자를 허용한다.
- `DELETE /api/checklist/{id}`: 항목 안의 삭제 확인에서 실행한다. 204 성공 후 목록에서 제거한다.
- 서버 성공 응답으로만 화면과 진행률을 갱신한다. 저장 중 중복 요청을 막고, 실패 시 입력·체크 상태를 유지한다.
- 조회 중 화면 이탈 시 요청을 취소한다. 빈 목록·유형별 0건·오류·재시도·비로그인 안내를 제공한다.
- 새로고침 시 서버에 저장된 내용을 다시 조회한다. 작성·수정 중인 미저장 문장은 새로고침/화면 이탈 시 유지되지 않는다.

## 디자인 확인

구글 로그인 설정 없이도 개발 서버에서 다음 주소로 배치·조작을 확인할 수 있다.

- `http://localhost:5173/?preview=checklist`
- `http://localhost:5173/?preview=checklist&state=empty`
- `http://localhost:5173/?preview=checklist&state=error` (저장 실패)

미리보기는 별도 메모리 데이터를 사용한다. 실제 API·토큰·브라우저 저장소를 사용하지 않으며 배포 빌드에서 제외된다.

## 검증

```powershell
npm run build
npm run lint
node --experimental-strip-types --test tests/*.test.mjs
node --experimental-strip-types scripts/verify-checklist-api.mjs
```

실제 연동 검증 스크립트는 로컬 개발용 백엔드에서 추가·조회·수정·완료/취소·소유권 제한·삭제 후 재조회를 확인한다. 생성한 검증용 항목만 정리한다.

검증 중 오래 실행된 H2 메모리 DB가 비어 `users` 테이블을 찾지 못하는 500 오류가 발생했다. 로컬 백엔드 재시작 후 검증이 통과했다. 동일 오류가 재발하면 프론트 요청 형식과 별개로 DB 수명 설정을 백엔드 담당자와 확인한다.
