package com.blooming.backend.user;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.post.ApplyField;
import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.post.PrepPeriod;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

import lombok.RequiredArgsConstructor;

/**
 * 시연용 데모 데이터: 인턴 · 개발 분야 · '면접' 키워드 글 22개 (성공 9, 실패 9, 중단 4).
 * 요인 분석에서 [인턴 + 면접 + 개발]로 거르면 이 글들이 나온다.
 * 준비 기간·지원 분야를 직접 넣으므로 DemoDetailsBackfill이 덮어쓰지 않는다.
 * 첫 번째 글 제목(MARKER)이 이미 있으면 다시 넣지 않는다.
 *
 * 한 줄 = 글 하나: 작성자번호|결과|단계|준비기간|도움이돼요|태그|제목|잘된점|아쉬운점|배운점|다음계획
 */
@Component
@Order(4)
@RequiredArgsConstructor
public class DemoInternDevInitializer implements ApplicationRunner {

    private static final String MARKER = "백엔드 인턴 기술 면접, CS 노트 덕분에 붙었어요";

    private static final String DATA = """
            1|SUCCESS|INTERVIEW|MONTH_1|42|THOROUGH_PREP,STEADY_EFFORT|백엔드 인턴 기술 면접, CS 노트 덕분에 붙었어요|한 달 동안 운영체제·네트워크·DB 질문을 노트로 정리했다|트랜잭션 격리 수준 질문은 설명이 길어졌다|기본 개념은 내 말로 설명할 수 있어야 한다|면접 전 CS 노트를 소리 내어 설명해 본다
            2|FAILURE|INTERVIEW|WITHIN_1_WEEK|18|LACK_OF_SKILL,LACK_OF_PREP|라이브 코딩 면접에서 손이 굳어 버렸어요|문제 의도는 빨리 파악했다|평소에 IDE 자동완성에만 기대서 맨손 코딩이 낯설었다|면접은 실제 환경과 같은 조건으로 연습해야 한다|메모장에서 손코딩하는 연습을 일주일에 세 번 한다
            3|SUCCESS|INTERVIEW|MONTHS_3|35|FEEDBACK_APPLIED,THOROUGH_PREP|프론트엔드 인턴 면접, 프로젝트 질문을 예상해 갔어요|내 프로젝트에서 나올 질문 20개를 뽑아 답을 준비했다|상태 관리 라이브러리를 고른 이유를 깊게 설명하지 못했다|내가 만든 것은 왜 그렇게 했는지까지 말할 수 있어야 한다|기술 선택 이유를 프로젝트마다 세 줄로 정리한다
            5|FAILURE|INTERVIEW|WEEKS_2|22|LACK_OF_SKILL|자료구조 기본 질문에서 막혀 떨어졌어요|프로젝트 경험 질문은 자신 있게 답했다|해시 충돌 해결 방법을 정확히 설명하지 못했다|기본기는 프로젝트 경험으로 대신할 수 없다|면접 2주 전부터 자료구조 개념을 하루 하나씩 복습한다
            6|STOPPED|INTERVIEW|WEEKS_2|4|SCHEDULE_CONFLICT,LACK_OF_TIME|면접이 기말고사 주간이랑 겹쳐서 포기했어요|서류와 코딩 테스트는 통과했다|면접 일정을 조율해 달라고 말할 생각을 못 했다|일정이 겹치면 먼저 물어봐도 된다|면접 일정이 겹치면 담당자에게 바로 문의한다
            7|SUCCESS|INTERVIEW|MONTH_1|29|TEAMWORK,FEEDBACK_APPLIED|모의 면접 스터디로 개발 인턴 합격했어요|스터디원끼리 매주 면접관 역할을 바꿔 가며 연습했다|처음 두 주는 피드백이 너무 막연했다|구체적인 피드백이 실력을 키운다|피드백은 좋았던 점 하나, 고칠 점 하나로 준다
            8|FAILURE|INTERVIEW|WITHIN_1_WEEK|15|LACK_OF_PREP,WRONG_DIRECTION|회사 기술 스택을 모르고 면접 봤어요|일반적인 개발 질문에는 잘 답했다|회사가 쓰는 언어와 프레임워크를 확인하지 않았다|지원하는 회사의 기술 블로그를 먼저 읽어야 한다|면접 전 회사 기술 블로그 글 세 개를 읽는다
            9|SUCCESS|INTERVIEW|MONTHS_3|38|STEADY_EFFORT,THOROUGH_PREP|알고리즘 100문제 풀고 코딩 면접 통과했어요|석 달 동안 하루 한 문제씩 풀고 풀이를 기록했다|초반에는 쉬운 문제만 골라 풀었다|꾸준히 기록하면 실력이 눈에 보인다|틀린 문제는 일주일 뒤에 다시 푼다
            1|STOPPED|INTERVIEW|MONTH_1|3|LOST_MOTIVATION|면접에서 연달아 떨어지고 지원을 멈췄어요|떨어진 면접마다 질문은 기록해 두었다|기록만 하고 다시 보지 않아 같은 실수를 반복했다|실패 기록은 다시 볼 때 의미가 있다|모은 질문을 주제별로 묶어 답변을 다시 쓴다
            2|SUCCESS|INTERVIEW|MONTH_1|26|FEEDBACK_APPLIED|첫 면접에서 떨어진 질문을 고쳐서 두 번째에 붙었어요|첫 면접 질문을 바로 적고 답을 다시 썼다|첫 면접 때는 너무 긴장해서 말을 잘랐다|떨어진 면접이 다음 면접의 예상 질문이다|면접이 끝나면 30분 안에 질문을 적는다
            3|FAILURE|INTERVIEW|WEEKS_2|19|LACK_OF_COMMUNICATION|기술 면접에서 생각을 말하지 않고 코드만 짰어요|문제는 시간 안에 풀었다|풀이 과정을 설명하지 않아 소통이 부족해 보였다|코딩 면접은 생각을 말로 꺼내는 시험이다|문제를 풀 때 접근 방법부터 말하고 시작한다
            5|SUCCESS|INTERVIEW|OVER_3_MONTHS|40|STEADY_EFFORT,TEAMWORK|오픈소스 기여 경험으로 개발 인턴 면접 통과했어요|반년 동안 작은 이슈부터 PR을 올렸다|처음 PR은 리뷰를 이해하지 못해 오래 걸렸다|리뷰를 받아 본 경험이 면접에서 강점이 된다|한 달에 PR 두 개를 목표로 한다
            6|FAILURE|INTERVIEW|WITHIN_1_WEEK|12|LACK_OF_PREP,LACK_OF_TIME|코딩 테스트 붙고 일주일 만에 면접 준비하다 떨어졌어요|코딩 테스트 문제는 다 풀었다|면접 준비를 테스트 이후로 미뤄 시간이 모자랐다|면접 준비는 서류를 낼 때 함께 시작해야 한다|지원과 동시에 예상 질문 목록을 만든다
            7|STOPPED|INTERVIEW|WEEKS_2|2|PRIORITY_CHANGE|해커톤 준비 때문에 인턴 면접을 미뤘어요|해커톤에서는 원하는 결과를 얻었다|두 가지를 동시에 잡으려다 면접 준비를 놓쳤다|한 시기에 하나에 집중해야 한다|다음 시즌에는 인턴을 우선순위 1번으로 둔다
            8|SUCCESS|INTERVIEW|MONTH_1|33|THOROUGH_PREP,USER_RESEARCH|회사 서비스를 직접 써 보고 개발 면접에 갔어요|앱을 써 보며 느낀 버그와 개선점을 정리해 갔다|개선안 하나는 이미 개발 중이라는 답을 들었다|직접 써 본 경험은 좋은 대화 소재가 된다|면접 전 서비스 사용 후기를 한 장으로 정리한다
            9|FAILURE|INTERVIEW|MONTH_1|17|LACK_OF_SKILL,NO_FEEDBACK|시스템 설계 질문에서 아무 말도 못 했어요|코딩 문제는 무난하게 풀었다|대용량 트래픽을 처리하는 구조를 공부해 본 적이 없었다|혼자 공부하면 약한 부분을 모른다|선배에게 모의 면접을 부탁해 피드백을 받는다
            1|SUCCESS|INTERVIEW|WEEKS_2|24|THOROUGH_PREP|면접 전에 내 깃허브를 다시 정리하고 갔어요|README에 프로젝트 목적과 맡은 역할을 정리했다|오래된 저장소를 다 정리하지는 못했다|면접관은 깃허브를 실제로 열어 본다|대표 저장소 세 개는 항상 정리해 둔다
            2|FAILURE|INTERVIEW|MONTHS_3|14|WRONG_DIRECTION|AI 직무 인턴 면접에서 웹 개발 이야기만 했어요|웹 프로젝트 경험은 자세히 설명했다|지원 직무와 맞지 않는 경험을 강조했다|경험은 직무에 맞게 골라서 말해야 한다|지원 직무마다 강조할 경험을 따로 고른다
            3|STOPPED|INTERVIEW|MONTH_1|5|HEALTH_ISSUE|최종 면접 직전에 몸이 안 좋아 포기했어요|1차 기술 면접까지는 통과했다|밤샘 준비로 컨디션 관리를 못 했다|컨디션도 준비의 일부다|면접 주간에는 잠을 7시간 이상 잔다
            5|FAILURE|INTERVIEW|WEEKS_2|16|LACK_OF_PREP,LACK_OF_COMMUNICATION|팀 프로젝트에서 맡은 부분을 설명하지 못했어요|프로젝트 전체 흐름은 잘 말했다|내가 직접 구현한 부분과 팀원 몫을 구분하지 못했다|면접은 내가 한 일을 묻는 자리다|프로젝트마다 내가 맡은 기능을 따로 적는다
            6|SUCCESS|INTERVIEW|MONTHS_3|31|STEADY_EFFORT,FEEDBACK_APPLIED|세 번 떨어지고 네 번째 개발 인턴 면접에 붙었어요|떨어질 때마다 받은 질문과 부족한 점을 기록했다|처음 두 번은 같은 질문에서 또 막혔다|실패 기록을 다시 보는 게 가장 빠른 준비다|면접마다 회고를 남기고 다음 면접 전에 다시 읽는다
            7|FAILURE|INTERVIEW|WITHIN_1_WEEK|11|LACK_OF_SKILL,LACK_OF_TIME|기술 면접 SQL 질문에서 조인을 헷갈려 떨어졌어요|자바 질문에는 자신 있게 답했다|데이터베이스 공부를 미뤄 두었다|자주 쓰는 기술일수록 기본을 다시 봐야 한다|조인과 인덱스 예제를 직접 만들어 연습한다
            """;

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (postRepository.existsByTitle(MARKER)) {
            return;
        }
        for (String line : DATA.split("\n")) {
            if (line.isBlank()) {
                continue;
            }
            String[] f = line.trim().split("\\|");
            Set<FactorTag> tags = Arrays.stream(f[5].split(","))
                    .map(String::trim)
                    .map(FactorTag::valueOf)
                    .collect(Collectors.toCollection(HashSet::new));
            Post post = postRepository.save(Post.builder()
                    .author(author(f[0]))
                    .resultType(ResultType.valueOf(f[1]))
                    .challengeType(ChallengeType.INTERN)
                    .stage(Stage.valueOf(f[2]))
                    .title(f[6])
                    .goodPoints(f[7])
                    .badPoints(f[8])
                    .lessons(f[9])
                    .nextPlan(f[10])
                    .factorTags(tags)
                    .build());
            post.changeDetails(PrepPeriod.valueOf(f[3]), ApplyField.DEVELOPMENT);
            int helpful = Integer.parseInt(f[4]);
            for (int i = 0; i < helpful; i++) {
                post.increaseHelpful();
            }
        }
    }

    private User author(String no) {
        String email = "demo" + no + "@blooming.local";
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(new User(email, "데모" + no, Role.USER)));
    }
}
