package com.blooming.backend.checklist;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blooming.backend.global.exception.ApiException;
import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.user.User;
import com.blooming.backend.user.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChecklistService {

    private final ChecklistRepository checklistRepository;
    private final UserService userService;

    public record CreateRequest(String content, ChecklistSource source, ChallengeType challengeType) {
    }

    /** 여러 개 한 번에 담기 (로드맵/요인 분석에서 '전부 담기'용) */
    public record BulkCreateRequest(List<String> contents, ChecklistSource source, ChallengeType challengeType) {
    }

    public record UpdateRequest(String content, Boolean done) {
    }

    public record ItemResponse(Long id, String content, boolean done, ChecklistSource source,
            ChallengeType challengeType) {
        static ItemResponse from(ChecklistItem item) {
            return new ItemResponse(item.getId(), item.getContent(), item.isDone(), item.getSource(),
                    item.getChallengeType());
        }
    }

    public record ChecklistResponse(List<ItemResponse> items, int total, int doneCount) {
        static ChecklistResponse from(List<ChecklistItem> items) {
            List<ItemResponse> list = items.stream().map(ItemResponse::from).toList();
            int done = (int) items.stream().filter(ChecklistItem::isDone).count();
            return new ChecklistResponse(list, list.size(), done);
        }
    }

    public ChecklistResponse getMine(Long userId, ChallengeType challengeType) {
        List<ChecklistItem> items = challengeType == null
                ? checklistRepository.findAllByUserIdOrderByCreatedAtAsc(userId)
                : checklistRepository.findAllByUserIdAndChallengeTypeOrderByCreatedAtAsc(userId, challengeType);
        return ChecklistResponse.from(items);
    }

    @Transactional
    public ItemResponse create(Long userId, CreateRequest request) {
        if (request == null) {
            throw ApiException.badRequest("항목 내용을 적어 주세요");
        }
        User user = userService.getUser(userId);
        ChecklistItem item = new ChecklistItem(user, request.challengeType(), validContent(request.content()),
                request.source() == null ? ChecklistSource.CUSTOM : request.source());
        return ItemResponse.from(checklistRepository.save(item));
    }

    @Transactional
    public ChecklistResponse createAll(Long userId, BulkCreateRequest request) {
        if (request == null || request.contents() == null || request.contents().isEmpty()) {
            throw ApiException.badRequest("담을 항목이 없어요");
        }
        User user = userService.getUser(userId);
        ChecklistSource source = request.source() == null ? ChecklistSource.CUSTOM : request.source();
        List<ChecklistItem> items = request.contents().stream()
                .map(c -> new ChecklistItem(user, request.challengeType(), validContent(c), source))
                .toList();
        checklistRepository.saveAll(items);
        return getMine(userId, request.challengeType());
    }

    @Transactional
    public ItemResponse update(Long userId, Long itemId, UpdateRequest request) {
        ChecklistItem item = getMyItem(userId, itemId);
        if (request != null && request.content() != null) {
            item.changeContent(validContent(request.content()));
        }
        if (request != null && request.done() != null) {
            item.changeDone(request.done());
        }
        return ItemResponse.from(item);
    }

    @Transactional
    public void delete(Long userId, Long itemId) {
        checklistRepository.delete(getMyItem(userId, itemId));
    }

    private ChecklistItem getMyItem(Long userId, Long itemId) {
        ChecklistItem item = checklistRepository.findById(itemId)
                .orElseThrow(() -> ApiException.notFound("체크리스트 항목을 찾을 수 없어요"));
        if (!item.isOwnedBy(userId)) {
            throw ApiException.notFound("체크리스트 항목을 찾을 수 없어요");
        }
        return item;
    }

    private String validContent(String content) {
        if (content == null || content.isBlank()) {
            throw ApiException.badRequest("항목 내용을 적어 주세요");
        }
        String trimmed = content.trim();
        if (trimmed.length() > 100) {
            throw ApiException.badRequest("항목은 100자 이내로 적어 주세요");
        }
        return trimmed;
    }
}
