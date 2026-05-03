import { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Dashboard   from "./pages/Dashboard";
import Checklist   from "./pages/Checklist";
import Budget      from "./pages/Budget";
import Vendors     from "./pages/Vendors";
import GuestList   from "./pages/GuestList";
import AIAssistant from "./pages/AIAssistant";

const navItems = [
  { to: "/",          label: "💍 Dashboard"     },
  { to: "/checklist", label: "✅ Checklist"      },
  { to: "/budget",    label: "💰 Budget"         },
  { to: "/vendors",   label: "🤝 Vendors"        },
  { to: "/guests",    label: "👥 Guests"         },
  { to: "/assistant", label: "✨ AI Assistant"   },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          {/* Wordmark */}
          <span className="font-bold text-[#7D9E7A] text-lg tracking-tight select-none">
            Vow<span className="text-[#C9A84C]">Flow</span>
          </span>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
                    isActive
                      ? "bg-[#7D9E7A] text-white"
                      : "text-gray-500 hover:text-[#7D9E7A] hover:bg-[#7D9E7A]/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#7D9E7A] text-white"
                      : "text-gray-500 hover:bg-[#7D9E7A]/10 hover:text-[#7D9E7A]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-1 p-4 max-w-5xl mx-auto w-full">
        <Routes>
          <Route path="/"          element={<Dashboard />}   />
          <Route path="/checklist" element={<Checklist />}   />
          <Route path="/budget"    element={<Budget />}      />
          <Route path="/vendors"   element={<Vendors />}     />
          <Route path="/guests"    element={<GuestList />}   />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="*"          element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
