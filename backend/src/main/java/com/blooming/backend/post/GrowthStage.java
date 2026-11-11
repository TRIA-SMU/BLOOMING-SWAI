package com.blooming.backend.post;

/**
 * 성장 단계. '도움이 돼요' 수로 정해진다. (기준 개수는 팀에서 바꿔도 됨)
 */
public enum GrowthStage {
    SEED("씨앗", 0),
    SPROUT("싹", 3),
    BUD("봉우리", 10),
    FLOWER("꽃", 30);

    private final String label;
    private final int minCount;

    GrowthStage(String label, int minCount) {
        this.label = label;
        this.minCount = minCount;
    }

    public String getLabel() {
        return label;
    }

    public int getMinCount() {
        return minCount;
    }

    public static GrowthStage from(int helpfulCount) {
        GrowthStage result = SEED;
        for (GrowthStage stage : values()) {
            if (helpfulCount >= stage.minCount) {
                result = stage;
            }
        }
        return result;
    }
}
