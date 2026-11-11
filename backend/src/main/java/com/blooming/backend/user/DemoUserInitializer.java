package com.blooming.backend.user;

import java.util.Arrays;
import java.util.HashSet;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

import lombok.RequiredArgsConstructor;

/**
 * 데모 데이터. 서버가 켜질 때 사용자가 한 명도 없으면 만든다 (MySQL로 바꿔도 처음 한 번만 들어감).
 *
 * 사용자: 1 새벽코딩 / 2 도토리 / 3 별빛 / 4 관리자(ADMIN)
 * 글 (1번 글 = 1번 사용자의 공모전 성공 글, 도움이 돼요·신고 테스트용):
 *  - 공모전: 성공 5, 실패 5, 중단 2 → 요인 분석 순위 화면 테스트 (5건 이상)
 *  - 인턴 실패 1, 프로젝트 중단 1
 *  - 1번 사용자 글이 4개라 로드맵(3개 이상)도 바로 테스트 가능
 *
 * 성장 단계가 화면에서 다 보이도록 일부 글은 도움이 돼요 수를 미리 올려 둔다
 * (데모용 숫자라 reactions 테이블에는 없음. 1번 글은 0에서 시작)
 */
@Component
@Order(1)
@RequiredArgsConstructor
public class DemoUserInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        User u1 = userRepository.save(new User("demo1@blooming.local", "새벽코딩", Role.USER));
        User u2 = userRepository.save(new User("demo2@blooming.local", "도토리", Role.USER));
        User u3 = userRepository.save(new User("demo3@blooming.local", "별빛", Role.USER));
        userRepository.save(new User("admin@blooming.local", "관리자", Role.ADMIN));

        // ===== 공모전 · 성공 5 =====
        save(u1, ResultType.SUCCESS, ChallengeType.CONTEST, Stage.FINAL,
                "사용자 조사부터 했더니 본선까지 갔어요",
                "설문 30명으로 기능을 3개로 줄였다",
                "발표 연습 시간이 부족했다",
                "기능을 줄이는 게 오히려 설득력이 있다",
                "다음엔 발표 리허설을 두 번 이상 한다",
                0, FactorTag.USER_RESEARCH, FactorTag.SCHEDULE_MANAGEMENT);
        save(u2, ResultType.SUCCESS, ChallengeType.CONTEST, Stage.FINAL,
                "역할을 처음부터 나눠서 끝까지 완주했어요",
                "기획·개발·디자인 담당을 첫날 정하고 매일 10분 공유했다",
                "디자인 수정이 막판에 몰렸다",
                "담당자가 분명하면 결정이 빨라진다",
                "디자인 시안을 중간 점검 때 미리 확정한다",
                34, FactorTag.ROLE_DIVISION, FactorTag.USER_RESEARCH);
        save(u3, ResultType.SUCCESS, ChallengeType.CONTEST, Stage.PRESENTATION,
                "주간 마감을 정해서 여유 있게 제출했어요",
                "마감 3일 전을 우리 팀 마감으로 잡았다",
                "초반 아이디어 회의가 길어졌다",
                "진짜 마감보다 앞당긴 내부 마감이 효과적이다",
                "아이디어 회의는 시간 제한을 두고 한다",
                12, FactorTag.SCHEDULE_MANAGEMENT);
        save(u2, ResultType.SUCCESS, ChallengeType.CONTEST, Stage.PRELIMINARY,
                "인터뷰 5명으로 문제를 다시 정의했어요",
                "실제 사용자 인터뷰로 처음 생각한 문제가 틀렸다는 걸 알았다",
                "인터뷰 질문을 미리 준비하지 않아 시간이 걸렸다",
                "가정은 꼭 사용자에게 확인해야 한다",
                "인터뷰 질문지를 먼저 만든다",
                4, FactorTag.USER_RESEARCH);
        save(u3, ResultType.SUCCESS, ChallengeType.CONTEST, Stage.FINAL,
                "역할표랑 일정표 하나로 수상까지 했어요",
                "노션에 역할표와 일정표를 만들어 매주 확인했다",
                "발표 자료 디자인이 아쉬웠다",
                "보이는 곳에 일정이 있으면 덜 밀린다",
                "발표 자료 템플릿을 미리 정한다",
                8, FactorTag.ROLE_DIVISION, FactorTag.SCHEDULE_MANAGEMENT);

        // ===== 공모전 · 실패 5 =====
        save(u2, ResultType.FAILURE, ChallengeType.CONTEST, Stage.DOCUMENT,
                "마감 직전에 몰아 써서 서류에서 떨어졌어요",
                "아이디어는 좋다는 피드백을 받았다",
                "제출 전날 밤에 기획서를 몰아 썼다",
                "완성도는 시간에서 나온다",
                "기획서 초안을 일주일 전에 끝낸다",
                15, FactorTag.LACK_OF_PREP, FactorTag.SCHEDULE_MANAGEMENT);
        save(u3, ResultType.FAILURE, ChallengeType.CONTEST, Stage.DOCUMENT,
                "기능을 너무 많이 넣어서 핵심이 안 보였대요",
                "하고 싶은 기능은 다 정리했다",
                "기능이 8개라 무엇이 핵심인지 설명하지 못했다",
                "한 문장으로 설명되는 서비스여야 한다",
                "핵심 기능을 3개로 제한한다",
                31, FactorTag.LACK_OF_PREP);
        save(u1, ResultType.FAILURE, ChallengeType.CONTEST, Stage.PRESENTATION,
                "역할이 겹쳐서 발표 준비가 엉망이 됐어요",
                "개발은 일정 안에 끝냈다",
                "발표 담당이 정해지지 않아 전날 급하게 준비했다",
                "발표도 개발만큼 담당자가 필요하다",
                "발표 담당을 처음부터 정한다",
                3, FactorTag.ROLE_DIVISION, FactorTag.LACK_OF_PREP);
        save(u2, ResultType.FAILURE, ChallengeType.CONTEST, Stage.PRELIMINARY,
                "중간 점검 없이 가다가 예선에서 떨어졌어요",
                "각자 맡은 부분은 열심히 했다",
                "합쳐 보니 서로 맞지 않아 마지막 주를 날렸다",
                "중간에 합쳐 보는 날이 꼭 있어야 한다",
                "주 1회 통합 점검을 한다",
                0, FactorTag.SCHEDULE_MANAGEMENT);
        save(u3, ResultType.FAILURE, ChallengeType.CONTEST, Stage.DOCUMENT,
                "사용자 조사 없이 우리 생각만 썼어요",
                "팀원들끼리는 아이디어에 확신이 있었다",
                "심사위원이 실제 필요가 있냐고 물었는데 근거가 없었다",
                "근거 없는 확신은 설득이 안 된다",
                "설문이라도 20명은 받는다",
                6, FactorTag.USER_RESEARCH, FactorTag.LACK_OF_PREP);

        // ===== 공모전 · 중단 2 =====
        save(u2, ResultType.STOPPED, ChallengeType.CONTEST, Stage.ETC,
                "역할 분담 없이 시작했다가 멈췄어요",
                "아이디어 회의는 활발했다",
                "누가 무엇을 할지 정하지 않아 개발이 진행되지 않았다",
                "시작할 때 역할과 마감일을 먼저 정해야 한다",
                "첫 회의에서 역할표와 주간 일정을 만든다",
                2, FactorTag.ROLE_DIVISION, FactorTag.SCHEDULE_MANAGEMENT);
        save(u3, ResultType.STOPPED, ChallengeType.CONTEST, Stage.ETC,
                "팀원이 빠지면서 이어 가지 못했어요",
                "남은 인원으로 기획까지는 끝냈다",
                "한 명이 빠지자 그 사람 일을 맡을 사람이 없었다",
                "담당 업무를 문서로 남겨 둬야 이어받을 수 있다",
                "업무 인수인계 문서를 만든다",
                1, FactorTag.ROLE_DIVISION);

        // ===== 다른 도전 유형 =====
        save(u1, ResultType.FAILURE, ChallengeType.INTERN, Stage.INTERVIEW,
                "기업 분석 없이 면접 갔다가 떨어졌어요",
                "자기소개는 자신 있게 했다",
                "회사 서비스에 대한 질문에 제대로 답하지 못했다",
                "지원하는 회사의 서비스를 직접 써 보고 가야 한다",
                "면접 전에 서비스 분석 노트를 한 장 만든다",
                9, FactorTag.LACK_OF_PREP);
        save(u1, ResultType.STOPPED, ChallengeType.PROJECT, Stage.ETC,
                "일정 없이 시작한 사이드 프로젝트가 멈췄어요",
                "처음 2주는 재미있게 개발했다",
                "마감이 없어서 시험 기간 이후로 아무도 손대지 않았다",
                "사이드 프로젝트도 마감일이 있어야 한다",
                "2주 단위로 목표를 정한다",
                0, FactorTag.SCHEDULE_MANAGEMENT, FactorTag.ROLE_DIVISION);
    }

    private void save(User author, ResultType result, ChallengeType challenge, Stage stage, String title,
            String good, String bad, String lessons, String next, int helpful, FactorTag... tags) {
        Post post = postRepository.save(Post.builder()
                .author(author)
                .resultType(result)
                .challengeType(challenge)
                .stage(stage)
                .title(title)
                .goodPoints(good)
                .badPoints(bad)
                .lessons(lessons)
                .nextPlan(next)
                .factorTags(new HashSet<>(Arrays.asList(tags)))
                .build());
        for (int i = 0; i < helpful; i++) {
            post.increaseHelpful();
        }
    }
}
