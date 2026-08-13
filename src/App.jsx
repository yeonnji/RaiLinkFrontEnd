import { useCallback, useEffect, useState } from "react";
import DashboardPage from "./pages/DashboardPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";

const getPageFromPath = () =>
  window.location.pathname.startsWith("/history") ? "history" : "dashboard";

export default function App() {
  const [page, setPage] = useState(getPageFromPath);
  const [historyDetail, setHistoryDetail] = useState(null);

  useEffect(() => {
    const handlePopState = () => setPage(getPageFromPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.title =
      page === "history"
        ? "분석 히스토리 | RAILINK"
        : "RAILINK | 철도 복합물류 AI 플랫폼";
  }, [page]);

  const navigate = useCallback((nextPage, options = {}) => {
    const nextPath = nextPage === "history" ? "/history" : "/";
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    if (nextPage === "dashboard") {
      setHistoryDetail(options.historyDetail || null);
    }
    setPage(nextPage);
  }, []);

  return page === "history" ? (
    <HistoryPage onNavigate={navigate} />
  ) : (
    <DashboardPage
      initialHistoryDetail={historyDetail}
      key={historyDetail?.receptNo || "new-analysis"}
      onNavigate={navigate}
    />
  );
}
