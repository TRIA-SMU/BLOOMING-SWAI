package com.blooming.backend.ai;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.blooming.backend.ai.AiAnalysisService.AnalyzeRequest;
import com.blooming.backend.ai.AiAnalysisService.AnalyzeResponse;
import com.blooming.backend.global.auth.LoginUser;
import com.blooming.backend.post.ChallengeType;
import com.blooming.backend.roadmap.RoadmapService;
import com.blooming.backend.roadmap.RoadmapService.Availability;
import com.blooming.backend.roadmap.RoadmapService.RoadmapRequest;
import com.blooming.backend.roadmap.RoadmapService.RoadmapResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiAnalysisService aiAnalysisService;
    private final RoadmapService roadmapService;

    /** 글쓰기 화면 'AI로 정리하기' (저장하지 않고 제안만) */
    @PostMapping("/api/ai/analyze")
    public AnalyzeResponse analyze(@LoginUser Long userId, @RequestBody AnalyzeRequest request) {
        return aiAnalysisService.analyze(userId, request);
    }

    /** 로드맵 받을 수 있는지 (내 기록 3개 이상?) */
    @GetMapping("/api/roadmaps/availability")
    public Availability availability(@LoginUser Long userId) {
        return roadmapService.availability(userId);
    }

    /** 로드맵 만들기 (자동 저장). body: {"challengeType": "CONTEST"} */
    @PostMapping("/api/roadmaps")
    public RoadmapResponse create(@LoginUser Long userId, @RequestBody RoadmapRequest request) {
        return roadmapService.create(userId, request);
    }

    /** 가장 최근 로드맵 보기. /api/roadmaps/latest?challengeType=CONTEST */
    @GetMapping("/api/roadmaps/latest")
    public RoadmapResponse latest(@LoginUser Long userId, @RequestParam ChallengeType challengeType) {
        return roadmapService.latest(userId, challengeType);
    }
}
