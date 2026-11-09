package com.blooming.backend.report;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.blooming.backend.global.auth.LoginUser;
import com.blooming.backend.report.ReportService.HiddenPost;
import com.blooming.backend.report.ReportService.ReportRequest;
import com.blooming.backend.report.ReportService.ReportResult;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** 신고하기. body: {"reason": "SPAM", "detail": "선택"} */
    @PostMapping("/api/posts/{postId}/report")
    public ReportResult report(@LoginUser Long userId, @PathVariable Long postId,
            @RequestBody ReportRequest request) {
        return reportService.report(userId, postId, request);
    }

    /** [관리자] 신고 누적으로 숨겨진 글 목록 */
    @GetMapping("/api/admin/reports")
    public List<HiddenPost> hiddenPosts(@LoginUser Long userId) {
        return reportService.getHiddenPosts(userId);
    }

    /** [관리자] 복구 */
    @PostMapping("/api/admin/posts/{postId}/restore")
    public ResponseEntity<Void> restore(@LoginUser Long userId, @PathVariable Long postId) {
        reportService.restore(userId, postId);
        return ResponseEntity.noContent().build();
    }

    /** [관리자] 삭제 */
    @DeleteMapping("/api/admin/posts/{postId}")
    public ResponseEntity<Void> delete(@LoginUser Long userId, @PathVariable Long postId) {
        reportService.delete(userId, postId);
        return ResponseEntity.noContent().build();
    }
}
