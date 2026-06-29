import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Link, useLocation } from "wouter";
import { PageTransition } from "@/components/page-transition";
import { StatusBadge } from "@/components/status-badge";
import {
  useListChangeControl,
  getListChangeControlQueryKey,
  useCreateChangeControl,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Filter, ShieldAlert, Loader2, X, Download } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { UserPicker } from "@/components/user-picker";
import { EquipmentPicker, ProductsEditor, type ProductRow } from "@/components/deviation-fields";
import { useSettingOptions } from "@/hooks/use-setting-options";

const CHANGE_TYPES = ["Process", "Analytical", "Equipment", "Regulatory", "Documentation", "Facility", "IT System", "Other"];
const JUSTIFICATION_TYPES = ["Quality", "Regulatory", "Safety", "Business", "Technical", "Other"];
const LOCATIONS = ["Manufacturing", "QC Lab", "Warehouse", "R&D", "Quality Assurance", "Regulatory Affairs", "Engineering", "QMS-Demo", "Other"];

const defaultForm = {
  title: "",
  changeType: "",
  plannedImplementationDate: "",
  currentSituation: "",
  proposedSituation: "",
  externalReference: "",
  location: "",
  justificationType: "",
  justification: "",
  hierarchicResponsible: "",
  siteCoordinator: "",
};

type SubmitMode = "submit" | "draft";

