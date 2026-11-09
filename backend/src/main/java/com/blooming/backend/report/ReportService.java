package com.blooming.backend.report;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.global.exception.ApiException;
import com.blooming.backend.post.Post;
import com.blooming.backend.post.PostRepository;
import com.blooming.backend.post.PostStatus;
import com.blooming.backend.reaction.ReactionRepository;
import com.blooming.backend.user.Role;
import com.blooming.backend.user.User;
import com.blooming.backend.user.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    /** 신고가 이만큼 쌓이면 글을 숨긴다 (팀에서 바꿔도 됨) */
    public static final int HIDE_THRESHOLD = 3;

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final ReactionRepository reactionRepository;
    private final UserService userService;

    public record ReportRequest(ReportReason reason, String detail) {
    }

    public record ReportResult(String message) {
    }

    public record HiddenPost(Long postId, String title, String authorNickname, int reportCount,
            LocalDateTime createdAt) {
    }

    // ===== 사용자: 신고하기 =====

    @Transactional
    public ReportResult report(Long userId, Long postId, ReportRequest request) {
        if (request == null || request.reason() == null) {
            throw ApiException.badRequest("신고 사유를 골라 주세요");
        }
        String detail = request.detail() == null ? null : request.detail().trim();
        if (detail != null && detail.length() > 200) {
            throw ApiException.badRequest("신고 내용은 200자 이내로 적어 주세요");
        }

        Post post = getPost(postId);
        if (post.isWrittenBy(userId)) {
            throw ApiException.badRequest("내 글은 신고할 수 없어요");
        }
        if (reportRepository.existsByUserIdAndPostId(userId, postId)) {
            throw ApiException.conflict("이미 신고한 글이에요");
        }

        User user = userService.getUser(userId);
        reportRepository.save(new Report(user, post, request.reason(), detail));
        post.addReport(HIDE_THRESHOLD);
        return new ReportResult("신고가 접수됐어요");
    }

    // ===== 관리자: 검토 대상 목록 / 복구 / 삭제 =====

    public List<HiddenPost> getHiddenPosts(Long adminId) {
        checkAdmin(adminId);
        return postRepository.findAllByStatusOrderByCreatedAtDesc(PostStatus.HIDDEN).stream()
                .map(p -> new HiddenPost(p.getId(), p.getTitle(), p.getAuthor().getNickname(),
                        p.getReportCount(), p.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void restore(Long adminId, Long postId) {
        checkAdmin(adminId);
        Post post = getPost(postId);
        reportRepository.deleteAllByPostId(postId);
        post.restore();
    }

    @Transactional
    public void delete(Long adminId, Long postId) {
        checkAdmin(adminId);
        Post post = getPost(postId);
        reportRepository.deleteAllByPostId(postId);
        reactionRepository.deleteAllByPostId(postId);
        postRepository.delete(post);
    }

    private void checkAdmin(Long userId) {
        if (userService.getUser(userId).getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "관리자만 할 수 있어요");
        }
    }

    private Post getPost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> ApiException.notFound("게시글을 찾을 수 없어요"));
    }
}
