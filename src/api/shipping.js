const shippingRecommendationEndpoint =
  import.meta.env.VITE_SHIPPING_API_PATH || "/api/Shipping/recommend";

export async function requestShippingRecommendation(payload, { signal } = {}) {
  const response = await fetch(shippingRecommendationEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
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
      data?.message || data?.error || `추천 요청에 실패했습니다. (${response.status})`,
    );
  }

  if (!data?.recommendation || !data?.cost || !data?.time) {
    throw new Error("추천 결과 형식이 올바르지 않습니다.");
  }

  return data;
}
