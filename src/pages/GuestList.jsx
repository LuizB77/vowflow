import { useState, useMemo } from "react";
import { getActiveWedding, updateWedding } from "../utils/storage";

const RSVP_STYLES = {
  pending:   { badge: "bg-gray-100 text-gray-500",     label: "Pending"   },
  attending: { badge: "bg-green-100 text-green-600",   label: "Attending" },
  declined:  { badge: "bg-red-100 text-red-500",       label: "Declined"  },
};
const MEALS   = ["No preference", "Chicken", "Fish", "Vegetarian", "Vegan", "Kids meal"];
const EMPTY   = { name: "", email: "", phone: "", plusOne: false, meal: "No preference", rsvp: "pending" };

function SortIcon({ col, sortBy, sortDir }) {
  if (sortBy !== col) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="text-[#7F77DD] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

// ── GuestModal ────────────────────────────────────────────────
function GuestModal({ initial = EMPTY, title, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [err,  setErr]  = useState("");

  function set(field, val) { setForm((p) => ({ ...p, [field]: val })); }

  function handleSave() {
    if (!form.name.trim()) { setErr("Guest name is required."); return; }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        {err && <p className="text-red-500 text-sm mb-3">{err}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Full Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Jane Smith"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="jane@email.com"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                placeholder="555-000-0000"
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">RSVP Status</label>
              <select value={form.rsvp} onChange={(e) => set("rsvp", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]">
                {Object.entries(RSVP_STYLES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meal Preference</label>
              <select value={form.meal} onChange={(e) => set("meal", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]">
                {MEALS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.plusOne} onChange={(e) => set("plusOne", e.target.checked)}
              className="w-4 h-4 accent-[#7F77DD]" />
            <span className="text-sm text-gray-600">Bringing a +1</span>
          </label>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-[#7F77DD] text-white font-semibold text-sm hover:bg-[#6a62c4]">
            Save Guest
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CSV export ────────────────────────────────────────────────
function exportCSV(guests) {
  const header = ["Name","Email","Phone","Plus One","Meal","RSVP"];
  const rows   = guests.map((g) => [
    g.name, g.email, g.phone,
    g.plusOne ? "Yes" : "No",
    g.meal, RSVP_STYLES[g.rsvp]?.label || g.rsvp,
  ]);
  const csv  = [header, ...rows].map((r) => r.map((c) => `"${(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "guest-list.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── GuestList page ────────────────────────────────────────────
export default function GuestList() {
  const [wedding,    setWedding]    = useState(getActiveWedding());
  const [showAdd,    setShowAdd]    = useState(false);
  const [editGuest,  setEditGuest]  = useState(null);
  const [filterRsvp, setFilterRsvp] = useState("All");
  const [sortBy,     setSortBy]     = useState("name"); // "name" | "rsvp"
  const [sortDir,    setSortDir]    = useState("asc");

  function refresh() { setWedding(getActiveWedding()); }

  function handleAdd(form) {
    const guest = { id: crypto.randomUUID(), ...form };
    updateWedding(wedding.id, (w) => ({ ...w, guests: [...w.guests, guest] }));
    setShowAdd(false);
    refresh();
  }

  function handleEdit(form) {
    updateWedding(wedding.id, (w) => ({
      ...w,
      guests: w.guests.map((g) => g.id === editGuest.id ? { ...g, ...form } : g),
    }));
    setEditGuest(null);
    refresh();
  }

  function handleDelete(id) {
    if (!confirm("Remove this guest?")) return;
    updateWedding(wedding.id, (w) => ({ ...w, guests: w.guests.filter((g) => g.id !== id) }));
    refresh();
  }

  function handleRsvpChange(id, rsvp) {
    if (!wedding) return;
    updateWedding(wedding.id, (w) => ({
      ...w,
      guests: w.guests.map((g) => g.id === id ? { ...g, rsvp } : g),
    }));
    refresh();
  }

  // ── sort + filter ──
  const displayed = useMemo(() => {
    if (!wedding) return [];
    const guests = wedding.guests || [];
    let list = filterRsvp === "All" ? guests : guests.filter((g) => g.rsvp === filterRsvp);
    list = [...list].sort((a, b) => {
      const va = sortBy === "name" ? a.name.toLowerCase() : a.rsvp;
      const vb = sortBy === "name" ? b.name.toLowerCase() : b.rsvp;
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [wedding, filterRsvp, sortBy, sortDir]);

  if (!wedding) return (
    <p className="text-gray-400 mt-12 text-center">Create a wedding first on the Dashboard.</p>
  );

  const guests = wedding.guests || [];

  function toggleSort(col) {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  // ── summary counts ──
  const totalInvited  = guests.length;
  const plusOnes      = guests.filter((g) => g.plusOne).length;
  const totalExpected = totalInvited + plusOnes;
  const attending     = guests.filter((g) => g.rsvp === "attending").length;
  const declined      = guests.filter((g) => g.rsvp === "declined").length;
  const pending       = guests.filter((g) => g.rsvp === "pending").length;

  return (
    <div className="space-y-6 py-6">
      {showAdd    && <GuestModal title="Add Guest"  onSave={handleAdd}            onClose={() => setShowAdd(false)}    />}
      {editGuest  && <GuestModal title="Edit Guest" initial={editGuest} onSave={handleEdit} onClose={() => setEditGuest(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">👥 Guest List</h1>
        <div className="flex gap-2">
          {guests.length > 0 && (
            <button onClick={() => exportCSV(guests)}
              className="text-sm border border-gray-200 text-gray-500 px-4 py-2 rounded-full hover:bg-gray-50">
              ⬇ Export CSV
            </button>
          )}
          <button onClick={() => setShowAdd(true)}
            className="text-sm bg-[#7F77DD] text-white px-4 py-2 rounded-full hover:bg-[#6a62c4] font-medium">
            + Add Guest
          </button>
        </div>
      </div>

      {/* ── Summary bar ── */}
      {guests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Invited",   val: totalInvited,  color: "text-gray-800"   },
            { label: "Expected",  val: totalExpected, color: "text-[#7F77DD]"  },
            { label: "Attending", val: attending,     color: "text-green-600"  },
            { label: "Declined",  val: declined,      color: "text-red-500"    },
            { label: "Pending",   val: pending,       color: "text-amber-500"  },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      {guests.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400">Filter:</span>
          {["All", "pending", "attending", "declined"].map((f) => (
            <button key={f} onClick={() => setFilterRsvp(f)}
              className={`text-xs px-3 py-1 rounded-full capitalize transition-colors ${filterRsvp === f ? "bg-[#7F77DD] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {f === "All" ? "All" : RSVP_STYLES[f].label}
            </button>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      {guests.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <p className="text-4xl">👥</p>
          <p>No guests yet. Add your first one!</p>
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No guests match the selected filter.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <button onClick={() => toggleSort("name")}
              className="col-span-4 text-left hover:text-[#7F77DD] flex items-center">
              Name <SortIcon col="name" sortBy={sortBy} sortDir={sortDir} />
            </button>
            <span className="col-span-2 hidden sm:block">Contact</span>
            <span className="col-span-1 text-center">+1</span>
            <span className="col-span-2">Meal</span>
            <button onClick={() => toggleSort("rsvp")}
              className="col-span-2 text-left hover:text-[#7F77DD] flex items-center">
              RSVP <SortIcon col="rsvp" sortBy={sortBy} sortDir={sortDir} />
            </button>
            <span className="col-span-1" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {displayed.map((g) => {
              const rs = RSVP_STYLES[g.rsvp] || RSVP_STYLES.pending;
              return (
                <div key={g.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-gray-50/50 group">
                  <div className="col-span-4 font-medium text-gray-800 truncate">{g.name}</div>
                  <div className="col-span-2 text-gray-400 text-xs truncate hidden sm:block">
                    {g.email || g.phone || "—"}
                  </div>
                  <div className="col-span-1 text-center text-xs">
                    {g.plusOne ? <span className="text-[#7F77DD] font-medium">+1</span> : <span className="text-gray-300">—</span>}
                  </div>
                  <div className="col-span-2 text-xs text-gray-500 truncate">{g.meal}</div>
                  <div className="col-span-2">
                    <select value={g.rsvp}
                      onChange={(e) => handleRsvpChange(g.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7F77DD] ${rs.badge}`}>
                      {Object.entries(RSVP_STYLES).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditGuest(g)}
                      className="text-gray-300 hover:text-[#7F77DD] text-xs">✏️</button>
                    <button onClick={() => handleDelete(g.id)}
                      className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
