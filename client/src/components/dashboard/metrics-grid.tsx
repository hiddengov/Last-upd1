import { Eye, Network, Image, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface Metrics {
  totalRequests: number;
  uniqueIPs: number;
  imagesServed: number;
  avgResponseTime: number;
  recentActivity: number;
}

interface MetricsGridProps {
  metrics?: Metrics;
  isLoading: boolean;
}

function CountUp({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else { setDisplayed(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{displayed.toLocaleString()}</>;
}

interface StatCardProps {
  label: string;
  value: number;
  unit?: string;
  icon: any;
  color: string;
  glowColor: string;
  subLabel?: string;
  subValue?: string | number;
  subColor?: string;
  delay?: number;
}

function StatCard({ label, value, unit, icon: Icon, color, glowColor, subLabel, subValue, subColor, delay = 0 }: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="relative overflow-hidden transition-all duration-400"
      style={{
        background: 'rgba(0, 6, 18, 0.9)',
        border: `1px solid ${hovered ? color : 'rgba(0,245,255,0.12)'}`,
        borderRadius: '4px',
        padding: '20px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, border-color 0.3s ease`,
        boxShadow: hovered ? `0 0 30px ${glowColor}20, 0 0 60px ${glowColor}08` : 'none',
        cursor: 'default'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: hovered ? 0.8 : 0.3 }}
      />

      {/* Rotating bg element */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${glowColor}15 0%, transparent 70%)`,
          opacity: hovered ? 1 : 0.4
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r transition-colors duration-300"
        style={{ borderColor: hovered ? color : 'rgba(0,245,255,0.2)' }}
      />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l transition-colors duration-300"
        style={{ borderColor: hovered ? color : 'rgba(0,245,255,0.2)' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1"
              style={{ color: 'rgba(0,245,255,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>
              {label}
            </p>
            <p className="text-3xl font-black tracking-tight"
              style={{ fontFamily: 'Orbitron, sans-serif', color: hovered ? color : 'rgba(220,240,255,0.95)', textShadow: hovered ? `0 0 20px ${glowColor}60` : 'none', transition: 'all 0.3s ease' }}>
              {visible ? <CountUp value={value} /> : '0'}{unit && <span className="text-sm font-normal ml-1" style={{ color: 'rgba(0,245,255,0.5)' }}>{unit}</span>}
            </p>
          </div>

          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0"
            style={{
              background: `${glowColor}15`,
              border: `1px solid ${glowColor}30`,
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              boxShadow: hovered ? `0 0 15px ${glowColor}30` : 'none'
            }}
          >
            <Icon className="h-5 w-5 transition-all duration-300"
              style={{ color: hovered ? color : `${color}90`, filter: hovered ? `drop-shadow(0 0 6px ${glowColor})` : 'none' }}
            />
          </div>
        </div>

        {subLabel && (
          <div className="flex items-center gap-2 pt-3 border-t"
            style={{ borderColor: 'rgba(0,245,255,0.06)' }}>
            <span className="text-xs font-semibold" style={{ color: subColor || '#00ff9f', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
              {subValue}
            </span>
            <span className="text-xs" style={{ color: 'rgba(0,245,255,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
              {subLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded" style={{ background: 'rgba(0,6,18,0.9)', border: '1px solid rgba(0,245,255,0.1)' }}>
            <Skeleton className="h-3 w-20 mb-3" style={{ background: 'rgba(0,245,255,0.1)' }} />
            <Skeleton className="h-9 w-28 mb-3" style={{ background: 'rgba(0,245,255,0.08)' }} />
            <Skeleton className="h-3 w-32" style={{ background: 'rgba(0,245,255,0.06)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Requests"
        value={metrics?.totalRequests || 0}
        icon={Eye}
        color="#00f5ff"
        glowColor="#00f5ff"
        subLabel="from last hour"
        subValue={metrics?.recentActivity ? `+${metrics.recentActivity}` : '+0'}
        subColor="#00ff9f"
        delay={0}
      />
      <StatCard
        label="Unique IPs"
        value={metrics?.uniqueIPs || 0}
        icon={Network}
        color="#a78bfa"
        glowColor="#a78bfa"
        subLabel="tracked addresses"
        delay={100}
      />
      <StatCard
        label="Images Served"
        value={metrics?.imagesServed || 0}
        icon={Image}
        color="#f59e0b"
        glowColor="#f59e0b"
        subLabel="success rate"
        subValue="100%"
        subColor="#f59e0b"
        delay={200}
      />
      <StatCard
        label="Avg Response"
        value={metrics?.avgResponseTime || 0}
        unit="ms"
        icon={Clock}
        color="#00ff9f"
        glowColor="#00ff9f"
        subLabel="performance"
        subValue="OPTIMAL"
        subColor="#00ff9f"
        delay={300}
      />
    </div>
  );
}
