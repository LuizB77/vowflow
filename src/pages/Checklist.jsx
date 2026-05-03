import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { getStore, getActiveWedding, updateWedding } from "../utils/storage";

const MONTHS = [
  { label: "12 Months Before", value: 12 },
  { label: "9 Months Before",  value: 9  },
  { label: "6 Months Before",  value: 6  },
  { label: "3 Months Before",  value: 3  },
  { label: "1 Month Before",   value: 1  },
  { label: "Week Of",          value: 0  },
  { label: "Day Of",           value: -1 },
];

function Badge({ label }) {
  return (
    <span className="text-xs bg-[#E8C4B8]/40 text-[#7D9E7A] px-2 py-0.5 rounded-full font-medium">
      {label}
    </span>
  );
}

export default function Checklist() {
  const [wedding, setWedding]         = useState(getActiveWedding());
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [collapsed, setCollapsed]     = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const prevSectionDone               = useRef({});

  function refresh() {
    const w = getActiveWedding();
    setWedding(w);
  }

  // ── Auto-generate on first load if checklist is empty ──────
  useEffect(() => {
    if (wedding && wedding.checklist.length === 0) {
      handleGenerate();
    }
  }, [wedding?.id]);

  function handleGenerate() {
    if (!wedding) return;
    setLoading(true);
    const items = [
      { task: "Set wedding budget and guest count estimate", category: "Misc", monthsBefore: 12 },
      { task: "Book wedding venue", category: "Venue", monthsBefore: 12 },
      { task: "Research and book wedding photographer", category: "Photography", monthsBefore: 12 },
      { task: "Research and book caterer", category: "Catering", monthsBefore: 12 },
      { task: "Book wedding videographer", category: "Photography", monthsBefore: 12 },
      { task: "Research wedding dress designers and shops", category: "Attire", monthsBefore: 12 },
      { task: "Book ceremony officiant", category: "Legal", monthsBefore: 12 },
      { task: "Start honeymoon planning research", category: "Honeymoon", monthsBefore: 12 },
      { task: "Order wedding dress", category: "Attire", monthsBefore: 9 },
      { task: "Book wedding band or DJ", category: "Music", monthsBefore: 9 },
      { task: "Book florist", category: "Flowers", monthsBefore: 9 },
      { task: "Finalize guest list", category: "Invitations", monthsBefore: 9 },
      { task: "Order groomsmen and bridesmaids attire", category: "Attire", monthsBefore: 9 },
      { task: "Book hair and makeup artists", category: "Attire", monthsBefore: 9 },
      { task: "Schedule wedding cake tastings", category: "Catering", monthsBefore: 9 },
      { task: "Send save-the-dates", category: "Invitations", monthsBefore: 9 },
      { task: "Book honeymoon travel and accommodations", category: "Honeymoon", monthsBefore: 6 },
      { task: "Order wedding invitations", category: "Invitations", monthsBefore: 6 },
      { task: "Schedule venue walkthrough", category: "Venue", monthsBefore: 6 },
      { task: "Arrange wedding transportation", category: "Misc", monthsBefore: 6 },
      { task: "Register for gifts", category: "Misc", monthsBefore: 6 },
      { task: "Book rehearsal dinner venue", category: "Venue", monthsBefore: 6 },
      { task: "Meet with officiant to plan ceremony", category: "Legal", monthsBefore: 6 },
      { task: "Schedule dress fittings", category: "Attire", monthsBefore: 6 },
      { task: "Mail wedding invitations", category: "Invitations", monthsBefore: 3 },
      { task: "Finalize catering menu", category: "Catering", monthsBefore: 3 },
      { task: "Order wedding cake", category: "Catering", monthsBefore: 3 },
      { task: "Purchase wedding rings", category: "Legal", monthsBefore: 3 },
      { task: "Book accommodations for out-of-town guests", category: "Misc", monthsBefore: 3 },
      { task: "Final dress fitting", category: "Attire", monthsBefore: 3 },
      { task: "Create seating chart", category: "Misc", monthsBefore: 3 },
      { task: "Write personal vows", category: "Legal", monthsBefore: 3 },
      { task: "Confirm all vendor bookings", category: "Misc", monthsBefore: 1 },
      { task: "Apply for marriage license", category: "Legal", monthsBefore: 1 },
      { task: "Prepare vendor payment schedule", category: "Misc", monthsBefore: 1 },
      { task: "Create day-of timeline", category: "Misc", monthsBefore: 1 },
      { task: "Send final guest count to caterer", category: "Catering", monthsBefore: 1 },
      { task: "Pick up wedding dress", category: "Attire", monthsBefore: 1 },
      { task: "Attend rehearsal and rehearsal dinner", category: "Misc", monthsBefore: 0 },
      { task: "Deliver vendor payments and tips", category: "Misc", monthsBefore: 0 },
      { task: "Pack for honeymoon", category: "Honeymoon", monthsBefore: 0 },
      { task: "Delegate day-of tasks to wedding party", category: "Misc", monthsBefore: 0 },
      { task: "Eat breakfast and stay hydrated", category: "Misc", monthsBefore: -1 },
      { task: "Give rings to best man / maid of honor", category: "Legal", monthsBefore: -1 },
      { task: "Do final venue walkthrough with coordinator", category: "Venue", monthsBefore: -1 },
      { task: "Take portraits with wedding party", category: "Photography", monthsBefore: -1 },
      { task: "Enjoy every moment — you only do this once!", category: "Misc", monthsBefore: -1 },
    ];
    const withIds = items.map((t) => ({
      ...t,
      id: crypto.randomUUID(),
      completed: false,
    }));
    updateWedding(wedding.id, (w) => ({ ...w, checklist: withIds }));
    refresh();
    setLoading(false);
  }

  function toggleTask(taskId) {
    if (!wedding) return;
    updateWedding(wedding.id, (w) => ({
      ...w,
      checklist: w.checklist.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
    refresh();
  }

  function addCustomTask(monthsBefore) {
    const text = (customInputs[monthsBefore] || "").trim();
    if (!text) return;
    updateWedding(wedding.id, (w) => ({
      ...w,
      checklist: [
        ...w.checklist,
        { id: crypto.randomUUID(), task: text, category: "Misc", monthsBefore, completed: false },
      ],
    }));
    setCustomInputs((prev) => ({ ...prev, [monthsBefore]: "" }));
    refresh();
  }

  function deleteTask(taskId) {
    updateWedding(wedding.id, (w) => ({
      ...w,
      checklist: w.checklist.filter((t) => t.id !== taskId),
    }));
    refresh();
  }

  // ── Confetti when a full section is newly completed ────────
  useEffect(() => {
    if (!wedding) return;
    MONTHS.forEach(({ value }) => {
      const sectionTasks = wedding.checklist.filter((t) => t.monthsBefore === value);
      if (sectionTasks.length === 0) return;
      const allDone = sectionTasks.every((t) => t.completed);
      const wasDone = prevSectionDone.current[value];
      if (allDone && !wasDone) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#7D9E7A", "#C9A84C", "#E8C4B8", "#fff"] });
      }
      prevSectionDone.current[value] = allDone;
    });
  }, [wedding?.checklist]);

  if (!wedding) {
    return <p className="text-gray-400 mt-12 text-center">Create a wedding first on the Dashboard.</p>;
  }

  const totalTasks = wedding.checklist.length;
  const doneTasks  = wedding.checklist.filter((t) => t.completed).length;

  return (
    <div className="space-y-6 py-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✅ Checklist</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {doneTasks}/{totalTasks} tasks completed
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-sm border border-[#7D9E7A] text-[#7D9E7A] px-4 py-1.5 rounded-full hover:bg-[#7D9E7A] hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? "Generating…" : "✨ Regenerate AI Checklist"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#7D9E7A]">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <p className="text-sm text-gray-500">Asking AI to build your checklist…</p>
        </div>
      )}

      {/* ── Sections ── */}
      {!loading && MONTHS.map(({ label, value }) => {
        const tasks = wedding.checklist.filter((t) => t.monthsBefore === value);
        if (tasks.length === 0) return null;

        const sectionDone = tasks.every((t) => t.completed);
        const isOpen      = collapsed[value] !== true;

        return (
          <div key={value} className="bg-white rounded-2xl shadow-sm border border-[#E8D9C4] overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => setCollapsed((p) => ({ ...p, [value]: !p[value] }))}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sectionDone ? "bg-[#C9A84C]" : "bg-[#7D9E7A]"}`} />
                <span className="font-semibold text-gray-700">{label}</span>
                <span className="text-xs text-gray-400">
                  {tasks.filter((t) => t.completed).length}/{tasks.length}
                </span>
                {sectionDone && <span className="text-xs text-[#C9A84C] font-medium">🎉 Done!</span>}
              </div>
              <span className="text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Tasks */}
            {isOpen && (
              <div className="divide-y divide-gray-50">
                {tasks.map((t) => (
                  <div key={t.id}
                    className={`flex items-center gap-3 px-5 py-3 group ${t.completed ? "bg-gray-50" : ""}`}>
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTask(t.id)}
                      className="w-4 h-4 accent-[#7D9E7A] cursor-pointer flex-shrink-0"
                    />
                    <span className={`flex-1 text-sm ${t.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {t.task}
                    </span>
                    <Badge label={t.category} />
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs transition-opacity ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Add custom task */}
                <div className="flex items-center gap-2 px-5 py-3 bg-gray-50/50">
                  <input
                    value={customInputs[value] || ""}
                    onChange={(e) => setCustomInputs((p) => ({ ...p, [value]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addCustomTask(value)}
                    placeholder="+ Add custom task…"
                    className="flex-1 text-sm bg-transparent border-none outline-none text-gray-500 placeholder-gray-300"
                  />
                  <button
                    onClick={() => addCustomTask(value)}
                    className="text-xs text-[#7D9E7A] font-medium hover:underline"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
