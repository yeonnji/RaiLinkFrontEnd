import { useEffect, useRef, useState } from "react";

const storageKey = "railink-shipment-conditions";
const defaultShipment = {
  origin: "부산항",
  destination: "평택공장",
  weight: "20",
  departureDate: "2026-08-08",
};

const readStoredShipment = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    return saved ? { ...defaultShipment, ...saved } : defaultShipment;
  } catch {
    return defaultShipment;
  }
};

function FieldRow({ accent = false, children, value }) {
  return (
    <label className={`field-row${accent ? " accent" : ""}${value ? " has-value" : ""}`}>
      <span className="field-dot" aria-hidden="true" />
      {children}
    </label>
  );
}

export default function ShipmentPanel({ collapsed }) {
  const [shipment, setShipment] = useState(readStoredShipment);
  const [priority, setPriority] = useState("time");
  const [includeComparison, setIncludeComparison] = useState(true);
  const dateInputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(shipment));
    } catch {
      // 브라우저 저장소가 제한된 환경에서도 입력 기능은 유지합니다.
    }
  }, [shipment]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = collapsed;
  }, [collapsed]);

  const updateShipment = (name, value) => {
    setShipment((current) => ({ ...current, [name]: value }));
  };

  const clampWeight = () => {
    const value = Number(shipment.weight);
    if (!Number.isFinite(value)) return;
    updateShipment("weight", String(Math.min(24, Math.max(1, value))));
  };

  const openCalendar = () => {
    const input = dateInputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
        return;
      } catch {
        // 기본 날짜 입력 동작으로 이어갑니다.
      }
    }
    input.click();
  };

  return (
    <aside
      className="input-panel"
      id="shipment-panel"
      ref={panelRef}
      aria-hidden={collapsed}
    >
      <section className="shipment-section" aria-labelledby="shipment-title">
        <span className="eyebrow">SHIPMENT INPUT</span>
        <h1 id="shipment-title">운송 조건</h1>
        <p className="help-text">필수 입력 5개 · 자동 저장됨</p>

        <div className="field-list">
          <FieldRow accent value={shipment.origin}>
            <span className="field-box">
              <small>출발지</small>
              <input
                className="field-input"
                type="text"
                name="origin"
                value={shipment.origin}
                autoComplete="organization"
                required
                aria-label="출발지"
                onChange={(event) => updateShipment("origin", event.target.value)}
              />
            </span>
          </FieldRow>

          <FieldRow value={shipment.destination}>
            <span className="field-box">
              <small>도착지</small>
              <input
                className="field-input"
                type="text"
                name="destination"
                value={shipment.destination}
                autoComplete="organization"
                required
                aria-label="도착지"
                onChange={(event) => updateShipment("destination", event.target.value)}
              />
            </span>
          </FieldRow>

          <FieldRow value={shipment.weight}>
            <span className="field-box split-value">
              <span className="field-main">
                <small>중량</small>
                <span className="weight-control">
                  <input
                    className="field-input weight-input"
                    type="number"
                    name="weight"
                    value={shipment.weight}
                    min="1"
                    max="24"
                    step="1"
                    inputMode="numeric"
                    required
                    aria-label="화물 중량"
                    aria-describedby="weight-limit"
                    onChange={(event) => updateShipment("weight", event.target.value)}
                    onBlur={clampWeight}
                  />
                  <b>톤</b>
                </span>
              </span>
              <em id="weight-limit">최대 24톤</em>
            </span>
          </FieldRow>

          <div className={`field-row${shipment.departureDate ? " has-value" : ""}`}>
            <span className="field-dot" aria-hidden="true" />
            <div className="field-box date-field">
              <label className="date-control" htmlFor="departure-date">
                <small>희망 출발일</small>
                <input
                  className="field-input date-input"
                  id="departure-date"
                  ref={dateInputRef}
                  type="date"
                  name="departureDate"
                  value={shipment.departureDate}
                  required
                  aria-label="희망 출발일"
                  onChange={(event) => updateShipment("departureDate", event.target.value)}
                />
              </label>
              <button
                className="calendar-button"
                type="button"
                aria-label="달력에서 출발일 선택"
                onClick={openCalendar}
              >
                <span className="calendar-icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="option-section" aria-labelledby="option-title">
        <span className="eyebrow">ROUTE OPTIONS</span>
        <h2 id="option-title">운송안 선택 기준</h2>
        <p className="help-text">우선순위 4가지 중 선택</p>

        <div className="priority-grid">
          {[
            ["cost", "비용우선"],
            ["time", "시간우선"],
            ["environment", "환경우선"],
            ["balanced", "균형형"],
          ].map(([value, label]) => (
            <label key={value}>
              <input
                type="radio"
                name="priority"
                value={value}
                checked={priority === value}
                onChange={() => setPriority(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <label className="compare-check">
          <input
            type="checkbox"
            checked={includeComparison}
            onChange={(event) => setIncludeComparison(event.target.checked)}
          />
          <span>철도 · 도로 비교 포함</span>
        </label>

        <button className="generate-button" type="button">
          <strong>AI 추천 운송안 생성</strong>
          <span aria-hidden="true">⟶</span>
        </button>
      </section>
    </aside>
  );
}
