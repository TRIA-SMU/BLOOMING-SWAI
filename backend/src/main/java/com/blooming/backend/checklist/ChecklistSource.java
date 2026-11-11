package com.blooming.backend.checklist;

/** 체크리스트 항목이 어디서 왔는지 */
public enum ChecklistSource {
    INSIGHT,  // 요인 분석에서 담음
    ROADMAP,  // AI 로드맵에서 담음
    CUSTOM    // 직접 추가
}
