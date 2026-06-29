import React, { useState } from "react";
import { Link } from "wouter";
import { useListRiskAssessments, useCreateRiskAssessment } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Search, ShieldCheck, Map, AlertTriangle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "In Review": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Closed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const CLASS_COLORS: Record<string, string> = {
  "Class I":   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Class II":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Class III": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Class IV":  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ASSESSMENT_TYPES = [
  "Process FMEA (pFMEA)",
  "Design FMEA (dFMEA)",
  "Equipment FMEA",
  "Software FMEA",
  "Supply Chain Risk",
  "Quality System Risk",
  "Other",
];

const STATUSES = ["Draft", "In Review", "Approved", "Closed"];
const CLASSES = ["Class I", "Class II", "Class III", "Class IV"];

interface NewAssessmentForm {
  title: string;
  assessmentType: string;
  scope: string;
  productProcess: string;
  regulatoryContext: string;
  riskAcceptanceCriteria: string;
  initiatedBy: string;
  raArea: string;
}

const EMPTY_FORM: NewAssessmentForm = {
  title: "",
  assessmentType: "Process FMEA (pFMEA)",
  scope: "",
  productProcess: "",
  regulatoryContext: "ICH Q9, SOPPQA016",
  riskAcceptanceCriteria: "RPN > 8 requires mitigation action",
  initiatedBy: "",
  raArea: "",
};

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RiskAssessmentList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewAssessmentForm>({ ...EMPTY_FORM, initiatedBy: user?.name ?? "" });

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useListRiskAssessments({
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    assessmentType: typeFilter !== "all" ? typeFilter : undefined,
  });

  const createMutation = useCreateRiskAssessment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/risk-assessments"] });
        setDialogOpen(false);
        setForm({ ...EMPTY_FORM, initiatedBy: user?.name ?? "" });
        toast({ title: "Risk assessment created", description: "Now add FMEA entries in the Worksheet tab." });
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create assessment";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  function handleCreate() {
    if (!form.title.trim() || !form.assessmentType || !form.initiatedBy.trim()) {
      toast({ title: "Required fields missing", description: "Title, type, and initiated by are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      data: {
        title: form.title.trim(),
        assessmentType: form.assessmentType,
        scope: form.scope || null,
        productProcess: form.productProcess || null,
        regulatoryContext: form.regulatoryContext || null,
        riskAcceptanceCriteria: form.riskAcceptanceCriteria || null,
        initiatedBy: form.initiatedBy.trim(),
        raArea: form.raArea || null,
        sopReference: "SOPPQA016",
      },
    });
  }

  const allAssessments = data?.data ?? [];
  const assessments = classFilter !== "all"
    ? allAssessments.filter(a => a.riskClass === classFilter)
    : allAssessments;
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Risk Assessments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">SOPPQA016 v05 · ICH Q9 · WHO TRS 981</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/risk/master-plan">
            <Button variant="outline" className="gap-2">
              <Map className="h-4 w-4" />
              Master Plan
            </Button>
          </Link>
          <Button onClick={() => { setForm({ ...EMPTY_FORM, initiatedBy: user?.name ?? "" }); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search assessments..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={v => { setClassFilter(v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ASSESSMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">No risk assessments found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="font-semibold">Assessment #</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Initiated By</TableHead>
                <TableHead className="font-semibold">Next Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map(ra => {
                const days = daysUntil(ra.nextReviewDate);
                const isOverdue = days !== null && days < 0 && ra.status === "Approved";
                const isDueSoon = days !== null && days >= 0 && days <= 60 && ra.status === "Approved";
                return (
                  <TableRow key={ra.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell>
                      <Link href={`/risk/${ra.id}`} className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {ra.assessmentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/risk/${ra.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400">
                        {ra.title}
                      </Link>
                      {(ra.riskVersion ?? 0) > 1 && (
                        <span className="ml-2 text-xs text-slate-400">v{ra.riskVersion}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{ra.assessmentType}</span>
                    </TableCell>
                    <TableCell>
                      {ra.riskClass ? (
                        <Badge className={`text-xs font-medium border-0 ${CLASS_COLORS[ra.riskClass] ?? "bg-slate-100 text-slate-600"}`}>
                          {ra.riskClass}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-xs">Not classified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs font-medium border-0 ${STATUS_COLORS[ra.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {ra.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">{ra.initiatedBy}</TableCell>
                    <TableCell className="text-sm">
                      {ra.nextReviewDate ? (
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                          <span className={isOverdue ? "text-red-600 font-medium" : isDueSoon ? "text-amber-600 font-medium" : "text-slate-600 dark:text-slate-400"}>
                            {ra.nextReviewDate}
                          </span>
                          {isOverdue && <Badge className="text-xs border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Overdue</Badge>}
                          {isDueSoon && !isOverdue && <Badge className="text-xs border-0 bg-amber-100 text-amber-700">Due soon</Badge>}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>Showing {assessments.length} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Risk Assessment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ra-title">Title <span className="text-red-500">*</span></Label>
              <Input id="ra-title" placeholder="e.g. Granulation Process Risk Assessment" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Assessment Type <span className="text-red-500">*</span></Label>
                <Select value={form.assessmentType} onValueChange={v => setForm(f => ({ ...f, assessmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ra-initiatedBy">Initiated By <span className="text-red-500">*</span></Label>
                <Input id="ra-initiatedBy" value={form.initiatedBy} onChange={e => setForm(f => ({ ...f, initiatedBy: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ra-scope">Scope</Label>
              <Textarea id="ra-scope" rows={2} placeholder="Describe the scope of this risk assessment" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ra-product">Product / Process</Label>
                <Input id="ra-product" placeholder="e.g. Tablet Granulation Line 3" value={form.productProcess} onChange={e => setForm(f => ({ ...f, productProcess: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ra-area">Area (SOP Attachment 3)</Label>
                <Input id="ra-area" placeholder="e.g. Manufacturing, Quality, Warehouse" value={form.raArea} onChange={e => setForm(f => ({ ...f, raArea: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ra-regulatory">Regulatory Context</Label>
                <Input id="ra-regulatory" value={form.regulatoryContext} onChange={e => setForm(f => ({ ...f, regulatoryContext: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ra-criteria">Risk Acceptance Criteria</Label>
                <Input id="ra-criteria" value={form.riskAcceptanceCriteria} onChange={e => setForm(f => ({ ...f, riskAcceptanceCriteria: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
