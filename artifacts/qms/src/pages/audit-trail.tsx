import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Shield, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const MODULE_COLORS: Record<string, string> = {
  Deviation: "bg-orange-100 text-orange-700 border-orange-200",
  CAPA: "bg-blue-100 text-blue-700 border-blue-200",
  "Change Control": "bg-purple-100 text-purple-700 border-purple-200",
  User: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useListAuditLogs({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    module: module === "all" ? undefined : module,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">Full history of all system actions for GxP compliance</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, action, or record…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={module} onValueChange={(v) => { setModule(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="Deviation">Deviation</SelectItem>
            <SelectItem value="CAPA">CAPA</SelectItem>
            <SelectItem value="Change Control">Change Control</SelectItem>
            <SelectItem value="User">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Module</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Record</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No audit log entries found</td></tr>
            ) : data?.data.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium">{log.userName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${MODULE_COLORS[log.module] ?? "bg-gray-100 text-gray-700"}`}>
                    {log.module}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.recordNumber ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{log.action}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs truncate">{log.details ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
