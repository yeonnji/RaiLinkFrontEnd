import { useCallback, useEffect, useState } from "react";
import DashboardPage from "./pages/DashboardPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";

const getPageFromPath = () =>
  window.location.pathname.startsWith("/history") ? "history" : "dashboard";

export default function App() {
  const [page, setPage] = useState(getPageFromPath);

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

  const navigate = useCallback((nextPage) => {
    const nextPath = nextPage === "history" ? "/history" : "/";
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPage(nextPage);
  }, []);

  return page === "history" ? (
    <HistoryPage onNavigate={navigate} />
  ) : (
    <DashboardPage onNavigate={navigate} />
  );
}
