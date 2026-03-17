import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Download, RefreshCw, BarChart2, PieChart as PieIcon, Layout, ChevronDown, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Replace with your actual Looker Studio Embed URL
const LOOKER_STUDIO_URL = 'https://lookerstudio.google.com/embed/reporting/7f1044de-4987-4cd6-8667-d2016d31a0a2/page/NMOsF';

const CHART_COLORS = [
  '#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, icon: Icon, colorClass, delay = 0,
}: {
  label: string; value: string; icon: React.ElementType; colorClass: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-foreground truncate">{value}</p>
      </div>
    </motion.div>
  );
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold" style={{ color: d.payload.fill }}>{d.name}</p>
      <p className="text-foreground">{fmt(d.value)}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DataAnalystPage() {
  const { t } = useTranslation();

  // Main dropdown: 'profitable' or 'failed'
  const [mainView, setMainView] = useState<'profitable' | 'failed'>('profitable');
  // Sub-tab for profitable: 'present' or 'past'
  const [subTab, setSubTab] = useState<'present' | 'past'>('present');

  // Data states
  const [presentCrops, setPresentCrops] = useState<any[]>([]);      // Active + Shelf crops
  const [pastProfitable, setPastProfitable] = useState<any[]>([]);   // Archived profitable only
  const [failedCrops, setFailedCrops] = useState<any[]>([]);        // Archived failed only

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const getToken = () => {
    const raw = localStorage.getItem('agrovision_user');
    return raw ? JSON.parse(raw).token : null;
  };

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Active crops (growing)
      const activeRes = await fetch(`${API_URL}/api/lifecycle/active`, { headers });
      const activeData = activeRes.ok ? await activeRes.json() : [];

      // 2. Shelf monitoring crops (selling)
      const shelfRes = await fetch(`${API_URL}/api/lifecycle/shelf`, { headers });
      const shelfData = shelfRes.ok ? await shelfRes.json() : [];

      // 3. Archived crops (completed)
      const archivedRes = await fetch(`${API_URL}/api/lifecycle/archived`, { headers });
      const archivedData = archivedRes.ok ? await archivedRes.json() : [];

      // Format present crops (Active + Shelf)
      const present = [
        ...activeData.map((c: any) => ({
          cropName: c.cropName,
          stage: 'Growing',
          totalExpense: c.totalExpense || 0,
          totalRevenue: 0,
          profit: -(c.totalExpense || 0),
          plantDate: c.plantDate,
        })),
        ...shelfData.map((s: any) => ({
          cropName: s.cropName,
          stage: 'Shelf Monitoring',
          totalExpense: s.totalExpense || 0,
          totalRevenue: s.totalRevenue || 0,
          profit: (s.totalRevenue || 0) - (s.totalExpense || 0),
          plantDate: s.plantDate,
        })),
      ];
      setPresentCrops(present);

      // Archived profitable only
      const profitable = archivedData
        .filter((a: any) => a.status === 'profitable')
        .map((a: any) => ({
          cropName: a.cropName,
          totalExpense: a.totalExpense,
          totalRevenue: a.totalRevenue,
          profit: a.profit,
          sellDate: a.sellDate,
          plantDate: a.plantDate,
        }));
      setPastProfitable(profitable);

      // Archived failed only
      const failed = archivedData
        .filter((a: any) => a.status === 'failed')
        .map((a: any) => ({
          cropName: a.cropName,
          totalExpense: a.totalExpense,
          totalRevenue: a.totalRevenue,
          profit: a.profit,
          loss: Math.abs(a.profit),
          sellDate: a.sellDate,
          plantDate: a.plantDate,
        }));
      setFailedCrops(failed);

    } catch (e: any) {
      setError(e.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const syncDataToSheets = async () => {
    setSyncing(true);
    setSyncSuccess(false);
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/analytics/sync-sheets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to sync data');
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 5000);
    } catch (e: any) {
      setError(e.message || 'Error syncing data');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => fetchAllData(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // ── Derived Data ─────────────────────────────────────────────────────────────
  // Present KPIs
  const presentTotalExpense = presentCrops.reduce((s, c) => s + c.totalExpense, 0);
  const presentTotalRevenue = presentCrops.reduce((s, c) => s + c.totalRevenue, 0);
  const presentNetProfit = presentTotalRevenue - presentTotalExpense;

  // Past Profitable KPIs
  const pastTotalRevenue = pastProfitable.reduce((s, c) => s + c.totalRevenue, 0);
  const pastTotalExpense = pastProfitable.reduce((s, c) => s + c.totalExpense, 0);
  const pastNetProfit = pastProfitable.reduce((s, c) => s + c.profit, 0);

  // Failed KPIs
  const totalLoss = failedCrops.reduce((s, c) => s + c.loss, 0);
  const failedCount = failedCrops.length;
  const avgLoss = failedCount > 0 ? totalLoss / failedCount : 0;

  // Chart data
  const pastPieData = pastProfitable
    .filter(c => c.profit > 0)
    .map((c, i) => ({ name: c.cropName, value: c.profit, fill: CHART_COLORS[i % CHART_COLORS.length] }));

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent"
          />
          <p className="text-muted-foreground text-sm">Loading analytics…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">

        {/* ── Page Header with Dropdown ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <BarChart2 className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">{t('analytics.title')}</h2>

            {/* Main Dropdown */}
            <div className="relative">
              <select
                value={mainView}
                onChange={(e) => {
                  setMainView(e.target.value as 'profitable' | 'failed');
                  setSubTab('present');
                }}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-card border border-border text-foreground font-bold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              >
                <option value="profitable">📈 Profitable Crops</option>
                <option value="failed">📉 Failed Crops</option>
              </select>
              <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={syncDataToSheets}
              disabled={syncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${
                syncSuccess
                  ? 'bg-success text-white'
                  : 'bg-primary text-white hover:bg-primary/90'
              } disabled:opacity-50`}
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : syncSuccess ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {syncing ? 'Syncing...' : syncSuccess ? 'Synced!' : 'Get Latest Report'}
            </button>
          </div>
        </motion.div>

        {/* ── Error & Success Banners ── */}
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {syncSuccess && (
            <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Data synchronized! Your Looker Studio report will reflect changes in a moment.
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── PROFITABLE CROPS VIEW ── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {mainView === 'profitable' && (
          <div className="space-y-6">

            {/* Sub-tabs: Present / Past */}
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit border border-border">
              <button
                onClick={() => setSubTab('present')}
                className={`px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                  subTab === 'present'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Present Crops
              </button>
              <button
                onClick={() => setSubTab('past')}
                className={`px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                  subTab === 'past'
                    ? 'bg-background text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Past (Profitable Only)
              </button>
            </div>

            {/* ── PRESENT TAB ── */}
            {subTab === 'present' && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Showing all crops currently growing or in shelf monitoring, with live expense and revenue tracking.
                </p>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KpiCard label="Total Investment" value={fmt(presentTotalExpense)} icon={TrendingDown} colorClass="bg-rose-500" delay={0} />
                  <KpiCard label="Revenue So Far" value={fmt(presentTotalRevenue)} icon={IndianRupee} colorClass="bg-emerald-500" delay={0.1} />
                  <KpiCard
                    label="Net Position"
                    value={fmt(presentNetProfit)}
                    icon={presentNetProfit >= 0 ? TrendingUp : TrendingDown}
                    colorClass={presentNetProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}
                    delay={0.2}
                  />
                </div>

                {presentCrops.length > 0 ? (
                  <>
                    {/* Bar chart: Expense per Crop */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Current Crops — Expense vs Revenue</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={presentCrops} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="cropName" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                          <RechartTooltip content={<CustomBarTooltip />} />
                          <Bar dataKey="totalExpense" name="Investment" fill="#ef4444" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="totalRevenue" name="Revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Present crops table */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left px-6 py-3 text-muted-foreground font-medium">Crop</th>
                              <th className="text-left px-6 py-3 text-muted-foreground font-medium">Stage</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">Investment</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">Revenue</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">P&L</th>
                            </tr>
                          </thead>
                          <tbody>
                            {presentCrops.map((c, i) => (
                              <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-4 font-medium text-foreground">{c.cropName}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    c.stage === 'Growing'
                                      ? 'bg-success/10 text-success'
                                      : 'bg-info/10 text-info'
                                  }`}>
                                    {c.stage}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-foreground">{fmt(c.totalExpense)}</td>
                                <td className="px-6 py-4 text-right text-foreground">{fmt(c.totalRevenue)}</td>
                                <td className={`px-6 py-4 text-right font-semibold ${c.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {c.profit >= 0 ? '+' : ''}{fmt(c.profit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Sprout className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-semibold">No crops currently growing or in shelf monitoring.</p>
                    <p className="text-sm mt-1">Add crops from the Crop Management page to start tracking.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PAST TAB (Profitable Only) ── */}
            {subTab === 'past' && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Showing only past crops that were <strong className="text-success">profitable</strong>. This data updates when a crop completes selling from Shelf Monitoring.
                </p>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <KpiCard label="Total Revenue" value={fmt(pastTotalRevenue)} icon={IndianRupee} colorClass="bg-emerald-500" delay={0} />
                  <KpiCard label="Total Expense" value={fmt(pastTotalExpense)} icon={TrendingDown} colorClass="bg-rose-500" delay={0.1} />
                  <KpiCard label="Net Profit" value={fmt(pastNetProfit)} icon={TrendingUp} colorClass="bg-blue-500" delay={0.2} />
                </div>

                {pastProfitable.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Bar chart */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-6">
                          <BarChart2 className="w-5 h-5 text-emerald-500" />
                          <h3 className="font-semibold text-foreground">Profit per Crop</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={pastProfitable} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="cropName" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <RechartTooltip content={<CustomBarTooltip />} />
                            <Bar dataKey="profit" name="Profit" radius={[6, 6, 0, 0]}>
                              {pastProfitable.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </motion.div>

                      {/* Pie chart */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-6">
                          <PieIcon className="w-5 h-5 text-emerald-500" />
                          <h3 className="font-semibold text-foreground">Profit Distribution</h3>
                        </div>
                        {pastPieData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie data={pastPieData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" paddingAngle={3}>
                                {pastPieData.map((entry, i) => (
                                  <Cell key={i} fill={entry.fill} />
                                ))}
                              </Pie>
                              <RechartTooltip content={<CustomPieTooltip />} />
                              <Legend formatter={(v) => <span className="text-sm text-foreground">{v}</span>} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-[280px]">
                            <p className="text-sm text-muted-foreground">No profit data yet.</p>
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* Past profitable table */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left px-6 py-3 text-muted-foreground font-medium">Crop</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">Revenue</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">Expense</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">Profit</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">Margin</th>
                              <th className="text-right px-6 py-3 text-muted-foreground font-medium">Sold On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastProfitable.map((c, i) => {
                              const margin = c.totalRevenue > 0 ? ((c.profit / c.totalRevenue) * 100).toFixed(1) : '—';
                              return (
                                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                  <td className="px-6 py-4 font-medium text-foreground">{c.cropName}</td>
                                  <td className="px-6 py-4 text-right text-foreground">{fmt(c.totalRevenue)}</td>
                                  <td className="px-6 py-4 text-right text-foreground">{fmt(c.totalExpense)}</td>
                                  <td className="px-6 py-4 text-right font-semibold text-emerald-600">+{fmt(c.profit)}</td>
                                  <td className="px-6 py-4 text-right text-sm text-emerald-600">{margin !== '—' ? `${margin}%` : '—'}</td>
                                  <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                                    {c.sellDate ? new Date(c.sellDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-semibold">No profitable crops yet.</p>
                    <p className="text-sm mt-1">Profitable crops will appear here after they complete selling from Shelf Monitoring.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* ── FAILED CROPS VIEW ── */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {mainView === 'failed' && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Showing crops that resulted in a <strong className="text-destructive">loss</strong>. This data updates when a crop is sold from Shelf Monitoring with revenue less than investment.
            </p>

            {/* KPIs */}
            <div className="bg-rose-50/50 dark:bg-rose-900/10 p-4 rounded-3xl border border-rose-100 dark:border-rose-900/30">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard label="Total Loss" value={fmt(totalLoss)} icon={TrendingDown} colorClass="bg-rose-600" delay={0} />
                <KpiCard label="Failed Crops" value={failedCount.toString()} icon={BarChart2} colorClass="bg-orange-500" delay={0.1} />
                <KpiCard label="Avg. Loss per Crop" value={fmt(avgLoss)} icon={TrendingDown} colorClass="bg-red-500" delay={0.2} />
              </div>
            </div>

            {failedCrops.length > 0 ? (
              <>
                {/* Bar chart: Loss per Crop */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingDown className="w-5 h-5 text-rose-500" />
                    <h3 className="font-semibold text-foreground">Loss Analysis by Crop</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={failedCrops} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="cropName" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <RechartTooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="loss" name="Loss Amount" radius={[6, 6, 0, 0]} fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Failed crops table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-6 py-3 text-muted-foreground font-medium">Crop</th>
                          <th className="text-right px-6 py-3 text-muted-foreground font-medium">Investment</th>
                          <th className="text-right px-6 py-3 text-muted-foreground font-medium">Revenue</th>
                          <th className="text-right px-6 py-3 text-muted-foreground font-medium">Loss</th>
                          <th className="text-right px-6 py-3 text-muted-foreground font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {failedCrops.map((c, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 font-medium text-foreground">{c.cropName}</td>
                            <td className="px-6 py-4 text-right text-foreground">{fmt(c.totalExpense)}</td>
                            <td className="px-6 py-4 text-right text-foreground">{fmt(c.totalRevenue)}</td>
                            <td className="px-6 py-4 text-right font-semibold text-rose-600">-{fmt(c.loss)}</td>
                            <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                              {c.sellDate ? new Date(c.sellDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-semibold">No failed crops recorded.</p>
                <p className="text-sm mt-1">Failed crops will appear here after a sale results in a loss.</p>
              </div>
            )}
          </div>
        )}

        {/* ── LOOKER STUDIO AUTOMATED SECTION ── */}
        <div className="space-y-6 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-bold text-foreground">Looker Studio Automated Analytics</h3>
            </div>
            <div className="flex items-center gap-2 bg-success/10 px-3 py-1.5 rounded-xl border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-bold text-success uppercase tracking-wider">Live Sync Enabled</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl aspect-video relative group">
            <iframe
              title="Looker Studio Report"
              width="100%"
              height="100%"
              src={LOOKER_STUDIO_URL}
              frameBorder="0"
              style={{ border: 0 }}
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
            
            {LOOKER_STUDIO_URL.includes('your-report-id') && (
               <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
                 <div className="max-w-md">
                   <Layout className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
                   <h4 className="text-xl font-bold mb-2">Connect Your Looker Studio Report</h4>
                   <p className="text-muted-foreground text-sm mb-6">
                     AgroVision is now automatically pushing data to your Google Sheet. To see your live charts here, 
                     please replace the placeholder URL in <code>DataAnalystPage.tsx</code> with your report's embed URL.
                   </p>
                   <div className="bg-muted p-4 rounded-xl text-left">
                     <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">How to get your URL:</p>
                     <ol className="text-xs text-foreground space-y-1 list-decimal list-inside">
                       <li>Open your Looker Studio report</li>
                       <li>Click 'File' → 'Embed report'</li>
                       <li>Enable embedding and copy the 'Embed URL'</li>
                     </ol>
                   </div>
                 </div>
               </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

// Tiny inline icon for empty states
function Sprout({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}
