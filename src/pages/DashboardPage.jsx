import { forwardRef, useEffect, useRef, useState } from "react";
import { requestShippingRecommendation } from "../api/shipping.js";
import { DashboardFrame, PrimaryNav } from "../components/AppShell.jsx";
import ShipmentPanel from "../components/ShipmentPanel.jsx";
import { defaultShippingResult } from "../data/defaultShippingResult.js";
import {
  formatDuration,
  formatKm,
  formatPercent,
  formatShortDate,
  formatWon,
  priorityLabels,
} from "../utils/shippingFormatters.js";

const getRecommendedMode = (result) =>
  result.recommendation?.recommended_mode === "road" ? "road" : "multimodal";

const getModeName = (mode) =>
  mode === "road" ? "도로 100% 운송" : "철도 복합운송";

const getStationLabel = (station) => {
  if (!station) return "화물역";
  return /역$/.test(station) ? `${station} CY` : `${station} CY`;
};

const formatEmission = (value) => {
  const emission = Number(value) || 0;
  return `${emission.toLocaleString("ko-KR", {
    minimumFractionDigits: Number.isInteger(emission) ? 0 : 1,
    maximumFractionDigits: 1,
  })}kgCO₂e`;
};

const getTrainSummary = (trainNumbers) => {
  const trains = String(trainNumbers || "")
    .split("|")
    .map((train) => train.trim())
    .filter(Boolean);

  if (!trains.length) return "열차 정보 없음";
  return trains.length === 1 ? trains[0] : `${trains[0]} 외 ${trains.length - 1}편`;
};

const getOperationSummary = (result) => {
  const days = Array.isArray(result.schedule?.operation_days)
    ? result.schedule.operation_days
    : String(result.rail?.operation_days || "")
        .split("|")
        .filter(Boolean);
  const daysLabel = days.length >= 7 ? "매일 운행" : `${days.join("·") || "운행일 미정"}`;
  const availability = result.schedule?.available_today
    ? "당일 가능"
    : `대기 ${result.schedule?.waiting_days || 0}일`;
  return `${daysLabel} · ${availability}`;
};

const buildRecommendationReason = (result) => {
  const recommendedMode = getRecommendedMode(result);
  const costDifference = Number(result.cost?.cost_difference_won) || 0;
  const timeDifference = Number(result.time?.time_difference_min) || 0;
  const carbonReduction = Number(result.carbon?.carbon_reduction_rate) || 0;

  if (recommendedMode === "road") {
    const costText =
      costDifference >= 0
        ? `복합운송 대비 ${formatWon(Math.abs(costDifference))} 절감`
        : `복합운송 대비 ${formatWon(Math.abs(costDifference))} 증가`;
    const timeText =
      timeDifference >= 0
        ? `${formatDuration(Math.abs(timeDifference))} 빠름`
        : `${formatDuration(Math.abs(timeDifference))} 느림`;
    return `${costText} · ${timeText} · 복합운송 전환 시 탄소 ${formatPercent(carbonReduction)} 감소`;
  }

  const costText =
    costDifference <= 0
      ? `도로 대비 ${formatWon(Math.abs(costDifference))} 절감`
      : `도로 대비 ${formatWon(Math.abs(costDifference))} 증가`;
  const operationText = result.schedule?.available_today
    ? "희망 운송일 철도 운행 가능"
    : `${result.schedule?.next_available_date || "다음 운행일"} 운행 가능`;
  return `${costText} · 탄소 ${formatPercent(carbonReduction)} 감소 · ${operationText}`;
};

const getCleanExplanation = (result) => {
  const reason = buildRecommendationReason(result);
  return (result.ai_explanation_error
    ? reason
    : result.ai_explanation || reason
  ).replaceAll("**", "");
};

