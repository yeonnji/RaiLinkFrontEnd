import { useEffect, useMemo, useState } from "react";
import { requestHistoryList, requestHistorySummary } from "../api/history.js";
import { DashboardFrame, PrimaryNav } from "../components/AppShell.jsx";

const PAGE_SIZE = 5;

const periodOptions = [
  ["7", "최근 7일"],
  ["30", "최근 30일"],
  ["90", "최근 90일"],
];

const transportModeOptions = [
  ["all", "전체 운송 방식"],
  ["rail", "철도 포함"],
  ["road", "도로 단독"],
];

const costSavingOptions = [
  ["all", "비용 절감률 전체"],
  ["savingOnly", "절감 운송안만"],
  ["min10", "10% 이상 절감"],
  ["min20", "20% 이상 절감"],
];

const sortOptions = [
  ["latest", "최신 분석순"],
  ["costSaving", "비용 절감순"],
  ["carbonSaving", "탄소 절감순"],
];

function Track({ type }) {
  if (type === "mixed") {
    return <span className="mini-track mixed-track"><i /><i /></span>;
  }
  return <span className={`mini-track ${type === "road" ? "road-direct-track" : "rail-direct-track"}`} />;
}

const formatSummaryRate = (value) =>
  Number(value || 0).toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

const formatLatestAnalysisTime = (value) => {
  if (!value) return "";

  const analyzedAt = new Date(value);
  if (Number.isNaN(analyzedAt.getTime())) return "";

  const now = new Date();
  const isToday =
    analyzedAt.getFullYear() === now.getFullYear() &&
    analyzedAt.getMonth() === now.getMonth() &&
    analyzedAt.getDate() === now.getDate();
  const time = analyzedAt.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isToday) return `오늘 ${time}`;

  const date = analyzedAt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${date} ${time}`;
};

function HistorySummary({ error, isLoading, summary }) {
  const latest = summary?.latestAnalysis;
  const unavailableValue = isLoading || error ? "–" : null;
  const costSavingRate = summary?.averageCostSavingRate || 0;
  const carbonSavingRate = summary?.averageCarbonSavingRate || 0;

  return (
    <section
      className="history-summary"
      aria-busy={isLoading}
      aria-label="분석 요약"
    >
      <div className="summary-metric">
        <small>이번 주 분석</small>
        <strong>{unavailableValue ?? summary?.weeklyAnalysisCount.toLocaleString("ko-KR") ?? 0}<em>건</em></strong>
      </div>
      <div className="summary-metric rail-summary">
        <small>철도 포함 추천</small>
        <span>
          <strong>{unavailableValue ?? summary?.railRecommendationCount.toLocaleString("ko-KR") ?? 0}<em>건</em></strong>
          <b>{unavailableValue ?? formatSummaryRate(summary?.railRecommendationRate)}%</b>
        </span>
      </div>
      <div className={`summary-metric${costSavingRate < 0 ? " negative-summary" : ""}`}>
        <small>평균 비용 절감</small>
        <strong>{unavailableValue ?? formatSummaryRate(costSavingRate)}<em>%</em></strong>
      </div>
      <div className={`summary-metric carbon-summary${carbonSavingRate < 0 ? " negative-summary" : ""}`}>
        <small>평균 탄소 절감</small>
        <strong>{unavailableValue ?? formatSummaryRate(carbonSavingRate)}<em>%</em></strong>
      </div>
      <div className={`summary-metric recent-summary${error ? " summary-error" : ""}`} title={error || undefined}>
        <small>최근 분석</small>
        {isLoading ? (
          <strong>요약 정보를 불러오는 중입니다</strong>
        ) : error ? (
          <strong role="status">요약 정보를 불러오지 못했습니다</strong>
        ) : latest ? (
          <>
            <strong>{latest.originName || "-"} → {latest.destinationName || "-"}</strong>
            <span>{formatLatestAnalysisTime(latest.analyzedAt)} · {Number(latest.cargoWeightTon || 0).toLocaleString("ko-KR")}t</span>
          </>
        ) : (
          <strong>아직 분석 기록이 없습니다</strong>
        )}
      </div>
    </section>
  );
}

function FilterSelect({ ariaLabel, onChange, options, value }) {
  return (
    <label className="filter-select-wrap">
      <span className="filter-label">{ariaLabel}</span>
      <select aria-label={ariaLabel} value={value} onChange={onChange}>
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>{label}</option>
        ))}
      </select>
      <i aria-hidden="true" />
    </label>
  );
}

function HistoryFilters({ filters, onFilterChange, onQueryChange, query }) {
  return (
    <form className="history-filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="history-search">
        <i aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder="출발지 또는 도착지를 검색하세요"
          aria-label="분석 기록 검색"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <FilterSelect
        ariaLabel="조회 기간"
        onChange={(event) => onFilterChange("period", event.target.value)}
        options={periodOptions}
        value={filters.period}
      />
      <FilterSelect
        ariaLabel="운송 방식"
        onChange={(event) => onFilterChange("transportMode", event.target.value)}
        options={transportModeOptions}
        value={filters.transportMode}
      />
      <FilterSelect
        ariaLabel="비용 절감률"
        onChange={(event) => onFilterChange("costSaving", event.target.value)}
        options={costSavingOptions}
        value={filters.costSaving}
      />
      <span className="filter-spacer" />
      <div className="sort-control">
        <small>정렬</small>
        <FilterSelect
          ariaLabel="목록 정렬"
          onChange={(event) => onFilterChange("sort", event.target.value)}
          options={sortOptions}
          value={filters.sort}
        />
      </div>
    </form>
  );
}

const formatListRate = (value) => {
  const rate = Number(value) || 0;
  return `${rate.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
};

