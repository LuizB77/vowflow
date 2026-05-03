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

async function generateChecklist(weddingDate) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system:
        "You are a wedding planning expert. Given a wedding date, generate a master checklist of tasks grouped by timeframe. Return ONLY a JSON array with no markdown, no backticks, no extra text, in this exact format: [{\"task\": string, \"category\": string, \"monthsBefore\": number}]. Use monthsBefore values: 12, 9, 6, 3, 1, 0 (week of), -1 (day of). Categories: Venue, Catering, Photography, Attire, Music, Flowers, Invitations, Legal, Honeymoon, Misc",
      messages: [
        {
          role: "user",
          content: `Wedding date: ${weddingDate}. Generate the master checklist now.`,
        },
      ],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || "[]";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
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

  async function handleGenerate() {
    if (!wedding) return;
    setLoading(true);
    setError("");
    try {
      const items = await generateChecklist(wedding.weddingDate);
      const withIds = items.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        completed: false,
      }));
      updateWedding(wedding.id, (w) => ({ ...w, checklist: withIds }));
      refresh();
    } catch (e) {
      setError("Failed to generate checklist. Check your API key and try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
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
