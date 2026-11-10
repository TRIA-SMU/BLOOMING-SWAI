import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDemoExperience, emptyDraft, validateDraft } from '../src/utils/experienceDraft.ts'

const validDraft = () => ({
  ...emptyDraft(), title: '  첫 공모전에서 배운 것  ', resultType: 'FAILURE', challengeType: 'CONTEST',
  stage: 'FINAL', factorTags: ['USER_RESEARCH', 'ROLE_DIVISION'], lessons: '  인터뷰를 먼저 하자.  ',
})

test('빈 입력은 제목, 분류, 단계, 태그, 배운 점을 보완하도록 안내한다', () => {
  assert.deepEqual(Object.keys(validateDraft(emptyDraft())), ['title', 'resultType', 'challengeType', 'stage', 'factorTags', 'lessons'])
})

test('공백만 있는 제목과 배운 점은 등록할 수 없다', () => {
  assert.ok(validateDraft({ ...validDraft(), title: '  ' }).title)
  assert.ok(validateDraft({ ...validDraft(), lessons: '\n\t' }).lessons)
})

test('제목은 100자까지 허용하고 초과하면 거부한다', () => {
  assert.deepEqual(validateDraft({ ...validDraft(), title: '가'.repeat(100) }), {})
  assert.ok(validateDraft({ ...validDraft(), title: '가'.repeat(101) }).title)
})

test('잘된 점, 아쉬운 점, 다음 도전은 비워도 등록할 수 있다', () => {
  assert.deepEqual(validateDraft(validDraft()), {})
})

test('등록한 실패 경험이 한글 분류, 씨앗 단계, 선택한 태그와 함께 목록용 데이터가 된다', () => {
  const post = createDemoExperience(validDraft(), 5, new Date(2026, 10, 11))
  assert.equal(post.id, 5)
  assert.equal(post.title, '첫 공모전에서 배운 것')
  assert.equal(post.result, '실패')
  assert.equal(post.type, '공모전')
  assert.equal(post.stage, '본선')
  assert.deepEqual(post.tags, ['사용자 조사', '역할 분담'])
  assert.equal(post.growth, '씨앗')
  assert.equal(post.helpful, 0)
  assert.equal(post.content.learned, '인터뷰를 먼저 하자.')
  assert.equal(post.date, '2026. 11. 11.')
})

test('필수 정보가 없는 글은 목록에 생성하지 않는다', () => {
  assert.throws(() => createDemoExperience(emptyDraft(), 5), /필수 항목/)
})