const formatListAmount = (value, unit) => {
  const amount = Number(value) || 0;
  const direction = amount >= 0 ? "절감" : "증가";
  const formatted = Math.abs(amount).toLocaleString("ko-KR", {
    maximumFractionDigits: unit === "원" ? 0 : 1,
  });
  return `${formatted}${unit} ${direction}`;
};

const formatAnalysisDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "-" };

  return {
    date: [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((part, index) => index === 0 ? part : String(part).padStart(2, "0"))
      .join("."),
    time: date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
};

const getTrackType = (record) => {
  if (record.recommendedMode === "road") return "road";
  if (record.transportLegs.includes("road") && record.transportLegs.includes("rail")) return "mixed";
  return "rail";
};

const getTransportPlan = (record) => {
  const legs = record.transportLegs.length
    ? record.transportLegs.map((leg) => (leg === "rail" ? "RAIL" : "TRUCK")).join(" → ")
    : record.recommendedMode === "road" ? "TRUCK DIRECT" : "RAIL";

  return {
    legs,
    share: record.recommendedMode === "road"
      ? "도로 100%"
      : `철도 ${formatSummaryRate(record.railRatio)}%`,
  };
};

function HistoryRow({ record }) {
  const track = getTrackType(record);
  const road = track === "road";
  const plan = getTransportPlan(record);
  const analyzedAt = formatAnalysisDate(record.analyzedAt);
  const costPositive = record.costSavingRate >= 0;
  const carbonPositive = record.carbonSavingRate >= 0;

  return (
    <article className="history-row">
      <div className="history-route-cell">
        <span className={`route-badge ${road ? "road-badge" : "rail-badge"}`}>{road ? "도로 추천" : "철도 추천"}</span>
        <div className="history-route-line">
          <strong title={record.originName}>{record.originName || "-"}</strong>
          <Track type={track} />
          <strong title={record.destinationName}>{record.destinationName || "-"}</strong>
        </div>
      </div>
      <strong className="cargo-weight">{record.cargoWeightTon.toLocaleString("ko-KR")}t</strong>
      <div className={`transport-plan${road ? " road-plan" : ""}`}>
        <small>{plan.legs}</small><strong>{plan.share}</strong>
      </div>
      <div className={`saving ${costPositive ? "cost-saving" : "negative-saving"}`}>
        <strong>{formatListRate(record.costSavingRate)}</strong>
        <small>{formatListAmount(record.costSavingWon, "원")}</small>
      </div>
      <div className={`saving ${carbonPositive ? "carbon-saving" : "negative-saving"}`}>
        <strong>{formatListRate(record.carbonSavingRate)}</strong>
        <small>{formatListAmount(record.carbonSavingKg, "kgCO₂e")}</small>
      </div>
      <div className="analysis-date"><strong>{analyzedAt.date}</strong><small>{analyzedAt.time}</small></div>
      <button className="detail-arrow" type="button" aria-label={`${record.originName} 분석 상세 보기`} data-recept-no={record.receptNo}>→</button>
    </article>
  );
}

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(Math.max(1, currentPage - 2), totalPages - 4);
  return Array.from({ length: 5 }, (_, index) => start + index);
};

