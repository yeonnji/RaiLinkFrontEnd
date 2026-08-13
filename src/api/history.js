const historySummaryEndpoint =
  import.meta.env.VITE_HISTORY_SUMMARY_API_PATH || "/api/history/summary";
const historyListEndpoint =
  import.meta.env.VITE_HISTORY_LIST_API_PATH || "/api/history";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const parseJsonObject = (value) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
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

export async function requestHistoryList(
  {
    keyword = "",
    period = "30",
    transportMode = "all",
    costSaving = "all",
    sort = "latest",
    page = 1,
    pageSize = 5,
  } = {},
  { signal } = {},
) {
  const searchParams = new URLSearchParams({
    period: String(period),
    transportMode,
    costSaving,
    sort,
    page: String(page),
    pageSize: String(pageSize),
  });

  if (keyword.trim()) {
    searchParams.set("keyword", keyword.trim());
  }

  const response = await fetch(`${historyListEndpoint}?${searchParams}`, {
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
      data?.message || data?.error || `히스토리 목록 조회에 실패했습니다. (${response.status})`,
    );
  }

  if (!Array.isArray(data?.items) || !data?.pagination) {
    throw new Error("히스토리 목록 응답 형식이 올바르지 않습니다.");
  }

  return {
    items: data.items.map((item) => ({
      ...item,
      cargoWeightTon: toNumber(item.cargoWeightTon),
      railRatio: toNumber(item.railRatio),
      costSavingRate: toNumber(item.costSavingRate),
      costSavingWon: toNumber(item.costSavingWon),
      carbonSavingRate: toNumber(item.carbonSavingRate),
      carbonSavingKg: toNumber(item.carbonSavingKg),
      transportLegs: Array.isArray(item.transportLegs) ? item.transportLegs : [],
    })),
    pagination: {
      page: Math.max(1, toNumber(data.pagination.page) || 1),
      pageSize: Math.max(1, toNumber(data.pagination.pageSize) || pageSize),
      totalItems: Math.max(0, toNumber(data.pagination.totalItems)),
      totalPages: Math.max(0, toNumber(data.pagination.totalPages)),
      hasPrevious: Boolean(data.pagination.hasPrevious),
      hasNext: Boolean(data.pagination.hasNext),
    },
  };
}

export async function requestHistoryDetail(receptNo, { signal } = {}) {
  if (!receptNo) {
    throw new Error("상세 조회에 필요한 접수번호가 없습니다.");
  }

  const response = await fetch(`${historyListEndpoint}/${encodeURIComponent(receptNo)}`, {
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
      data?.message || data?.error || `히스토리 상세 조회에 실패했습니다. (${response.status})`,
    );
  }

  const inputJson = parseJsonObject(data?.inputJson) || {};
  const outputJson = parseJsonObject(data?.outputJson);

  if (!outputJson) {
    throw new Error("히스토리 상세 결과 형식이 올바르지 않습니다.");
  }

  return {
    ...data,
    receptNo: data.receptNo || receptNo,
    inputJson,
    outputJson,
  };
}
