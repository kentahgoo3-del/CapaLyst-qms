import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Link } from "wouter";
import { PageTransition } from "@/components/page-transition";
import { StatusBadge } from "@/components/status-badge";
import { useListCapa, getListCapaQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, AlertCircle, ClipboardList, X, Download } from "lucide-react";
import { format } from "date-fns";

export default function CapaList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(search, 400);

  const params = {
    page,
    pageSize: 10,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { flag: statusFilter }),
  };

  const { data, isLoading } = useListCapa(params, {
    query: { queryKey: getListCapaQueryKey(params) },
  });

  return (
    <PageTransition className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            CAPA
          </h1>
          <p className="text-muted-foreground mt-1">Corrective and Preventive Actions</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => {
          const p = new URLSearchParams();
          if (statusFilter !== "all") p.set("flag", statusFilter);
          if (debouncedSearch) p.set("search", debouncedSearch);
          window.location.href = `/api/capa/export${p.toString() ? "?" + p.toString() : ""}`;
        }}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(["all", "todo", "mine", "plants", "overdue", "Draft"] as const).map((v) => {
          const labels: Record<string, string> = { all: "All", todo: "ToDo", mine: "Mine", plants: "Plants", overdue: "Overdue", Draft: "Draft" };
          const active = statusFilter === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => { setStatusFilter(v); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                active
                  ? "bg-cyan-400 text-white border-cyan-400"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {labels[v]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number, title, or leader..."
            className={search ? "pl-9 pr-9" : "pl-9"}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-testid="input-search-capa"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-52">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger data-testid="select-capa-status-filter">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="todo">ToDo</SelectItem>
              <SelectItem value="mine">Mine</SelectItem>
              <SelectItem value="plants">Plants</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Card view (tablet / mobile < lg) ── */}
      <div className="block lg:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p>No CAPAs found matching your criteria.</p>
          </div>
        ) : (
          data?.data.map((capa) => (
            <Link key={capa.id} href={`/capa/${capa.id}`} data-testid={`row-capa-${capa.id}`}>
              <div className="rounded-xl border bg-card p-4 active:scale-[0.99] transition-transform space-y-2.5 hover:border-primary/30 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-primary">{capa.capaNumber}</span>
                  <StatusBadge status={capa.status} />
                </div>
                <p className="font-medium text-sm leading-snug text-foreground line-clamp-2">{capa.title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{capa.capaType}</span>
                  <span>·</span>
                  <span>Leader: {capa.implementationLeader}</span>
                  {capa.deviationNumber && <><span>·</span><span>{capa.deviationNumber}</span></>}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Planned:</span>
                  <span className={capa.isOverdue ? "text-destructive font-medium flex items-center gap-1" : "text-foreground"}>
                    {format(new Date(capa.updatedPlannedDate || capa.initialPlannedDate), "MMM d, yyyy")}
                    {capa.isOverdue && <AlertCircle className="h-3 w-3" />}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ── Table view (desktop ≥ lg) ── */}
      <div className="hidden lg:block border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="whitespace-nowrap">Number</TableHead>
              <TableHead className="w-full">Title</TableHead>
              <TableHead className="whitespace-nowrap">Linked Dev.</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">Leader</TableHead>
              <TableHead className="whitespace-nowrap">Planned Date</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full max-w-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No CAPAs found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((capa) => (
                <TableRow key={capa.id} className="hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`row-capa-${capa.id}`}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link href={`/capa/${capa.id}`} className="text-primary hover:underline group-hover:text-primary/80">
                      {capa.capaNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <span className="block truncate font-medium text-foreground">{capa.title}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {capa.deviationNumber ?? "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{capa.capaType}</TableCell>
                  <TableCell className="whitespace-nowrap">{capa.implementationLeader}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={capa.isOverdue ? "text-destructive font-medium" : ""}>
                        {format(new Date(capa.updatedPlannedDate || capa.initialPlannedDate), "MMM d, yyyy")}
                      </span>
                      {capa.isOverdue && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={capa.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">{(page - 1) * 10 + 1}</span> to{" "}
            <span className="font-medium text-foreground">{Math.min(page * 10, data.total)}</span> of{" "}
            <span className="font-medium text-foreground">{data.total}</span> CAPAs
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= data.total}>Next</Button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
