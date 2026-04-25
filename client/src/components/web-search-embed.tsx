import { useEffect, useRef, useState } from "react";
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  X,
  Globe,
  Youtube,
  Github,
  BookOpen,
  ShoppingCart,
  Image as ImageIcon,
  Newspaper,
  MessageSquare,
  Code2,
  Film,
  Map as MapIcon,
  Music,
  Hash,
  Languages,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebSearchEmbedProps {
  open: boolean;
  onClose: () => void;
}

interface Engine {
  id: string;
  name: string;
  category: string;
  icon: any;
  url: (q: string) => string;
  color: string;
}

const ENGINES: Engine[] = [
  { id: "google", name: "Google", category: "Web", icon: Globe, color: "#4285f4", url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: "ddg", name: "DuckDuckGo", category: "Web", icon: Search, color: "#de5833", url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
  { id: "bing", name: "Bing", category: "Web", icon: Search, color: "#008373", url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { id: "brave", name: "Brave", category: "Web", icon: Search, color: "#fb542b", url: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}` },
  { id: "ecosia", name: "Ecosia", category: "Web", icon: Search, color: "#36a47f", url: (q) => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}` },

  { id: "youtube", name: "YouTube", category: "Video", icon: Youtube, color: "#ff0033", url: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
  { id: "vimeo", name: "Vimeo", category: "Video", icon: Film, color: "#1ab7ea", url: (q) => `https://vimeo.com/search?q=${encodeURIComponent(q)}` },

  { id: "github", name: "GitHub", category: "Code", icon: Github, color: "#ffffff", url: (q) => `https://github.com/search?q=${encodeURIComponent(q)}` },
  { id: "stackoverflow", name: "Stack Overflow", category: "Code", icon: Code2, color: "#f48024", url: (q) => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}` },
  { id: "mdn", name: "MDN Docs", category: "Code", icon: BookOpen, color: "#83d0f2", url: (q) => `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(q)}` },
  { id: "npm", name: "npm", category: "Code", icon: Hash, color: "#cb3837", url: (q) => `https://www.npmjs.com/search?q=${encodeURIComponent(q)}` },

  { id: "reddit", name: "Reddit", category: "Social", icon: MessageSquare, color: "#ff4500", url: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}` },
  { id: "twitter", name: "X / Twitter", category: "Social", icon: Hash, color: "#ffffff", url: (q) => `https://twitter.com/search?q=${encodeURIComponent(q)}` },

  { id: "wikipedia", name: "Wikipedia", category: "Reference", icon: BookOpen, color: "#ffffff", url: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}` },
  { id: "translate", name: "Translate", category: "Reference", icon: Languages, color: "#4285f4", url: (q) => `https://translate.google.com/?text=${encodeURIComponent(q)}` },

  { id: "images", name: "Google Images", category: "Media", icon: ImageIcon, color: "#34a853", url: (q) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}` },
  { id: "unsplash", name: "Unsplash", category: "Media", icon: ImageIcon, color: "#ffffff", url: (q) => `https://unsplash.com/s/photos/${encodeURIComponent(q)}` },
  { id: "spotify", name: "Spotify", category: "Media", icon: Music, color: "#1db954", url: (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}` },

  { id: "news", name: "Google News", category: "News", icon: Newspaper, color: "#4285f4", url: (q) => `https://news.google.com/search?q=${encodeURIComponent(q)}` },

  { id: "maps", name: "Google Maps", category: "Other", icon: MapIcon, color: "#34a853", url: (q) => `https://www.google.com/maps/search/${encodeURIComponent(q)}` },
  { id: "amazon", name: "Amazon", category: "Other", icon: ShoppingCart, color: "#ff9900", url: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
];

const CATEGORIES = ["All", "Web", "Video", "Code", "Social", "Reference", "Media", "News", "Other"];

const HISTORY_KEY = "gov_v8_search_history";
const FAV_KEY = "gov_v8_search_favs";

export default function WebSearchEmbed({ open, onClose }: WebSearchEmbedProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      const f = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      if (Array.isArray(h)) setHistory(h.slice(0, 10));
      if (Array.isArray(f)) setFavs(f);
    } catch {}
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Ctrl key closes the panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const saveToHistory = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const next = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, 10);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
  };

  const toggleFav = (engineId: string) => {
    const next = favs.includes(engineId) ? favs.filter((f) => f !== engineId) : [...favs, engineId];
    setFavs(next);
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch {}
  };

  const handleOpen = (engine: Engine) => {
    if (!query.trim()) {
      toast({ title: "ENTER A QUERY", description: "Type something to search first.", variant: "destructive" });
      return;
    }
    saveToHistory(query);
    window.open(engine.url(query), "_blank", "noopener,noreferrer");
  };

  const handleCopy = async (engine: Engine) => {
    if (!query.trim()) {
      toast({ title: "ENTER A QUERY", description: "Type something to generate a link.", variant: "destructive" });
      return;
    }
    const link = engine.url(query);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(engine.id);
      saveToHistory(query);
      toast({ title: "LINK COPIED", description: `${engine.name} search link on clipboard` });
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast({ title: "COPY FAILED", description: "Clipboard unavailable", variant: "destructive" });
    }
  };

  const handleQuickSearch = () => {
    const google = ENGINES.find((e) => e.id === "google")!;
    handleOpen(google);
  };

  const filteredEngines = ENGINES.filter((e) => category === "All" || e.category === category);
  const sortedEngines = [
    ...filteredEngines.filter((e) => favs.includes(e.id)),
    ...filteredEngines.filter((e) => !favs.includes(e.id)),
  ];

  if (!open && !mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-start justify-center p-4 sm:p-8 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{ background: "rgba(0, 5, 8, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTransitionEnd={() => { if (!open) setMounted(false); }}
    >
      <div
        className={`relative w-full max-w-4xl mt-8 transition-all duration-200 ${open ? "scale-100 translate-y-0" : "scale-95 -translate-y-4"}`}
        style={{
          background: "linear-gradient(135deg, rgba(0,8,12,0.98), rgba(0,5,10,0.98))",
          border: "1px solid rgba(0, 245, 255, 0.35)",
          boxShadow: "0 0 40px rgba(0,245,255,0.15), 0 0 80px rgba(0,245,255,0.08), inset 0 0 60px rgba(0,245,255,0.03)",
          clipPath: "polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)",
        }}
      >
        {/* corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: "#00f5ff" }} />
        <div className="absolute top-0 right-5 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: "#00f5ff" }} />
        <div className="absolute bottom-5 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: "#00f5ff" }} />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: "#00f5ff" }} />

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,245,255,0.18)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{
                background: "rgba(0,245,255,0.08)",
                border: "1px solid rgba(0,245,255,0.45)",
                boxShadow: "0 0 14px rgba(0,245,255,0.35), inset 0 0 8px rgba(0,245,255,0.1)",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#00f5ff" }} />
            </div>
            <div>
              <div
                className="text-sm font-bold tracking-[0.25em]"
                style={{ color: "#00f5ff", fontFamily: "Orbitron, sans-serif", textShadow: "0 0 8px rgba(0,245,255,0.5)" }}
              >
                WEB SEARCH EMBED
              </div>
              <div className="text-[10px] tracking-widest" style={{ color: "rgba(0,245,255,0.5)", fontFamily: "JetBrains Mono, monospace" }}>
                MULTI-ENGINE QUERY DISPATCHER
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-widest"
              style={{
                background: "rgba(0,245,255,0.04)",
                border: "1px solid rgba(0,245,255,0.25)",
                color: "rgba(0,245,255,0.7)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              <kbd className="px-1.5 py-0.5" style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)" }}>CTRL</kbd>
              <span className="opacity-70">to close</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110"
              style={{
                background: "rgba(255,80,80,0.06)",
                border: "1px solid rgba(255,80,80,0.4)",
                color: "#ff8080",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 14px rgba(255,80,80,0.5)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* search input */}
        <div className="px-6 pt-5 pb-3">
          <form
            onSubmit={(e) => { e.preventDefault(); handleQuickSearch(); }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "rgba(0,245,255,0.6)" }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="// type your query..."
              className="w-full pl-11 pr-32 py-3 text-base outline-none"
              style={{
                background: "rgba(0,245,255,0.04)",
                border: "1px solid rgba(0,245,255,0.3)",
                color: "#00f5ff",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.02em",
                transition: "all 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#00f5ff"; e.target.style.boxShadow = "0 0 18px rgba(0,245,255,0.25)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(0,245,255,0.3)"; e.target.style.boxShadow = "none"; }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-xs tracking-widest font-bold flex items-center gap-2 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(0,245,255,0.18), rgba(0,255,159,0.18))",
                border: "1px solid rgba(0,245,255,0.5)",
                color: "#00f5ff",
                fontFamily: "Orbitron, sans-serif",
                cursor: "pointer",
                clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(0,245,255,0.5)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <Search className="w-3.5 h-3.5" />
              GO
            </button>
          </form>

          {/* recent history pills */}
          {history.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] tracking-widest mr-1" style={{ color: "rgba(0,245,255,0.45)", fontFamily: "JetBrains Mono, monospace" }}>
                // RECENT:
              </span>
              {history.slice(0, 6).map((h) => (
                <button
                  key={h}
                  onClick={() => setQuery(h)}
                  className="px-2 py-1 text-[11px] transition-all duration-150 hover:scale-105"
                  style={{
                    background: "rgba(0,245,255,0.04)",
                    border: "1px solid rgba(0,245,255,0.2)",
                    color: "rgba(0,245,255,0.75)",
                    fontFamily: "JetBrains Mono, monospace",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.5)";
                    (e.currentTarget as HTMLElement).style.color = "#00f5ff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.2)";
                    (e.currentTarget as HTMLElement).style.color = "rgba(0,245,255,0.75)";
                  }}
                >
                  {h.length > 28 ? h.substring(0, 28) + "…" : h}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* category filter */}
        <div className="px-6 py-3 flex flex-wrap gap-1.5 border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1 text-[10px] tracking-widest font-bold transition-all duration-200"
                style={{
                  background: active ? "rgba(0,245,255,0.18)" : "rgba(0,245,255,0.03)",
                  border: `1px solid ${active ? "#00f5ff" : "rgba(0,245,255,0.2)"}`,
                  color: active ? "#00f5ff" : "rgba(0,245,255,0.55)",
                  fontFamily: "Orbitron, sans-serif",
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  boxShadow: active ? "0 0 10px rgba(0,245,255,0.35)" : "none",
                }}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* engines grid */}
        <div className="px-6 py-5 max-h-[55vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sortedEngines.map((engine, idx) => {
              const Icon = engine.icon;
              const isFav = favs.includes(engine.id);
              const copied = copiedId === engine.id;
              return (
                <div
                  key={engine.id}
                  className="group relative p-3 transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(0,245,255,0.025)",
                    border: "1px solid rgba(0,245,255,0.18)",
                    animation: open ? `slideUp 0.3s ease-out ${idx * 20}ms backwards` : undefined,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = engine.color;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 18px ${engine.color}33, inset 0 0 18px ${engine.color}11`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.18)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${engine.color}15`,
                          border: `1px solid ${engine.color}55`,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: engine.color }} />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-xs font-bold truncate"
                          style={{ color: "#e0f7ff", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.08em" }}
                        >
                          {engine.name}
                        </div>
                        <div
                          className="text-[9px] tracking-widest"
                          style={{ color: "rgba(0,245,255,0.5)", fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {engine.category.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFav(engine.id)}
                      className="text-base leading-none transition-transform hover:scale-125"
                      style={{
                        color: isFav ? "#ffd700" : "rgba(0,245,255,0.3)",
                        cursor: "pointer",
                        textShadow: isFav ? "0 0 8px rgba(255,215,0,0.6)" : "none",
                      }}
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      ★
                    </button>
                  </div>

                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => handleOpen(engine)}
                      className="flex-1 py-1.5 text-[10px] tracking-widest font-bold flex items-center justify-center gap-1.5 transition-all duration-150"
                      style={{
                        background: "rgba(0,245,255,0.06)",
                        border: "1px solid rgba(0,245,255,0.35)",
                        color: "#00f5ff",
                        fontFamily: "Orbitron, sans-serif",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.18)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(0,245,255,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.06)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      OPEN
                    </button>
                    <button
                      onClick={() => handleCopy(engine)}
                      className="flex-1 py-1.5 text-[10px] tracking-widest font-bold flex items-center justify-center gap-1.5 transition-all duration-150"
                      style={{
                        background: copied ? "rgba(0,255,159,0.18)" : "rgba(0,255,159,0.04)",
                        border: `1px solid ${copied ? "#00ff9f" : "rgba(0,255,159,0.3)"}`,
                        color: copied ? "#00ff9f" : "rgba(0,255,159,0.85)",
                        fontFamily: "Orbitron, sans-serif",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        if (!copied) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(0,255,159,0.15)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 10px rgba(0,255,159,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!copied) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(0,255,159,0.04)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "none";
                        }
                      }}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "COPIED" : "LINK"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {sortedEngines.length === 0 && (
            <div className="py-16 text-center text-sm" style={{ color: "rgba(0,245,255,0.4)", fontFamily: "JetBrains Mono, monospace" }}>
              // no engines in this category
            </div>
          )}
        </div>

        {/* footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between text-[10px] tracking-widest" style={{ borderColor: "rgba(0,245,255,0.15)", color: "rgba(0,245,255,0.45)", fontFamily: "JetBrains Mono, monospace" }}>
          <span>// {ENGINES.length} engines · {favs.length} favorites · direct browser query (no proxy)</span>
          <span className="hidden sm:inline">// .GOV V8 SEARCH</span>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,245,255,0.03); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,245,255,0.25); border-radius: 0; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,245,255,0.5); }
      `}</style>
    </div>
  );
}
