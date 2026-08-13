import { useEffect, useRef, useState } from "react";
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

function TransportDetails({ mode, result }) {
  const road = mode === "road";
  const items = road
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

function EstimateTicket({ result }) {
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
        <button type="button">PDF 다운로드</button>
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
  const explanation = (result.ai_explanation_error
    ? reason
    : result.ai_explanation || reason
  ).replaceAll("**", "");

  return (
    <section className="recommendation" aria-label="AI 추천 결과">
      <b className="ai-tab">AI</b>
      <span className="recommendation-title">
        <small>AI RECOMMENDATION</small>
        <strong>{result.recommendation?.recommended_name || getModeName(getRecommendedMode(result))}을 추천합니다</strong>
      </span>
      <i />
      <span className="recommendation-copy">
        <span title={explanation}>{explanation}</span>
        <strong>{reason}</strong>
      </span>
    </section>
  );
}

export default function DashboardPage({ onNavigate }) {
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [result, setResult] = useState(defaultShippingResult);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const activeRequestRef = useRef(null);

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

  return (
    <DashboardFrame onNavigate={onNavigate}>
      <div className={`workspace${panelCollapsed ? " panel-collapsed" : ""}`} id="dashboard-workspace">
        <PrimaryNav activePage="dashboard" onNavigate={onNavigate} />
        <ShipmentPanel
          collapsed={panelCollapsed}
          error={error}
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
            <EstimateTicket result={result} />
          </div>
          <Recommendation result={result} />
        </main>
      </div>
    </DashboardFrame>
  );
}
