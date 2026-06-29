import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { PageTransition } from "@/components/page-transition";
import {
  useGetCapa,
  useUpdateCapa,
  getGetCapaQueryKey,
  useListEfficacyReviews,
  useCreateEfficacyReview,
  useUpdateEfficacyReview,
  useReassignCapaImplLeader,
  useGenerateChangeControlFromCapa,
  useListChangeControl,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth-context";
import { useSettingOptions } from "@/hooks/use-setting-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Download, Send, CheckCircle2, XCircle, CheckCircle, AlertTriangle, Paperclip, Upload, ChevronDown, FlaskConical, Clock, RotateCcw, CalendarClock, ThumbsUp, ThumbsDown, UserRoundPen, ShieldAlert, ExternalLink, Plus } from "lucide-react";
import { AuditTrailTab } from "@/components/audit-trail-tab";
import { ESignatureDialog } from "@/components/esignature-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { UserPicker } from "@/components/user-picker";

/* ─── Change Control Tab Component ─── */
const CC_STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "In Review": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Closed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

function ChangeControlTab({ capaId, capaNumber, canGenerate }: { capaId: number; capaNumber: string; canGenerate: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListChangeControl({ capaId });
  const generateMutation = useGenerateChangeControlFromCapa({
    mutation: {
      onSuccess: (newCc) => {
        queryClient.invalidateQueries({ queryKey: ["/api/changecontrol"] });
        toast({ title: "Change Control created", description: `${newCc.changeControlNumber} has been created and linked to this CAPA.` });
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to generate Change Control";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const ccs = data?.data ?? [];

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Linked Change Controls</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Change Controls generated from or linked to CAPA {capaNumber}</p>
        </div>
        {canGenerate && (
          <Button
            size="sm"
            className="gap-1.5"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate({ id: capaId })}
          >
            {generateMutation.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Plus className="h-3.5 w-3.5" />}
            Generate CC
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-12 rounded-lg bg-muted animate-pulse" />
          <div className="h-12 rounded-lg bg-muted animate-pulse" />
        </div>
      ) : ccs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <ShieldAlert className="h-9 w-9 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-muted-foreground">No Change Controls linked to this CAPA</p>
          {canGenerate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate({ id: capaId })}
            >
              {generateMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Plus className="h-3.5 w-3.5" />}
              Generate Change Control
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {ccs.map((cc) => (
            <div key={cc.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/changecontrol/${cc.id}`} className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">{cc.changeControlNumber}</Link>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CC_STATUS_COLORS[cc.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {cc.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-lg">{cc.title}</p>
                  <p className="text-xs text-muted-foreground">{cc.changeType} · {cc.location}</p>
                </div>
              </div>
              <Link href={`/changecontrol/${cc.id}`} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">
                Open <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CAPA_TYPES = ["Corrective Action", "Preventive Action", "Corrective and Preventive Action"];
const SPECIFIC_ATTRIBUTES = ["N/A", "GMP", "GLP", "GDP", "GCP", "Other"];
const CAPA_STATUSES = ["Open", "In Progress", "Accepted", "Closed"];
const LOCATIONS = ["Manufacturing", "QC Lab", "Warehouse", "R&D", "Quality Assurance", "Regulatory Affairs", "Engineering", "QMS-Demo", "Other"];

/* ─── Workflow status config ─── */
const WF_BADGE: Record<string, { label: string; className: string }> = {
  Draft:                    { label: "Draft",                        className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  Submitted:                { label: "Pending QA Review",            className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  QA_Rejected:              { label: "Rejected by QA",               className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  QA_Accepted:              { label: "QA Accepted — Implement",      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  Implementation_Submitted: { label: "Implementation Submitted",     className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  Implementation_Accepted:  { label: "Implementation Accepted",      className: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  Impl_Rejected:            { label: "Implementation Rejected",      className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  Closed:                   { label: "Closed",                       className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
};

function WfBadge({ status }: { status: string }) {
  const cfg = WF_BADGE[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function FieldDisplay({ label, value, multiline = false }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {multiline ? (
        <p className="text-sm whitespace-pre-wrap">{value || "—"}</p>
      ) : (
        <p className="text-sm">{value || "—"}</p>
      )}
    </div>
  );
}

export default function CapaDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser, loading: isUserLoading } = useAuth();
  const capaTypes = useSettingOptions("capa_types", CAPA_TYPES);
  const specificAttributes = useSettingOptions("specific_attributes", SPECIFIC_ATTRIBUTES);
  const locations = useSettingOptions("locations", LOCATIONS);

  const { data: capa, isLoading } = useGetCapa(Number(id), {
    query: { queryKey: getGetCapaQueryKey(Number(id)), enabled: !!id },
  });

  const update = useUpdateCapa();
  const createEr = useCreateEfficacyReview();
  const updateEr = useUpdateEfficacyReview();
  const { data: erData, refetch: refetchEr } = useListEfficacyReviews({ capaId: Number(id) });
  const erList = erData?.data ?? [];

  /* ── E-Signature gate ── */
  type EsigConfig = { title: string; description?: string; actionLabel?: string; withReason?: boolean; reasonLabel?: string; onConfirmed: (reason?: string) => void };
  const [esig, setEsig] = useState<EsigConfig | null>(null);

  /* ── Reassign Implementation Leader dialog ── */
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignLeader, setReassignLeader] = useState("");
  const { mutateAsync: doReassign, isPending: reassignPending } = useReassignCapaImplLeader();

  /* ── Update Planned Date dialog ── */
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDate, setExtendDate] = useState("");
  const [extendComment, setExtendComment] = useState("");

  /* ── Active tab — initialised from ?tab= URL param so deep-links work ── */
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get("tab") ?? "general");

  /* ── General tab ── */
  const [generalForm, setGeneralForm] = useState({
    title: "", description: "", capaType: "", specificAttribute: "",
    updatedPlannedDate: "", status: "", location: "", implementationLeader: "",
  });
  const [generalSaving, setGeneralSaving] = useState(false);
  const GSAVED_KEY = `capa-${id}-general-saved`;
  const [generalSaved, setGeneralSaved] = useState(() => sessionStorage.getItem(`capa-${id}-general-saved`) === "true");

  const markGeneralSaved = (v: boolean) => {
    if (v) sessionStorage.setItem(GSAVED_KEY, "true");
    else sessionStorage.removeItem(GSAVED_KEY);
    setGeneralSaved(v);
  };

  const updateGeneralForm = (updater: (f: typeof generalForm) => typeof generalForm) => {
    markGeneralSaved(false);
    setGeneralForm(updater);
  };

  /* ── Implementation tab ── */
  const [implForm, setImplForm] = useState({
    implementationSummary: "", implementationDate: "", implementationLeader: "",
  });

  /* ── Implementation tab ── */
  const implFileRef = useRef<HTMLInputElement>(null);
  const [implUploading, setImplUploading] = useState(false);
  const IMPL_SAVED_KEY = `capa-${id}-impl-saved`;
  const [implSaved, setImplSaved] = useState(() => sessionStorage.getItem(`capa-${id}-impl-saved`) === "true");

  const markImplSaved = (v: boolean) => {
    if (v) sessionStorage.setItem(IMPL_SAVED_KEY, "true");
    else sessionStorage.removeItem(IMPL_SAVED_KEY);
    setImplSaved(v);
  };

  const updateImplForm = (updater: (f: typeof implForm) => typeof implForm) => {
    markImplSaved(false);
    setImplForm(updater);
  };

  const handleImplAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImplUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("module", "CAPA");
      fd.append("recordId", String(id));
      const res = await fetch("/api/attachments/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) { toast({ title: "Upload failed", variant: "destructive" }); return; }
      toast({ title: "File attached" });
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setImplUploading(false);
      if (implFileRef.current) implFileRef.current.value = "";
    }
  };

  /* ── Completion tab ── */
  const [closeComment, setCloseComment] = useState("");

  /* ── Workflow loading ── */
  const [wfLoading, setWfLoading] = useState(false);

  /* ── ER add dialog ── */
  const [erOpen, setErOpen] = useState(false);
  const [erForm, setErForm] = useState({ reviewer: "", expectedDate: "", instruction: "", criteria: "", round: 1 });
  const [erSaving, setErSaving] = useState(false);

  const [erReviewDates, setErReviewDates] = useState<Record<number, string>>({});
  const [erReviewComments, setErReviewComments] = useState<Record<number, string>>({});
  const [erOutcomes, setErOutcomes] = useState<Record<number, string>>({});
  const [erSubmitting, setErSubmitting] = useState<number | null>(null);
  const [expandedErIds, setExpandedErIds] = useState<Set<number>>(new Set());

  // Auto-expand newly loaded ER cards — depend on count, not the array reference,
  // to avoid an infinite loop (React Query returns a new array object every render)
  useEffect(() => {
    setExpandedErIds((prev) => new Set([...prev, ...erList.map((er) => er.id)]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erList.length]);

  useEffect(() => {
    if (!capa) return;
    setGeneralForm({
      title: capa.title ?? "",
      description: capa.description ?? "",
      capaType: capa.capaType ?? "",
      specificAttribute: capa.specificAttribute ?? "",
      updatedPlannedDate: capa.updatedPlannedDate ?? "",
      status: capa.status ?? "",
      location: capa.location ?? "",
      implementationLeader: capa.implementationLeader ?? "",
    });
    setImplForm({
      implementationSummary: capa.implementationSummary ?? "",
      implementationDate: capa.implementationDate ?? "",
      implementationLeader: capa.implementationLeader ?? "",
    });
    setCloseComment(capa.closeComment ?? "");
  }, [capa]);

  useEffect(() => {
    if (!erList.length) return;
    setErReviewDates((prev) => {
      const next = { ...prev };
      for (const er of erList) { if (!(er.id in next)) next[er.id] = er.reviewDate ?? ""; }
      return next;
    });
    setErReviewComments((prev) => {
      const next = { ...prev };
      for (const er of erList) { if (!(er.id in next)) next[er.id] = er.review ?? ""; }
      return next;
    });
  }, [erList]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetCapaQueryKey(Number(id)) });

  /* ── Computed role/state values ── */
  const wfStatus: string = (capa as unknown as Record<string, unknown>)?.workflowStatus as string
    ?? (capa?.status === "Closed" ? "Closed" : capa?.status === "Draft" ? "Draft" : capa ? "Submitted" : "Draft");
  const qaRejectReason = (capa as unknown as Record<string, unknown>)?.qaRejectReason as string | null | undefined;
  const implRejectReason = (capa as unknown as Record<string, unknown>)?.implRejectReason as string | null | undefined;
  const userName = currentUser?.name ?? "";
  const userRoles: string[] = currentUser?.roles ?? [];
  const isQA = userRoles.includes("QA");
  const isAdmin = userRoles.includes("Admin");
  const isImplLeader = !!userName && capa?.implementationLeader === userName;
  const isReadOnly = wfStatus === "Closed";
  // General tab editable only while CAPA is in Draft or QA_Rejected (and user is QA or Admin).
  // Once submitted/accepted it is locked for ALL users — Admin included.
  const isGeneralReadOnly = isReadOnly || (!isQA && !isAdmin) || !["Draft", "QA_Rejected"].includes(wfStatus);
  // Impl fields editable only when QA_Accepted or Impl_Rejected, and only for impl leader / admin
  const isImplReadOnly = isReadOnly || !["QA_Accepted", "Impl_Rejected"].includes(wfStatus) || (!isImplLeader && !isAdmin);

  /* ── Workflow API helper ── */
  const callWf = async (action: string, body: Record<string, unknown> = {}): Promise<void> => {
    const res = await fetch(`/api/capa/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(data.error ?? "Request failed");
    }
  };

  const runWf = (action: string, body: Record<string, unknown>, successMsg: string) => async (reason?: string) => {
    setWfLoading(true);
    try {
      await callWf(action, reason !== undefined ? { ...body, reason } : body);
      toast({ title: successMsg });
      invalidate();
    } catch (e) {
      toast({ title: (e as Error).message, variant: "destructive" });
    } finally {
      setWfLoading(false);
    }
  };

  const handleRequestExtension = async () => {
    if (!extendDate) { toast({ title: "Please select a new planned date", variant: "destructive" }); return; }
    if (!extendComment.trim()) { toast({ title: "Please provide a reason for the extension", variant: "destructive" }); return; }
    setExtendOpen(false);
    setEsig({
      title: "Request Date Extension",
      description: "Your e-signature confirms this request. A QA user must approve the extension before the planned date is updated.",
      actionLabel: "Submit Request",
      onConfirmed: async () => {
        try {
          const res = await fetch(`/api/capa/${id}/request-extension`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ date: extendDate, reason: extendComment }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({})) as { error?: string };
            toast({ title: data.error ?? "Failed to submit extension request", variant: "destructive" });
            return;
          }
          toast({ title: "Extension request submitted — awaiting QA approval" });
          invalidate();
          setExtendDate("");
          setExtendComment("");
        } catch {
          toast({ title: "Network error", variant: "destructive" });
        }
      },
    });
  };

  const handleGeneralSave = () => {
    setEsig({
      title: "Submit CAPA",
      description: "Your e-signature is required to save changes to this CAPA.",
      actionLabel: "Submit",
      onConfirmed: () => {
        setGeneralSaving(true);
        update.mutate({ id: Number(id), data: generalForm }, {
          onSuccess: () => { toast({ title: "CAPA updated" }); invalidate(); setGeneralSaving(false); markGeneralSaved(true); setActiveTab("implementation"); },
          onError: () => { toast({ title: "Failed to save", variant: "destructive" }); setGeneralSaving(false); },
        });
      },
    });
  };

  const handleImplSave = () => {
    setEsig({
      title: "Submit Implementation",
      description: "Your e-signature confirms the implementation details recorded here.",
      actionLabel: "Submit",
      onConfirmed: () => {
        update.mutate({ id: Number(id), data: implForm }, {
          onSuccess: () => { toast({ title: "Implementation saved" }); invalidate(); markImplSaved(true); },
          onError: () => toast({ title: "Failed to save", variant: "destructive" }),
        });
      },
    });
  };

  const handleCreateEr = () => {
    if (!erForm.reviewer || !erForm.expectedDate) { toast({ title: "Reviewer and date required", variant: "destructive" }); return; }
    if (!erForm.criteria.trim()) { toast({ title: "Effectiveness criteria required", variant: "destructive" }); return; }
    setErOpen(false);
    setEsig({
      title: "Add Efficacy Review",
      description: "Your e-signature is required to schedule an efficacy review.",
      actionLabel: "Confirm",
      onConfirmed: () => {
        setErSaving(true);
        createEr.mutate({ data: { capaId: Number(id), reviewer: erForm.reviewer, expectedDate: erForm.expectedDate, instruction: erForm.instruction || null, criteria: erForm.criteria, round: erForm.round } }, {
          onSuccess: () => { toast({ title: "Efficacy review added" }); refetchEr(); setErForm({ reviewer: "", expectedDate: "", instruction: "", criteria: "", round: 1 }); setErSaving(false); },
          onError: () => { toast({ title: "Failed to add", variant: "destructive" }); setErSaving(false); },
        });
      },
    });
  };

  const handleSubmitEr = (er: { id: number; status: string }) => {
    const reviewDate = erReviewDates[er.id] ?? "";
    const reviewComment = erReviewComments[er.id] ?? "";
    const outcome = erOutcomes[er.id] ?? "";
    if (!reviewComment.trim()) { toast({ title: "Please enter a review comment", variant: "destructive" }); return; }
    if (!outcome) { toast({ title: "Please select an outcome", variant: "destructive" }); return; }
    setEsig({
      title: "Submit Efficacy Review",
      description: `Your e-signature confirms the efficacy review submission with outcome: ${outcome}.`,
      actionLabel: "Submit",
      onConfirmed: () => {
        setErSubmitting(er.id);
        updateEr.mutate({ id: er.id, data: { status: "Completed", reviewDate: reviewDate || new Date().toISOString().split("T")[0], review: reviewComment, outcome } }, {
          onSuccess: () => { toast({ title: "Efficacy review submitted" }); refetchEr(); setErSubmitting(null); },
          onError: () => { toast({ title: "Failed to submit", variant: "destructive" }); setErSubmitting(null); },
        });
      },
    });
  };

  const handleScheduleFollowUpEr = (er: { id: number; round: number }) => {
    const nextRound = er.round + 1;
    setErForm({ reviewer: "", expectedDate: "", instruction: "", criteria: "", round: nextRound });
    setErOpen(true);
  };

  if (isLoading) {
    return (
      <PageTransition className="p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-[600px] w-full" />
      </PageTransition>
    );
  }

  if (!capa) return <div className="p-6 text-sm text-muted-foreground">CAPA not found</div>;

  return (
    <PageTransition className="pb-16">
      <div className="border-b bg-background px-6 pt-4 pb-0">

        {/* ── Header row ── */}
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>CAPA Number:</span>
              <span className="font-medium text-foreground">{capa.capaNumber}</span>
              {capa.deviationId && (
                <>
                  <span>·</span>
                  <span>Linked to:</span>
                  <Link href={`/deviations/${capa.deviationId}`} className="font-medium text-primary hover:underline">
                    {(capa as unknown as Record<string, unknown>).deviationNumber as string ?? `DEV-${capa.deviationId}`}
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <WfBadge status={wfStatus} />
              {capa.isOverdue && wfStatus !== "Closed" && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertTriangle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
          </div>

          {/* ── Workflow action buttons ── */}
          <div className="flex gap-2 flex-wrap justify-end">
            {isUserLoading && (
              <div className="h-8 w-28 bg-muted animate-pulse rounded-md" />
            )}
            {/* Submit: QA only when Draft or QA_Rejected */}
            {!isUserLoading && (wfStatus === "Draft" || wfStatus === "QA_Rejected") && isQA && (
              <Button
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-600 text-white border-0"
                disabled={wfLoading}
                onClick={() => setEsig({
                  title: "Submit CAPA",
                  description: "Submitting confirms the CAPA details are complete. The implementation leader can then begin their work.",
                  actionLabel: "Submit",
                  onConfirmed: runWf("submit", {}, "CAPA submitted"),
                })}
              >
                {wfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                Submit CAPA
              </Button>
            )}


            {/* Submit Implementation: Impl Leader only, at QA_Accepted or Impl_Rejected */}
            {!isUserLoading && ["QA_Accepted", "Impl_Rejected"].includes(wfStatus) && (isImplLeader || isAdmin) && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                disabled={wfLoading}
                onClick={() => {
                  if (!implForm.implementationSummary?.trim()) {
                    toast({ title: "Implementation summary required", description: "Please fill in the Implementation Summary on the Implementation tab before submitting.", variant: "destructive" });
                    setActiveTab("implementation");
                    return;
                  }
                  if (!implForm.implementationDate) {
                    toast({ title: "Implementation date required", description: "Please enter the Implementation Date on the Implementation tab before submitting.", variant: "destructive" });
                    setActiveTab("implementation");
                    return;
                  }
                  setEsig({
                    title: "Submit Implementation for Verification",
                    description: "Your e-signature confirms that implementation activities are complete and ready for QA verification.",
                    actionLabel: "Submit Implementation",
                    onConfirmed: runWf("submit-impl", {}, "Implementation submitted for QA verification"),
                  });
                }}
              >
                {wfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                Submit Implementation
              </Button>
            )}

            {/* Accept Implementation: QA only when Implementation_Submitted */}
            {!isUserLoading && wfStatus === "Implementation_Submitted" && isQA && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                disabled={wfLoading}
                onClick={() => setEsig({
                  title: "Accept Implementation",
                  description: "Your e-signature confirms the implementation is satisfactory and complete.",
                  actionLabel: "Accept",
                  onConfirmed: runWf("accept-impl", {}, "Implementation accepted by QA"),
                })}
              >
                {wfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                Accept Implementation
              </Button>
            )}

            {/* Reject Implementation: QA only when Implementation_Submitted */}
            {!isUserLoading && wfStatus === "Implementation_Submitted" && isQA && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={wfLoading}
                onClick={() => setEsig({
                  title: "Reject Implementation",
                  description: "Provide a reason for rejecting this implementation. The implementation leader will be required to address the issue and re-submit.",
                  actionLabel: "Reject Implementation",
                  withReason: true,
                  reasonLabel: "Rejection reason",
                  onConfirmed: (reason) => runWf("reject-impl", {}, "Implementation rejected — returned to implementation leader")(reason),
                })}
              >
                {wfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                Reject Implementation
              </Button>
            )}

            {/* Close CAPA: QA only after implementation has been accepted */}
            {!isUserLoading && wfStatus === "Implementation_Accepted" && isQA && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white border-0"
                disabled={wfLoading}
                onClick={() => setEsig({
                  title: "Close CAPA",
                  description: "Closing this CAPA is final and cannot be undone. Your e-signature is required.",
                  actionLabel: "Close CAPA",
                  onConfirmed: runWf("close", closeComment ? { comment: closeComment } : {}, "CAPA closed"),
                })}
              >
                {wfLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                Close CAPA
              </Button>
            )}

            {/* Reassign Implementation Leader: QA or Admin — not when Closed */}
            {!isUserLoading && wfStatus !== "Closed" && (isQA || isAdmin) && (
              <Button size="sm" variant="outline" onClick={() => { setReassignLeader(capa?.implementationLeader ?? ""); setReassignOpen(true); }}>
                <UserRoundPen className="h-3.5 w-3.5 mr-1.5" />
                Reassign Leader
              </Button>
            )}

            {/* Request Extension: Impl Leader, QA, or Admin — not when Closed */}
            {!isUserLoading && wfStatus !== "Closed" && (isImplLeader || isQA || isAdmin) && (
              <Button size="sm" variant="outline" onClick={() => setExtendOpen(true)}>
                <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                Request Extension
              </Button>
            )}
          </div>
        </div>

        {/* ── Rejection reason banner ── */}
        {wfStatus === "QA_Rejected" && qaRejectReason && (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-0.5">Rejected by QA</p>
              <p className="text-sm text-foreground">{qaRejectReason}</p>
            </div>
          </div>
        )}

        {/* ── Extension pending banner ── */}
        {(() => {
          const extReqDate = (capa as unknown as Record<string, unknown>).extensionRequestedDate as string | null;
          const extReqReason = (capa as unknown as Record<string, unknown>).extensionRequestedReason as string | null;
          const extReqBy = (capa as unknown as Record<string, unknown>).extensionRequestedBy as string | null;
          if (!extReqDate) return null;
          return (
            <div className="mb-3 flex items-start gap-3 rounded-md border border-amber-400/50 bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3">
              <CalendarClock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-0.5">Extension Requested — Pending QA Approval</p>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{extReqBy}</span> requested a new planned date of{" "}
                  <span className="font-medium">{extReqDate}</span>.
                </p>
                {extReqReason && <p className="text-sm text-muted-foreground mt-0.5">Reason: {extReqReason}</p>}
                {!isUserLoading && isQA && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-7 text-xs"
                      disabled={wfLoading}
                      onClick={() => setEsig({
                        title: "Approve Date Extension",
                        description: `This will update the planned date to ${extReqDate}. Your e-signature is required.`,
                        actionLabel: "Approve Extension",
                        onConfirmed: runWf("approve-extension", {}, "Extension approved — planned date updated"),
                      })}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10 h-7 text-xs"
                      disabled={wfLoading}
                      onClick={() => setEsig({
                        title: "Reject Extension Request",
                        description: "The extension request will be discarded. Your e-signature is required.",
                        actionLabel: "Reject",
                        onConfirmed: runWf("reject-extension", {}, "Extension request rejected"),
                      })}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b-0 rounded-none h-10 bg-transparent p-0 gap-0 -mb-px">
            {[
              { value: "general", label: "General" },
              { value: "implementation", label: "Implementation" },
              { value: "er", label: "ER" },
              { value: "completion", label: "Completion" },
              { value: "changecontrol", label: "Change Control" },
              { value: "attachment", label: "Attachment" },
              { value: "logs", label: "Logs" },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 data-[state=active]:bg-transparent px-5 h-10 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ─── GENERAL TAB ─── */}
          <TabsContent value="general" className="mt-0 px-0">
            <div className="p-6 space-y-5 max-w-4xl">
              <h2 className="text-base font-semibold">General</h2>

              <FieldDisplay label="CAPA Number" value={capa.capaNumber} />

              {isGeneralReadOnly ? (
                <FieldDisplay label="Title" value={generalForm.title} />
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input value={generalForm.title} onChange={(e) => updateGeneralForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
              )}

              {isGeneralReadOnly ? (
                <FieldDisplay label="Description" value={generalForm.description} multiline />
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea rows={4} value={generalForm.description} onChange={(e) => updateGeneralForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                {isGeneralReadOnly ? (
                  <FieldDisplay label="Type" value={generalForm.capaType} />
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <Select value={generalForm.capaType} onValueChange={(v) => updateGeneralForm((f) => ({ ...f, capaType: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>{capaTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                {isGeneralReadOnly ? (
                  <FieldDisplay label="Specific Attribute" value={generalForm.specificAttribute || "N/A"} />
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Specific Attribute</Label>
                    <Select value={generalForm.specificAttribute || "N/A"} onValueChange={(v) => updateGeneralForm((f) => ({ ...f, specificAttribute: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select attribute" /></SelectTrigger>
                      <SelectContent>{specificAttributes.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Initial Planned Date</p>
                  <p className="text-sm">{capa.initialPlannedDate}</p>
                </div>
                {isGeneralReadOnly ? (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Updated Planned Date</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">{generalForm.updatedPlannedDate || "—"}</p>
                      {capa.isOverdue && wfStatus !== "Closed" && (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Updated Planned Date</Label>
                    <div className="flex items-center gap-2">
                      <Input type="date" value={generalForm.updatedPlannedDate} onChange={(e) => updateGeneralForm((f) => ({ ...f, updatedPlannedDate: e.target.value }))} className={`h-9 ${capa.isOverdue && wfStatus !== "Closed" ? "border-destructive text-destructive focus-visible:ring-destructive" : ""}`} />
                      {capa.isOverdue && wfStatus !== "Closed" && (
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isGeneralReadOnly ? (
                <FieldDisplay label="Location" value={generalForm.location} />
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Select value={generalForm.location} onValueChange={(v) => updateGeneralForm((f) => ({ ...f, location: v }))}>
                    <SelectTrigger className="h-9 max-w-xs"><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>{locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <FieldDisplay label="Implementation Leader" value={generalForm.implementationLeader} />

            </div>
          </TabsContent>

          {/* ─── IMPLEMENTATION TAB ─── */}
          <TabsContent value="implementation" className="mt-0 px-0">
            <div className="p-6 space-y-5 max-w-4xl">
              <h2 className="text-base font-semibold">Implementation</h2>

              {/* Rejection reason banner - shown to impl leader when QA has rejected */}
              {wfStatus === "Impl_Rejected" && implRejectReason && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Implementation rejected by QA</p>
                    <p className="text-sm text-red-600 dark:text-red-300">{implRejectReason}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 pt-1">Please address the issue above, update the details below, and re-submit.</p>
                  </div>
                </div>
              )}

              {isImplReadOnly ? (
                <FieldDisplay label="Implementation Summary" value={implForm.implementationSummary || "—"} multiline />
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Implementation Summary</Label>
                  <Textarea rows={4} placeholder="Describe the implementation status or outcome..." value={implForm.implementationSummary} onChange={(e) => updateImplForm((f) => ({ ...f, implementationSummary: e.target.value }))} />
                </div>
              )}

              {!isImplReadOnly && (
                <div className="pt-1">
                  <input ref={implFileRef} type="file" className="hidden" onChange={handleImplAttach} />
                  <Button size="sm" variant="outline" onClick={() => implFileRef.current?.click()} disabled={implUploading}>
                    {implUploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5 mr-1.5" />}
                    {implUploading ? "Uploading…" : "Attach File"}
                  </Button>
                </div>
              )}

              {isImplReadOnly ? (
                <FieldDisplay label="Implementation Date" value={implForm.implementationDate || "—"} />
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Implementation Date</Label>
                  <Input type="date" className="h-9 max-w-xs" value={implForm.implementationDate} onChange={(e) => updateImplForm((f) => ({ ...f, implementationDate: e.target.value }))} />
                </div>
              )}

              {isImplReadOnly ? (
                <FieldDisplay label="Implementation Leader" value={implForm.implementationLeader || "—"} />
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Implementation Leader</Label>
                  <UserPicker value={implForm.implementationLeader} onChange={(v) => updateImplForm((f) => ({ ...f, implementationLeader: v }))} disabled={!isQA} />
                </div>
              )}

              {/* Button visible to Implementation Leader and Admin when CAPA not Closed */}
              {!isUserLoading && !isReadOnly && (isImplLeader || isAdmin) && (
                <div className="pt-2">
                  {implSaved && !isAdmin ? (
                    <Button size="sm" disabled className="bg-green-600 hover:bg-green-600 text-white opacity-100 cursor-default">
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Implementation Submitted
                    </Button>
                  ) : !isImplReadOnly ? (
                    <Button size="sm" onClick={handleImplSave}>
                      Submit
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── ER TAB ─── */}
          <TabsContent value="er" className="mt-0 px-0">
            <div className="p-6 space-y-6 max-w-4xl">
              {!isReadOnly && isQA && (
                <Button size="sm" className="bg-gray-700 hover:bg-gray-800 text-white border-0" onClick={() => { setErForm({ reviewer: "", expectedDate: "", instruction: "", criteria: "", round: 1 }); setErOpen(true); }}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Add ER
                </Button>
              )}

              {erList.length === 0 && <p className="text-sm text-muted-foreground">No efficacy reviews yet.</p>}

              <div className="space-y-4">
                {erList.map((er, idx) => {
                  const isExpanded = expandedErIds.has(er.id);
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOverdue = er.status !== "Completed" && er.expectedDate < todayStr;
                  const hasFollowUp = erList.some((other) => other.round === er.round + 1);
                  const canSubmit = er.status !== "Completed" && (isAdmin || er.reviewer === userName);
                  const outcomeColor: Record<string, string> = {
                    "Effective": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                    "Not Effective": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                    "Inconclusive": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                  };
                  return (
                    <div key={er.id} className={`border rounded-lg overflow-hidden ${isOverdue ? "border-orange-400" : ""}`}>
                      {/* Overdue alert banner */}
                      {isOverdue && (
                        <div className="flex items-center gap-2 px-5 py-2 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-900">
                          <Clock className="h-4 w-4 text-orange-600 shrink-0" />
                          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Overdue — expected by {er.expectedDate}</span>
                        </div>
                      )}

                      {/* Card header — click to expand/collapse */}
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedErIds((prev) => { const next = new Set(prev); if (next.has(er.id)) next.delete(er.id); else next.add(er.id); return next; })}
                      >
                        <div className="flex items-center gap-2">
                          <FlaskConical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-bold">
                            Efficacy Review {idx + 1}{er.round > 1 ? ` — Round ${er.round}` : ""}
                          </span>
                          {er.outcome && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${outcomeColor[er.outcome] ?? "bg-muted text-muted-foreground"}`}>
                              {er.outcome}
                            </span>
                          )}
                          {er.status === "Completed" && !er.outcome && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Completed</span>
                          )}
                          {er.status !== "Completed" && !isOverdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Pending</span>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`} />
                      </button>

                      {isExpanded && (
                        <div className="border-t px-5 pb-6 space-y-5 pt-4">
                          {/* Effectiveness Criteria (always shown) */}
                          <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 px-4 py-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">Effectiveness Criteria</p>
                            <p className="text-sm">{er.criteria || <span className="italic text-muted-foreground">Not specified</span>}</p>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Instructions</Label>
                            <Textarea rows={4} value={er.instruction ?? ""} readOnly className="resize-y" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Reviewer</Label>
                            <UserPicker value={er.reviewer ?? ""} onChange={() => {}} disabled />
                          </div>

                          <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Expected Date</Label>
                              <Input type="date" className="h-9" value={er.expectedDate ?? ""} disabled />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Review Date</Label>
                              <Input type="date" className="h-9" value={erReviewDates[er.id] ?? ""} onChange={(e) => setErReviewDates((prev) => ({ ...prev, [er.id]: e.target.value }))} disabled={er.status === "Completed" || !canSubmit} />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Review Comment</Label>
                            <Textarea rows={3} placeholder="Enter your review comment..." value={erReviewComments[er.id] ?? (er.status !== "Completed" ? "" : (er.review ?? ""))} onChange={(e) => setErReviewComments((prev) => ({ ...prev, [er.id]: e.target.value }))} disabled={er.status === "Completed" || !canSubmit} />
                          </div>

                          {/* Outcome selector — only shown for pending ERs that can be submitted */}
                          {canSubmit && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Outcome <span className="text-destructive">*</span></Label>
                              <Select value={erOutcomes[er.id] ?? ""} onValueChange={(v) => setErOutcomes((prev) => ({ ...prev, [er.id]: v }))}>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select outcome…" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Effective">✅ Effective — action worked as intended</SelectItem>
                                  <SelectItem value="Not Effective">❌ Not Effective — action failed to resolve the issue</SelectItem>
                                  <SelectItem value="Inconclusive">⚠️ Inconclusive — insufficient data, follow-up required</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Completed outcome display (read-only) */}
                          {er.status === "Completed" && er.outcome && (
                            <div className={`rounded-md px-4 py-3 ${er.outcome === "Effective" ? "bg-green-50 border border-green-200 dark:bg-green-950/20" : er.outcome === "Not Effective" ? "bg-red-50 border border-red-200 dark:bg-red-950/20" : "bg-amber-50 border border-amber-200 dark:bg-amber-950/20"}`}>
                              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5 text-muted-foreground">Outcome</p>
                              <p className="text-sm font-semibold">{er.outcome}</p>
                            </div>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {canSubmit && (
                              <Button size="sm" className="bg-gray-700 hover:bg-gray-800 text-white border-0" onClick={() => handleSubmitEr(er)} disabled={erSubmitting === er.id}>
                                {erSubmitting === er.id && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Submit Review
                              </Button>
                            )}

                            {/* Follow-up ER prompt — shown when outcome indicates failure/inconclusive and no follow-up exists */}
                            {er.status === "Completed" && (er.outcome === "Not Effective" || er.outcome === "Inconclusive") && !hasFollowUp && !isReadOnly && isQA && (
                              <div className="w-full rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Follow-up required</p>
                                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                    {er.outcome === "Not Effective"
                                      ? "This action was not effective. A new CAPA or re-investigation should be scheduled."
                                      : "The review was inconclusive. Schedule a follow-up efficacy review with updated criteria."}
                                  </p>
                                </div>
                                <Button size="sm" variant="outline" className="shrink-0 border-amber-400 text-amber-800 hover:bg-amber-100" onClick={() => handleScheduleFollowUpEr(er)}>
                                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                  Schedule Round {er.round + 1}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <Button size="sm" className="bg-gray-700 hover:bg-gray-800 text-white border-0" onClick={() => toast({ title: "Generating report…", description: "Download will start shortly." })}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download Report
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ─── COMPLETION TAB ─── */}
          <TabsContent value="completion" className="mt-0 px-0">
            <div className="p-6 space-y-5 max-w-4xl">
              <h2 className="text-base font-semibold">CAPA Closure</h2>
              <p className="text-sm text-muted-foreground">
                {wfStatus === "Implementation_Accepted"
                  ? "Implementation has been accepted. Enter a closure comment and click Close CAPA to finalise."
                  : wfStatus === "Closed"
                  ? "This CAPA has been closed."
                  : "This tab is used by QA to close the CAPA once the implementation has been accepted."}
              </p>

              {wfStatus !== "Closed" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Closure Comment</Label>
                  <Textarea rows={5} placeholder="Provide a comment for closing this CAPA..." value={closeComment} onChange={(e) => setCloseComment(e.target.value)} disabled={isReadOnly} />
                </div>
              )}

              {capa.closeComment && wfStatus === "Closed" && (
                <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 px-4 py-3">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Closure Comment</p>
                  <p className="text-sm">{capa.closeComment}</p>
                </div>
              )}

              {wfStatus === "Implementation_Accepted" && isQA && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={wfLoading}
                    onClick={() => {
                      if (!closeComment.trim()) {
                        toast({ title: "Please enter a closure comment before closing.", variant: "destructive" });
                        return;
                      }
                      setEsig({
                        title: "Close CAPA",
                        description: "Your e-signature is required to permanently close this CAPA.",
                        actionLabel: "Close CAPA",
                        onConfirmed: runWf("close", { comment: closeComment }, "CAPA closed"),
                      });
                    }}
                  >
                    {wfLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                    Close CAPA
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── CHANGE CONTROL TAB ─── */}
          <TabsContent value="changecontrol" className="mt-0 px-0">
            <ChangeControlTab capaId={Number(id)} capaNumber={capa.capaNumber} canGenerate={isQA || isAdmin} />
          </TabsContent>

          {/* ─── ATTACHMENT TAB ─── */}
          <TabsContent value="attachment" className="mt-0 px-0">
            <div className="p-6">
              <AttachmentsPanel module="CAPA" recordId={Number(id)} readOnly={isReadOnly} />
            </div>
          </TabsContent>

          {/* ─── LOGS TAB ─── */}
          <TabsContent value="logs" className="mt-0 px-0">
            <div className="p-6">
              <AuditTrailTab module="CAPA" recordId={Number(id)} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ════ E-SIGNATURE DIALOG ════ */}
      <ESignatureDialog
        open={!!esig}
        onOpenChange={(o) => { if (!o) setEsig(null); }}
        title={esig?.title ?? ""}
        description={esig?.description}
        actionLabel={esig?.actionLabel}
        withReason={esig?.withReason}
        reasonLabel={esig?.reasonLabel}
        onConfirmed={esig?.onConfirmed ?? (() => {})}
      />

      {/* Request Extension Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Date Extension</DialogTitle>
            <DialogDescription>Submit an extension request. A QA user must approve it before the planned date is updated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>New Planned Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={extendDate} onChange={(e) => setExtendDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason for Extension <span className="text-destructive">*</span></Label>
              <Textarea rows={3} value={extendComment} onChange={(e) => setExtendComment(e.target.value)} placeholder="Explain why additional time is needed..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestExtension}>
              <CalendarClock className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add ER Dialog */}
      <Dialog open={erOpen} onOpenChange={setErOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {erForm.round > 1 ? `Add Efficacy Review — Round ${erForm.round}` : "Add Efficacy Review"}
            </DialogTitle>
            <DialogDescription>
              {erForm.round > 1
                ? "Schedule a follow-up efficacy review based on the previous inconclusive or not-effective result."
                : "Schedule a post-implementation efficacy review."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Reviewer <span className="text-destructive">*</span></Label>
              <UserPicker value={erForm.reviewer} onChange={(v) => setErForm((f) => ({ ...f, reviewer: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Expected Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={erForm.expectedDate} onChange={(e) => setErForm((f) => ({ ...f, expectedDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Effectiveness Criteria <span className="text-destructive">*</span></Label>
              <Textarea rows={3} value={erForm.criteria} onChange={(e) => setErForm((f) => ({ ...f, criteria: e.target.value }))} placeholder="Define what success looks like, e.g. 'Zero recurrences in 90 days'…" />
            </div>
            <div className="space-y-1.5">
              <Label>Instructions for Reviewer</Label>
              <Textarea rows={3} value={erForm.instruction} onChange={(e) => setErForm((f) => ({ ...f, instruction: e.target.value }))} placeholder="Optional guidance for the reviewer…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEr} disabled={erSaving}>
              {erSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reassign Implementation Leader Dialog ── */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Implementation Leader</DialogTitle>
            <DialogDescription>
              Select a new implementation leader. The CAPA will remain in its current state and the new leader will be responsible for implementation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Current Leader</Label>
              <p className="text-sm font-medium">{capa?.implementationLeader || "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Label>New Implementation Leader <span className="text-destructive">*</span></Label>
              <UserPicker value={reassignLeader} onChange={setReassignLeader} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)} disabled={reassignPending}>Cancel</Button>
            <Button
              disabled={reassignPending || !reassignLeader.trim() || reassignLeader === capa?.implementationLeader}
              onClick={async () => {
                if (!id || !reassignLeader.trim()) return;
                try {
                  await doReassign({ id: Number(id), data: { newLeader: reassignLeader.trim() } });
                  await queryClient.invalidateQueries({ queryKey: getGetCapaQueryKey(Number(id)) });
                  toast({ title: "Implementation leader reassigned", description: `Now assigned to ${reassignLeader.trim()}.` });
                  setReassignOpen(false);
                } catch {
                  toast({ title: "Failed to reassign", description: "Please try again.", variant: "destructive" });
                }
              }}
            >
              {reassignPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
