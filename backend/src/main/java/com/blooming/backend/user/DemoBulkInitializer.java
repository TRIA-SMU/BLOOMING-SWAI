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

import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.post.FactorTag;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.post.ResultType;
import com.blooming.backend.post.Stage;

import lombok.RequiredArgsConstructor;

/**
 * 공모전 외 유형 데모 데이터 (대외활동·인턴·취업·프로젝트·기타가 각각 20개가 되도록 72개 추가).
 * DemoMoreInitializer 다음에 실행된다. 첫 번째 글 제목(MARKER)이 이미 있으면 다시 넣지 않는다.
 *
 * 한 줄 = 글 하나: 작성자번호|결과|유형|단계|도움이돼요|태그|제목|잘된점|아쉬운점|배운점|다음계획
 *  - 작성자번호: demo{번호}@blooming.local (1 새벽코딩, 2 도토리, 3 별빛, 5 구름빵, 6 여름밤, 7 꿀벌, 8 노을, 9 몽글)
 *  - 결과: SUCCESS / FAILURE / STOPPED, 태그는 쉼표로 구분
 */
@Component
@Order(3)
@RequiredArgsConstructor
public class DemoBulkInitializer implements ApplicationRunner {

    private static final String MARKER = "대외활동 첫 지원, 활동 후기부터 찾아봤어요";

