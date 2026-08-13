let pendingRequestCount = 0;
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToApiLoading = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getApiLoadingSnapshot = () => pendingRequestCount > 0;

export async function withApiLoading(request) {
  pendingRequestCount += 1;
  notify();

  try {
    return await request();
  } finally {
    pendingRequestCount = Math.max(0, pendingRequestCount - 1);
    notify();
  }
}