function MetricCard({ mode, recommended, result }) {
  const road = mode === "road";
  const totalCost = road
    ? result.cost?.road_only?.total_cost_won
    : result.cost?.multimodal_total_cost_won;
  const duration = road
    ? result.time?.road_only_time_min
    : result.time?.multimodal_total_time_min;

  return (
    <div className={`metric-card${recommended ? " recommended" : ""}`}>
      <span className={`metric-label${road ? " orange-label" : ""}`}>
        {recommended ? "최종 추천" : "비교안"}
      </span>
      <div className="metric-grid">
        <span><small>총운임</small><strong>{formatWon(totalCost)}</strong></span>
        <span><small>소요</small><strong>{formatDuration(duration, true)}</strong></span>
        <span>
          <small>CO₂</small>
          <strong className={road ? "orange" : "green"}>
            {road ? "기준 100" : `${formatPercent(result.carbon?.carbon_reduction_rate)} ↓`}
          </strong>
        </span>
        <span><small>환적</small><strong>{road ? "0회" : "2회"}</strong></span>
      </div>
    </div>
  );
}

function RouteVisual({ mode, result }) {
  const originName = result.origin?.name || "출발지";
  const destinationName = result.destination?.name || "도착지";

  if (mode === "road") {
    return (
      <div className="route-visual road-route" aria-label={`${originName}에서 ${destinationName}까지 도로 단독운송 경로`}>
        <div className="place-labels two"><span>{originName}</span><span>{destinationName}</span></div>
        <div className="road-line route-line">
          <i className="route-node first" />
          <i className="route-node last" />
          <span className="truck-icon" aria-hidden="true" />
        </div>
        <strong className="road-note">
          도로 직송 {formatKm(result.road_only?.distance_km)} · 환적 없음
        </strong>
      </div>
    );
  }

  return (
    <div className="route-visual rail-route" aria-label={`${originName}에서 ${destinationName}까지 철도 복합운송 경로`}>
      <div className="place-labels four">
        <span>{originName}</span>
        <span>{getStationLabel(result.departure_station || result.rail?.origin_station)}</span>
        <span>{getStationLabel(result.arrival_station || result.rail?.destination_station)}</span>
        <span>{destinationName}</span>
      </div>
      <div className="rail-line route-line">
        <i className="route-node first" />
        <i className="route-node second" />
        <span className="train-icon" aria-hidden="true" />
      </div>
      <div className="distance-labels three">
        <span>도로 {formatKm(result.first_mile?.distance_km)}</span>
        <strong>철도 본선 {formatKm(result.rail?.distance_km)}</strong>
        <span>도로 {formatKm(result.last_mile?.distance_km)}</span>
      </div>
    </div>
  );
}

function RouteOption({ mode, order, recommended, result }) {
  const road = mode === "road";

  return (
    <article className={`route-option${recommended ? " selected" : ""}`}>
      <span className={`route-order${recommended ? "" : " muted"}`}>{String(order).padStart(2, "0")}</span>
      <div className="route-title">
        <em className={recommended ? undefined : "muted-tag"}>{recommended ? "추천" : "비교안"}</em>
        <strong>{getModeName(mode)}</strong>
        <small>{road ? "Direct Truck" : "Truck → Rail → Truck"}</small>
      </div>
      <RouteVisual mode={mode} result={result} />
      <MetricCard mode={mode} recommended={recommended} result={result} />
    </article>
  );
}

function ComparisonPanel({ includeComparison, result }) {
  const recommendedMode = getRecommendedMode(result);
  const otherMode = recommendedMode === "road" ? "multimodal" : "road";
  const modes = includeComparison ? [recommendedMode, otherMode] : [recommendedMode];
  const reason = buildRecommendationReason(result);

  return (
    <section
      className={`comparison-panel${includeComparison ? "" : " single-option"}`}
      aria-labelledby="comparison-title"
    >
      <header className="panel-heading comparison-heading">
        <h2 id="comparison-title">
          추천 운송 경로 · {priorityLabels[result.priority] || "균형형"}
        </h2>
        <i />
        <button type="button">철도 vs 도로 비교</button>
        <span>최적경로 기준</span>
      </header>

      {modes.map((mode, index) => (
        <RouteOption
          key={mode}
          mode={mode}
          order={index + 1}
          recommended={index === 0}
          result={result}
        />
      ))}

      <footer className="comparison-reason">
        <strong>최종 추천 사유</strong>
        <span>{reason}</span>
      </footer>
    </section>
  );
}

