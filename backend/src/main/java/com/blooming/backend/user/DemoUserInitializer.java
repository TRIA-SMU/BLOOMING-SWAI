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
 * 서버가 켜질 때 사용자가 한 명도 없으면 1번(새벽코딩), 2번(도토리)과 1번이 쓴 예시 글 1개를 만든다.
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
    }
}
