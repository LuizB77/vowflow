import { useState } from "react";
import { getActiveWedding, updateWedding } from "../utils/storage";

const CATEGORIES = ["Venue","Catering","Photography","Attire","Music","Flowers","Invitations","Legal","Honeymoon","Misc"];
const STATUSES   = ["contacted","booked","paid"];

const STATUS_STYLES = {
  contacted: { badge: "bg-gray-100 text-gray-500",       dot: "bg-gray-400",  label: "Contacted" },
  booked:    { badge: "bg-amber-100 text-amber-600",     dot: "bg-amber-400", label: "Booked"    },
  paid:      { badge: "bg-[#E8F0E6] text-[#4A7A47]",     dot: "bg-green-400", label: "Paid"      },
};

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const EMPTY_FORM = { name: "", category: "Venue", contact: "", quote: "", status: "contacted", notes: "" };

// ── VendorModal (add / edit) ──────────────────────────────────
function VendorModal({ initial = EMPTY_FORM, title, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [err,  setErr]  = useState("");

  function set(field, val) { setForm((p) => ({ ...p, [field]: val })); }

  function handleSave() {
    if (!form.name.trim()) { setErr("Vendor name is required."); return; }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        {err && <p className="text-red-500 text-sm mb-3">{err}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vendor Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. The Grand Venue"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]">
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact (phone / email)</label>
            <input value={form.contact} onChange={(e) => set("contact", e.target.value)}
              placeholder="e.g. 555-123-4567"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Price Quote ($)</label>
            <input type="number" value={form.quote} onChange={(e) => set("quote", e.target.value)}
              placeholder="e.g. 3500"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A]" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              rows={3} placeholder="Anything to remember about this vendor…"
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7D9E7A] resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-[#7D9E7A] text-white font-semibold text-sm hover:bg-[#5E8260]">
            Save Vendor
          </button>
        </div>
      </div>
    </div>
  );
}

// ── VendorCard ────────────────────────────────────────────────
function VendorCard({ vendor, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_STYLES[vendor.status] || STATUS_STYLES.contacted;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D9C4] p-4 space-y-3 cursor-pointer hover:border-[#7D9E7A]/40 transition-colors"
      onClick={() => setExpanded((p) => !p)}>

      {/* top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{vendor.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{vendor.category}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${s.badge}`}>
          {s.label}
        </span>
      </div>

      {/* quote */}
      {vendor.quote > 0 && (
        <p className="text-sm font-semibold text-[#7D9E7A]">{fmt(vendor.quote)}</p>
      )}

      {/* expanded details */}
      {expanded && (
        <div className="pt-2 border-t border-gray-100 space-y-2 text-sm text-gray-600"
          onClick={(e) => e.stopPropagation()}>
          {vendor.contact && (
            <p><span className="text-gray-400 text-xs uppercase tracking-wide">Contact: </span>{vendor.contact}</p>
          )}
          {vendor.notes && (
            <p><span className="text-gray-400 text-xs uppercase tracking-wide">Notes: </span>{vendor.notes}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(vendor)}
              className="flex-1 text-xs border border-gray-200 text-gray-500 rounded-lg py-1.5 hover:border-[#7D9E7A] hover:text-[#7D9E7A] transition-colors">
              ✏️ Edit
            </button>
            <button onClick={() => onDelete(vendor.id)}
              className="flex-1 text-xs border border-red-100 text-red-400 rounded-lg py-1.5 hover:bg-red-50 transition-colors">
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vendors page ──────────────────────────────────────────────
export default function Vendors() {
  const [wedding,    setWedding]    = useState(getActiveWedding());
  const [showAdd,    setShowAdd]    = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [filterCat,  setFilterCat]  = useState("All");
  const [filterSt,   setFilterSt]   = useState("All");

  function refresh() { setWedding(getActiveWedding()); }

  if (!wedding) return (
    <p className="text-gray-400 mt-12 text-center">Create a wedding first on the Dashboard.</p>
  );

  const vendors = wedding.vendors || [];

  function handleAdd(form) {
    const vendor = { id: crypto.randomUUID(), ...form, quote: Number(form.quote) || 0 };
    updateWedding(wedding.id, (w) => ({ ...w, vendors: [...w.vendors, vendor] }));
    setShowAdd(false);
    refresh();
  }

  function handleEdit(form) {
    updateWedding(wedding.id, (w) => ({
      ...w,
      vendors: w.vendors.map((v) => v.id === editVendor.id ? { ...v, ...form, quote: Number(form.quote) || 0 } : v),
    }));
    setEditVendor(null);
    refresh();
  }

  function handleDelete(id) {
    if (!confirm("Delete this vendor?")) return;
    updateWedding(wedding.id, (w) => ({ ...w, vendors: w.vendors.filter((v) => v.id !== id) }));
    refresh();
  }

  // ── filters ──
  const cats = ["All", ...CATEGORIES.filter((c) => vendors.some((v) => v.category === c))];
  const sts  = ["All", ...STATUSES];

  const filtered = vendors.filter((v) =>
    (filterCat === "All" || v.category === filterCat) &&
    (filterSt  === "All" || v.status   === filterSt)
  );

  // group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const list = filtered.filter((v) => v.category === cat);
    if (list.length > 0) acc[cat] = list;
    return acc;
  }, {});

  // summary counts
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: vendors.filter((v) => v.status === s).length }), {});
  const totalQuoted = vendors.reduce((s, v) => s + (v.quote || 0), 0);

  return (
    <div className="space-y-6 py-6">
      {showAdd    && <VendorModal title="Add Vendor"  onSave={handleAdd}           onClose={() => setShowAdd(false)}    />}
      {editVendor && <VendorModal title="Edit Vendor" initial={editVendor} onSave={handleEdit} onClose={() => setEditVendor(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">🤝 Vendors</h1>
        <button onClick={() => setShowAdd(true)}
          className="text-sm bg-[#7D9E7A] text-white px-4 py-2 rounded-full hover:bg-[#5E8260] font-medium">
          + Add Vendor
        </button>
      </div>

      {/* ── Summary bar ── */}
      {vendors.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Vendors", val: vendors.length,       color: "text-gray-800" },
            { label: "Contacted",     val: counts.contacted,     color: "text-gray-500" },
            { label: "Booked",        val: counts.booked,        color: "text-amber-500" },
            { label: "Paid",          val: counts.paid,          color: "text-green-600" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-[#E8D9C4] shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {vendors.length > 0 && (
        <p className="text-sm text-gray-500">
          Total quoted: <span className="font-semibold text-[#7D9E7A]">
            {Number(totalQuoted).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
          </span>
        </p>
      )}

      {/* ── Filters ── */}
      {vendors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">Category:</span>
            {cats.map((c) => (
              <button key={c} onClick={() => setFilterCat(c)}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${filterCat === c ? "bg-[#7D9E7A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400">Status:</span>
            {sts.map((s) => (
              <button key={s} onClick={() => setFilterSt(s)}
                className={`text-xs px-3 py-1 rounded-full transition-colors capitalize ${filterSt === s ? "bg-[#7D9E7A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Grouped cards ── */}
      {vendors.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-2">
          <p className="text-4xl">🤝</p>
          <p>No vendors yet. Add your first one!</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No vendors match the selected filters.</p>
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((v) => (
                <VendorCard key={v.id} vendor={v} onEdit={setEditVendor} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
