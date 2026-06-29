import React from "react";
import { PageTransition, ListTransition } from "@/components/page-transition";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useGetDashboardSummary, 
  useGetDashboardMetrics, 
  useGetDashboardRecentActivity,
  useGetDeviationCounts,
  useGetCapaCounts
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Activity, AlertCircle, CheckCircle2, ClipboardList, Clock, FileWarning, ShieldAlert, Building2, User, FlaskConical } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/context/auth-context";

function MetricCard({ title, value, description, icon: Icon, loading }: { title: string, value?: string | number, description?: string, icon: React.ElementType, loading?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {loading ? <Skeleton className="h-4 w-32" /> : description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: metrics, isLoading: isLoadingMetrics } = useGetDashboardMetrics();
  const { data: activity, isLoading: isLoadingActivity } = useGetDashboardRecentActivity();
  const { data: devCounts, isLoading: isLoadingDevCounts } = useGetDeviationCounts();
  const { data: capaCounts, isLoading: isLoadingCapaCounts } = useGetCapaCounts();

  const isPrivileged = user?.roles?.some(r => r === "QA" || r === "Admin") ?? false;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const barData = metrics ? metrics.labels.map((label, i) => ({
    name: label,
    deviations: metrics.deviations[i]
  })) : [];

  const trendData = metrics ? metrics.trendLabels.map((label, i) => ({
    name: label,
    new: metrics.trendNew[i],
    closed: metrics.trendClosed[i]
  })) : [];

  return (
    <PageTransition className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          {isPrivileged ? (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plant Overview</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Quality Management System — {summary?.monthLabel || 'Current Period'}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">My Workload</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName}</h1>
              <p className="text-muted-foreground mt-1">Records assigned to you — {summary?.monthLabel || 'Current Period'}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard 
          title={isPrivileged ? "Total Deviations" : "My Deviations"}
          value={summary?.totalDeviations} 
          description={`${summary?.newDeviations || 0} new this period`}
          icon={FileWarning} 
          loading={isLoadingSummary} 
        />
        <MetricCard 
          title="Overdue Deviations"
          value={summary?.overdueDeviations} 
          description="Requires immediate action"
          icon={AlertCircle} 
          loading={isLoadingSummary} 
        />
        <MetricCard 
          title={isPrivileged ? "Open CAPAs" : "My Open CAPAs"}
          value={summary?.openCapa} 
          description={`${summary?.capaDue30 || 0} due within 30 days`}
          icon={ClipboardList} 
          loading={isLoadingSummary} 
        />
        <MetricCard 
          title={isPrivileged ? "CCs in Review" : "My CCs in Review"}
          value={summary?.changeControlsInReview} 
          description="Pending approvals"
          icon={ShieldAlert} 
          loading={isLoadingSummary} 
        />
        <MetricCard 
          title="Overdue ERs"
          value={summary?.overdueErs} 
          description="Efficacy reviews past due date"
          icon={FlaskConical} 
          loading={isLoadingSummary} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Deviation Trends</CardTitle>
            <CardDescription>
              {isPrivileged ? "New vs Closed deviations over time" : "New vs Closed deviations assigned to you"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingMetrics ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="new" name="New" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="closed" name="Closed" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deviations by Area</CardTitle>
            <CardDescription>
              {isPrivileged ? "Current distribution" : "Your records by area"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingMetrics ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="deviations" name="Count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {isPrivileged ? "Latest updates across the system" : "Latest updates on your records"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-start gap-4">
                    <div className="mt-0.5 bg-muted p-2 rounded-full">
                      {item.type === 'deviation' ? <FileWarning className="w-4 h-4 text-amber-500" /> :
                       item.type === 'capa' ? <ClipboardList className="w-4 h-4 text-blue-500" /> :
                       <ShieldAlert className="w-4 h-4 text-purple-500" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          <Link href={item.type === "deviation" ? `/deviations/${item.id}` : item.type === "capa" ? `/capa/${item.id}` : `/changecontrol/${item.id}`} className="hover:underline">
                            {item.number}
                          </Link>
                          {" "}- {item.action}
                        </p>
                        <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-medium text-foreground">{item.user}</span>
                        <span>•</span>
                        <StatusBadge status={item.status} className="h-5 text-[10px] px-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity on your records</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Workload Summary</CardTitle>
              {!isPrivileged && (
                <CardDescription>Items assigned to you</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingDevCounts || isLoadingCapaCounts ? (
                 <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{isPrivileged ? "Open Deviations" : "My Open Deviations"}</span>
                      <span className="text-muted-foreground">{devCounts?.open || 0} / {devCounts?.total || 0}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, ((devCounts?.open || 0) / Math.max(1, devCounts?.total || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{isPrivileged ? "Open CAPAs" : "My Open CAPAs"}</span>
                      <span className="text-muted-foreground">{capaCounts?.open || 0} / {capaCounts?.total || 0}</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((capaCounts?.open || 0) / Math.max(1, capaCounts?.total || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-destructive">Overdue Items</span>
                      <span className="text-muted-foreground">{(devCounts?.overdue || 0) + (capaCounts?.overdue || 0)} total</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-destructive" style={{ width: `${Math.min(100, (((devCounts?.overdue || 0) + (capaCounts?.overdue || 0)) / Math.max(1, (devCounts?.total || 0) + (capaCounts?.total || 0))) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