export default function ChangeControlList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const changeTypes = useSettingOptions("change_types", CHANGE_TYPES);
  const justificationTypes = useSettingOptions("justification_types", JUSTIFICATION_TYPES);
  const locations = useSettingOptions("locations", LOCATIONS);

  const debouncedSearch = useDebounce(search, 400);

  const params = {
    page,
    pageSize: 10,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { flag: statusFilter }),
  };

  const { data, isLoading } = useListChangeControl(params, {
    query: { queryKey: getListChangeControlQueryKey(params) },
  });

  const createChangeControl = useCreateChangeControl();

  const setField = (key: keyof typeof defaultForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetDialog = () => {
    setIsOpen(false);
    setForm(defaultForm);
    setEquipment([]);
    setProducts([]);
  };

  const handleSubmit = (mode: SubmitMode = "submit") => {
    if (!form.title) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    if (mode === "submit" && (
      !form.changeType || !form.plannedImplementationDate ||
      !form.currentSituation || !form.proposedSituation || !form.location ||
      !form.hierarchicResponsible || !form.siteCoordinator || !form.justification
    )) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createChangeControl.mutate(
      {
        data: {
          title: form.title,
          changeType: form.changeType || "Other",
          plannedImplementationDate: form.plannedImplementationDate || new Date().toISOString().split("T")[0],
          currentSituation: form.currentSituation || "",
          proposedSituation: form.proposedSituation || "",
          location: form.location || "",
          hierarchicResponsible: form.hierarchicResponsible || "",
          siteCoordinator: form.siteCoordinator || "",
          justification: form.justification || "",
          justificationType: form.justificationType || undefined,
          externalReference: form.externalReference || undefined,
          equipment: equipment.length ? JSON.stringify(equipment) : undefined,
          products: products.length ? JSON.stringify(products) : undefined,
          status: mode === "draft" ? "Draft" : undefined,
        },
      },
      {
        onSuccess: (created) => {
          toast({ title: mode === "draft" ? "Change Control saved as draft" : "Change Control created successfully" });
          resetDialog();
          queryClient.invalidateQueries({ queryKey: getListChangeControlQueryKey(params) });
          if (mode === "submit" && created?.id) navigate(`/changecontrol/${created.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create Change Control", variant: "destructive" });
        },
      }
    );
  };

  return (
    <PageTransition className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Change Control
          </h1>
          <p className="text-muted-foreground mt-1">Manage and approve system/process changes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => {
            const p = new URLSearchParams();
            if (statusFilter !== "all") p.set("flag", statusFilter);
            if (debouncedSearch) p.set("search", debouncedSearch);
            window.location.href = `/api/changecontrol/export${p.toString() ? "?" + p.toString() : ""}`;
          }}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="shrink-0 gap-2" onClick={() => setIsOpen(true)} data-testid="button-new-change-control">
            <Plus className="h-4 w-4" />
            New Change Control
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {(["all", "todo", "mine", "plants", "Draft"] as const).map((v) => {
          const labels: Record<string, string> = { all: "All", todo: "ToDo", mine: "Mine", plants: "Plants", Draft: "Draft" };
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
            placeholder="Search by number, title, or coordinator..."
            className={search ? "pl-9 pr-9" : "pl-9"}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            data-testid="input-search-cc"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-52">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger data-testid="select-cc-status-filter">
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
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="HR Review">HR Review</SelectItem>
              <SelectItem value="SC Review">SC Review</SelectItem>
              <SelectItem value="Expert Review">Expert Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[160px] whitespace-nowrap">Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[140px] whitespace-nowrap">Type</TableHead>
              <TableHead className="w-[160px] whitespace-nowrap">Coordinator</TableHead>
              <TableHead className="w-[160px] whitespace-nowrap">Location</TableHead>
              <TableHead className="w-[130px] whitespace-nowrap">Planned Date</TableHead>
              <TableHead className="w-[120px] whitespace-nowrap">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full max-w-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No change controls found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((cc) => (
                <TableRow key={cc.id} className="hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`row-cc-${cc.id}`}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <Link href={`/changecontrol/${cc.id}`} className="text-primary hover:underline group-hover:text-primary/80">
                      {cc.changeControlNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-0">
                    <span className="block font-medium text-foreground truncate">{cc.title}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{cc.changeType}</TableCell>
                  <TableCell className="whitespace-nowrap">{cc.siteCoordinator}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{cc.location}</TableCell>
                  <TableCell className="whitespace-nowrap">{format(new Date(cc.plannedImplementationDate), "MMM d, yyyy")}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={cc.status} />
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
            <span className="font-medium text-foreground">{data.total}</span> change controls
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= data.total}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) resetDialog(); else setIsOpen(true); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Change Control</DialogTitle>
            <DialogDescription>Initiate a new change control request. It will be created in Draft status.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="cc-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="cc-title"
                placeholder="Brief title for this change"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                data-testid="input-cc-title"
              />
            </div>

            {/* Type of Change | Planned Implementation Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type of Change <span className="text-destructive">*</span></Label>
                <Select value={form.changeType} onValueChange={(v) => setField("changeType", v)}>
                  <SelectTrigger data-testid="select-cc-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {changeTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cc-date">Planned Implementation Date <span className="text-destructive">*</span></Label>
                <Input
                  id="cc-date"
                  type="date"
                  value={form.plannedImplementationDate}
                  onChange={(e) => setField("plannedImplementationDate", e.target.value)}
                  data-testid="input-cc-date"
                />
              </div>
            </div>

            {/* Current Situation */}
            <div className="space-y-1.5">
              <Label htmlFor="cc-current">Current Situation <span className="text-destructive">*</span></Label>
              <Textarea
                id="cc-current"
                placeholder="Describe the current state before the change..."
                rows={3}
                value={form.currentSituation}
                onChange={(e) => setField("currentSituation", e.target.value)}
                data-testid="input-cc-current"
              />
            </div>

            {/* Proposed Situation */}
            <div className="space-y-1.5">
              <Label htmlFor="cc-proposed">Proposed Situation <span className="text-destructive">*</span></Label>
              <Textarea
                id="cc-proposed"
                placeholder="Describe what will change and the expected outcome..."
                rows={3}
                value={form.proposedSituation}
                onChange={(e) => setField("proposedSituation", e.target.value)}
                data-testid="input-cc-proposed"
              />
            </div>

            {/* External Reference | Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cc-ref">External Reference</Label>
                <Input
                  id="cc-ref"
                  placeholder="e.g. QC-METH-CHANGE-2026-004"
                  value={form.externalReference}
                  onChange={(e) => setField("externalReference", e.target.value)}
                  data-testid="input-cc-ref"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location <span className="text-destructive">*</span></Label>
                <Select value={form.location} onValueChange={(v) => setField("location", v)}>
                  <SelectTrigger data-testid="select-cc-location"><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Equipment */}
            <div className="space-y-1.5">
              <Label>Equipment</Label>
              <EquipmentPicker value={equipment} onChange={setEquipment} />
              {equipment.length === 0 && (
                <p className="text-xs text-muted-foreground">No equipment selected</p>
              )}
            </div>

            {/* Products */}
            <div className="space-y-1.5">
              <Label>Products</Label>
              <ProductsEditor rows={products} onChange={setProducts} />
            </div>

            {/* Justification section */}
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold">Justification</p>
              <div className="space-y-1.5">
                <Label>Justification Type</Label>
                <Select value={form.justificationType} onValueChange={(v) => setField("justificationType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {justificationTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cc-justification">Justification Comment <span className="text-destructive">*</span></Label>
                <Textarea
                  id="cc-justification"
                  placeholder="Why is this change necessary or beneficial?"
                  rows={3}
                  value={form.justification}
                  onChange={(e) => setField("justification", e.target.value)}
                  data-testid="input-cc-justification"
                />
              </div>
            </div>

            {/* Information for Hierarchic Agreement */}
            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold">Information for Hierarchic Agreement</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Area Responsible <span className="text-destructive">*</span></Label>
                  <UserPicker value={form.hierarchicResponsible} onChange={(v) => setField("hierarchicResponsible", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Quality Expert <span className="text-destructive">*</span></Label>
                  <UserPicker value={form.siteCoordinator} onChange={(v) => setField("siteCoordinator", v)} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={resetDialog}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleSubmit("draft")} disabled={createChangeControl.isPending}>
              {createChangeControl.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save as Draft
            </Button>
            <Button onClick={() => handleSubmit("submit")} disabled={createChangeControl.isPending} data-testid="button-submit-cc">
              {createChangeControl.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Change Control
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
