const historySummaryEndpoint =
  import.meta.env.VITE_HISTORY_SUMMARY_API_PATH || "/api/history/summary";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export async function requestHistorySummary({ signal } = {}) {
  const response = await fetch(historySummaryEndpoint, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // JSON 본문이 없는 오류 응답은 상태 코드로 처리합니다.
  }

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `히스토리 요약 조회에 실패했습니다. (${response.status})`,
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error("히스토리 요약 응답 형식이 올바르지 않습니다.");
  }

  return {
    weeklyAnalysisCount: toNumber(data.weeklyAnalysisCount),
    railRecommendationCount: toNumber(data.railRecommendationCount),
    railRecommendationRate: toNumber(data.railRecommendationRate),
    averageCostSavingRate: toNumber(data.averageCostSavingRate),
    averageCarbonSavingRate: toNumber(data.averageCarbonSavingRate),
    latestAnalysis:
      data.latestAnalysis && typeof data.latestAnalysis === "object"
        ? data.latestAnalysis
        : null,
  };
}
