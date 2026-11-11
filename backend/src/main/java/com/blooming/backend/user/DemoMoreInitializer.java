package com.blooming.backend.user;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;

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
 * 추가 데모 데이터 (게시판이 꽉 차 보이도록).
 * DemoUserInitializer 다음에 실행된다.
 * 이미 DB가 있는 배포 서버에도 들어가도록, "사용자 수"가 아니라 아래 MARKER 제목의 글이 있는지로 판단한다.
 * → 한 번 들어가면 다시 넣지 않는다.
 *
 * 사용자 5~9: 구름빵 / 여름밤 / 꿀벌 / 노을 / 몽글
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class DemoMoreInitializer implements ApplicationRunner {

    private static final String MARKER = "공모전 첫 도전, 팀 빌딩부터 다시 배웠어요";

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (postRepository.existsByTitle(MARKER)) {
            return;
        }
        List<User> u = List.of(
                user("demo5@blooming.local", "구름빵"),
                user("demo6@blooming.local", "여름밤"),
                user("demo7@blooming.local", "꿀벌"),
                user("demo8@blooming.local", "노을"),
                user("demo9@blooming.local", "몽글"));

        // ===== 공모전 =====
        save(u.get(0), ResultType.FAILURE, ChallengeType.CONTEST, Stage.DOCUMENT, MARKER,
                "아이디어 자체는 참신하다는 말을 들었다",
                "팀원을 급하게 모아서 서로 잘하는 걸 몰랐다",
                "팀 빌딩에 하루를 쓰는 게 아깝지 않다",
                "첫 모임에서 각자 잘하는 것과 가능한 시간을 공유한다",
                7, FactorTag.ROLE_DIVISION, FactorTag.LACK_OF_PREP);
        save(u.get(1), ResultType.SUCCESS, ChallengeType.CONTEST, Stage.FINAL,
                "데모 영상을 미리 찍어 둔 덕분에 본선을 버텼어요",
                "발표 전날 데모 영상을 따로 녹화해 두었다",
                "현장 와이파이가 끊겨 라이브 시연을 못 했다",
                "시연은 항상 플랜 B가 있어야 한다",
                "발표 자료에 데모 영상을 미리 넣어 둔다",
                41, FactorTag.LACK_OF_PREP, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(2), ResultType.SUCCESS, ChallengeType.CONTEST, Stage.PRESENTATION,
                "심사 기준표를 보고 기획서를 다시 썼어요",
                "심사 항목별로 기획서 목차를 맞췄다",
                "처음엔 하고 싶은 말만 써서 두 번 갈아엎었다",
                "심사 기준이 곧 정답지다",
                "공고문의 심사 기준부터 표로 정리한다",
                18, FactorTag.LACK_OF_PREP);
        save(u.get(3), ResultType.FAILURE, ChallengeType.CONTEST, Stage.PRESENTATION,
                "발표 시간 5분을 넘겨서 감점됐어요",
                "내용은 충실하게 준비했다",
                "리허설을 한 번도 시간 재며 하지 않았다",
                "발표는 내용보다 시간 안에 끝내는 게 먼저다",
                "타이머 켜고 리허설을 최소 두 번 한다",
                12, FactorTag.SCHEDULE_MANAGEMENT, FactorTag.LACK_OF_PREP);
        save(u.get(4), ResultType.SUCCESS, ChallengeType.CONTEST, Stage.FINAL,
                "설문 50명 데이터로 문제를 증명했어요",
                "에브리타임과 단톡방으로 설문을 돌려 근거를 만들었다",
                "설문 문항이 길어서 응답률이 낮았다",
                "숫자 하나가 긴 설명보다 설득력이 있다",
                "설문은 5문항 이내로 짧게 만든다",
                27, FactorTag.USER_RESEARCH);
        save(u.get(0), ResultType.STOPPED, ChallengeType.CONTEST, Stage.ETC,
                "시험 기간이랑 겹쳐서 중간에 포기했어요",
                "아이디어 정리까지는 재미있게 했다",
                "일정을 확인하지 않고 신청해 시험 기간과 겹쳤다",
                "신청 전에 내 일정부터 확인해야 한다",
                "학사 일정과 대회 일정을 같이 놓고 신청한다",
                3, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(1), ResultType.FAILURE, ChallengeType.CONTEST, Stage.PRELIMINARY,
                "비슷한 서비스가 이미 있다는 지적을 받았어요",
                "기능 구현은 깔끔하게 끝냈다",
                "경쟁 서비스 조사를 하지 않았다",
                "차별점이 없으면 완성도가 좋아도 떨어진다",
                "시작 전에 비슷한 서비스 3개를 비교해 본다",
                22, FactorTag.USER_RESEARCH, FactorTag.LACK_OF_PREP);
        save(u.get(2), ResultType.SUCCESS, ChallengeType.CONTEST, Stage.PRELIMINARY,
                "매일 저녁 15분 스탠드업으로 예선 통과했어요",
                "짧게 매일 진행 상황을 공유했다",
                "회의록을 안 남겨서 결정한 걸 자꾸 잊었다",
                "짧더라도 매일 만나는 게 효과가 크다",
                "회의록 담당을 정해 한 줄이라도 남긴다",
                9, FactorTag.SCHEDULE_MANAGEMENT, FactorTag.ROLE_DIVISION);

        // ===== 대외활동 =====
        save(u.get(3), ResultType.SUCCESS, ChallengeType.ACTIVITY, Stage.INTERVIEW,
                "서포터즈 면접, 활동 계획서를 들고 가서 붙었어요",
                "합격하면 할 콘텐츠 계획을 한 장으로 만들어 갔다",
                "자기소개가 너무 길었다",
                "구체적인 계획이 열정보다 잘 보인다",
                "자기소개는 30초 버전을 따로 준비한다",
                16, FactorTag.LACK_OF_PREP);
        save(u.get(4), ResultType.FAILURE, ChallengeType.ACTIVITY, Stage.DOCUMENT,
                "지원서를 복붙했다가 서류에서 떨어졌어요",
                "지원 동기는 진심으로 썼다",
                "다른 대외활동 지원서를 그대로 고쳐 써서 이름이 틀렸다",
                "지원서는 기관마다 새로 써야 한다",
                "제출 전 기관 이름과 활동 이름을 다시 확인한다",
                31, FactorTag.LACK_OF_PREP);
        save(u.get(0), ResultType.STOPPED, ChallengeType.ACTIVITY, Stage.ETC,
                "동시에 활동 세 개를 하다가 하나를 그만뒀어요",
                "처음 한 달은 모두 열심히 했다",
                "주말마다 일정이 겹쳐 하나도 제대로 못 했다",
                "많이 하는 것보다 끝까지 하는 게 낫다",
                "한 학기에 대외활동은 두 개까지만 한다",
                5, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(1), ResultType.SUCCESS, ChallengeType.ACTIVITY, Stage.ETC,
                "봉사단 팀장 맡아서 우수팀 받았어요",
                "역할표를 만들어 매주 담당을 돌렸다",
                "초반에 팀원 참여도가 들쭉날쭉했다",
                "역할이 보이면 사람들이 알아서 움직인다",
                "첫 주에 역할표와 연락 규칙을 같이 정한다",
                24, FactorTag.ROLE_DIVISION);
        save(u.get(2), ResultType.FAILURE, ChallengeType.ACTIVITY, Stage.INTERVIEW,
                "그룹 면접에서 말을 한 번도 못 했어요",
                "질문 예상 답변은 준비해 갔다",
                "다른 지원자들 사이에 끼어들 타이밍을 놓쳤다",
                "그룹 면접은 첫 발언이 중요하다",
                "첫 질문에 먼저 손 드는 연습을 한다",
                8, FactorTag.LACK_OF_PREP);
        save(u.get(3), ResultType.SUCCESS, ChallengeType.ACTIVITY, Stage.DOCUMENT,
                "기자단 지원서에 포트폴리오 링크를 넣었어요",
                "블로그 글 세 편을 링크로 첨부했다",
                "포트폴리오 정리에 생각보다 오래 걸렸다",
                "결과물이 있으면 말이 필요 없다",
                "평소에 결과물을 한 곳에 모아 둔다",
                13, FactorTag.LACK_OF_PREP, FactorTag.SCHEDULE_MANAGEMENT);

        // ===== 인턴 =====
        save(u.get(4), ResultType.SUCCESS, ChallengeType.INTERN, Stage.INTERVIEW,
                "서비스를 직접 써 보고 개선점을 말해서 붙었어요",
                "면접 전에 앱을 일주일 써 보고 불편한 점을 정리했다",
                "기술 질문 하나에 제대로 답하지 못했다",
                "회사 서비스를 아는 지원자는 눈에 띈다",
                "기술 면접 기본 질문을 따로 정리한다",
                38, FactorTag.USER_RESEARCH, FactorTag.LACK_OF_PREP);
        save(u.get(0), ResultType.FAILURE, ChallengeType.INTERN, Stage.DOCUMENT,
                "자소서 마감 1시간 전에 써서 떨어졌어요",
                "경험 자체는 많이 쌓아 두었다",
                "마감 직전에 써서 경험을 제대로 못 풀어냈다",
                "자소서는 경험보다 정리하는 시간이 필요하다",
                "마감 3일 전에 초안을 끝낸다",
                19, FactorTag.SCHEDULE_MANAGEMENT, FactorTag.LACK_OF_PREP);
        save(u.get(1), ResultType.SUCCESS, ChallengeType.INTERN, Stage.DOCUMENT,
                "프로젝트 경험을 숫자로 바꿔 써서 서류 통과했어요",
                "\"사용자 30명, 만족도 4.5점\"처럼 결과를 숫자로 적었다",
                "숫자로 바꿀 자료를 다시 찾느라 오래 걸렸다",
                "숫자가 있으면 경험이 구체적으로 보인다",
                "프로젝트 끝날 때마다 결과 수치를 기록해 둔다",
                26, FactorTag.LACK_OF_PREP);
        save(u.get(2), ResultType.FAILURE, ChallengeType.INTERN, Stage.INTERVIEW,
                "코딩 테스트는 붙고 면접에서 떨어졌어요",
                "코딩 테스트는 꾸준히 준비해서 통과했다",
                "내 프로젝트 코드를 설명하지 못했다",
                "내가 쓴 코드는 내가 설명할 수 있어야 한다",
                "프로젝트마다 핵심 코드 설명을 정리한다",
                33, FactorTag.LACK_OF_PREP);
        save(u.get(3), ResultType.STOPPED, ChallengeType.INTERN, Stage.ETC,
                "인턴 지원 준비하다가 학기 중이라 미뤘어요",
                "포트폴리오 정리는 시작했다",
                "수업과 과제가 몰려서 지원서를 쓸 시간이 없었다",
                "지원 시즌을 미리 알고 준비해야 한다",
                "방학 전에 지원서 초안을 만들어 둔다",
                2, FactorTag.SCHEDULE_MANAGEMENT);

        // ===== 취업 =====
        save(u.get(4), ResultType.SUCCESS, ChallengeType.JOB, Stage.INTERVIEW,
                "모의 면접 열 번 하고 최종 합격했어요",
                "스터디원들과 서로 면접관 역할을 해 줬다",
                "처음엔 피드백 받는 게 부끄러웠다",
                "실전처럼 연습한 만큼 덜 떨린다",
                "면접 답변을 녹화해서 다시 본다",
                45, FactorTag.LACK_OF_PREP, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(0), ResultType.FAILURE, ChallengeType.JOB, Stage.INTERVIEW,
                "1분 자기소개를 외워 갔다가 말이 막혔어요",
                "답변 내용은 충분히 준비했다",
                "문장을 통째로 외워서 한 단어를 잊자 전부 막혔다",
                "외우기보다 키워드로 기억해야 한다",
                "답변을 키워드 3개로 정리해 연습한다",
                21, FactorTag.LACK_OF_PREP);
        save(u.get(1), ResultType.FAILURE, ChallengeType.JOB, Stage.DOCUMENT,
                "지원 직무와 경험이 안 맞아서 서류 탈락했어요",
                "경험은 다양하게 적었다",
                "직무와 관련 없는 경험까지 다 넣어 핵심이 흐려졌다",
                "직무에 맞는 경험만 골라 써야 한다",
                "직무 설명을 보고 경험을 골라 쓴다",
                14, FactorTag.LACK_OF_PREP, FactorTag.USER_RESEARCH);
        save(u.get(2), ResultType.SUCCESS, ChallengeType.JOB, Stage.DOCUMENT,
                "현직자 커피챗으로 자소서 방향을 잡았어요",
                "현직자 두 명에게 실제 업무를 물어봤다",
                "연락할 사람을 찾는 데 시간이 걸렸다",
                "직무를 직접 들어 보면 쓸 말이 생긴다",
                "학교 선배 네트워크를 먼저 활용한다",
                29, FactorTag.USER_RESEARCH);
        save(u.get(3), ResultType.STOPPED, ChallengeType.JOB, Stage.ETC,
                "취업 준비를 잠시 멈추고 진로부터 다시 고민했어요",
                "여러 직무를 알아보며 관심사를 정리했다",
                "목표 없이 지원만 하다 지쳤다",
                "방향이 먼저고 지원은 그다음이다",
                "관심 직무 세 개를 정해 하나씩 경험해 본다",
                11, FactorTag.ETC);

        // ===== 프로젝트 =====
        save(u.get(4), ResultType.SUCCESS, ChallengeType.PROJECT, Stage.PRESENTATION,
                "깃허브 이슈로 할 일을 나눠서 끝까지 갔어요",
                "기능마다 이슈를 만들고 담당자를 지정했다",
                "PR 리뷰가 늦어 merge가 밀렸다",
                "할 일이 보이면 누가 뭘 할지 싸우지 않는다",
                "PR 리뷰는 하루 안에 하기로 규칙을 정한다",
                20, FactorTag.ROLE_DIVISION, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(0), ResultType.FAILURE, ChallengeType.PROJECT, Stage.PRESENTATION,
                "기능 욕심내다가 발표 날 절반만 동작했어요",
                "기획 단계에서 아이디어가 풍부했다",
                "핵심 기능보다 부가 기능을 먼저 만들었다",
                "핵심 기능 하나가 완벽한 게 낫다",
                "MVP 기능을 먼저 정하고 그것부터 만든다",
                17, FactorTag.LACK_OF_PREP, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(1), ResultType.STOPPED, ChallengeType.PROJECT, Stage.ETC,
                "기술 스택을 세 번 바꾸다 멈췄어요",
                "새 기술을 많이 공부했다",
                "더 좋아 보이는 기술이 나올 때마다 갈아탔다",
                "익숙한 기술로 끝내는 게 먼저다",
                "기술 스택은 첫 주에 정하고 바꾸지 않는다",
                6, FactorTag.LACK_OF_PREP, FactorTag.ETC);
        save(u.get(2), ResultType.SUCCESS, ChallengeType.PROJECT, Stage.ETC,
                "실제 사용자 10명 테스트로 앱을 고쳤어요",
                "친구들에게 앱을 써 보게 하고 화면을 같이 봤다",
                "테스트 결과 정리에 시간이 오래 걸렸다",
                "만든 사람 눈에는 불편함이 안 보인다",
                "테스트용 체크리스트를 미리 만든다",
                35, FactorTag.USER_RESEARCH);
        save(u.get(3), ResultType.FAILURE, ChallengeType.PROJECT, Stage.ETC,
                "디자이너 없이 시작했다가 화면이 엉망이 됐어요",
                "기능은 다 구현했다",
                "디자인 기준이 없어 화면마다 스타일이 달랐다",
                "디자인 시스템이 있으면 개발도 빨라진다",
                "색, 글꼴, 버튼 규칙부터 정하고 시작한다",
                10, FactorTag.ROLE_DIVISION, FactorTag.LACK_OF_PREP);
        save(u.get(4), ResultType.STOPPED, ChallengeType.PROJECT, Stage.ETC,
                "팀원 연락이 끊겨서 프로젝트가 멈췄어요",
                "처음 기획 회의는 활발했다",
                "연락 규칙이 없어 답장이 며칠씩 늦어졌다",
                "연락 규칙도 팀 규칙이다",
                "답장 기한과 정기 회의 시간을 처음에 정한다",
                4, FactorTag.ROLE_DIVISION, FactorTag.SCHEDULE_MANAGEMENT);

        // ===== 기타 =====
        save(u.get(0), ResultType.SUCCESS, ChallengeType.ETC, Stage.ETC,
                "자격증 시험, 하루 2시간씩 꾸준히 해서 붙었어요",
                "매일 같은 시간에 공부하는 습관을 만들었다",
                "초반에 계획을 너무 빡빡하게 잡았다",
                "꾸준함이 몰아치기보다 낫다",
                "계획은 여유 있게 잡고 매일 체크한다",
                15, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(1), ResultType.FAILURE, ChallengeType.ETC, Stage.ETC,
                "어학 시험 점수가 목표에 못 미쳤어요",
                "단어는 꾸준히 외웠다",
                "실전 모의고사를 시험 직전에야 풀어 봤다",
                "실전 연습은 일찍 시작해야 한다",
                "시험 한 달 전부터 주 1회 모의고사를 푼다",
                9, FactorTag.LACK_OF_PREP, FactorTag.SCHEDULE_MANAGEMENT);
        save(u.get(2), ResultType.STOPPED, ChallengeType.ETC, Stage.ETC,
                "블로그 100일 챌린지를 40일에서 멈췄어요",
                "40일 동안은 매일 글을 올렸다",
                "주제를 미리 정해 두지 않아 쓸 게 없어졌다",
                "꾸준함에는 준비된 재료가 필요하다",
                "주제 목록을 30개 먼저 만들어 둔다",
                7, FactorTag.LACK_OF_PREP);
        save(u.get(3), ResultType.SUCCESS, ChallengeType.ETC, Stage.ETC,
                "학교 해커톤에서 처음으로 완주했어요",
                "역할을 기획, 프론트, 백엔드로 나눠 시작했다",
                "밤샘하느라 마지막 발표 때 너무 피곤했다",
                "완주 경험 하나가 다음 도전의 자신감이 된다",
                "해커톤에서도 잠자는 시간을 정해 둔다",
                30, FactorTag.ROLE_DIVISION, FactorTag.SCHEDULE_MANAGEMENT);
    }

    private User user(String email, String nickname) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(new User(email, nickname, Role.USER)));
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
