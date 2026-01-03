export const createTtlCache = (ttlMs) => {
  const store = new Map();

  const get = (key) => {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  };

  const set = (key, value) => {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  return { get, set };
};
