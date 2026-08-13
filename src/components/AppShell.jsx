function InternalLink({ children, className, current, label, onNavigate, page }) {
  const href = page === "history" ? "/history" : "/";

  const handleClick = (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onNavigate(page);
  };

  return (
    <a
      className={className}
      href={href}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

const formatEstimateDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const datePart = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index === 0 ? part : String(part).padStart(2, "0"))
    .join(".");
  const timePart = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart} ${timePart}`;
};

export function Topbar({ estimate, history = false, onNavigate }) {
  return (
    <header className="topbar">
      <InternalLink
        className="korail-logo"
        label="KORAIL 홈"
        onNavigate={onNavigate}
        page="dashboard"
      >
        KORAIL
      </InternalLink>

      <div className="topbar-content">
        <div className="brand-copy">
          <span>철도 중심 복합물류 AI 의사결정 플랫폼</span>
          <strong>RAILINK</strong>
        </div>

        <div className="topbar-status">
          {!history && (
            <div className="estimate-id">
              <strong>견적번호 {estimate?.receptNo || "KR-260806-0217"}</strong>
              <span>
                {estimate?.analyzedAt
                  ? `${formatEstimateDate(estimate.analyzedAt)} 분석`
                  : "2026.08.06 09:40 기준"}
              </span>
            </div>
          )}
          <div className="live-pill">
            <i aria-hidden="true" />
            <strong>운임 데이터 정상</strong>
            <span />
            <button type="button">실시간 반영</button>
          </div>
        </div>
      </div>
    </header>
  );
}

export function PrimaryNav({ activePage, history = false, onNavigate }) {
  return (
    <nav
      className={`primary-nav${history ? " history-primary-nav" : ""}`}
      aria-label="주요 메뉴"
    >
      <InternalLink
        className={`nav-item${activePage === "dashboard" ? " active" : ""}`}
        current={activePage === "dashboard"}
        onNavigate={onNavigate}
        page="dashboard"
      >
        <span className="nav-symbol train-menu-icon" aria-hidden="true" />
        <strong>운송설계</strong>
      </InternalLink>
      <InternalLink
        className={`nav-item${activePage === "history" ? " active" : ""}`}
        current={activePage === "history"}
        onNavigate={onNavigate}
        page="history"
      >
        <span className="nav-symbol history-symbol" aria-hidden="true" />
        <strong>히스토리</strong>
      </InternalLink>

      <div className="nav-line" aria-hidden="true">
        <i /><i /><i />
      </div>
      <span className="railink-seal">RAILINK</span>
    </nav>
  );
}

export function DashboardFrame({ children, estimate, history = false, onNavigate }) {
  return (
    <div className={`dashboard${history ? " history-dashboard" : ""}`}>
      <Topbar estimate={estimate} history={history} onNavigate={onNavigate} />
      {children}
    </div>
  );
}
