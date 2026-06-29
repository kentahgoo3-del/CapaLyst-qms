import React, { useEffect, useState } from "react";
import { Clock, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

interface AuditEntry {
  id: number;
  userName: string;
  action: string;
  module: string;
  recordId: number | null;
  recordNumber: string | null;
  details: string | null;
  createdAt: string;
}

interface Props {
  module: string;
  recordId: number;
}

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  const a = action.toLowerCase();
  if (a.includes("created") || a.includes("submitted")) return "default";
  if (a.includes("rejected") || a.includes("closed")) return "destructive";
  if (a.includes("approved") || a.includes("accepted") || a.includes("completed")) return "secondary";
  return "outline";
}

function actionColor(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("created")) return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  if (a.includes("rejected")) return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800";
  if (a.includes("approved") || a.includes("accepted") || a.includes("completed")) return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800";
  if (a.includes("submitted")) return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800";
  if (a.includes("closed")) return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800";
  if (a.includes("status changed")) return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  return "bg-muted text-muted-foreground border-border";
}

export function AuditTrailTab({ module, recordId }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/audit?module=${encodeURIComponent(module)}&recordId=${recordId}&pageSize=100`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data.data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recordId) load();
  }, [module, recordId]);

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 space-y-3">
        <p className="text-sm text-muted-foreground">Failed to load audit trail.</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No audit trail entries yet.</p>
        <p className="text-xs text-muted-foreground">Actions taken on this record will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{entries.length} audit entr{entries.length === 1 ? "y" : "ies"}</p>
        <Button variant="ghost" size="sm" onClick={load} className="h-7 text-xs">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-5">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[17px] top-1 w-3.5 h-3.5 rounded-full bg-background border-2 border-border" />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${actionColor(entry.action)}`}>
                    {entry.action}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="font-medium text-foreground">{entry.userName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <Clock className="h-3 w-3" />
                    <span>{format(parseISO(entry.createdAt), "dd MMM yyyy, HH:mm")}</span>
                  </div>
                </div>
                {entry.details && (
                  <p className="text-sm text-muted-foreground pl-1">{entry.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