const getScheduleRows = (result, mode) => {
  const originName = result.origin?.name || "출발지";
  const destinationName = result.destination?.name || "도착지";
  const departureStation = result.departure_station || result.rail?.origin_station || "출발 화물역";
  const arrivalStation = result.arrival_station || result.rail?.destination_station || "도착 화물역";

  if (mode === "road") {
    return [
      {
        number: "01",
        route: `${originName} → ${destinationName}`,
        detail: `Direct truck · ${result.cost?.road_only?.weight_class || "적용 톤급 확인"}`,
        method: "도로",
        distance: formatKm(result.road_only?.distance_km),
        duration: formatDuration(result.road_only?.duration_min, true),
        cost: formatWon(result.cost?.road_only?.total_cost_won),
        active: true,
      },
    ];
  }

  return [
    {
      number: "01",
      route: `${originName} → ${departureStation}`,
      detail: `First mile · 통행료 ${formatWon(result.cost?.first_mile?.toll_won)} · CO₂ ${formatEmission(result.carbon?.first_mile_emission_kg)}`,
      method: "도로",
      distance: formatKm(result.first_mile?.distance_km),
      duration: formatDuration(result.first_mile?.duration_min, true),
      cost: formatWon(result.cost?.first_mile?.total_cost_won),
    },
    {
      number: "02",
      route: `${departureStation} → ${arrivalStation}`,
      detail: `${result.rail?.main_lines || "철도 본선"} · ${getTrainSummary(result.rail?.train_numbers)}`,
      method: "철도",
      distance: formatKm(result.rail?.distance_km),
      duration: formatDuration(result.rail?.duration_min, true),
      cost: formatWon(result.cost?.rail?.total_cost_won),
      active: true,
    },
    {
      number: "03",
      route: `${arrivalStation} → ${destinationName}`,
      detail: `Last mile · 통행료 ${formatWon(result.cost?.last_mile?.toll_won)} · CO₂ ${formatEmission(result.carbon?.last_mile_emission_kg)}`,
      method: "도로",
      distance: formatKm(result.last_mile?.distance_km),
      duration: formatDuration(result.last_mile?.duration_min, true),
      cost: formatWon(result.cost?.last_mile?.total_cost_won),
    },
  ];
};

const getTransportDetailItems = (mode, result) => {
  const road = mode === "road";
  return road
    ? [
        ["순수 운송비", formatWon(result.cost?.road_only?.estimated_freight_fare_won)],
        ["통행료", formatWon(result.cost?.road_only?.toll_won)],
        ["적용 톤급", result.cost?.road_only?.weight_class || "-"],
        ["탄소 배출", formatEmission(result.carbon?.road_only_emission_kg)],
      ]
    : [
        ["주요 노선", result.rail?.main_lines || "-"],
        ["운행 열차", getTrainSummary(result.rail?.train_numbers)],
        ["운행 정보", getOperationSummary(result)],
        ["톤당 운임", `${formatWon(result.rail?.fare_per_ton_won)}/톤`],
        ["운송 실적", `${Number(result.rail?.performance_record_count || 0).toLocaleString("ko-KR")}건`],
      ];
};

function TransportDetails({ mode, result }) {
  const road = mode === "road";
  const items = getTransportDetailItems(mode, result);

  return (
    <div className={`transport-details ${road ? "road-details" : "rail-details"}`} aria-label={`${getModeName(mode)} 추가 정보`}>
      {items.map(([label, value]) => (
        <span key={label} title={String(value)}>
          <small>{label}</small>
          <strong>{value}</strong>
        </span>
      ))}
    </div>
  );
}

