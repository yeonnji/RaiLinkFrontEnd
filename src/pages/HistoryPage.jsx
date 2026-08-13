import { useMemo, useState } from "react";
import { DashboardFrame, PrimaryNav } from "../components/AppShell.jsx";

const historyRecords = [
  {
    origin: "인천 남동공단",
    destination: "부산 신항",
    weight: "20t",
    badge: "철도 추천",
    track: "mixed",
    plan: "TRUCK → RAIL → TRUCK",
    share: "철도 66%",
    cost: "16.8%",
    costDetail: "- 184,000원",
    carbon: "73.4%",
    carbonDetail: "- 312 kgCO₂e",
    date: "2026.08.08",
    time: "14:32",
    selected: true,
  },
  {
    origin: "평택 포승산단",
    destination: "광양항",
    weight: "18t",
    badge: "철도 추천",
    track: "mixed",
    plan: "TRUCK → RAIL → TRUCK",
    share: "철도 72%",
    cost: "21.3%",
    costDetail: "- 246,000원",
    carbon: "68.1%",
    carbonDetail: "- 286 kgCO₂e",
    date: "2026.08.08",
    time: "11:05",
  },
  {
    origin: "대전 물류센터",
    destination: "울산 산업단지",
    weight: "12t",
    badge: "철도 추천",
    track: "mixed",
    plan: "TRUCK → RAIL → TRUCK",
    share: "철도 58%",
    cost: "13.6%",
    costDetail: "- 121,000원",
    carbon: "61.5%",
    carbonDetail: "- 198 kgCO₂e",
    date: "2026.08.07",
    time: "18:47",
  },
  {
    origin: "수원 물류센터",
    destination: "부산 신항",
    weight: "6t",
    badge: "도로 추천",
    track: "road",
    plan: "TRUCK DIRECT",
    share: "도로 100%",
    cost: "+2.1%",
    costDetail: "철도 대비",
    carbon: "-8.2%",
    carbonDetail: "철도 대비",
    date: "2026.08.07",
    time: "16:21",
  },
  {
    origin: "의왕 ICD",
    destination: "부산 신항",
    weight: "22t",
    badge: "철도 추천",
    track: "rail",
    plan: "RAIL DIRECT",
    share: "철도 100%",
    cost: "24.8%",
    costDetail: "- 318,000원",
    carbon: "76.9%",
    carbonDetail: "- 402 kgCO₂e",
    date: "2026.08.07",
    time: "13:18",
  },
];

function Track({ type }) {
  if (type === "mixed") {
    return <span className="mini-track mixed-track"><i /><i /></span>;
  }
  return <span className={`mini-track ${type === "road" ? "road-direct-track" : "rail-direct-track"}`} />;
}

function HistorySummary() {
  return (
    <section className="history-summary" aria-label="분석 요약">
      <div className="summary-metric">
        <small>이번 주 분석</small>
        <strong>24<em>건</em></strong>
      </div>
      <div className="summary-metric rail-summary">
        <small>철도 포함 추천</small>
        <span><strong>16<em>건</em></strong><b>66.7%</b></span>
      </div>
      <div className="summary-metric">
        <small>평균 비용 절감</small>
        <strong>18.4<em>%</em></strong>
      </div>
      <div className="summary-metric carbon-summary">
        <small>평균 탄소 절감</small>
        <strong>64.8<em>%</em></strong>
      </div>
      <div className="summary-metric recent-summary">
        <small>최근 분석</small>
        <strong>인천 남동공단 → 부산 신항</strong>
        <span>오늘 14:32 · 20t</span>
      </div>
    </section>
  );
}

function HistoryFilters({ query, onQueryChange }) {
  return (
    <form className="history-filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="history-search">
        <i aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder="출발지, 도착지, 화물명을 검색하세요"
          aria-label="분석 기록 검색"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <button className="filter-select" type="button">최근 30일<i aria-hidden="true" /></button>
      <button className="filter-select" type="button">전체 운송 방식<i aria-hidden="true" /></button>
      <button className="filter-select" type="button">비용 절감률 전체<i aria-hidden="true" /></button>
      <span className="filter-spacer" />
      <div className="sort-control">
        <small>정렬</small>
        <button className="filter-select" type="button">최신 분석순<i aria-hidden="true" /></button>
      </div>
    </form>
  );
}

function HistoryRow({ record }) {
  const road = record.track === "road";

  return (
    <article className={`history-row${record.selected ? " selected-row" : ""}`}>
      <div className="history-route-cell">
        <span className={`route-badge ${road ? "road-badge" : "rail-badge"}`}>{record.badge}</span>
        <div className="history-route-line">
          <strong>{record.origin}</strong>
          <Track type={record.track} />
          <strong>{record.destination}</strong>
        </div>
      </div>
      <strong className="cargo-weight">{record.weight}</strong>
      <div className={`transport-plan${road ? " road-plan" : ""}`}>
        <small>{record.plan}</small><strong>{record.share}</strong>
      </div>
      <div className={`saving ${road ? "negative-saving" : "cost-saving"}`}>
        <strong>{record.cost}</strong><small>{record.costDetail}</small>
      </div>
      <div className={`saving ${road ? "neutral-saving" : "carbon-saving"}`}>
        <strong>{record.carbon}</strong><small>{record.carbonDetail}</small>
      </div>
      <div className="analysis-date"><strong>{record.date}</strong><small>{record.time}</small></div>
      <button className="detail-arrow" type="button" aria-label={`${record.origin} 분석 상세 보기`}>→</button>
    </article>
  );
}

export default function HistoryPage({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko");
    if (!keyword) return historyRecords;
    return historyRecords.filter((record) =>
      [record.origin, record.destination, record.weight, record.badge]
        .join(" ")
        .toLocaleLowerCase("ko")
        .includes(keyword),
    );
  }, [query]);

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

          <HistorySummary />
          <HistoryFilters query={query} onQueryChange={setQuery} />

          <section className="records-section" aria-labelledby="records-title">
            <h2 id="records-title">분석 기록 <small>{query ? `${filteredRecords.length}건` : "24건"}</small></h2>

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
              {filteredRecords.map((record) => (
                <HistoryRow key={`${record.origin}-${record.destination}`} record={record} />
              ))}
            </div>
          </section>

          <nav className="pagination" aria-label="분석 기록 페이지">
            <button
              className={`page-arrow${page === 1 ? " disabled" : ""}`}
              type="button"
              aria-label="이전 페이지"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >‹</button>
            {[1, 2, 3].map((number) => (
              <button
                className={`page-number${page === number ? " active" : ""}`}
                type="button"
                aria-current={page === number ? "page" : undefined}
                key={number}
                onClick={() => setPage(number)}
              >{number}</button>
            ))}
            <button
              className="page-arrow"
              type="button"
              aria-label="다음 페이지"
              disabled={page === 3}
              onClick={() => setPage((current) => Math.min(3, current + 1))}
            >›</button>
          </nav>
        </main>
      </div>
    </DashboardFrame>
  );
}
