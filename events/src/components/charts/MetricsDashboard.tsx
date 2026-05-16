import React, { useEffect } from 'react';
import { Zap, Bell, Clock, TrendingUp, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMetrics } from '../../store/slices/eventsSlices';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

const METRIC_DEFS = [
  {
    key: 'totalEvents',
    label: 'Total Events',
    icon: Zap,
    iconBg: 'rgba(99,102,241,0.15)',
    iconColor: '#818cf8',
    glow: 'linear-gradient(135deg, #6366f1, #818cf8)',
  },
  {
    key: 'activeEvents',
    label: 'Active Events',
    icon: Activity,
    iconBg: 'rgba(34,197,94,0.15)',
    iconColor: '#22c55e',
    glow: 'linear-gradient(135deg, #22c55e, #4ade80)',
  },
  {
    key: 'totalCaptures24h',
    label: 'Captures (24h)',
    icon: TrendingUp,
    iconBg: 'rgba(59,130,246,0.15)',
    iconColor: '#3b82f6',
    glow: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  },
  {
    key: 'totalNotifications24h',
    label: 'Notifications (24h)',
    icon: Bell,
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#f59e0b',
    glow: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  },
  {
    key: 'avgProcessingTimeMs',
    label: 'Avg Processing',
    icon: Clock,
    iconBg: 'rgba(168,85,247,0.15)',
    iconColor: '#a855f7',
    format: (v: number) => `${v.toFixed(0)}ms`,
    glow: 'linear-gradient(135deg, #a855f7, #c084fc)',
  },
  {
    key: 'failureRate',
    label: 'Failure Rate',
    icon: AlertTriangle,
    iconBg: 'rgba(239,68,68,0.15)',
    iconColor: '#ef4444',
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    glow: 'linear-gradient(135deg, #ef4444, #f87171)',
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161d35',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export function MetricsDashboard() {
  const dispatch = useAppDispatch();
  const { data, loading } = useAppSelector(s => s.metrics);

  useEffect(() => { dispatch(fetchMetrics()); }, [dispatch]);

  if (loading && !data) {
    return (
      <div className="metrics-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="metric-card skeleton" style={{ height: 110 }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── KPI cards ── */}
      <div className="metrics-grid">
        {METRIC_DEFS.map(({ key, label, icon: Icon, iconBg, iconColor, format, glow }) => {
          const raw = (data as any)[key] as number;
          const display = format ? format(raw) : raw?.toLocaleString();
          return (
            <div
              key={key}
              className="metric-card"
              style={{ '--glow-color': glow, '--icon-bg': iconBg, '--icon-color': iconColor } as React.CSSProperties}
            >
              <div className="metric-icon">
                <Icon size={18} />
              </div>
              <div className="metric-value" style={{ color: iconColor }}>{display}</div>
              <div className="metric-label">{label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Charts ── */}
      <div className="charts-row">
        {/* Timeline area chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><TrendingUp size={15} /> Activity Timeline (24h)</span>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.captureTimeline}>
                <defs>
                  <linearGradient id="captGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="notifGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="captures" name="Captures" stroke="#6366f1" fill="url(#captGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="notifications" name="Notifications" stroke="#22c55e" fill="url(#notifGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="failures" name="Failures" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events by type pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Zap size={15} /> Events by Type</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data.eventsByType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {data.eventsByType.map((_entry: unknown, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [v, 'count']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center' }}>
              {data.eventsByType.map((d: { type: string }, i: number) => (
                <span key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                  {d.type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top events bar chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><BarChart2 size={15} /> Top Events by Volume</span>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.topEvents} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="key" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="captures" name="Captures" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
