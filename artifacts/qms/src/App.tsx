import React, { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useToast as useToastHook } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

// Pages
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import DeviationsList from "@/pages/deviations/list";
import DeviationDetail from "@/pages/deviations/detail";
import CapaList from "@/pages/capa/list";
import CapaDetail from "@/pages/capa/detail";
import ErListPage from "@/pages/capa/er-list";
import ChangeControlList from "@/pages/change-control/list";
import ChangeControlDetail from "@/pages/change-control/detail";
import UsersList from "@/pages/users";
import AuditTrailPage from "@/pages/audit-trail";
import ReportsPage from "@/pages/reports";
import AnalyticsPage from "@/pages/analytics";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ForcePasswordChange() {
  const { refetch } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    if (newPassword !== confirm) { toast({ title: "Passwords do not match", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error ?? "Failed to change password", variant: "destructive" });
        return;
      }
      toast({ title: "Password updated successfully" });
      refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="bg-card border rounded-xl shadow-lg w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold">Password Change Required</h1>
          <p className="text-sm text-muted-foreground">Your administrator has required you to set a new password before continuing.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fp-new">New Password</Label>
            <div className="relative">
              <Input id="fp-new" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="pr-10" required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-confirm">Confirm Password</Label>
            <div className="relative">
              <Input id="fp-confirm" type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" className="pr-10" required />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Set New Password
          </Button>
        </form>
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, sessionExpiredRef } = useAuth();
  const { toast } = useToastHook();

  useEffect(() => {
    if (!user && sessionExpiredRef.current) {
      sessionExpiredRef.current = false;
      toast({ title: "Session expired", description: "You have been logged out due to inactivity.", variant: "destructive" });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (user.mustChangePassword) return <ForcePasswordChange />;

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.roles?.includes("Admin")) {
    return <Redirect to="/" />;
  }
  return <>{children}</>;
}

function QaAdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.roles?.includes("QA") && !user?.roles?.includes("Admin")) {
    return <Redirect to="/" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <AuthGuard>
      <AppLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/deviations" component={DeviationsList} />
          <Route path="/deviations/:id" component={DeviationDetail} />
          <Route path="/capa/er" component={ErListPage} />
          <Route path="/capa/:id" component={CapaDetail} />
          <Route path="/capa" component={CapaList} />
          <Route path="/changecontrol" component={ChangeControlList} />
          <Route path="/changecontrol/:id" component={ChangeControlDetail} />
          <Route path="/users">
            <AdminGuard><UsersList /></AdminGuard>
          </Route>
          <Route path="/audit">
            <QaAdminGuard><AuditTrailPage /></QaAdminGuard>
          </Route>
          <Route path="/reports">
            <QaAdminGuard><ReportsPage /></QaAdminGuard>
          </Route>
          <Route path="/analytics">
            <QaAdminGuard><AnalyticsPage /></QaAdminGuard>
          </Route>
          <Route path="/settings">
            <AdminGuard><SettingsPage /></AdminGuard>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="qms-theme">
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
