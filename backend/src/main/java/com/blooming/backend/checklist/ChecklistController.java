package com.blooming.backend.checklist;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blooming.backend.checklist.ChecklistService.BulkCreateRequest;
import com.blooming.backend.checklist.ChecklistService.ChecklistResponse;
import com.blooming.backend.checklist.ChecklistService.CreateRequest;
import com.blooming.backend.checklist.ChecklistService.ItemResponse;
import com.blooming.backend.checklist.ChecklistService.UpdateRequest;
import com.blooming.backend.global.auth.LoginUser;
import com.blooming.backend.post.ChallengeType;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/checklist")
@RequiredArgsConstructor
public class ChecklistController {

    private final ChecklistService checklistService;

    /** 내 체크리스트 (?challengeType=CONTEST 로 거를 수 있음) */
    @GetMapping
    public ChecklistResponse mine(@LoginUser Long userId,
            @RequestParam(required = false) ChallengeType challengeType) {
        return checklistService.getMine(userId, challengeType);
    }

    /** 항목 하나 추가. body: {"content": "...", "source": "CUSTOM", "challengeType": "CONTEST"} */
    @PostMapping
    public ItemResponse create(@LoginUser Long userId, @RequestBody CreateRequest request) {
        return checklistService.create(userId, request);
    }

    /** 여러 개 한 번에 담기. body: {"contents": ["...", "..."], "source": "ROADMAP", "challengeType": "CONTEST"} */
    @PostMapping("/bulk")
    public ChecklistResponse createAll(@LoginUser Long userId, @RequestBody BulkCreateRequest request) {
        return checklistService.createAll(userId, request);
    }

    /** 내용 수정 또는 완료 체크. body: {"done": true} 또는 {"content": "..."} */
    @PatchMapping("/{itemId}")
    public ItemResponse update(@LoginUser Long userId, @PathVariable Long itemId,
            @RequestBody UpdateRequest request) {
        return checklistService.update(userId, itemId, request);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> delete(@LoginUser Long userId, @PathVariable Long itemId) {
        checklistService.delete(userId, itemId);
        return ResponseEntity.noContent().build();
    }
}
