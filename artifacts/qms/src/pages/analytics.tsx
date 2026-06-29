import React, { useState, useMemo } from "react";
import { PageTransition } from "@/components/page-transition";
import {
  useListDeviations, getListDeviationsQueryKey,
  useListCapa, getListCapaQueryKey,
  useListChangeControl, getListChangeControlQueryKey,
  useListEfficacyReviews, getListEfficacyReviewsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Printer, TrendingUp, AlertTriangle, CheckCircle2, Clock, BarChart2, Loader2 } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CHART_COLORS = {
  primary: "#1e3a5f",
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  blue: "#3b82f6",
  violet: "#7c3aed",
  teal: "#0d9488",
  rose: "#e11d48",
  amber: "#f59e0b",
  slate: "#64748b",
};

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.teal, CHART_COLORS.violet, CHART_COLORS.rose, CHART_COLORS.amber];

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: color + "20" }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function OnTimeBar({ onTime, late, label }: { onTime: number; late: number; label: string }) {
  const total = onTime + late;
  const rate = total > 0 ? Math.round((onTime / total) * 100) : 0;
  const color = rate >= 80 ? CHART_COLORS.success : rate >= 60 ? CHART_COLORS.warning : CHART_COLORS.danger;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold" style={{ color }}>{rate}% on time</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
        <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: color }} />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>✓ {onTime} on time</span>
        <span>⚠ {late} late</span>
        <span>Total: {total}</span>
      </div>
    </div>
  );
}

