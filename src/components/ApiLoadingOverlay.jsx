import { useEffect, useSyncExternalStore } from "react";
import {
  getApiLoadingSnapshot,
  subscribeToApiLoading,
} from "../api/request.js";

export default function ApiLoadingOverlay() {
  const isLoading = useSyncExternalStore(
    subscribeToApiLoading,
    getApiLoadingSnapshot,
    () => false,
  );

  useEffect(() => {
    if (!isLoading) return undefined;

    const dashboard = document.querySelector(".dashboard");
    const wasInert = dashboard?.inert || false;

    if (dashboard) dashboard.inert = true;
    document.body.classList.add("api-is-loading");

    return () => {
      if (dashboard) dashboard.inert = wasInert;
      document.body.classList.remove("api-is-loading");
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="api-loading-overlay" role="status" aria-live="polite" aria-label="데이터를 불러오는 중입니다">
      <div className="api-loading-panel">
        <div className="api-loading-content">
          <img
            className="api-loading-logo"
            src="/assets/railink-logo-train-track.png"
            alt="RAILINK"
            width="1449"
            height="267"
          />
          <span className="api-loading-dots" aria-hidden="true">
            <i /><i /><i /><i /><i /><i />
          </span>
          <span className="sr-only">데이터를 불러오는 중입니다.</span>
        </div>
      </div>
    </div>
  );
}
