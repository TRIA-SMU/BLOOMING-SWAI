package com.blooming.backend.user;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

import lombok.RequiredArgsConstructor;

/**
 * 구글 로그인 붙이기 전까지 쓸 데모 데이터.
 * 서버가 켜질 때 사용자가 한 명도 없으면 1번(새벽코딩), 2번(도토리), 3번(별빛), 4번(관리자)과
 * 1번이 쓴 예시 글 1개를 만든다. 신고 3건 테스트는 2·3·4번으로 하면 된다.
 * 도움이 돼요는 본인 글에 못 누르니까, 2번(X-User-Id: 2)으로 1번 글에 눌러 보면 된다.
 */
@Component
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
        User demo1 = userRepository.save(new User("demo1@blooming.local", "새벽코딩", Role.USER));
        userRepository.save(new User("demo2@blooming.local", "도토리", Role.USER));
        userRepository.save(new User("demo3@blooming.local", "별빛", Role.USER));
        userRepository.save(new User("admin@blooming.local", "관리자", Role.ADMIN));

        postRepository.save(Post.builder()
                .author(demo1)
                .resultType(ResultType.SUCCESS)
                .challengeType(ChallengeType.CONTEST)
                .stage(Stage.FINAL)
                .title("사용자 조사부터 했더니 본선까지 갔어요")
                .goodPoints("설문 30명으로 기능을 3개로 줄였다")
                .badPoints("발표 연습 시간이 부족했다")
                .lessons("기능을 줄이는 게 오히려 설득력이 있다")
                .nextPlan("다음엔 발표 리허설을 두 번 이상 한다")
                .build());

        // 로드맵은 내 기록이 3개 이상이어야 해서, 1번 사용자 글을 2개 더 둔다
        postRepository.save(Post.builder()
                .author(demo1)
                .resultType(ResultType.FAILURE)
                .challengeType(ChallengeType.INTERN)
                .stage(Stage.INTERVIEW)
                .title("기업 분석 없이 면접 갔다가 떨어졌어요")
                .goodPoints("자기소개는 자신 있게 했다")
                .badPoints("회사 서비스에 대한 질문에 제대로 답하지 못했다")
                .lessons("지원하는 회사의 서비스를 직접 써 보고 가야 한다")
                .nextPlan("면접 전에 서비스 분석 노트를 한 장 만든다")
                .build());
        postRepository.save(Post.builder()
                .author(demo1)
                .resultType(ResultType.STOPPED)
                .challengeType(ChallengeType.PROJECT)
                .stage(Stage.ETC)
                .title("역할 분담 없이 시작했다가 중간에 멈췄어요")
                .goodPoints("아이디어 회의는 활발했다")
                .badPoints("누가 무엇을 할지 정하지 않아 개발이 진행되지 않았다")
                .lessons("시작할 때 역할과 마감일을 먼저 정해야 한다")
                .nextPlan("첫 회의에서 역할표와 주간 일정을 만든다")
                .build());
    }
}
