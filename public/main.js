const shipmentFields = Array.from(
  document.querySelectorAll("[data-shipment-field]"),
);
const dateInput = document.querySelector("#departure-date");
const calendarButton = document.querySelector("#calendar-button");
const dashboardWorkspace = document.querySelector("#dashboard-workspace");
const shipmentPanel = document.querySelector("#shipment-panel");
const panelToggle = document.querySelector("#panel-toggle");
const storageKey = "railink-shipment-conditions";

const setFilledState = (input) => {
  const fieldRow = input.closest(".field-row");
  if (!fieldRow) return;

  fieldRow.classList.toggle("has-value", input.value.trim() !== "");
};

const saveShipmentConditions = () => {
  const values = Object.fromEntries(
    shipmentFields.map((input) => [input.name, input.value]),
  );

  try {
    localStorage.setItem(storageKey, JSON.stringify(values));
  } catch {
    // 입력 기능은 저장소 사용이 제한된 환경에서도 그대로 동작합니다.
  }
};

const restoreShipmentConditions = () => {
  try {
    const savedValues = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!savedValues) return;

    shipmentFields.forEach((input) => {
      if (savedValues[input.name] !== undefined) {
        input.value = savedValues[input.name];
      }
    });
  } catch {
    // 손상된 저장값은 기본 화면값으로 대체합니다.
  }
};

restoreShipmentConditions();

shipmentFields.forEach((input) => {
  setFilledState(input);

  input.addEventListener("input", () => {
    setFilledState(input);
    saveShipmentConditions();
  });

  input.addEventListener("change", () => {
    if (input.name === "weight") {
      const minimum = Number(input.min);
      const maximum = Number(input.max);
      const value = Number(input.value);

      if (Number.isFinite(value)) {
        input.value = String(Math.min(maximum, Math.max(minimum, value)));
      }
    }

    setFilledState(input);
    saveShipmentConditions();
  });
});

calendarButton?.addEventListener("click", () => {
  if (!(dateInput instanceof HTMLInputElement)) return;

  dateInput.focus({ preventScroll: true });

  if (typeof dateInput.showPicker === "function") {
    try {
      dateInput.showPicker();
    } catch {
      dateInput.click();
    }
  } else {
    dateInput.click();
  }
});

const setPanelCollapsed = (collapsed) => {
  if (!(dashboardWorkspace instanceof HTMLElement)) return;

  dashboardWorkspace.classList.toggle("panel-collapsed", collapsed);

  if (shipmentPanel instanceof HTMLElement) {
    shipmentPanel.inert = collapsed;
    shipmentPanel.setAttribute("aria-hidden", String(collapsed));
  }

  if (panelToggle instanceof HTMLButtonElement) {
    panelToggle.setAttribute("aria-expanded", String(!collapsed));
    panelToggle.setAttribute(
      "aria-label",
      collapsed ? "운송 조건 패널 펼치기" : "운송 조건 패널 접기",
    );
  }
};

panelToggle?.addEventListener("click", () => {
  const isCollapsed = dashboardWorkspace?.classList.contains("panel-collapsed");
  setPanelCollapsed(!isCollapsed);
});
