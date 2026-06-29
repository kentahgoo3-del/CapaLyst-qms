import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Zap } from "lucide-react";
import { useLocation } from "wouter";

const DISMISSED_ACTIONS_KEY = "qms_dismissed_action_items";
const DISMISSED_AUDIT_KEY = "qms_dismissed_notifications";

interface ActionItem {
  id: string;
  type: "action_required" | "info";
  priority: "high" | "medium" | "low";
  module: string;
  recordId: number;
  recordNumber: string;
  message: string;
  url: string;
}

interface AuditEntry {
  id: number;
  action: string;
  module: string;
  recordId: number | null;
  recordNumber: string | null;
  details: string | null;
  userName: string;
  createdAt: string;
}

function loadDismissedActions(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_ACTIONS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}

function saveDismissedActions(ids: Set<string>) {
  try { localStorage.setItem(DISMISSED_ACTIONS_KEY, JSON.stringify([...ids])); } catch {}
}

function loadDismissedAudit(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISSED_AUDIT_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch { return new Set(); }
}

function saveDismissedAudit(ids: Set<number>) {
  try { localStorage.setItem(DISMISSED_AUDIT_KEY, JSON.stringify([...ids])); } catch {}
}

function auditUrl(entry: AuditEntry): string {
  const { module, recordId } = entry;
  if (recordId) {
    if (module === "Deviation") return `/deviations/${recordId}`;
    if (module === "CAPA") return `/capa/${recordId}`;
    if (module === "Change Control") return `/changecontrol/${recordId}`;
  }
  return "/audit";
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([]);
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(loadDismissedActions);
  const [dismissedAudit, setDismissedAudit] = useState<Set<number>>(loadDismissedAudit);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [notifRes, auditRes] = await Promise.all([
        fetch("/api/notifications", { credentials: "include" }),
        fetch("/api/audit?pageSize=20&page=1", { credentials: "include" }),
      ]);
      if (notifRes.ok) {
        const d = await notifRes.json() as { items: ActionItem[] };
        setActionItems(d.items ?? []);
      }
      if (auditRes.ok) {
        const d = await auditRes.json() as { data: AuditEntry[] };
        setRecentAudit(d.data ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const visibleActions = actionItems.filter((a) => !dismissedActions.has(a.id));
  const visibleAudit = recentAudit.filter((a) => !dismissedAudit.has(a.id)).slice(0, 5);
  const totalCount = visibleActions.length + visibleAudit.length;
  const badge = totalCount > 99 ? "99+" : totalCount > 0 ? String(totalCount) : null;

  const dismissAction = (id: string) => {
    const next = new Set(dismissedActions);
    next.add(id);
    setDismissedActions(next);
    saveDismissedActions(next);
  };

  const dismissAudit = (id: number) => {
    const next = new Set(dismissedAudit);
    next.add(id);
    setDismissedAudit(next);
    saveDismissedAudit(next);
  };

  const handleActionClick = (item: ActionItem) => {
    dismissAction(item.id);
    setOpen(false);
    navigate(item.url);
  };

  const handleAuditClick = (entry: AuditEntry) => {
    dismissAudit(entry.id);
    setOpen(false);
    navigate(auditUrl(entry));
  };

  const priorityDot: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-orange-400",
    low: "bg-muted-foreground",
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-card border border-border rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 px-4 py-2.5 flex items-center justify-between">
            <p className="text-white text-xs font-bold tracking-widest uppercase">Alerts Center</p>
            <button
              type="button"
              onClick={() => {
                const nextActions = new Set(dismissedActions);
                actionItems.forEach((a) => nextActions.add(a.id));
                setDismissedActions(nextActions);
                saveDismissedActions(nextActions);

                const nextAudit = new Set(dismissedAudit);
                recentAudit.forEach((a) => nextAudit.add(a.id));
                setDismissedAudit(nextAudit);
                saveDismissedAudit(nextAudit);
              }}
              className="text-red-200 hover:text-white text-[10px] underline transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {loading && visibleActions.length === 0 && visibleAudit.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : visibleActions.length === 0 && visibleAudit.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No new notifications</div>
            ) : (
              <>
                {/* Action Required section */}
                {visibleActions.length > 0 && (
                  <div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 px-4 py-1.5 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-600" />
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Action Required</p>
                    </div>
                    <div className="divide-y divide-border/60">
                      {visibleActions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleActionClick(item)}
                          className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                        >
                          <div className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${priorityDot[item.priority] ?? "bg-muted"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{item.module}</p>
                            <p className="text-sm text-foreground leading-snug">{item.message}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent activity section */}
                {visibleAudit.length > 0 && (
                  <div>
                    <div className="bg-muted/40 border-b border-border/60 px-4 py-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Activity</p>
                    </div>
                    <div className="divide-y divide-border/60">
                      {visibleAudit.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => handleAuditClick(entry)}
                          className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                        >
                          <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                            <Bell className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground mb-0.5">{entry.module} · {entry.userName}</p>
                            <p className="text-sm text-foreground leading-snug font-medium">
                              {entry.recordNumber ? `${entry.action} — ${entry.recordNumber}` : entry.action}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