function groupByKey<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = (item[key] as string) ?? "Unknown";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function toPieData(obj: Record<string, number>) {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

function avgDays(dates: number[]): number {
  if (!dates.length) return 0;
  return Math.round(dates.reduce((a, b) => a + b, 0) / dates.length);
}

export default function AnalyticsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));

  const yr = parseInt(year, 10);
  const monthKeys = MONTHS_SHORT.map((m, i) => ({ label: m, start: `${yr}-${String(i+1).padStart(2,"0")}-01`, end: `${yr}-${String(i+1).padStart(2,"0")}-${String(new Date(yr, i+1, 0).getDate()).padStart(2,"0")}` }));

  const devParams = { pageSize: 1000 };
  const capaParams = { pageSize: 1000 };
  const ccParams = { pageSize: 1000 };
  const erParams = { pageSize: 1000 };

  const { data: devData, isLoading: devLoading } = useListDeviations(devParams, { query: { queryKey: getListDeviationsQueryKey(devParams) } });
  const { data: capaData, isLoading: capaLoading } = useListCapa(capaParams, { query: { queryKey: getListCapaQueryKey(capaParams) } });
  const { data: ccData, isLoading: ccLoading } = useListChangeControl(ccParams, { query: { queryKey: getListChangeControlQueryKey(ccParams) } });
  const { data: erData, isLoading: erLoading } = useListEfficacyReviews(erParams, { query: { queryKey: getListEfficacyReviewsQueryKey(erParams) } });

  const isLoading = devLoading || capaLoading || ccLoading || erLoading;

  const allDevs = devData?.data ?? [];
  const allCapas = capaData?.data ?? [];
  const allCcs = ccData?.data ?? [];
  const allErs = erData?.data ?? [];

  const analytics = useMemo(() => {
    const yearStr = String(yr);

    /* ── DEVIATIONS ── */
    const yearDevs = allDevs.filter(d => d.eventDate?.startsWith(yearStr));
    const closedDevs = allDevs.filter(d => d.status === "Closed" && d.updatedAt.startsWith(yearStr));

    const devMonthlyOpened = monthKeys.map(m => ({
      month: m.label,
      opened: allDevs.filter(d => d.eventDate >= m.start && d.eventDate <= m.end).length,
      closed: allDevs.filter(d => d.status === "Closed" && d.updatedAt.slice(0,10) >= m.start && d.updatedAt.slice(0,10) <= m.end).length,
    }));

    const devByType = toPieData(groupByKey(yearDevs, "deviationType" as keyof typeof yearDevs[0]));
    const devByArea = Object.entries(groupByKey(yearDevs, "areaResponsible" as keyof typeof yearDevs[0]))
      .map(([name, count]) => ({ name: name.length > 22 ? name.slice(0,20)+"…" : name, count }))
      .sort((a,b) => b.count - a.count).slice(0, 8);

    const devOnTime = closedDevs.filter(d => {
      if (!d.dueDate) return true;
      const closedAt = d.updatedAt.slice(0,10);
      return closedAt <= d.dueDate;
    });
    const devLate = closedDevs.filter(d => {
      if (!d.dueDate) return false;
      const closedAt = d.updatedAt.slice(0,10);
      return closedAt > d.dueDate;
    });

    const devDaysList = closedDevs.map(d => {
      const start = d.eventDate;
      const end = d.updatedAt.slice(0,10);
      return start && end ? differenceInDays(parseISO(end), parseISO(start)) : null;
    }).filter((x): x is number => x !== null && x >= 0);

    const devAvgDays = avgDays(devDaysList);
    const devOverdue = allDevs.filter(d => d.status !== "Closed" && d.dueDate && d.dueDate < new Date().toISOString().slice(0,10)).length;

    const devLateRows = devLate.map(d => ({
      number: d.deviationNumber,
      title: d.title,
      dueDate: d.dueDate ?? "—",
      closedAt: d.updatedAt.slice(0,10),
      daysLate: d.dueDate ? differenceInDays(parseISO(d.updatedAt.slice(0,10)), parseISO(d.dueDate)) : 0,
      area: d.areaResponsible ?? "—",
      type: d.deviationType ?? "—",
    })).sort((a,b) => b.daysLate - a.daysLate).slice(0, 10);

    /* ── CAPA ── */
    const yearCapas = allCapas.filter(c => c.creationDate?.startsWith(yearStr));
    const closedCapas = allCapas.filter(c => c.status === "Closed" && c.updatedAt.startsWith(yearStr));

    const capaMonthly = monthKeys.map(m => ({
      month: m.label,
      opened: allCapas.filter(c => c.creationDate >= m.start && c.creationDate <= m.end).length,
      closed: allCapas.filter(c => c.status === "Closed" && c.updatedAt.slice(0,10) >= m.start && c.updatedAt.slice(0,10) <= m.end).length,
    }));

    const capaByType = toPieData(groupByKey(yearCapas, "capaType" as keyof typeof yearCapas[0]));

    const capaOnTime = closedCapas.filter(c => {
      const planned = c.initialPlannedDate;
      const actual = c.implementationDate ?? c.updatedAt.slice(0,10);
      return planned && actual <= planned;
    });
    const capaLate = closedCapas.filter(c => {
      const planned = c.initialPlannedDate;
      const actual = c.implementationDate ?? c.updatedAt.slice(0,10);
      return planned && actual > planned;
    });

    const capaDaysList = closedCapas.map(c => {
      const start = c.creationDate;
      const end = c.updatedAt.slice(0,10);
      return start && end ? differenceInDays(parseISO(end), parseISO(start)) : null;
    }).filter((x): x is number => x !== null && x >= 0);

    const capaAvgDays = avgDays(capaDaysList);
    const capaOverdue = allCapas.filter(c => c.status !== "Closed" && c.initialPlannedDate && c.initialPlannedDate < new Date().toISOString().slice(0,10)).length;

    /* ── EFFICACY REVIEWS ── */
    const completedErs = allErs.filter(e => (e as unknown as { outcome: string | null }).outcome != null);
    const erByOutcome = toPieData(groupByKey(completedErs, "outcome" as keyof typeof completedErs[0]));
    const erEffective = allErs.filter(e => (e as unknown as { outcome: string | null }).outcome === "Effective").length;
    const erNotEffective = allErs.filter(e => (e as unknown as { outcome: string | null }).outcome === "Not Effective").length;
    const erInconclusive = allErs.filter(e => (e as unknown as { outcome: string | null }).outcome === "Inconclusive").length;
    const erPending = allErs.filter(e => e.status === "Pending" || e.status === "Overdue").length;

    /* ── CHANGE CONTROL ── */
    const yearCcs = allCcs.filter(c => c.plannedImplementationDate?.startsWith(yearStr));
    const closedCcs = allCcs.filter(c => c.status === "Closed" && c.updatedAt.startsWith(yearStr));

    const ccMonthly = monthKeys.map(m => ({
      month: m.label,
      opened: allCcs.filter(c => (c.plannedImplementationDate ?? "") >= m.start && (c.plannedImplementationDate ?? "") <= m.end).length,
      closed: allCcs.filter(c => c.status === "Closed" && c.updatedAt.slice(0,10) >= m.start && c.updatedAt.slice(0,10) <= m.end).length,
    }));

    const ccByType = toPieData(groupByKey(yearCcs, "changeType" as keyof typeof yearCcs[0]));
    const ccByStatus = Object.entries(groupByKey(allCcs, "status" as keyof typeof allCcs[0]))
      .map(([name, count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count);

    const ccOnTime = closedCcs.filter(c => {
      const planned = c.plannedImplementationDate;
      const closed = c.updatedAt.slice(0,10);
      return planned && closed <= planned;
    });
    const ccLate = closedCcs.filter(c => {
      const planned = c.plannedImplementationDate;
      const closed = c.updatedAt.slice(0,10);
      return planned && closed > planned;
    });

    const ccDaysList = closedCcs.map(c => {
      const start = c.plannedImplementationDate;
      const end = c.updatedAt.slice(0,10);
      return start && end ? differenceInDays(parseISO(end), parseISO(start)) : null;
    }).filter((x): x is number => x !== null && x >= 0);

    const ccAvgDays = avgDays(ccDaysList);

    /* ── OVERALL QUALITY SCORE ── */
    const totalClosed = closedDevs.length + closedCapas.length + closedCcs.length;
    const totalOnTime = devOnTime.length + capaOnTime.length + ccOnTime.length;
    const qualityScore = totalClosed > 0 ? Math.round((totalOnTime / totalClosed) * 100) : 0;

    return {
      devMonthlyOpened, devByType, devByArea,
      devOnTime: devOnTime.length, devLate: devLate.length,
      devAvgDays, devOverdue, devLateRows,
      totalDevs: allDevs.length, openDevs: allDevs.filter(d => d.status !== "Closed").length,
      capaMonthly, capaByType,
      capaOnTime: capaOnTime.length, capaLate: capaLate.length,
      capaAvgDays, capaOverdue, totalCapas: allCapas.length,
      erByOutcome, erEffective, erNotEffective, erInconclusive, erPending, totalErs: allErs.length,
      ccMonthly, ccByType, ccByStatus,
      ccOnTime: ccOnTime.length, ccLate: ccLate.length,
      ccAvgDays, totalCcs: allCcs.length,
      qualityScore, totalClosed, totalOnTime,
    };
  }, [allDevs, allCapas, allCcs, allErs, yr]);

  const scoreColor = analytics.qualityScore >= 80 ? CHART_COLORS.success : analytics.qualityScore >= 60 ? CHART_COLORS.warning : CHART_COLORS.danger;

  return (
    <PageTransition className="p-6 max-w-7xl mx-auto">
      {/* CONTROLS */}
      <div className="no-print mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-muted-foreground" />
              Quality Analytics
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Trends, compliance rates, and closure performance across all QMS modules.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-5">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-1.5" />Print / Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT HEADER */}
      <div className="print-only mb-6">
        <h1 className="text-2xl font-bold">Quality Analytics Report — {year}</h1>
        <p className="text-sm text-gray-500">Generated {new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"long", year:"numeric" })}</p>
        <hr className="mt-3" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── OVERALL KPIs ── */}
          <section>
            <SectionTitle title="Overall Quality Performance" subtitle={`All-time summary • ${year} trend data`} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard label="Quality Score" value={`${analytics.qualityScore}%`} sub="on-time closure rate" icon={CheckCircle2} color={scoreColor} />
              <KpiCard label="Total Deviations" value={analytics.totalDevs} sub={`${analytics.openDevs} open`} icon={AlertTriangle} color={CHART_COLORS.danger} />
              <KpiCard label="Total CAPAs" value={analytics.totalCapas} sub={`${analytics.capaOverdue} overdue`} icon={TrendingUp} color={CHART_COLORS.blue} />
              <KpiCard label="Change Controls" value={analytics.totalCcs} sub={`${analytics.totalErs} efficacy reviews`} icon={Clock} color={CHART_COLORS.teal} />
            </div>

            {/* On-time summary bars */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">On-Time Closure Rate by Module</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <OnTimeBar onTime={analytics.devOnTime} late={analytics.devLate} label="Deviations" />
                <OnTimeBar onTime={analytics.capaOnTime} late={analytics.capaLate} label="CAPAs" />
                <OnTimeBar onTime={analytics.ccOnTime} late={analytics.ccLate} label="Change Controls" />
              </CardContent>
            </Card>
          </section>

          {/* ── DEVIATIONS ── */}
          <section>
            <SectionTitle title="Deviation Analytics" subtitle="Trend, distribution, and closure performance" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title="Monthly Opened vs Closed">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.devMonthlyOpened} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize:11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize:11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="opened" name="Opened" fill={CHART_COLORS.blue} radius={[3,3,0,0]} />
                    <Bar dataKey="closed" name="Closed" fill={CHART_COLORS.success} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="By Deviation Type">
                {analytics.devByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={analytics.devByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0)*100)}%`} labelLine={false}>
                        {analytics.devByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data for {year}</p>}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title="By Area Responsible">
                {analytics.devByArea.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.devByArea} layout="vertical" margin={{ top:0, right:16, bottom:0, left:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize:11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} width={130} />
                      <Tooltip />
                      <Bar dataKey="count" name="Deviations" fill={CHART_COLORS.primary} radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data for {year}</p>}
              </ChartCard>

              <ChartCard title="Avg Days to Close & Overdue">
                <div className="flex flex-col gap-6 pt-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color: CHART_COLORS.primary }}>{analytics.devAvgDays}</p>
                    <p className="text-sm text-muted-foreground mt-1">Average days to close a deviation</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color: analytics.devOverdue > 0 ? CHART_COLORS.danger : CHART_COLORS.success }}>{analytics.devOverdue}</p>
                    <p className="text-sm text-muted-foreground mt-1">Currently overdue (open past due date)</p>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Late closure table */}
            {analytics.devLateRows.length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Late Closures — Top {analytics.devLateRows.length} (days overdue)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-medium">Record</th>
                          <th className="text-left py-2 pr-4 font-medium">Title</th>
                          <th className="text-left py-2 pr-4 font-medium">Area</th>
                          <th className="text-left py-2 pr-4 font-medium">Type</th>
                          <th className="text-right py-2 pr-4 font-medium">Due Date</th>
                          <th className="text-right py-2 font-medium text-destructive">Days Late</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.devLateRows.map(r => (
                          <tr key={r.number} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{r.number}</td>
                            <td className="py-2 pr-4 max-w-[200px] truncate">{r.title}</td>
                            <td className="py-2 pr-4 text-xs text-muted-foreground">{r.area}</td>
                            <td className="py-2 pr-4 text-xs">{r.type}</td>
                            <td className="py-2 pr-4 text-right text-xs text-muted-foreground">{r.dueDate}</td>
                            <td className="py-2 text-right font-semibold text-destructive">+{r.daysLate}d</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </section>

          {/* ── CAPA ── */}
          <section>
            <SectionTitle title="CAPA Analytics" subtitle="Corrective & preventive action implementation performance" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title="Monthly Opened vs Closed">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.capaMonthly} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize:11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize:11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="opened" name="Opened" fill={CHART_COLORS.blue} radius={[3,3,0,0]} />
                    <Bar dataKey="closed" name="Closed" fill={CHART_COLORS.success} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="By Type">
                {analytics.capaByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={analytics.capaByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0)*100)}%`} labelLine={false}>
                        {analytics.capaByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data for {year}</p>}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Efficacy Review Outcomes">
                {analytics.erByOutcome.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={analytics.erByOutcome} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {analytics.erByOutcome.map((entry) => {
                          const c = entry.name === "Effective" ? CHART_COLORS.success : entry.name === "Not Effective" ? CHART_COLORS.danger : CHART_COLORS.warning;
                          return <Cell key={entry.name} fill={c} />;
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No completed efficacy reviews yet</p>}
              </ChartCard>

              <ChartCard title="CAPA Performance">
                <div className="flex flex-col gap-6 pt-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color: CHART_COLORS.primary }}>{analytics.capaAvgDays}</p>
                    <p className="text-sm text-muted-foreground mt-1">Average days to implement a CAPA</p>
                  </div>
                  <div className="flex justify-center gap-6 text-center">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: CHART_COLORS.success }}>{analytics.erEffective}</p>
                      <p className="text-xs text-muted-foreground">Effective</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: CHART_COLORS.danger }}>{analytics.erNotEffective}</p>
                      <p className="text-xs text-muted-foreground">Not Effective</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: CHART_COLORS.warning }}>{analytics.erInconclusive}</p>
                      <p className="text-xs text-muted-foreground">Inconclusive</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: CHART_COLORS.slate }}>{analytics.erPending}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </section>

          {/* ── CHANGE CONTROL ── */}
          <section>
            <SectionTitle title="Change Control Analytics" subtitle="Approval workflow and implementation timelines" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title="Monthly Opened vs Closed">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.ccMonthly} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize:11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize:11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="opened" name="Opened" fill={CHART_COLORS.violet} radius={[3,3,0,0]} />
                    <Bar dataKey="closed" name="Closed" fill={CHART_COLORS.success} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="By Change Type">
                {analytics.ccByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={analytics.ccByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0)*100)}%`} labelLine={false}>
                        {analytics.ccByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data for {year}</p>}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Status Distribution">
                {analytics.ccByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.ccByStatus} layout="vertical" margin={{ top:0, right:16, bottom:0, left:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize:11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} width={110} />
                      <Tooltip />
                      <Bar dataKey="count" name="Change Controls" fill={CHART_COLORS.violet} radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>}
              </ChartCard>

              <ChartCard title="Change Control Performance">
                <div className="flex flex-col gap-6 pt-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color: CHART_COLORS.violet }}>{analytics.ccAvgDays}</p>
                    <p className="text-sm text-muted-foreground mt-1">Average days to close a change control</p>
                  </div>
                  <div className="flex justify-center gap-8 text-center">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: CHART_COLORS.success }}>{analytics.ccOnTime}</p>
                      <p className="text-xs text-muted-foreground">On time</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: CHART_COLORS.danger }}>{analytics.ccLate}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>
          </section>

          {/* PRINT FOOTER */}
          <div className="print-only mt-8 border-t pt-4 text-xs text-gray-500 flex justify-between">
            <span>Capalyst QMS — Confidential</span>
            <span>Quality Analytics Report {year}</span>
          </div>

        </div>
      )}
    </PageTransition>
  );
}
