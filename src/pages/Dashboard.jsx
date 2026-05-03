import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStore,
  getActiveWedding,
  setActiveWedding,
  createWedding,
  deleteWedding,
} from "../utils/storage";

// ── ProgressRing ──────────────────────────────────────────────
function ProgressRing({ pct = 0, size = 100, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#7F77DD" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="text-sm font-bold" fill="#7F77DD" fontSize={size * 0.18}>
        {pct}%
      </text>
    </svg>
  );
}

// ── CreateWeddingModal ────────────────────────────────────────
function CreateWeddingModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    coupleName: "", partnerName: "", weddingDate: "", budget: "",
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit() {
    if (!form.coupleName || !form.partnerName || !form.weddingDate || !form.budget) {
      setError("Please fill in all fields.");
      return;
    }
    if (isNaN(Number(form.budget)) || Number(form.budget) <= 0) {
      setError("Budget must be a positive number.");
      return;
    }
    const w = createWedding({ ...form, budget: Number(form.budget) });
    onCreated(w);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-[#7F77DD] mb-1">💍 New Wedding</h2>
        <p className="text-gray-500 text-sm mb-5">Fill in the basics to get started.</p>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Partner 1 Name</label>
            <input name="coupleName" value={form.coupleName} onChange={handleChange}
              placeholder="e.g. Sofia"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Partner 2 Name</label>
            <input name="partnerName" value={form.partnerName} onChange={handleChange}
              placeholder="e.g. Marco"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wedding Date</label>
            <input name="weddingDate" type="date" value={form.weddingDate} onChange={handleChange}
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Budget ($)</label>
            <input name="budget" type="number" value={form.budget} onChange={handleChange}
              placeholder="e.g. 25000"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {onClose && (
            <button onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
              Cancel
            </button>
          )}
          <button onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg bg-[#7F77DD] text-white font-semibold text-sm hover:bg-[#6a62c4] transition-colors">
            Create Wedding 💍
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const [store, setStore] = useState(getStore());
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const wedding = store.weddings.find((w) => w.id === store.activeWeddingId) || null;

  useEffect(() => {
    if (store.weddings.length === 0) setShowModal(true);
  }, []);

  function refresh() { setStore(getStore()); }

  function handleCreated() {
    refresh();
    setShowModal(false);
  }

  function handleSelectWedding(e) {
    setActiveWedding(e.target.value);
    refresh();
  }

  function handleDelete() {
    if (!wedding) return;
    if (!confirm(`Delete "${wedding.coupleName} & ${wedding.partnerName}"? This cannot be undone.`)) return;
    deleteWedding(wedding.id);
    refresh();
  }

  // ── derived stats ────────────────────────────────────────────
  const daysAway = wedding
    ? Math.max(0, Math.ceil((new Date(wedding.weddingDate) - new Date()) / 86400000))
    : null;

  const totalTasks = wedding?.checklist?.length || 0;
  const doneTasks = wedding?.checklist?.filter((t) => t.completed).length || 0;
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const totalAllocated = wedding?.budgetCategories?.reduce((s, c) => s + (c.allocated || 0), 0) || 0;
  const totalSpent = wedding?.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
  const remaining = (wedding?.budget || 0) - totalSpent;

  const nextTasks = wedding?.checklist?.filter((t) => !t.completed).slice(0, 3) || [];

  // ── empty state ──────────────────────────────────────────────
  if (!wedding && !showModal) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 gap-4">
        <p className="text-gray-400 text-lg">No wedding yet.</p>
        <button onClick={() => setShowModal(true)}
          className="bg-[#7F77DD] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#6a62c4]">
          + Create Your First Wedding
        </button>
        {showModal && <CreateWeddingModal onCreated={handleCreated} />}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {showModal && (
        <CreateWeddingModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {wedding ? `💍 ${wedding.coupleName} & ${wedding.partnerName}` : "VowFlow"}
          </h1>
          {wedding && (
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date(wedding.weddingDate).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {store.weddings.length > 1 && (
            <select value={store.activeWeddingId} onChange={handleSelectWedding}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7F77DD]">
              {store.weddings.map((w) => (
                <option key={w.id} value={w.id}>{w.coupleName} & {w.partnerName}</option>
              ))}
            </select>
          )}
          <button onClick={() => setShowModal(true)}
            className="text-sm bg-[#7F77DD] text-white px-4 py-1.5 rounded-full hover:bg-[#6a62c4] font-medium">
            + New Wedding
          </button>
          {wedding && (
            <button onClick={handleDelete}
              className="text-sm border border-red-200 text-red-400 px-3 py-1.5 rounded-full hover:bg-red-50">
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      {wedding && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Countdown */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <p className="text-5xl font-extrabold text-[#7F77DD]">{daysAway}</p>
              <p className="text-gray-500 text-sm mt-1">days to go 🗓️</p>
            </div>

            {/* Progress ring */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2">
              <ProgressRing pct={pct} size={90} stroke={9} />
              <p className="text-gray-500 text-sm">{doneTasks}/{totalTasks} tasks done</p>
            </div>

            {/* Budget snapshot */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold">${wedding.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Allocated</span>
                <span className="font-semibold">${totalAllocated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Spent</span>
                <span className="font-semibold text-rose-500">${totalSpent.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                <div className="bg-[#7F77DD] h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalSpent / (wedding.budget || 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 text-right">${remaining.toLocaleString()} remaining</p>
            </div>
          </div>

          {/* ── Next tasks ── */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">🗒️ Up Next</h2>
              <button onClick={() => navigate("/checklist")}
                className="text-xs text-[#7F77DD] hover:underline">View all →</button>
            </div>
            {nextTasks.length === 0 ? (
              <p className="text-sm text-gray-400">
                {totalTasks === 0
                  ? "Head to the Checklist page to generate your AI checklist."
                  : "🎉 All tasks complete!"}
              </p>
            ) : (
              <ul className="space-y-2">
                {nextTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-[#F4C0D1] flex-shrink-0" />
                    {t.task}
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {t.category}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
