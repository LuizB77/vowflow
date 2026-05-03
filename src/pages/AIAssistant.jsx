import { useState, useEffect, useRef, startTransition } from "react";
import { getActiveWedding } from "../utils/storage";

function buildSystemPrompt(wedding) {
  if (!wedding) return "You are a helpful wedding planning assistant.";

  const daysAway = Math.max(0, Math.ceil(
    (new Date(wedding.weddingDate) - new Date()) / 86400000
  ));
  const totalTasks = wedding.checklist?.length || 0;
  const doneTasks  = wedding.checklist?.filter((t) => t.completed).length || 0;
  const pct        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalSpent = wedding.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0;
  const guestCount = wedding.guests?.length || 0;
  const attending  = wedding.guests?.filter((g) => g.rsvp === "attending").length || 0;
  const bookedVendors = wedding.vendors?.filter((v) => v.status === "booked" || v.status === "paid").length || 0;

  return `You are a warm, knowledgeable wedding planning assistant helping ${wedding.coupleName} and ${wedding.partnerName} plan their perfect wedding.

Here is their current wedding snapshot:
- Wedding date: ${new Date(wedding.weddingDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (${daysAway} days away)
- Total budget: $${wedding.budget?.toLocaleString()}
- Budget spent so far: $${totalSpent.toLocaleString()}
- Checklist completion: ${pct}% (${doneTasks}/${totalTasks} tasks done)
- Guests invited: ${guestCount} (${attending} confirmed attending)
- Vendors booked or paid: ${bookedVendors}

Be warm, specific, and practical. Give actionable advice based on their actual data. When they ask what to do next, look at their checklist completion and days remaining to give relevant guidance. Keep responses concise but helpful.`;
}

const SUGGESTIONS = [
  "What should I focus on next?",
  "Am I on track with my budget?",
  "Give me a day-of timeline",
  "How should I split my remaining budget?",
  "What vendors should I book first?",
  "Help me write thank-you card wording",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-2 h-2 rounded-full bg-[#7D9E7A] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const wedding = getActiveWedding();
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Welcome message on mount ──────────────────────────────
  useEffect(() => {
    if (!wedding) return;
    startTransition(() => {
      setMessages([{
        role: "assistant",
        content: `Hi ${wedding.coupleName} & ${wedding.partnerName}! 💍 I'm your VowFlow wedding assistant. I know all about your wedding — ${Math.max(0, Math.ceil((new Date(wedding.weddingDate) - new Date()) / 86400000))} days to go! Ask me anything — what to book next, how to stay on budget, day-of timelines, or anything else. How can I help?`,
      }]);
    });
  }, [wedding?.id]);

  // ── Scroll to bottom on new messages ─────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setError("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
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
          max_tokens: 1000,
          system: buildSystemPrompt(wedding),
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setError("Failed to reach the AI. Check your API key and connection.");
      console.error(e);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!wedding) return (
    <p className="text-gray-400 mt-12 text-center">Create a wedding first on the Dashboard.</p>
  );

  return (
    <div className="flex flex-col py-6 gap-4" style={{ height: "calc(100vh - 80px)" }}>
      <h1 className="text-2xl font-bold text-gray-800 flex-shrink-0">✨ AI Assistant</h1>

      {/* ── Suggestion chips ── */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-[#E8C4B8]/40 text-[#7D9E7A] font-medium hover:bg-[#E8C4B8]/70 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Message thread ── */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-[#E8D9C4] shadow-sm p-4 space-y-4 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-[#7D9E7A] text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                ✨
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-[#7D9E7A] text-white rounded-tr-sm"
                : "bg-gray-50 text-gray-700 rounded-tl-sm border border-gray-100"
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-[#7D9E7A] text-white text-xs flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              ✨
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm">
              <TypingDots />
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your wedding…"
          rows={1}
          className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7D9E7A] max-h-32 overflow-y-auto"
          style={{ fieldSizing: "content" }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-full bg-[#7D9E7A] text-white flex items-center justify-center hover:bg-[#5E8260] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
