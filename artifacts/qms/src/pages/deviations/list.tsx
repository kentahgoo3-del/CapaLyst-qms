import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { PageTransition } from "@/components/page-transition";
import { StatusBadge } from "@/components/status-badge";
import {
  useListDeviations, getListDeviationsQueryKey, useCreateDeviation,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, AlertCircle, FileWarning, Loader2, X, Download } from "lucide-react";
import { format, addDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { UserPicker } from "@/components/user-picker";
import {
  DEVIATION_TYPES, OPERATIONS, EquipmentPicker, ProductsEditor, parseJSON, type ProductRow,
} from "@/components/deviation-fields";
import { useSettingOptions } from "@/hooks/use-setting-options";

const WF_LABELS: Record<string, { label: string; className: string }> = {
  Draft:                  { label: "Draft",                  className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  Submitted:              { label: "Pending Area Review",    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  Area_Accepted:          { label: "Area Accepted",          className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  Area_Rejected:          { label: "Rejected by Area",       className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  QA_Accepted:            { label: "QA Accepted",            className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  QA_Rejected:            { label: "Rejected by QA",         className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  Roles_Assigned:         { label: "Roles Assigned",         className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  Investigation_Submitted:{ label: "Investigation Submitted",className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  Risk_Mgmt_Submitted:    { label: "Risk Mgmt Submitted",    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  Root_Cause_Submitted:   { label: "Root Cause Submitted",   className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  CAPA_ER_Submitted:      { label: "CAPA & ER Submitted",    className: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  Completed:              { label: "Completed",              className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
};

function WfStatusBadge({ wfStatus, status }: { wfStatus?: string | null; status: string }) {
  const key = wfStatus ?? status;
  const cfg = WF_LABELS[key] ?? { label: key, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

const PRIORITY_LEVELS = ["Low", "Medium", "High", "Critical"];

const defaultForm = {
  title: "",
  description: "",
  immediateAction: "",
  deviationType: "",
  location: "",
  externalReference: "",
  eventDate: "",
  detectionDate: "",
  areaResponsible: "",
  qaExpert: "",
  operation: "",
  batchLotNumber: "",
  eventPriority: "",
};

type SubmitMode = "open" | "draft";

export default function DeviationsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deviationTypes = useSettingOptions("deviation_types", DEVIATION_TYPES);
  const operations = useSettingOptions("operations", OPERATIONS);
  const debouncedSearch = useDebounce(search, 400);

  const params = {
    page,
    pageSize: 10,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { flag: statusFilter }),
  };

  const { data, isLoading } = useListDeviations(params, {
    query: { queryKey: getListDeviationsQueryKey(params) },
  });

  const createDeviation = useCreateDeviation();

  const setField = (key: keyof typeof defaultForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (formErrors[key]) setFormErrors((e) => ({ ...e, [key]: false }));
  };

  const computedDueDate = form.detectionDate
    ? format(addDays(new Date(form.detectionDate), 30), "yyyy-MM-dd")
    : "";

  const resetDialog = () => {
    setIsOpen(false);
    setForm(defaultForm);
    setEquipment([]);
    setProducts([]);
    setFormErrors({});
  };

  const handleSubmit = (mode: SubmitMode = "open") => {
    const errors: Record<string, boolean> = {};
    if (!form.title.trim()) errors.title = true;
    if (!form.deviationType) errors.deviationType = true;
    if (!form.eventDate) errors.eventDate = true;
    if (!form.detectionDate) errors.detectionDate = true;
    if (!form.areaResponsible) errors.areaResponsible = true;
    if (!form.qaExpert) errors.qaExpert = true;
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setFormErrors({});
    createDeviation.mutate(
      {
        data: {
          title: form.title,
          description: form.description || null,
          immediateAction: form.immediateAction || null,
          deviationType: form.deviationType,
          location: form.location || null,
          externalReference: form.externalReference || null,
          eventDate: form.eventDate,
          detectionDate: form.detectionDate,
          areaResponsible: form.areaResponsible,
          qaExpert: form.qaExpert,
          operation: form.operation || null,
          equipment: equipment.length > 0 ? JSON.stringify(equipment) : null,
          products: products.length > 0 ? JSON.stringify(products) : null,
          batchLotNumber: form.batchLotNumber || null,
          eventPriority: form.eventPriority || null,
          status: mode === "draft" ? "Draft" : null,
        },
      },
      {
        onSuccess: (created) => {
          toast({ title: mode === "draft" ? "Deviation saved as draft" : "Deviation created successfully" });
          resetDialog();
          queryClient.invalidateQueries({ queryKey: getListDeviationsQueryKey(params) });
          if (mode === "open" && created?.id) navigate(`/deviations/${created.id}`);
        },
        onError: () => toast({ title: "Failed to create deviation", variant: "destructive" }),
      }
    );
  };

  return (
    <PageTransition className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileWarning className="h-8 w-8 text-primary" />
            Deviations
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track non-conformances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => {
            const p = new URLSearchParams();
            if (statusFilter !== "all") p.set("flag", statusFilter);
            if (debouncedSearch) p.set("search", debouncedSearch);
            window.location.href = `/api/deviations/export${p.toString() ? "?" + p.toString() : ""}`;
          }}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="shrink-0 gap-2" onClick={() => setIsOpen(true)} data-testid="button-new-deviation">
            <Plus className="h-4 w-4" />
            New Deviation
          </Button>
        </div>
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
            placeholder="Search by number or title..."
            className={cn("pl-9", search && "pr-9")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-testid="input-search-deviations"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-52">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger data-testid="select-status-filter">
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
                <Skeleton className="h-5 w-32 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <FileWarning className="h-10 w-10 opacity-30" />
            <p>No deviations found matching your criteria.</p>
          </div>
        ) : (
          data?.data.map((dev) => (
            <Link key={dev.id} href={`/deviations/${dev.id}`} data-testid={`row-deviation-${dev.id}`}>
              <div className="rounded-xl border bg-card p-4 active:scale-[0.99] transition-transform space-y-2.5 hover:border-primary/30 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-primary">{dev.deviationNumber}</span>
                  <WfStatusBadge wfStatus={(dev as unknown as Record<string, unknown>).workflowStatus as string | null | undefined} status={dev.status} />
                </div>
                <p className="font-medium text-sm leading-snug text-foreground line-clamp-2">{dev.title}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{dev.deviationType}</span>
                  <span>·</span>
                  <span>{dev.areaResponsible}</span>
                  {dev.qaExpert && <><span>·</span><span>QA: {dev.qaExpert}</span></>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Event: <span className="text-foreground">{format(new Date(dev.eventDate), "MMM d, yyyy")}</span></span>
                  <span className={cn("flex items-center gap-1", dev.isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                    Due: {format(new Date(dev.dueDate), "MMM d, yyyy")}
                    {dev.isOverdue && <AlertCircle className="h-3 w-3" />}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ── Table view (desktop ≥ lg) ── */}
      <div className="hidden lg:block border rounded-md bg-card overflow-x-auto">
        <Table className="min-w-[1100px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[160px]">Number</TableHead>
              <TableHead className="min-w-[220px]">Title</TableHead>
              <TableHead className="w-[160px]">Type</TableHead>
              <TableHead className="w-[150px]">Area</TableHead>
              <TableHead className="w-[160px]">QA Expert</TableHead>
              <TableHead className="w-[130px]">Event Date</TableHead>
              <TableHead className="w-[130px]">Due Date</TableHead>
              <TableHead className="w-[130px]">Extended Date</TableHead>
              <TableHead className="w-[170px]">Workflow Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full max-w-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-28 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No deviations found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((dev) => (
                <TableRow key={dev.id} className="hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`row-deviation-${dev.id}`}>
                  <TableCell className="font-medium">
                    <Link href={`/deviations/${dev.id}`} className="text-primary hover:underline group-hover:text-primary/80">
                      {dev.deviationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{dev.title}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-sm">{dev.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{dev.deviationType}</TableCell>
                  <TableCell className="text-sm">{dev.areaResponsible}</TableCell>
                  <TableCell className="text-sm">{dev.qaExpert}</TableCell>
                  <TableCell className="text-sm">{format(new Date(dev.eventDate), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className={dev.isOverdue ? "text-destructive font-medium" : ""}>
                        {format(new Date(dev.dueDate), "MMM d, yyyy")}
                      </span>
                      {dev.isOverdue && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dev.extendedDate ? format(new Date(dev.extendedDate), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <WfStatusBadge wfStatus={(dev as unknown as Record<string, unknown>).workflowStatus as string | null | undefined} status={dev.status} />
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
            <span className="font-medium text-foreground">{data.total}</span> deviations
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= data.total}>Next</Button>
          </div>
        </div>
      )}

      {/* ── Create Deviation Dialog ── */}
      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) resetDialog(); else setIsOpen(true); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Deviation</DialogTitle>
            <DialogDescription>Record a new quality deviation event.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Core fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="dev-title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="dev-title"
                  placeholder="Brief description of the deviation"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  data-testid="input-deviation-title"
                  className={cn(formErrors.title && "border-destructive ring-1 ring-destructive")}
                />
                {formErrors.title && <p className="text-xs text-destructive">Title is required</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Detailed description of what occurred..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  data-testid="input-deviation-description"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>Immediate Action Taken</Label>
                <Textarea
                  placeholder="Describe any immediate corrective action taken..."
                  rows={2}
                  value={form.immediateAction}
                  onChange={(e) => setField("immediateAction", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={form.deviationType} onValueChange={(v) => setField("deviationType", v)}>
                  <SelectTrigger data-testid="select-deviation-type" className={cn(formErrors.deviationType && "border-destructive ring-1 ring-destructive")}><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{deviationTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {formErrors.deviationType && <p className="text-xs text-destructive">Type is required</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Operation</Label>
                <Select value={form.operation} onValueChange={(v) => setField("operation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select operation" /></SelectTrigger>
                  <SelectContent>{operations.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  placeholder="e.g. Building A, Room 201"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>External Reference</Label>
                <Input
                  placeholder="e.g. SOP-123"
                  value={form.externalReference}
                  onChange={(e) => setField("externalReference", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Batch / Lot Number</Label>
                <Input
                  placeholder="e.g. LOT-2024-001"
                  value={form.batchLotNumber}
                  onChange={(e) => setField("batchLotNumber", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Initial Severity</Label>
                <Select value={form.eventPriority} onValueChange={(v) => setField("eventPriority", v)}>
                  <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                  <SelectContent>{PRIORITY_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Event Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setField("eventDate", e.target.value)}
                  data-testid="input-deviation-event-date"
                  className={cn(formErrors.eventDate && "border-destructive ring-1 ring-destructive")}
                />
                {formErrors.eventDate && <p className="text-xs text-destructive">Event date is required</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Detection Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.detectionDate}
                  onChange={(e) => setField("detectionDate", e.target.value)}
                  data-testid="input-deviation-detection-date"
                  className={cn(formErrors.detectionDate && "border-destructive ring-1 ring-destructive")}
                />
                {formErrors.detectionDate && <p className="text-xs text-destructive">Detection date is required</p>}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label>
                  Due Date{" "}
                  <span className="text-muted-foreground text-xs font-normal">(Detection + 30 days)</span>
                </Label>
                <Input
                  type="date"
                  value={computedDueDate}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed"
                  data-testid="input-deviation-due-date"
                />
              </div>
            </div>

            {/* Correspondants */}
            <div>
              <p className="text-sm font-semibold mb-3">Correspondants</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Area Responsible <span className="text-destructive">*</span></Label>
                  <UserPicker
                    value={form.areaResponsible}
                    onChange={(v) => setField("areaResponsible", v)}
                    placeholder="Select area responsible..."
                    data-testid="select-area-responsible"
                    className={cn(formErrors.areaResponsible && "border-destructive ring-1 ring-destructive")}
                  />
                  {formErrors.areaResponsible && <p className="text-xs text-destructive">Area responsible is required</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>QA Expert <span className="text-destructive">*</span></Label>
                  <UserPicker
                    value={form.qaExpert}
                    onChange={(v) => setField("qaExpert", v)}
                    placeholder="Select QA expert..."
                    data-testid="input-deviation-qa"
                    className={cn(formErrors.qaExpert && "border-destructive ring-1 ring-destructive")}
                  />
                  {formErrors.qaExpert && <p className="text-xs text-destructive">QA expert is required</p>}
                </div>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <p className="text-sm font-semibold mb-3">Equipment</p>
              <EquipmentPicker value={equipment} onChange={setEquipment} />
            </div>

            {/* Products */}
            <div>
              <p className="text-sm font-semibold mb-3">Products</p>
              <ProductsEditor rows={products} onChange={setProducts} />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={resetDialog}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSubmit("draft")} disabled={createDeviation.isPending}>
              {createDeviation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit("open")} disabled={createDeviation.isPending} data-testid="button-submit-deviation">
              {createDeviation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Deviation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