    private static final String DATA = """
            5|SUCCESS|ACTIVITY|DOCUMENT|19|USER_RESEARCH|대외활동 첫 지원, 활동 후기부터 찾아봤어요|지난 기수 후기를 읽고 기관이 원하는 인재상을 파악했다|후기를 너무 많이 읽어 정리하는 데 시간이 걸렸다|지원서는 기관이 원하는 사람에 맞춰 써야 한다|후기에서 반복되는 키워드 3개만 뽑아 정리한다
            6|FAILURE|ACTIVITY|INTERVIEW|11|LACK_OF_PREP|활동 경험을 묻는 질문에 대답을 못 했어요|자기소개는 자연스럽게 했다|비슷한 활동 경험을 구체적으로 준비하지 않았다|경험은 상황, 행동, 결과로 정리해 둬야 한다|대표 경험 3개를 STAR 방식으로 정리한다
            7|STOPPED|ACTIVITY|ETC|4|SCHEDULE_MANAGEMENT|매주 오프라인 모임이라 통학이 힘들어 그만뒀어요|첫 두 달은 빠지지 않고 참여했다|이동 시간을 계산하지 않고 지원했다|활동 장소와 이동 시간도 지원 조건이다|지원 전에 모임 장소와 빈도를 먼저 확인한다
            8|SUCCESS|ACTIVITY|ETC|28|ROLE_DIVISION|홍보 서포터즈에서 콘텐츠 조회수 1등 했어요|기획, 촬영, 편집을 나눠 매주 한 편씩 올렸다|초반 두 편은 반응이 거의 없었다|분업하면 꾸준히 올릴 수 있다|업로드 요일을 정해 놓고 역할을 돌린다
            9|FAILURE|ACTIVITY|DOCUMENT|9|LACK_OF_PREP,SCHEDULE_MANAGEMENT|마감 시간을 착각해서 지원서를 못 냈어요|지원서 내용은 미리 다 써 두었다|마감이 자정이 아니라 오후 6시였다|마감은 날짜뿐 아니라 시간까지 확인해야 한다|공고를 보자마자 캘린더에 시간까지 적어 둔다
            1|SUCCESS|ACTIVITY|INTERVIEW|14|LACK_OF_PREP|면접 전에 기관 SNS를 다 보고 갔어요|최근 캠페인 이야기를 꺼내자 면접관 반응이 좋았다|긴장해서 준비한 말을 다 못 했다|관심은 준비한 만큼 보인다|면접 전날 기관 소식 5개를 메모해 간다
            2|STOPPED|ACTIVITY|ETC|3|ROLE_DIVISION|팀장이 바뀌면서 활동이 흐지부지됐어요|처음 팀장이 있을 때는 잘 굴러갔다|팀장이 빠진 뒤 아무도 정리를 맡지 않았다|사람에 기대는 팀은 오래 못 간다|회의 진행을 돌아가며 맡는다
            3|SUCCESS|ACTIVITY|ETC|22|SCHEDULE_MANAGEMENT|해외 탐방 프로그램 일정표를 미리 짜서 수료했어요|출국 전에 일정과 역할을 표로 만들어 공유했다|현지 교통 정보를 덜 알아봐서 하루가 꼬였다|미리 짠 일정표가 현장에서 버팀목이 된다|현지 교통은 두 가지 경로를 준비한다
            5|FAILURE|ACTIVITY|INTERVIEW|16|USER_RESEARCH|기관이 하는 일을 잘못 알고 면접 봤어요|열정은 충분히 보여 줬다|기관의 주요 사업을 다른 곳과 헷갈렸다|지원하는 곳을 정확히 아는 게 기본이다|기관 홈페이지 소개 페이지를 꼭 읽고 간다
            6|SUCCESS|ACTIVITY|DOCUMENT|7|LACK_OF_PREP|활동 계획서에 예시 게시물을 붙여서 합격했어요|직접 만든 카드뉴스 두 장을 첨부했다|디자인에 시간을 너무 많이 썼다|예시 하나가 계획 설명보다 낫다|예시는 한 장만 깔끔하게 만든다
            7|STOPPED|ACTIVITY|ETC|5|SCHEDULE_MANAGEMENT,ETC|아르바이트랑 겹쳐서 중도 하차했어요|활동 중간 과제까지는 제출했다|아르바이트 시간이 바뀌면서 모임에 계속 빠졌다|병행할 일은 시작 전에 정리해야 한다|한 학기 고정 일정을 먼저 적고 활동을 고른다
            8|FAILURE|ACTIVITY|DOCUMENT|12|LACK_OF_PREP|지원 동기를 너무 추상적으로 써서 떨어졌어요|문장은 매끄럽게 썼다|"성장하고 싶다"는 말만 반복했다|추상적인 말보다 구체적인 이유가 필요하다|지원 동기에 내 경험 하나를 꼭 넣는다
            9|SUCCESS|ACTIVITY|ETC|33|ROLE_DIVISION,SCHEDULE_MANAGEMENT|대학생 기자단 우수 활동자 됐어요|기사 주제를 한 달 치 미리 정하고 취재 일정을 잡았다|인터뷰 섭외가 생각보다 어려웠다|미리 정한 주제가 꾸준함을 만든다|섭외는 2주 전에 연락한다
            1|FAILURE|ACTIVITY|INTERVIEW|6|LACK_OF_PREP|영어 면접인 줄 모르고 갔어요|질문 의도는 이해했다|공고의 영어 면접 안내를 놓쳤다|공고문은 끝까지 읽어야 한다|공고문에서 면접 방식부터 체크한다

            2|SUCCESS|INTERN|INTERVIEW|36|USER_RESEARCH|직무 인터뷰 영상을 보고 질문을 예상했어요|회사 유튜브의 직무 소개 영상을 보고 답변을 준비했다|예상 못 한 인성 질문에 답이 짧았다|회사가 공개한 자료가 가장 좋은 힌트다|인성 질문 10개를 따로 연습한다
            3|FAILURE|INTERN|DOCUMENT|15|LACK_OF_PREP|포트폴리오 링크가 비공개라 서류에서 떨어졌어요|포트폴리오 내용은 열심히 만들었다|노션 링크 공유 설정을 확인하지 않았다|제출 전 링크는 로그아웃 상태로 열어 봐야 한다|시크릿 창에서 모든 링크를 확인한다
            5|SUCCESS|INTERN|DOCUMENT|24|LACK_OF_PREP|자소서를 직무 역량별로 나눠 써서 붙었어요|역량마다 경험 하나씩 짝지어 썼다|처음에는 글자 수를 넘겨 다시 줄였다|역량과 경험을 짝지으면 글이 정리된다|직무 역량 표를 먼저 만들고 자소서를 쓴다
            6|FAILURE|INTERN|INTERVIEW|20|LACK_OF_PREP|과제 전형을 제출했는데 설명을 못 해서 떨어졌어요|과제 결과물은 기한 안에 냈다|왜 그렇게 만들었는지 이유를 정리하지 않았다|결과물만큼 과정 설명이 중요하다|과제마다 선택 이유를 세 줄로 적어 둔다
            7|STOPPED|INTERN|ETC|2|SCHEDULE_MANAGEMENT|인턴 붙었는데 학교 수업이랑 안 맞아 포기했어요|지원부터 합격까지는 잘 준비했다|근무 시간이 수업과 겹치는 걸 늦게 확인했다|합격만큼 일정 확인이 중요하다|지원 전에 근무 요일과 시간을 확인한다
            8|SUCCESS|INTERN|INTERVIEW|41|LACK_OF_PREP,USER_RESEARCH|역질문 하나로 분위기가 바뀌었어요|팀에서 최근 해결한 문제를 물어봤다|초반 답변이 너무 길었다|좋은 역질문은 관심을 보여 준다|역질문을 세 개 준비해 간다
            9|FAILURE|INTERN|DOCUMENT|8|USER_RESEARCH|회사마다 같은 자소서를 내서 다 떨어졌어요|자소서 문장은 많이 다듬었다|회사 이름만 바꿔 열 군데에 냈다|많이 내는 것보다 맞춰 내는 게 낫다|지원 회사를 다섯 곳으로 줄이고 맞춤으로 쓴다
            1|SUCCESS|INTERN|ETC|27|ROLE_DIVISION|인턴 기간 동안 매일 업무 일지를 썼어요|배운 것과 질문을 매일 기록해 멘토와 공유했다|처음엔 무엇을 적어야 할지 몰랐다|기록이 성장을 보여 준다|일지에 오늘 한 일, 막힌 점, 질문을 적는다
            2|FAILURE|INTERN|INTERVIEW|13|LACK_OF_PREP|기술 면접에서 기본 개념을 헷갈렸어요|프로젝트 경험은 잘 설명했다|자료구조 기본 질문에 답이 틀렸다|기본기는 다시 봐도 손해가 없다|면접 일주일 전 기본 개념 노트를 복습한다
            3|STOPPED|INTERN|ETC|4|ETC|진로가 바뀌어서 인턴 준비를 멈췄어요|여러 회사를 알아보며 관심 분야를 찾았다|목표가 흐린 채로 준비했다|방향이 정해져야 준비가 쉬워진다|관심 직무를 한 문장으로 정리한다
            5|SUCCESS|INTERN|DOCUMENT|18|LACK_OF_PREP|이력서를 한 장으로 줄여서 서류 통과했어요|핵심 경험만 남기고 한 장으로 정리했다|무엇을 빼야 할지 고민이 길었다|짧은 이력서가 더 잘 읽힌다|직무와 관련 없는 경험은 과감히 뺀다
            6|FAILURE|INTERN|INTERVIEW|10|SCHEDULE_MANAGEMENT|면접 장소에 늦게 도착해서 망쳤어요|답변 준비는 충분히 했다|이동 시간을 넉넉히 잡지 않았다|여유 시간이 실력을 지켜 준다|면접 장소에는 30분 일찍 도착한다
            7|SUCCESS|INTERN|ETC|30|ROLE_DIVISION,SCHEDULE_MANAGEMENT|인턴 프로젝트 발표까지 맡아서 끝냈어요|맡은 기능과 마감일을 멘토와 먼저 정했다|중간에 요구사항이 바뀌어 다시 만들었다|범위를 먼저 정하면 끝까지 갈 수 있다|변경 사항은 바로 문서로 남긴다
            8|STOPPED|INTERN|ETC|3|SCHEDULE_MANAGEMENT,LACK_OF_PREP|지원 시즌을 놓쳐서 다음 기회로 미뤘어요|포트폴리오 정리는 해 두었다|채용 시즌 일정을 몰랐다|지원 시즌은 미리 알아 둬야 한다|관심 회사 채용 일정을 캘린더에 미리 적는다

            9|SUCCESS|JOB|INTERVIEW|44|LACK_OF_PREP|PT 면접을 다섯 번 연습하고 합격했어요|스터디원 앞에서 실전처럼 발표했다|자료 만드는 데 시간을 너무 많이 썼다|발표는 연습 횟수가 자신감이다|자료는 간단하게, 연습은 많이 한다
            1|FAILURE|JOB|DOCUMENT|17|USER_RESEARCH|회사 인재상을 안 보고 써서 탈락했어요|경험 자체는 충분히 적었다|회사가 강조하는 가치와 맞지 않았다|인재상은 자소서의 방향표다|인재상 키워드를 자소서에 연결한다
            2|SUCCESS|JOB|DOCUMENT|25|LACK_OF_PREP,USER_RESEARCH|현직자 블로그로 직무를 이해하고 서류 통과했어요|현직자 글을 읽고 실제 업무 용어로 썼다|자료가 흩어져 정리에 시간이 걸렸다|직무 언어로 쓰면 준비된 사람처럼 보인다|직무 용어 사전을 만들어 둔다
            3|STOPPED|JOB|ETC|6|SCHEDULE_MANAGEMENT|공채 준비와 졸업 작품이 겹쳐 한 학기 미뤘어요|졸업 작품은 끝까지 완성했다|두 가지를 동시에 하다 둘 다 지쳤다|우선순위를 정해야 둘 다 망치지 않는다|이번 학기 목표를 하나만 정한다
            5|FAILURE|JOB|INTERVIEW|22|LACK_OF_PREP|임원 면접에서 회사 뉴스를 몰라 당황했어요|직무 질문에는 잘 답했다|최근 회사 이슈를 묻는 질문에 답을 못 했다|회사 소식은 면접 직전까지 챙겨야 한다|면접 일주일 전부터 회사 뉴스를 매일 본다
            6|SUCCESS|JOB|INTERVIEW|31|LACK_OF_PREP|실패 경험 질문에 솔직하게 답해서 붙었어요|떨어진 경험과 거기서 배운 점을 정리해 갔다|처음엔 실패를 말하기 부끄러웠다|실패도 정리하면 강점이 된다|실패 경험 하나를 배운 점과 함께 준비한다
            7|FAILURE|JOB|DOCUMENT|9|SCHEDULE_MANAGEMENT|지원서 여러 개를 동시에 쓰다 오타를 냈어요|지원한 회사 수는 많았다|검토 시간 없이 제출해서 회사 이름이 틀렸다|검토 시간도 일정에 넣어야 한다|제출 하루 전에 소리 내어 읽어 본다
            8|SUCCESS|JOB|ETC|20|ROLE_DIVISION|취업 스터디에서 역할을 나눠 정보를 모았어요|기업 분석, 기출, 뉴스 담당을 나눴다|스터디 시간이 길어져 지쳤다|나눠서 모으면 정보가 빨리 쌓인다|스터디는 한 시간 안에 끝낸다
            9|STOPPED|JOB|ETC|5|ETC|번아웃이 와서 취업 준비를 잠시 쉬었어요|쉬면서 하고 싶은 일을 다시 생각했다|쉬는 법 없이 몇 달을 달렸다|오래 가려면 쉬는 시간도 계획해야 한다|일주일에 하루는 준비를 쉰다
            1|SUCCESS|JOB|DOCUMENT|16|LACK_OF_PREP|직무 관련 자격증을 먼저 따고 지원했어요|자격증으로 기본 역량을 증명했다|자격증 공부로 지원이 한 달 늦어졌다|증명할 수 있는 근거가 있으면 서류가 쉬워진다|필요한 자격증을 방학에 미리 딴다
            2|FAILURE|JOB|INTERVIEW|14|LACK_OF_PREP|토론 면접에서 내 주장만 말했어요|논리적으로 의견을 냈다|다른 사람 의견을 듣지 않는 모습으로 보였다|토론 면접은 듣는 태도도 평가한다|상대 의견을 요약한 뒤 말하는 연습을 한다
            3|SUCCESS|JOB|INTERVIEW|38|USER_RESEARCH|회사 제품을 써 보고 개선안을 가져갔어요|직접 써 본 불편함과 개선안을 한 장으로 정리했다|개선안이 조금 과했다는 피드백을 받았다|직접 써 본 경험이 가장 강한 답이다|개선안은 작고 현실적으로 준비한다
            5|STOPPED|JOB|ETC|4|SCHEDULE_MANAGEMENT|대학원 진학을 고민하느라 취업 준비를 멈췄어요|교수님과 상담하며 선택지를 정리했다|결정을 미루며 두 가지를 다 어정쩡하게 했다|결정에도 마감일이 필요하다|진로 결정 날짜를 정해 둔다
            6|FAILURE|JOB|DOCUMENT|11|USER_RESEARCH,LACK_OF_PREP|직무를 잘못 이해하고 지원했어요|지원서는 성실하게 썼다|마케팅 직무를 홍보 업무로만 생각했다|직무 설명을 정확히 읽어야 한다|직무 설명서의 주요 업무를 정리하고 지원한다
            7|SUCCESS|JOB|ETC|27|SCHEDULE_MANAGEMENT|하루 일정표로 공채 시즌을 버텼어요|자소서, 인적성, 면접 준비 시간을 나눠 적었다|초반엔 일정표를 지키지 못했다|보이는 일정이 불안을 줄인다|하루 할 일을 세 개만 적는다

            9|SUCCESS|PROJECT|PRESENTATION|29|USER_RESEARCH|사용자 인터뷰로 기능을 반으로 줄였어요|인터뷰 다섯 명으로 꼭 필요한 기능만 남겼다|인터뷰 대상 찾는 데 오래 걸렸다|덜어 내는 게 더 어렵고 더 중요하다|인터뷰 대상을 기획 단계에 미리 섭외한다
            1|FAILURE|PROJECT|ETC|13|ROLE_DIVISION|프론트와 백엔드가 API 약속 없이 개발했어요|각자 맡은 부분은 빨리 만들었다|합칠 때 필드 이름이 달라 다 고쳐야 했다|API 문서를 먼저 정해야 한다|개발 전에 API 명세를 함께 쓴다
            2|SUCCESS|PROJECT|ETC|21|SCHEDULE_MANAGEMENT|2주 스프린트로 학기 프로젝트를 끝냈어요|2주마다 목표와 회고를 했다|첫 스프린트 목표를 너무 크게 잡았다|짧게 끊으면 끝까지 갈 수 있다|스프린트 목표는 세 개 이하로 정한다
            3|STOPPED|PROJECT|ETC|5|LACK_OF_PREP|서버 비용 때문에 배포를 못 했어요|기능 개발은 대부분 끝냈다|배포 방법과 비용을 미리 알아보지 않았다|배포도 개발 계획에 넣어야 한다|무료 배포 방법을 처음에 정한다
            5|FAILURE|PROJECT|PRESENTATION|18|SCHEDULE_MANAGEMENT|발표 전날 merge하다가 다 꼬였어요|기능은 각자 다 만들었다|마지막 날 한꺼번에 합쳐 충돌이 났다|자주 합쳐야 덜 꼬인다|하루에 한 번은 dev 브랜치에 합친다
            6|SUCCESS|PROJECT|PRESENTATION|34|ROLE_DIVISION|역할 분담표 하나로 4인 팀 프로젝트 완주했어요|기획, 디자인, 프론트, 백엔드를 처음에 정했다|중간에 한 명이 바빠져 일이 몰렸다|역할이 분명하면 빈자리도 빨리 보인다|역할마다 백업 담당을 정해 둔다
            7|FAILURE|PROJECT|ETC|8|LACK_OF_PREP|테스트 없이 배포했다가 시연 중에 에러 났어요|화면 디자인은 완성도가 높았다|배포 환경에서 한 번도 테스트하지 않았다|로컬에서 된다고 배포에서 되는 건 아니다|배포 후 핵심 기능을 직접 눌러 본다
            8|STOPPED|PROJECT|ETC|2|ROLE_DIVISION,SCHEDULE_MANAGEMENT|팀원 절반이 휴학해서 프로젝트를 접었어요|남은 인원으로 기획 문서는 정리했다|팀원 상황을 미리 공유하지 않았다|서로의 상황을 알아야 계획을 바꿀 수 있다|한 달에 한 번 팀원 상황을 공유한다
            9|SUCCESS|PROJECT|ETC|23|USER_RESEARCH|베타 테스터 20명 피드백으로 앱을 고쳤어요|구글폼으로 불편한 점을 모아 우선순위를 정했다|피드백이 많아 다 반영하지 못했다|모든 피드백보다 많이 나온 피드백이 중요하다|피드백은 많이 나온 순서로 고친다
            1|FAILURE|PROJECT|PRESENTATION|12|LACK_OF_PREP|발표 자료를 개발자만 만들어서 어려웠대요|기술 설명은 자세히 했다|사용자 입장 설명이 없어 이해하기 어려웠다|발표는 듣는 사람 눈높이로 해야 한다|발표 자료를 비전공자 친구에게 먼저 보여 준다
            2|STOPPED|PROJECT|ETC|3|LACK_OF_PREP|아이디어가 너무 커서 시작도 못 했어요|아이디어 회의는 정말 즐거웠다|무엇부터 만들지 정하지 못했다|작게 시작해야 시작할 수 있다|첫 주에 만들 화면 하나만 정한다
            3|SUCCESS|PROJECT|PRESENTATION|26|SCHEDULE_MANAGEMENT,ROLE_DIVISION|노션 칸반 보드로 할 일을 관리했어요|할 일, 하는 중, 완료로 나눠 매일 옮겼다|카드가 너무 잘게 쪼개져 관리가 번거로웠다|진행 상황이 보이면 서로 재촉할 일이 없다|카드는 하루 단위로 만든다
            5|FAILURE|PROJECT|ETC|10|ROLE_DIVISION|코드 리뷰 없이 각자 올려서 코드가 엉망이 됐어요|개발 속도는 빨랐다|코드 스타일이 달라 나중에 고치기 어려웠다|리뷰는 속도를 늦추는 게 아니라 지켜 준다|PR마다 한 명은 리뷰하고 merge한다

            6|SUCCESS|ETC|ETC|20|SCHEDULE_MANAGEMENT|토익 목표 점수, 6주 계획으로 달성했어요|주차별 목표를 정하고 매주 모의고사를 풀었다|리스닝에 비해 리딩 시간이 부족했다|주차별 계획이 막연한 공부보다 낫다|약한 파트에 시간을 더 배정한다
            7|FAILURE|ETC|ETC|8|LACK_OF_PREP|자격증 실기를 이론만 보고 갔다가 떨어졌어요|필기는 한 번에 붙었다|실기 연습을 거의 하지 않았다|실기는 손으로 익혀야 한다|실기 기출을 시간 재며 세 번 푼다
            8|STOPPED|ETC|ETC|4|SCHEDULE_MANAGEMENT|운동 습관 만들기를 3주 만에 멈췄어요|처음 3주는 매일 했다|시험 기간에 한 번 빠진 뒤 다시 시작하지 못했다|빠졌을 때 다시 시작하는 규칙이 필요하다|하루 빠지면 다음 날 10분만이라도 한다
            9|SUCCESS|ETC|DOCUMENT|15|LACK_OF_PREP|교환학생 서류를 한 달 전에 끝내서 합격했어요|필요한 서류를 체크리스트로 만들어 하나씩 준비했다|추천서 받는 데 시간이 오래 걸렸다|서류는 다른 사람 손을 거치는 게 제일 오래 걸린다|추천서는 가장 먼저 부탁한다
            1|FAILURE|ETC|DOCUMENT|11|LACK_OF_PREP,SCHEDULE_MANAGEMENT|장학금 서류를 하나 빠뜨려서 떨어졌어요|자기소개서는 정성껏 썼다|성적 증명서 제출을 놓쳤다|제출 서류는 체크리스트로 확인해야 한다|공고의 제출 서류 목록을 그대로 체크리스트로 만든다
            2|SUCCESS|ETC|ETC|24|ROLE_DIVISION|학과 행사 준비위원으로 행사를 무사히 끝냈어요|섭외, 홍보, 진행 담당을 나눠 준비했다|예산 정리를 마지막에 몰아서 했다|담당이 나뉘면 행사 당일이 편하다|예산 담당도 처음부터 정한다
            3|STOPPED|ETC|ETC|6|LACK_OF_PREP|유튜브 채널을 열었다가 영상 세 개로 멈췄어요|첫 영상은 반응이 꽤 좋았다|촬영과 편집에 시간이 너무 들었다|지속하려면 만드는 방식을 가볍게 해야 한다|편집 템플릿을 만들어 시간을 줄인다
            5|FAILURE|ETC|ETC|13|SCHEDULE_MANAGEMENT|코딩 테스트 대비를 몰아서 하다 지쳤어요|하루에 열 문제씩 풀었다|일주일 만에 지쳐서 손을 놨다|많이보다 꾸준히가 중요하다|하루 두 문제씩 매일 푼다
            6|SUCCESS|ETC|ETC|31|LACK_OF_PREP|학교 해커톤 수상, 사전 준비가 핵심이었어요|사용할 기술을 미리 연습하고 갔다|아이디어 회의가 길어져 개발 시간이 줄었다|해커톤은 시작 전에 이미 절반이 결정된다|아이디어 후보를 세 개 미리 정해 간다
            7|STOPPED|ETC|ETC|3|ETC|사이드 창업 아이디어를 시장 조사 후 접었어요|시장 조사를 꼼꼼히 했다|비슷한 서비스가 이미 많다는 걸 늦게 알았다|일찍 접는 것도 좋은 결정이다|아이디어가 생기면 바로 경쟁 서비스부터 찾는다
            8|FAILURE|ETC|INTERVIEW|9|LACK_OF_PREP|학생회 면접에서 공약을 설명하지 못했어요|하고 싶은 일은 많았다|구체적인 실행 방법이 없었다|계획은 방법까지 있어야 믿음을 준다|공약마다 실행 단계를 세 개씩 적는다
            9|SUCCESS|ETC|ETC|18|SCHEDULE_MANAGEMENT,USER_RESEARCH|학과 스터디를 한 학기 동안 운영했어요|수요 조사로 시간과 주제를 정했다|중간고사 이후 참여율이 떨어졌다|원하는 걸 물어보면 참여율이 오른다|중간에 한 번 더 수요 조사를 한다
            1|STOPPED|ETC|ETC|2|SCHEDULE_MANAGEMENT|매일 일기 쓰기를 한 달 만에 그만뒀어요|한 달 동안은 빠짐없이 썼다|쓰는 시간을 정하지 않아 미루다 끊겼다|습관은 시간을 정해야 이어진다|자기 전 5분을 일기 시간으로 정한다
            2|FAILURE|ETC|DOCUMENT|7|USER_RESEARCH|연구실 인턴 지원서에 연구 주제를 잘못 썼어요|성적과 수업 경험은 잘 정리했다|교수님 연구 분야를 제대로 알아보지 않았다|지원하는 곳의 관심사를 먼저 알아야 한다|최근 논문 제목 세 개를 읽고 지원한다
            3|SUCCESS|ETC|ETC|28|ROLE_DIVISION,SCHEDULE_MANAGEMENT|동아리 정기 공연을 역할표로 준비했어요|무대, 홍보, 연습 담당을 나눠 주간 일정을 공유했다|리허설 장소 예약을 늦게 했다|역할표와 일정표가 있으면 큰 행사도 굴러간다|장소 예약은 한 달 전에 한다
            5|STOPPED|ETC|ETC|5|LACK_OF_PREP|제2외국어 공부를 교재만 사고 멈췄어요|교재와 강의는 골라 두었다|목표 없이 시작해 금방 흐지부지됐다|목표가 있어야 공부가 이어진다|시험 날짜를 먼저 정하고 공부를 시작한다
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
                    .challengeType(ChallengeType.valueOf(f[2]))
                    .stage(Stage.valueOf(f[3]))
                    .title(f[6])
                    .goodPoints(f[7])
                    .badPoints(f[8])
                    .lessons(f[9])
                    .nextPlan(f[10])
                    .factorTags(tags)
                    .build());
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
