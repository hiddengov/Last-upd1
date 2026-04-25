import { useEffect, useRef, useState } from "react";

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_LINES: { text: string; delay: number; status?: "ok" | "warn" | "info" }[] = [
  { text: "[ BIOS ] .GOV V8 firmware v8.4.2 — POST initialized", delay: 120, status: "info" },
  { text: "[ BIOS ] CPU.................................. INTEL XEON E5-2697 v4 @ 2.30GHz x32", delay: 80, status: "ok" },
  { text: "[ BIOS ] MEMORY................................ 131072 MB DDR4-2400 ECC", delay: 80, status: "ok" },
  { text: "[ BIOS ] STORAGE............................... 4 x NVMe SSD (RAID-10)", delay: 80, status: "ok" },
  { text: "[ BIOS ] SECURE BOOT........................... ENABLED", delay: 100, status: "ok" },
  { text: "[ KERNEL ] loading vmlinuz-6.5.0-gov-hardened...", delay: 140, status: "info" },
  { text: "[ KERNEL ] decompressing kernel image............ [ DONE ]", delay: 180, status: "ok" },
  { text: "[ KERNEL ] mounting /dev/sda1 → /................ [ DONE ]", delay: 100, status: "ok" },
  { text: "[ KERNEL ] mounting /dev/sda2 → /home............ [ DONE ]", delay: 100, status: "ok" },
  { text: "[ KERNEL ] starting udev......................... [ DONE ]", delay: 90, status: "ok" },
  { text: "[ INIT  ] systemd v254.5 — managing 47 units", delay: 120, status: "info" },
  { text: "[ INIT  ] starting Network Service............... [ DONE ]", delay: 110, status: "ok" },
  { text: "[ INIT  ] starting Cryptography Daemon........... [ DONE ]", delay: 110, status: "ok" },
  { text: "[ INIT  ] starting IP Intelligence Service....... [ DONE ]", delay: 110, status: "ok" },
  { text: "[ INIT  ] starting Webhook Relay................. [ DONE ]", delay: 100, status: "ok" },
  { text: "[ INIT  ] establishing TLS tunnel @ 0x7f3e2a01... [ DONE ]", delay: 130, status: "ok" },
  { text: "[ AUTH  ] verifying access keys.................. [ OK ]", delay: 100, status: "ok" },
  { text: "[ AUTH  ] loading session manifest............... [ OK ]", delay: 90, status: "ok" },
  { text: "[ NET   ] resolving uplink @ gov.intelligence.... [ OK ]", delay: 110, status: "ok" },
  { text: "[ NET   ] negotiating handshake.................. [ OK ]", delay: 100, status: "ok" },
  { text: "[ SYS   ] threat-intel feeds...................... [ SYNCED ]", delay: 110, status: "ok" },
  { text: "[ SYS   ] dashboard kernel module................ [ LOADED ]", delay: 100, status: "ok" },
  { text: "[ SYS   ] mounting /proc/.gov/intel.............. [ DONE ]", delay: 100, status: "ok" },
  { text: "[ SYS   ] all subsystems nominal", delay: 200, status: "info" },
  { text: ">> BOOT COMPLETE", delay: 600, status: "ok" },
];

