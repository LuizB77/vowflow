import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getActiveWedding, updateWedding } from "../utils/storage";

// ── helpers ───────────────────────────────────────────────────
function fmt(n) {
  return Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ── EditAllocatedModal ────────────────────────────────────────
function EditAllocatedModal({ category, onSave, onClose }) {
  const [val, setVal] = useState(String(category.allocated || ""));
  const [err, setErr] = useState("");

  function handleSave() {
    const n = Number(val);
    if (isNaN(n) || n < 0) { setErr("Enter a valid amount."); return; }
    onSave(n);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Edit {category.name} Budget</h3>
        <p className="text-sm text-gray-400 mb-4">Set how much you want to allocate to this category.</p>
        {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A] mb-4"
          placeholder="e.g. 5000"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-[#7D9E7A] text-white font-semibold text-sm hover:bg-[#5E8260]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AddExpenseModal ───────────────────────────────────────────
function AddExpenseModal({ category, onSave, onClose }) {
  const [form, setForm] = useState({ description: "", amount: "", date: new Date().toISOString().slice(0, 10) });
  const [err, setErr]   = useState("");

  function handleSave() {
    if (!form.description.trim()) { setErr("Add a description."); return; }
    const amt = Number(form.amount);
    if (isNaN(amt) || amt <= 0)   { setErr("Enter a valid amount."); return; }
    onSave({ description: form.description.trim(), amount: amt, date: form.date });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Log Expense — {category.name}</h3>
        <p className="text-sm text-gray-400 mb-4">Record actual money spent in this category.</p>
        {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
        <div className="space-y-3">
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (e.g. Venue deposit)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]"
          />
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount ($)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-[#7D9E7A] text-white font-semibold text-sm hover:bg-[#5E8260]">
            Log Expense
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CategoryCard ──────────────────────────────────────────────
function CategoryCard({ cat, expenses, onEditAllocated, onAddExpense, onDeleteExpense }) {
  const [open, setOpen] = useState(false);
  const spent     = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = cat.allocated - spent;
  const over      = remaining < 0;
  const pct       = cat.allocated > 0 ? Math.min(100, (spent / cat.allocated) * 100) : 0;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${over ? "border-red-200" : "border-[#E8D9C4]"} p-5 space-y-3`}>
      {/* top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
          <span className="font-semibold text-gray-800">{cat.name}</span>
        </div>
        {over && <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">Over budget!</span>}
      </div>

      {/* amounts */}
      <div className="grid grid-cols-3 text-center text-sm divide-x divide-gray-100">
        <div>
          <p className="text-gray-400 text-xs">Allocated</p>
          <p className="font-semibold text-gray-700">{fmt(cat.allocated)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Spent</p>
          <p className={`font-semibold ${spent > 0 ? "text-rose-500" : "text-gray-700"}`}>{fmt(spent)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Remaining</p>
          <p className={`font-semibold ${over ? "text-red-500" : "text-[#7D9E7A]"}`}>{fmt(remaining)}</p>
        </div>
      </div>

      {/* progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${over ? "bg-red-400" : "bg-[#7D9E7A]"}`}
          style={{ width: `${pct}%` }} />
      </div>

      {/* actions */}
      <div className="flex gap-2">
        <button onClick={onEditAllocated}
          className="flex-1 text-xs border border-gray-200 text-gray-500 rounded-lg py-1.5 hover:border-[#7D9E7A] hover:text-[#7D9E7A] transition-colors">
          Edit Budget
        </button>
        <button onClick={onAddExpense}
          className="flex-1 text-xs bg-[#7D9E7A] text-white rounded-lg py-1.5 hover:bg-[#5E8260] transition-colors">
          + Log Expense
        </button>
      </div>

      {/* expense log toggle */}
      {expenses.length > 0 && (
        <button onClick={() => setOpen((p) => !p)}
          className="text-xs text-[#7D9E7A] hover:underline">
          {open ? "Hide" : `Show ${expenses.length} expense${expenses.length > 1 ? "s" : ""}`} ▾
        </button>
      )}
      {open && (
        <ul className="space-y-1 pt-1">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between text-xs text-gray-500 group">
              <span>{e.date} — {e.description}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{fmt(e.amount)}</span>
                <button onClick={() => onDeleteExpense(e.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity">✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Budget page ───────────────────────────────────────────────
export default function Budget() {
  const [wedding, setWedding] = useState(getActiveWedding());
  const [editCat,  setEditCat]  = useState(null); // category object
  const [expCat,   setExpCat]   = useState(null); // category object

  function refresh() { setWedding(getActiveWedding()); }

  if (!wedding) return (
    <p className="text-gray-400 mt-12 text-center">Create a wedding first on the Dashboard.</p>
  );

  const cats     = wedding.budgetCategories || [];
  const expenses = wedding.expenses || [];

  const totalBudget    = wedding.budget || 0;
  const totalAllocated = cats.reduce((s, c) => s + (c.allocated || 0), 0);
  const totalSpent     = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalRemaining = totalBudget - totalSpent;

  // donut data — only categories with allocation
  const donutData = cats
    .filter((c) => c.allocated > 0)
    .map((c) => ({ name: c.name, value: c.allocated, color: c.color }));

  function handleSaveAllocated(amount) {
    updateWedding(wedding.id, (w) => ({
      ...w,
      budgetCategories: w.budgetCategories.map((c) =>
        c.id === editCat.id ? { ...c, allocated: amount } : c
      ),
    }));
    setEditCat(null);
    refresh();
  }

  function handleSaveExpense({ description, amount, date }) {
    const expense = { id: crypto.randomUUID(), categoryId: expCat.id, description, amount, date };
    updateWedding(wedding.id, (w) => ({ ...w, expenses: [...w.expenses, expense] }));
    setExpCat(null);
    refresh();
  }

  function handleDeleteExpense(expId) {
    updateWedding(wedding.id, (w) => ({ ...w, expenses: w.expenses.filter((e) => e.id !== expId) }));
    refresh();
  }

  return (
    <div className="space-y-6 py-6">
      {editCat && <EditAllocatedModal category={editCat} onSave={handleSaveAllocated} onClose={() => setEditCat(null)} />}
      {expCat  && <AddExpenseModal    category={expCat}  onSave={handleSaveExpense}   onClose={() => setExpCat(null)}  />}

      {/* ── Header ── */}
      <h1 className="text-2xl font-bold text-gray-800">💰 Budget</h1>

      {/* ── Total bar ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E8D9C4] p-5 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: "Total Budget",  val: totalBudget,    color: "text-gray-800" },
            { label: "Allocated",     val: totalAllocated, color: "text-[#7D9E7A]" },
            { label: "Spent",         val: totalSpent,     color: "text-rose-500" },
            { label: "Remaining",     val: totalRemaining, color: totalRemaining < 0 ? "text-red-500" : "text-[#7D9E7A]" },
          ].map(({ label, val, color }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{fmt(val)}</p>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-[#7D9E7A] h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (totalSpent / (totalBudget || 1)) * 100)}%` }} />
        </div>
        <p className="text-xs text-gray-400 text-right">
          {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of total budget spent
        </p>
      </div>

      {/* ── Donut chart ── */}
      {donutData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8D9C4] p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Budget Allocation</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
              >
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Category cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((cat) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            expenses={expenses.filter((e) => e.categoryId === cat.id)}
            onEditAllocated={() => setEditCat(cat)}
            onAddExpense={() => setExpCat(cat)}
            onDeleteExpense={handleDeleteExpense}
          />
        ))}
      </div>
    </div>
  );
}