export default function HistoryPage({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState({
    period: "30",
    transportMode: "all",
    costSaving: "all",
    sort: "latest",
  });
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false,
  });
  const [recordsError, setRecordsError] = useState("");
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadSummary = async () => {
      setIsSummaryLoading(true);
      setSummaryError("");

      try {
        const data = await requestHistorySummary({ signal: controller.signal });
        setSummary(data);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setSummaryError(requestError.message || "히스토리 요약 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSummaryLoading(false);
        }
      }
    };

    loadSummary();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    const loadRecords = async () => {
      setIsRecordsLoading(true);
      setRecordsError("");

      try {
        const data = await requestHistoryList(
          {
            keyword: debouncedQuery,
            ...filters,
            page,
            pageSize: PAGE_SIZE,
          },
          { signal: controller.signal },
        );
        setRecords(data.items);
        setPagination(data.pagination);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setRecords([]);
          setPagination((current) => ({ ...current, totalItems: 0, totalPages: 0 }));
          setRecordsError(requestError.message || "히스토리 목록을 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsRecordsLoading(false);
        }
      }
    };

    loadRecords();
    return () => controller.abort();
  }, [debouncedQuery, filters, page]);

  const visiblePages = useMemo(
    () => getVisiblePages(page, pagination.totalPages),
    [page, pagination.totalPages],
  );

  const handleFilterChange = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };

  const openDashboard = (event) => {
    event.preventDefault();
    onNavigate("dashboard");
  };

  return (
    <DashboardFrame history onNavigate={onNavigate}>
      <div className="workspace history-workspace">
        <PrimaryNav activePage="history" history onNavigate={onNavigate} />

        <main className="history-content">
          <section className="history-intro" aria-labelledby="history-title">
            <div>
              <h1 id="history-title">분석 히스토리</h1>
              <p>이전에 실행한 철도·도로 복합운송 분석을 다시 확인하거나 비교할 수 있습니다.</p>
            </div>
            <a className="new-route-button" href="/" onClick={openDashboard}>
              <span aria-hidden="true">＋</span>새로운 경로 탐색
            </a>
          </section>

          <HistorySummary
            error={summaryError}
            isLoading={isSummaryLoading}
            summary={summary}
          />
          <HistoryFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onQueryChange={setQuery}
            query={query}
          />

          <section className="records-section" aria-busy={isRecordsLoading} aria-labelledby="records-title">
            <h2 id="records-title">분석 기록 <small>{pagination.totalItems.toLocaleString("ko-KR")}건</small></h2>

            <div className="history-columns" aria-hidden="true">
              <span>분석 경로</span>
              <span>화물 중량</span>
              <span>추천 운송안</span>
              <span>비용 절감</span>
              <span>탄소 절감</span>
              <span>분석일</span>
              <span>상세</span>
            </div>

            <div className="history-rows">
              {isRecordsLoading ? (
                <div className="history-list-state" role="status">분석 기록을 불러오는 중입니다.</div>
              ) : recordsError ? (
                <div className="history-list-state error-state" role="alert">{recordsError}</div>
              ) : records.length ? (
                records.map((record) => <HistoryRow key={record.receptNo} record={record} />)
              ) : (
                <div className="history-list-state">조건에 맞는 분석 기록이 없습니다.</div>
              )}
            </div>
          </section>

          <nav className="pagination" aria-label="분석 기록 페이지" hidden={pagination.totalPages <= 1}>
            <button
              className={`page-arrow${!pagination.hasPrevious ? " disabled" : ""}`}
              type="button"
              aria-label="이전 페이지"
              disabled={!pagination.hasPrevious || isRecordsLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >‹</button>
            {visiblePages.map((number) => (
              <button
                className={`page-number${page === number ? " active" : ""}`}
                type="button"
                aria-current={page === number ? "page" : undefined}
                disabled={isRecordsLoading}
                key={number}
                onClick={() => setPage(number)}
              >{number}</button>
            ))}
            <button
              className={`page-arrow${!pagination.hasNext ? " disabled" : ""}`}
              type="button"
              aria-label="다음 페이지"
              disabled={!pagination.hasNext || isRecordsLoading}
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            >›</button>
          </nav>
        </main>
      </div>
    </DashboardFrame>
  );
}