function MatrixColumn({ side }: { side: "left" | "right" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars =
      "01ABCDEFGHJKLMNPQRSTUVWXYZ!@#$%&*()_+={}[]<>?/\\|アイウエオカキクケコサシスセソタチツテトナニヌネノ";
    const fontSize = 14;
    const cols = Math.max(1, Math.floor(canvas.width / fontSize));
    const drops: number[] = Array(cols)
      .fill(0)
      .map(() => Math.floor(Math.random() * 40));

    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * fontSize;
        ctx.fillStyle =
          Math.random() > 0.97
            ? "rgba(180, 255, 220, 0.95)"
            : `rgba(0, 255, 140, ${0.35 + Math.random() * 0.45})`;
        ctx.fillText(ch, i * fontSize, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 55);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div
      className="absolute top-0 bottom-0 w-[180px] overflow-hidden pointer-events-none"
      style={{
        [side]: 0,
        background:
          side === "left"
            ? "linear-gradient(90deg, rgba(0,8,4,0.9), rgba(0,8,4,0.4))"
            : "linear-gradient(270deg, rgba(0,8,4,0.9), rgba(0,8,4,0.4))",
        borderRight: side === "left" ? "1px solid rgba(0,255,140,0.18)" : undefined,
        borderLeft: side === "right" ? "1px solid rgba(0,255,140,0.18)" : undefined,
      } as React.CSSProperties}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [lines, setLines] = useState<{ text: string; status?: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let total = 0;
    BOOT_LINES.forEach((l) => (total += l.delay));
    let elapsed = 0;
    let i = 0;

    const advance = () => {
      if (cancelled) return;
      if (i >= BOOT_LINES.length) {
        setDone(true);
        setProgress(100);
        setTimeout(() => onComplete(), 900);
        return;
      }
      const line = BOOT_LINES[i];
      setLines((prev) => [...prev, { text: line.text, status: line.status }]);
      elapsed += line.delay;
      setProgress(Math.min(100, Math.round((elapsed / total) * 100)));
      i++;
      setTimeout(advance, line.delay);
    };
    advance();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const colorFor = (status?: string) => {
    if (status === "ok") return "rgba(0, 255, 140, 0.9)";
    if (status === "warn") return "rgba(255, 200, 80, 0.9)";
    if (status === "info") return "rgba(120, 220, 255, 0.85)";
    return "rgba(180, 255, 220, 0.75)";
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,15,8,1) 0%, rgba(0,5,2,1) 70%, rgba(0,0,0,1) 100%)",
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,255,140,0.04) 0px, rgba(0,255,140,0.04) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,140,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,140,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <MatrixColumn side="left" />
      <MatrixColumn side="right" />

      {/* Center terminal */}
      <div
        className="absolute inset-y-0"
        style={{ left: 180, right: 180 }}
      >
        <div className="h-full flex flex-col p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{
                  border: "1px solid rgba(0,255,140,0.5)",
                  boxShadow: "0 0 20px rgba(0,255,140,0.4), inset 0 0 10px rgba(0,255,140,0.1)",
                  background: "rgba(0,255,140,0.05)",
                }}
              >
                <span
                  className="text-xs font-black tracking-widest"
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    color: "#00ff8c",
                    textShadow: "0 0 10px #00ff8c",
                  }}
                >
                  GOV
                </span>
              </div>
              <div>
                <div
                  className="text-sm font-bold tracking-[0.3em]"
                  style={{ color: "#00ff8c", textShadow: "0 0 8px rgba(0,255,140,0.6)" }}
                >
                  .GOV V8 BOOTLOADER
                </div>
                <div
                  className="text-xs tracking-widest"
                  style={{ color: "rgba(0,255,140,0.5)" }}
                >
                  SECURE BOOT // ENCRYPTED CHANNEL
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div
                style={{ color: "rgba(0,255,140,0.55)" }}
              >
                {new Date().toISOString().replace("T", " ").substring(0, 19)}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: tick % 2 ? "#00ff8c" : "rgba(0,255,140,0.3)",
                    boxShadow: "0 0 6px #00ff8c",
                  }}
                />
                <span style={{ color: "rgba(0,255,140,0.7)" }}>LIVE</span>
              </div>
            </div>
          </div>

          {/* Terminal box */}
          <div
            className="flex-1 relative overflow-hidden rounded"
            style={{
              border: "1px solid rgba(0,255,140,0.25)",
              boxShadow: "0 0 30px rgba(0,255,140,0.1), inset 0 0 40px rgba(0,255,140,0.03)",
              background: "rgba(0, 8, 4, 0.7)",
            }}
          >
            {/* corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: "#00ff8c" }} />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: "#00ff8c" }} />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: "#00ff8c" }} />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: "#00ff8c" }} />

            <div
              ref={scrollRef}
              className="h-full overflow-hidden p-5 text-[12px] leading-[1.55]"
            >
              {lines.map((l, idx) => (
                <div
                  key={idx}
                  style={{ color: colorFor(l.status), textShadow: l.status === "ok" ? "0 0 4px rgba(0,255,140,0.4)" : undefined }}
                >
                  {l.text}
                </div>
              ))}
              {!done && (
                <div className="inline-block" style={{ color: "rgba(0,255,140,0.85)" }}>
                  <span style={{ opacity: tick % 2 ? 1 : 0.2 }}>▌</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: "rgba(0,255,140,0.6)" }}>// BOOT PROGRESS</span>
              <span style={{ color: "#00ff8c", textShadow: "0 0 8px rgba(0,255,140,0.5)" }}>
                {progress.toString().padStart(3, "0")}%
              </span>
            </div>
            <div
              className="h-2 relative overflow-hidden"
              style={{
                background: "rgba(0,255,140,0.08)",
                border: "1px solid rgba(0,255,140,0.25)",
              }}
            >
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, rgba(0,255,140,0.4), rgba(0,255,140,0.95))",
                  boxShadow: "0 0 10px rgba(0,255,140,0.7)",
                }}
              />
            </div>
            {done && (
              <div
                className="mt-4 text-center text-sm font-bold tracking-[0.4em] animate-pulse"
                style={{
                  color: "#00ff8c",
                  fontFamily: "Orbitron, sans-serif",
                  textShadow: "0 0 16px #00ff8c, 0 0 32px rgba(0,255,140,0.5)",
                }}
              >
                ▷ BOOT COMPLETE ◁
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
