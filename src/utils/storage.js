const KEY = "vowflow";

export function getStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { weddings: [], activeWeddingId: null };
  } catch {
    return { weddings: [], activeWeddingId: null };
  }
}

export function saveStore(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getActiveWedding() {
  const store = getStore();
  return store.weddings.find((w) => w.id === store.activeWeddingId) || null;
}

export function setActiveWedding(id) {
  const store = getStore();
  store.activeWeddingId = id;
  saveStore(store);
}

export function createWedding(data) {
  const store = getStore();
  const wedding = {
    id: crypto.randomUUID(),
    coupleName: data.coupleName,
    partnerName: data.partnerName,
    weddingDate: data.weddingDate,
    budget: data.budget,
    checklist: [],
    budgetCategories: [
      { id: "venue", name: "Venue", allocated: 0, spent: 0, color: "#7F77DD" },
      { id: "catering", name: "Catering", allocated: 0, spent: 0, color: "#F4C0D1" },
      { id: "photography", name: "Photography", allocated: 0, spent: 0, color: "#93C5FD" },
      { id: "flowers", name: "Flowers", allocated: 0, spent: 0, color: "#6EE7B7" },
      { id: "attire", name: "Attire", allocated: 0, spent: 0, color: "#FCD34D" },
      { id: "music", name: "Music", allocated: 0, spent: 0, color: "#F87171" },
      { id: "invitations", name: "Invitations", allocated: 0, spent: 0, color: "#C084FC" },
      { id: "honeymoon", name: "Honeymoon", allocated: 0, spent: 0, color: "#34D399" },
      { id: "misc", name: "Misc", allocated: 0, spent: 0, color: "#9CA3AF" },
    ],
    expenses: [],
    vendors: [],
    guests: [],
  };
  store.weddings.push(wedding);
  store.activeWeddingId = wedding.id;
  saveStore(store);
  return wedding;
}

export function updateWedding(id, updater) {
  const store = getStore();
  store.weddings = store.weddings.map((w) => (w.id === id ? updater(w) : w));
  saveStore(store);
}

export function deleteWedding(id) {
  const store = getStore();
  store.weddings = store.weddings.filter((w) => w.id !== id);
  if (store.activeWeddingId === id) {
    store.activeWeddingId = store.weddings[0]?.id || null;
  }
  saveStore(store);
}
