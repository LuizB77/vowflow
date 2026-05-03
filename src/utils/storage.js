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
      { id: "venue",       name: "Venue",       allocated: 0, spent: 0, color: "#7D9E7A" },
      { id: "catering",    name: "Catering",    allocated: 0, spent: 0, color: "#C9A84C" },
      { id: "photography", name: "Photography", allocated: 0, spent: 0, color: "#E8C4B8" },
      { id: "flowers",     name: "Flowers",     allocated: 0, spent: 0, color: "#A8C5A0" },
      { id: "attire",      name: "Attire",      allocated: 0, spent: 0, color: "#D4B483" },
      { id: "music",       name: "Music",       allocated: 0, spent: 0, color: "#C4957A" },
      { id: "invitations", name: "Invitations", allocated: 0, spent: 0, color: "#8FB08C" },
      { id: "honeymoon",   name: "Honeymoon",   allocated: 0, spent: 0, color: "#B8986A" },
      { id: "misc",        name: "Misc",        allocated: 0, spent: 0, color: "#C5BBA8" },
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
