import { useState } from "react";
import { DashboardFrame, PrimaryNav } from "../components/AppShell.jsx";
import ShipmentPanel from "../components/ShipmentPanel.jsx";

const scheduleRows = [
  {
    number: "01",
    route: "부산항 → 부산진 CY",
    detail: "First mile · 15km",
    method: "도로",
    distance: "15km",
    duration: "1h 10m",
    cost: "110,000원",
  },
  {
    number: "02",
    route: "부산진 CY → 오봉역 CY",
    detail: "Main rail · 420km",
    method: "철도",
    distance: "420km",
    duration: "18h 00m",
    cost: "480,000원",
    active: true,
  },
  {
    number: "03",
    route: "오봉역 CY → 평택공장",
    detail: "Last mile · 20km",
    method: "도로",
    distance: "20km",
    duration: "1h 50m",
    cost: "140,000원",
  },
];

function MetricCard({ road = false }) {
  return (
    <div className={`metric-card${road ? "" : " recommended"}`}>
      <span className={`metric-label${road ? " orange-label" : ""}`}>
        {road ? "최소시간 기준" : "최적경로 추천"}
      </span>
      <div className="metric-grid">
        <span><small>총운임</small><strong>{road ? "1,120,000원" : "923,000원"}</strong></span>
        <span><small>소요</small><strong>{road ? "19시간" : "25시간"}</strong></span>
        <span>
          <small>CO₂</small>
          <strong className={road ? "orange" : "green"}>{road ? "기준 100" : "46% ↓"}</strong>
        </span>
        <span><small>환적</small><strong>{road ? "0회" : "2회"}</strong></span>
      </div>
    </div>
  );
}

function ComparisonPanel() {
  return (
    <section className="comparison-panel" aria-labelledby="comparison-title">
      <header className="panel-heading comparison-heading">
        <h2 id="comparison-title">추천 운송 경로 · 비용 우선</h2>
        <i />
        <button type="button">철도 vs 도로 비교</button>
        <span>최적경로 기준</span>
      </header>

      <article className="route-option selected">
        <span className="route-order">01</span>
        <div className="route-title">
          <em>추천</em>
          <strong>철도 복합운송</strong>
          <small>Truck → Rail → Truck</small>
        </div>

        <div className="route-visual rail-route" aria-label="부산항에서 평택공장까지 철도 복합운송 경로">
          <div className="place-labels four">
            <span>부산항</span><span>부산진 CY</span><span>오봉역 CY</span><span>평택공장</span>
          </div>
          <div className="rail-line route-line">
            <i className="route-node first" />
            <i className="route-node second" />
            <span className="train-icon" aria-hidden="true" />
          </div>
          <div className="distance-labels three">
            <span>도로 15km</span><strong>철도 본선 420km</strong><span>도로 20km</span>
          </div>
        </div>

        <MetricCard />
      </article>

      <article className="route-option">
        <span className="route-order muted">02</span>
        <div className="route-title">
          <em className="muted-tag">비교안</em>
          <strong>도로 단독운송</strong>
          <small>Direct Truck</small>
        </div>

        <div className="route-visual road-route" aria-label="부산항에서 평택공장까지 도로 단독운송 경로">
          <div className="place-labels two"><span>부산항</span><span>평택공장</span></div>
          <div className="road-line route-line">
            <i className="route-node first" />
            <i className="route-node last" />
            <span className="truck-icon" aria-hidden="true" />
          </div>
          <strong className="road-note">도로 직송 455km · 환적 없음</strong>
        </div>

        <MetricCard road />
      </article>

      <footer className="comparison-reason">
        <strong>철도 추천 사유</strong>
        <span>비용 197,000원 절감 · 탄소 46% 감소 · 희망 도착일 충족</span>
      </footer>
    </section>
  );
}

function SchedulePanel() {
  return (
    <section className="schedule-panel" aria-labelledby="schedule-title">
      <header className="panel-heading schedule-heading">
        <h2 id="schedule-title">선택 운송안 상세 일정</h2>
        <span>일반화물 20톤</span>
      </header>

      <div className="schedule-table" role="table" aria-label="선택 운송안 상세 일정">
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
              <strong>{row.route}</strong><small>{row.detail}</small>
            </span>
            <strong className={row.active ? "rail-text" : undefined} role="cell">{row.method}</strong>
            <strong role="cell">{row.distance}</strong>
            <strong role="cell">{row.duration}</strong>
            <strong className="cost" role="cell">{row.cost}</strong>
          </div>
        ))}
      </div>

      <footer className="schedule-total">
        <span>운송안 예상 총액</span>
        <span><strong>923,000원</strong><small>총액표 포함</small></span>
      </footer>
    </section>
  );
}

function EstimateTicket() {
  return (
    <aside className="estimate-ticket" aria-labelledby="ticket-title">
      <header>
        <div>
          <small>AI ESTIMATE TICKET</small>
          <h2 id="ticket-title">철도 복합운송 견적</h2>
        </div>
        <button type="button">PDF 다운로드</button>
      </header>

      <div className="ticket-price">
        <small>예상 총 운송비</small>
        <strong>923,000<em>원</em></strong>
        <b>도로 대비 197,000원 절감</b>
        <div>
          <span><small>기존 도로 운송</small><strong>1,120,000원</strong></span>
          <span><small>비용 절감률</small><strong>17.6%</strong></span>
        </div>
      </div>

      <div className="ticket-detail-grid">
        <span><small>LEAD TIME</small><strong>25시간</strong></span>
        <span><small>RAIL SHARE</small><strong>92%</strong></span>
        <span><small>CO₂ REDUCTION</small><strong>46% ↓</strong></span>
        <span><small>VALID UNTIL</small><strong>08.07 18:00</strong></span>
      </div>
    </aside>
  );
}

function Recommendation() {
  return (
    <section className="recommendation" aria-label="AI 추천 결과">
      <b className="ai-tab">AI</b>
      <span className="recommendation-title">
        <small>AI RECOMMENDATION</small>
        <strong>철도 복합운송을 추천합니다</strong>
      </span>
      <i />
      <span className="recommendation-copy">
        <span>최저비용·환경우선 점수가 높고, 08.08 내 도착 가능합니다.</span>
        <strong>도로 대비 197,000원 절감 · 탄소 46% 감소</strong>
      </span>
    </section>
  );
}

export default function DashboardPage({ onNavigate }) {
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  return (
    <DashboardFrame onNavigate={onNavigate}>
      <div className={`workspace${panelCollapsed ? " panel-collapsed" : ""}`} id="dashboard-workspace">
        <PrimaryNav activePage="dashboard" onNavigate={onNavigate} />
        <ShipmentPanel collapsed={panelCollapsed} />

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

        <main className="content" aria-label="운송 경로 분석 결과">
          <ComparisonPanel />
          <div className="lower-grid">
            <SchedulePanel />
            <EstimateTicket />
          </div>
          <Recommendation />
        </main>
      </div>
    </DashboardFrame>
  );
}
