import { useState } from "react";
import { Link } from "wouter";
import { useListEfficacyReviews } from "@workspace/api-client-react";
import { FlaskConical, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ErListPage() {
  const [flag, setFlag] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useListEfficacyReviews({
    flag: flag === "all" ? undefined : flag,
    page,
    pageSize,
  });

  const total = data?.total ?? 0;
  const reviews = data?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Efficacy Reviews</h1>
          <p className="text-sm text-muted-foreground">{total} review{total !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={flag} onValueChange={(v) => { setFlag(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">CAPA No.</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Deviation</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[30%]">Instruction</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Expected Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Reviewed Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Assigned</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[25%]">Review</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Outcome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Loading…</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">No efficacy reviews found</td></tr>
            ) : reviews.map((er) => (
              <tr key={er.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-xs font-medium">{er.capaNumber ?? "—"}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono text-xs">{er.deviationNumber ?? "—"}</td>
                <td className="px-4 py-3 max-w-0">
                  <p className="truncate text-sm">{er.instruction ?? "—"}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(er.expectedDate)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(er.reviewDate)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{er.reviewer}</td>
                <td className="px-4 py-3 max-w-0">
                  <p className="truncate text-sm text-muted-foreground">{er.review ?? "—"}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {er.outcome ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      er.outcome === "Effective" ? "bg-green-100 text-green-800" :
                      er.outcome === "Not Effective" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-800"
                    }`}>{er.outcome}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={er.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <Link href={`/capa/${er.capaId}?tab=er`}>
                    <button className="p-1.5 rounded hover:bg-muted transition-colors">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > pageSize && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40 text-xs">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * pageSize >= total} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-40 text-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
