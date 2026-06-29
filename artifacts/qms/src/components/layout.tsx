import React from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/auth-context";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { LayoutDashboard, FileWarning, ClipboardList, ShieldAlert, Users, Sun, Moon, FlaskConical, Shield, LogOut, FileBarChart2, Settings2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { CapalystLogoMark } from "@/components/capalyst-logo";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const pageTitle = 
    location === "/" ? "Dashboard" :
    location.startsWith("/deviations") ? "Deviations Management" :
    location.startsWith("/capa/er") ? "Efficacy Reviews" :
    location.startsWith("/capa") ? "CAPA Management" :
    location.startsWith("/changecontrol") ? "Change Control" :
    location.startsWith("/users") ? "User Administration" :
    location.startsWith("/audit") ? "Audit Trail" :
    location.startsWith("/reports") ? "Reports" :
    location.startsWith("/analytics") ? "Quality Analytics" :
    location.startsWith("/settings") ? "System Settings" : "";

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "QA";
  const isQA = user?.roles?.includes("QA");
  const isAdmin = user?.roles?.includes("Admin");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-950">
        <Sidebar className="border-r border-sidebar-border bg-sidebar dark:bg-sidebar">
          <SidebarHeader className="flex items-center justify-center px-4 py-4 border-b border-sidebar-border bg-slate-900">
            <img
              src="/capalyst-text-logo-nobg.png"
              alt="Capalyst"
              className="w-full object-contain"
              style={{ filter: "invert(1) brightness(2)" }}
            />
          </SidebarHeader>
          <SidebarContent className="py-4 px-3">
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"} className="rounded-xl px-3 py-2.5">
                  <Link href="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/deviations")} className="rounded-xl px-3 py-2.5">
                  <Link href="/deviations">
                    <FileWarning />
                    <span>Deviations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/capa") && !location.startsWith("/capa/er")} className="rounded-xl px-3 py-2.5">
                  <Link href="/capa">
                    <ClipboardList />
                    <span>CAPA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/capa/er")} className="rounded-xl px-3 py-2.5">
                  <Link href="/capa/er">
                    <FlaskConical />
                    <span>Efficacy Reviews</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.startsWith("/changecontrol")} className="rounded-xl px-3 py-2.5">
                  <Link href="/changecontrol">
                    <ShieldAlert />
                    <span>Change Control</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/users")} className="rounded-xl px-3 py-2.5">
                    <Link href="/users">
                      <Users />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
            <SidebarSeparator className="my-3 mx-1" />
            <SidebarMenu className="space-y-1">
              {(isQA || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/analytics")} className="rounded-xl px-3 py-2.5">
                    <Link href="/analytics">
                      <BarChart2 />
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(isQA || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/reports")} className="rounded-xl px-3 py-2.5">
                    <Link href="/reports">
                      <FileBarChart2 />
                      <span>Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {(isQA || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/audit")} className="rounded-xl px-3 py-2.5">
                    <Link href="/audit">
                      <Shield />
                      <span>Audit Trail</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.startsWith("/settings")} className="rounded-xl px-3 py-2.5">
                    <Link href="/settings">
                      <Settings2 />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 space-y-1">
            {user && (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
                  <p className="text-xs text-sidebar-foreground/50">{isQA ? "QA Admin" : "User"}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors w-full p-2 rounded-md hover:bg-sidebar-accent"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors w-full p-2 rounded-md hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
            <p className="text-[10px] text-sidebar-foreground/30 text-center pt-2 pb-1 tracking-wide">
              © 2025 CapaLyst &nbsp;·&nbsp; v1.0.0
            </p>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="no-print h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 border-b bg-card">
            <div className="flex items-center gap-3 lg:gap-4">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border hidden lg:block" />
              <h1 className="text-sm font-medium text-muted-foreground hidden lg:block">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-3 lg:gap-4">
              <NotificationBell />
              <div className="w-px h-5 bg-border hidden lg:block" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm shrink-0">
                  {initials}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium leading-none">{user?.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{isQA ? "Quality Assurance" : "User"}</p>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
