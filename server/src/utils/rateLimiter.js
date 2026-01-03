export const createRateLimiter = ({ intervalMs, max }) => {
  let tokens = max;
  let lastRefill = Date.now();

  return async () => {
    const now = Date.now();
    const elapsed = now - lastRefill;
    if (elapsed > intervalMs) {
      tokens = max;
      lastRefill = now;
    }

    if (tokens <= 0) {
      const wait = intervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, Math.max(wait, 0)));
      tokens = max - 1;
      lastRefill = Date.now();
      return;
    }

    tokens -= 1;
  };
};