const ShippingPdfReport = forwardRef(function ShippingPdfReport({ result }, ref) {
  const mode = getRecommendedMode(result);
  const scheduleRows = getScheduleRows(result, mode);
  const detailItems = getTransportDetailItems(mode, result);
  const reason = buildRecommendationReason(result);
  const explanation = getCleanExplanation(result);
  const roadCost = result.cost?.road_only?.total_cost_won;
  const multimodalCost = result.cost?.multimodal_total_cost_won;
  const recommendedCost = mode === "road" ? roadCost : multimodalCost;
  const comparisonRows = [
    {
      mode: "road",
      name: "도로 100%",
      cost: roadCost,
      duration: result.time?.road_only_time_min,
      distance: result.distance?.road_only_distance_km,
      emission: result.carbon?.road_only_emission_kg,
      railShare: 0,
    },
    {
      mode: "multimodal",
      name: "철도 복합운송",
      cost: multimodalCost,
      duration: result.time?.multimodal_total_time_min,
      distance: result.distance?.multimodal_total_distance_km,
      emission: result.carbon?.multimodal_emission_kg,
      railShare: result.distance?.rail_ratio,
    },
  ];

  return (
    <div className="pdf-report-stage" aria-hidden="true">
      <article className="pdf-report" ref={ref}>
        <header className="pdf-report-header">
          <div>
            <span>철도 중심 복합물류 AI 의사결정 플랫폼</span>
            <h1>AI 운송 추천 보고서</h1>
          </div>
          <div className="pdf-report-brand">
            <strong>RAILINK</strong>
            <span>{result.shipping_date} 기준</span>
          </div>
        </header>

        <section className="pdf-shipment-summary" aria-label="운송 기본 정보">
          <div className="wide">
            <small>출발지</small>
            <strong>{result.origin?.name || "-"}</strong>
            <span>{result.origin?.address || "주소 정보 없음"}</span>
          </div>
          <div className="wide">
            <small>도착지</small>
            <strong>{result.destination?.name || "-"}</strong>
            <span>{result.destination?.address || "주소 정보 없음"}</span>
          </div>
          <div>
            <small>화물 중량</small>
            <strong>{result.cargo_weight_ton}톤</strong>
          </div>
          <div>
            <small>희망 운송일</small>
            <strong>{result.shipping_date}</strong>
          </div>
        </section>

        <section className={`pdf-recommendation-hero ${mode}`}>
          <div>
            <span>FINAL RECOMMENDATION</span>
            <h2>{result.recommendation?.recommended_name || getModeName(mode)}</h2>
            <p>{reason}</p>
          </div>
          <div>
            <small>예상 총 운송비</small>
            <strong>{formatWon(recommendedCost)}</strong>
            <span>{formatDuration(mode === "road" ? result.time?.road_only_time_min : result.time?.multimodal_total_time_min)}</span>
          </div>
        </section>

        <section className="pdf-report-section pdf-comparison-section">
          <header>
            <span>01</span>
            <h2>운송안 비교</h2>
          </header>
          <div className="pdf-comparison-table">
            <div className="pdf-table-head">
              <span>운송안</span><span>총비용</span><span>소요시간</span><span>총거리</span><span>탄소배출</span><span>철도 비중</span>
            </div>
            {comparisonRows.map((row) => (
              <div className={row.mode === mode ? "recommended" : ""} key={row.mode}>
                <span><strong>{row.name}</strong>{row.mode === mode && <em>추천</em>}</span>
                <span>{formatWon(row.cost)}</span>
                <span>{formatDuration(row.duration)}</span>
                <span>{formatKm(row.distance)}</span>
                <span>{formatEmission(row.emission)}</span>
                <span>{formatPercent(row.railShare)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pdf-report-section pdf-schedule-section">
          <header>
            <span>02</span>
            <h2>선택 운송안 상세 일정</h2>
          </header>
          <div className="pdf-schedule-table">
            <div className="pdf-table-head">
              <span>순서</span><span>운송 구간</span><span>수단</span><span>거리</span><span>소요</span><span>예상 운임</span>
            </div>
            {scheduleRows.map((row) => (
              <div key={row.number}>
                <span>{row.number}</span>
                <span><strong>{row.route}</strong><small>{row.detail}</small></span>
                <span>{row.method}</span>
                <span>{row.distance}</span>
                <span>{row.duration}</span>
                <span>{row.cost}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pdf-report-section pdf-detail-section">
          <header>
            <span>03</span>
            <h2>{getModeName(mode)} 상세 정보</h2>
          </header>
          <div className={`pdf-transport-details columns-${detailItems.length}`}>
            {detailItems.map(([label, value]) => (
              <span key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </span>
            ))}
          </div>
        </section>

        <section className="pdf-ai-summary">
          <span>AI RECOMMENDATION</span>
          <h2>추천 분석</h2>
          <p>{explanation}</p>
        </section>

        <footer className="pdf-report-footer">
          <span>본 견적은 입력 조건과 실시간 운임 데이터를 기반으로 산출된 예상 결과입니다.</span>
          <strong>RAILINK · 1 / 1</strong>
        </footer>
      </article>
    </div>
  );
});

function SchedulePanel({ result }) {
  const mode = getRecommendedMode(result);
  const scheduleRows = getScheduleRows(result, mode);
  const totalCost =
    mode === "road"
      ? result.cost?.road_only?.total_cost_won
      : result.cost?.multimodal_total_cost_won;

  return (
    <section className={`schedule-panel ${mode === "road" ? "road-schedule" : "rail-schedule"}`} aria-labelledby="schedule-title">
      <header className="panel-heading schedule-heading">
        <h2 id="schedule-title">선택 운송안 상세 일정</h2>
        <span>일반화물 {result.cargo_weight_ton}톤</span>
      </header>

      <div
        className={`schedule-table${mode === "road" ? " single-route" : ""}`}
        role="table"
        aria-label="선택 운송안 상세 일정"
      >
        <div className="schedule-columns" role="row">
          <span role="columnheader">순서</span>
          <span role="columnheader">운송 구간</span>
          <span role="columnheader">수단</span>
          <span role="columnheader">거리</span>
          <span role="columnheader">소요</span>
          <span role="columnheader">예상 운임</span>
        </div>

        {scheduleRows.map((row) => (
          <div className={`schedule-row${row.active ? " active" : ""}`} role="row" key={row.number}>
            <span className="schedule-number" role="cell">{row.number}</span>
            <span className="schedule-route" role="cell">
              <strong>{row.route}</strong><small title={row.detail}>{row.detail}</small>
            </span>
            <strong className={row.method === "철도" ? "rail-text" : undefined} role="cell">{row.method}</strong>
            <strong role="cell">{row.distance}</strong>
            <strong role="cell">{row.duration}</strong>
            <strong className="cost" role="cell">{row.cost}</strong>
          </div>
        ))}
      </div>

      <TransportDetails mode={mode} result={result} />

      <footer className="schedule-total">
        <span>운송안 예상 총액</span>
        <span>
          <strong>{formatWon(totalCost)}</strong>
          <small>{mode === "road" ? "도로 단독 운송" : "복합운송 총액"}</small>
        </span>
      </footer>
    </section>
  );
}

function EstimateTicket({ downloadError, isDownloading, onDownload, result }) {
  const mode = getRecommendedMode(result);
  const road = mode === "road";
  const roadCost = Number(result.cost?.road_only?.total_cost_won) || 0;
  const multimodalCost = Number(result.cost?.multimodal_total_cost_won) || 0;
  const totalCost = road ? roadCost : multimodalCost;
  const comparisonCost = road ? multimodalCost : roadCost;
  const selectedDifference = totalCost - comparisonCost;
  const differenceText = `${road ? "복합운송" : "도로"} 대비 ${formatWon(Math.abs(selectedDifference))} ${selectedDifference <= 0 ? "절감" : "증가"}`;
  const duration = road
    ? result.time?.road_only_time_min
    : result.time?.multimodal_total_time_min;
  const railShare = road ? 0 : result.distance?.rail_ratio;
  const validDate = road
    ? result.shipping_date
    : result.schedule?.next_available_date || result.shipping_date;

  return (
    <aside className="estimate-ticket" aria-labelledby="ticket-title">
      <header>
        <div>
          <small>AI ESTIMATE TICKET</small>
          <h2 id="ticket-title">{getModeName(mode)} 견적</h2>
        </div>
        <button
          type="button"
          disabled={isDownloading}
          title={downloadError || "세로형 PDF 보고서 다운로드"}
          aria-busy={isDownloading}
          onClick={onDownload}
        >
          {isDownloading ? "PDF 생성 중…" : "PDF 다운로드"}
        </button>
      </header>

      <div className="ticket-price">
        <small>예상 총 운송비</small>
        <strong>{Math.round(totalCost).toLocaleString("ko-KR")}<em>원</em></strong>
        <b>{differenceText}</b>
        <div>
          <span><small>비교 운송안</small><strong>{formatWon(comparisonCost)}</strong></span>
          <span><small>비용 차이</small><strong>{formatWon(Math.abs(selectedDifference))}</strong></span>
        </div>
      </div>

      <div className="ticket-detail-grid">
        <span><small>LEAD TIME</small><strong>{formatDuration(duration)}</strong></span>
        <span><small>RAIL SHARE</small><strong>{formatPercent(railShare)}</strong></span>
        <span>
          <small>CO₂ REDUCTION</small>
          <strong>{road ? "기준 100" : `${formatPercent(result.carbon?.carbon_reduction_rate)} ↓`}</strong>
        </span>
        <span><small>VALID DATE</small><strong>{formatShortDate(validDate)}</strong></span>
      </div>
    </aside>
  );
}

function Recommendation({ result }) {
  const reason = buildRecommendationReason(result);
  const explanation = getCleanExplanation(result);

  return (
    <section className="recommendation" aria-label="AI 추천 결과">
      <b className="ai-tab">AI</b>
      <span className="recommendation-title">
        <small>AI RECOMMENDATION</small>
        <strong>{result.recommendation?.recommended_name || getModeName(getRecommendedMode(result))}을 추천합니다</strong>
      </span>
      <i />
      <div className="recommendation-copy">
        <p className="recommendation-comment" tabIndex="0">{explanation}</p>
        <strong className="recommendation-summary" title={reason}>{reason}</strong>
      </div>
    </section>
  );
}

const getHistoryShipment = (historyDetail) => {
  if (!historyDetail) return null;

  const input = historyDetail.inputJson || {};
  const output = historyDetail.outputJson || {};
  const origin = typeof input.origin === "object" ? input.origin?.name : input.origin;
  const destination = typeof input.destination === "object"
    ? input.destination?.name
    : input.destination;

  return {
    origin: origin || output.origin?.name || "",
    destination: destination || output.destination?.name || "",
    weight: String(input.cargo_weight_ton ?? output.cargo_weight_ton ?? ""),
    departureDate: input.shipping_date || output.shipping_date || "",
  };
};

export default function DashboardPage({ initialHistoryDetail, onNavigate }) {
  const initialResult = initialHistoryDetail?.outputJson || defaultShippingResult;
  const initialShipment = getHistoryShipment(initialHistoryDetail);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [result, setResult] = useState(initialResult);
  const [estimate, setEstimate] = useState(() => initialHistoryDetail ? {
    receptNo: initialHistoryDetail.receptNo,
    analyzedAt: initialHistoryDetail.entDateTime,
  } : null);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [pdfDownloadError, setPdfDownloadError] = useState("");
  const activeRequestRef = useRef(null);
  const pdfReportRef = useRef(null);

  useEffect(
    () => () => {
      activeRequestRef.current?.abort();
    },
    [],
  );

  const handleRecommendationRequest = async ({ request, includeComparison: shouldCompare }) => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    setIsLoading(true);
    setError("");

    try {
      const nextResult = await requestShippingRecommendation(request, {
        signal: controller.signal,
      });
      setResult(nextResult);
      setEstimate(null);
      setIncludeComparison(shouldCompare);
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setError(requestError.message || "추천 결과를 불러오지 못했습니다.");
      }
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setIsLoading(false);
      }
    }
  };

  const handlePdfDownload = async () => {
    if (!pdfReportRef.current || isPdfDownloading) return;

    setIsPdfDownloading(true);
    setPdfDownloadError("");

    try {
      await document.fonts?.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const reportElement = pdfReportRef.current;
      const canvas = await html2canvas(reportElement, {
        backgroundColor: "#ffffff",
        height: reportElement.offsetHeight,
        logging: false,
        scale: 2,
        useCORS: true,
        width: reportElement.offsetWidth,
        windowHeight: reportElement.offsetHeight,
        windowWidth: reportElement.offsetWidth,
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const title = `${result.origin?.name || "출발지"} - ${result.destination?.name || "도착지"} 운송 추천 보고서`;
      pdf.setProperties({
        title,
        subject: "RAILINK AI 운송 추천 결과",
        author: "RAILINK",
        creator: "RAILINK",
      });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");

      const safeRoute = `${result.origin?.name || "출발지"}_${result.destination?.name || "도착지"}`
        .replace(/[^가-힣a-zA-Z0-9_-]+/g, "_")
        .slice(0, 48);
      pdf.save(`RAILINK_${safeRoute}_${result.shipping_date || "견적"}.pdf`);
    } catch (downloadError) {
      console.error(downloadError);
      setPdfDownloadError("PDF를 만들지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setIsPdfDownloading(false);
    }
  };

  return (
    <DashboardFrame
      estimate={estimate || undefined}
      onNavigate={onNavigate}
    >
      <div className={`workspace${panelCollapsed ? " panel-collapsed" : ""}`} id="dashboard-workspace">
        <PrimaryNav activePage="dashboard" onNavigate={onNavigate} />
        <ShipmentPanel
          collapsed={panelCollapsed}
          error={error}
          initialPriority={initialHistoryDetail?.inputJson?.priority || initialResult.priority}
          initialShipment={initialShipment}
          isLoading={isLoading}
          onSubmit={handleRecommendationRequest}
        />

        <button
          className="collapse-tab"
          type="button"
          aria-label={panelCollapsed ? "운송 조건 패널 펼치기" : "운송 조건 패널 접기"}
          aria-controls="shipment-panel"
          aria-expanded={!panelCollapsed}
          onClick={() => setPanelCollapsed((current) => !current)}
        >
          <img src="/assets/panel-collapse-toggle.svg" alt="" aria-hidden="true" />
          <span className="collapse-chevron" aria-hidden="true" />
        </button>

        <main
          className={`content${isLoading ? " is-loading" : ""}`}
          aria-label="운송 경로 분석 결과"
          aria-busy={isLoading}
        >
          <ComparisonPanel includeComparison={includeComparison} result={result} />
          <div className="lower-grid">
            <SchedulePanel result={result} />
            <EstimateTicket
              downloadError={pdfDownloadError}
              isDownloading={isPdfDownloading}
              onDownload={handlePdfDownload}
              result={result}
            />
          </div>
          <Recommendation result={result} />
        </main>
      </div>
      <ShippingPdfReport ref={pdfReportRef} result={result} />
    </DashboardFrame>
  );
}
