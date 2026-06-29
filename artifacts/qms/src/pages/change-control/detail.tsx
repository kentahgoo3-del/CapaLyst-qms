import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { PageTransition } from "@/components/page-transition";
import {
  useGetChangeControl,
  useUpdateChangeControl,
  getGetChangeControlQueryKey,
  useCloseChangeControl,
  useListChangeControlExpertReviews,
  getListChangeControlExpertReviewsQueryKey,
  useCreateChangeControlExpertReviews,
  useAcceptChangeControlExpertReviews,
  useRejectChangeControlExpertReviews,
  useSubmitChangeControlExpertReview,
  useReassignChangeControlExpertReview,
  useListChangeControlWorkPlans,
  getListChangeControlWorkPlansQueryKey,
  useCreateChangeControlWorkPlans,
  useDeleteChangeControlWorkPlan,
  useSubmitChangeControlWorkPlan,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Download, Plus, Trash2, ChevronDown, ChevronUp, Send, Check, CheckCircle2, Ban, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, GitBranch } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { AuditTrailTab } from "@/components/audit-trail-tab";
import { ESignatureDialog } from "@/components/esignature-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { UserPicker } from "@/components/user-picker";
import { EquipmentPicker, ProductsEditor, type ProductRow, parseJSON } from "@/components/deviation-fields";
import { useSettingOptions } from "@/hooks/use-setting-options";

const CHANGE_TYPES = ["Process", "Analytical", "Equipment", "Regulatory", "Documentation", "Facility", "IT System", "Other"];
const JUSTIFICATION_TYPES = ["Quality", "Regulatory", "Safety", "Business", "Technical", "Other"];
const LOCATIONS = ["Manufacturing", "QC Lab", "Warehouse", "R&D", "Quality Assurance", "Regulatory Affairs", "Engineering", "QMS-Demo", "Other"];
const DEPARTMENTS = ["Production", "Validation", "Quality", "Regulatory", "Engineering", "Procurement", "IT", "R&D", "Logistics", "Other"];
const RISK_CLASSES = ["Minor", "Major", "Critical"] as const;
const PIR_OUTCOMES = ["Effective", "Not Effective", "Partially Effective"] as const;

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

function RiskBadge({ risk }: { risk?: string | null }) {
  if (!risk) return null;
  const cfg = {
    Minor: { icon: ShieldCheck, cls: "text-green-700 bg-green-50 border-green-200" },
    Major: { icon: ShieldAlert, cls: "text-amber-700 bg-amber-50 border-amber-200" },
    Critical: { icon: ShieldX, cls: "text-red-700 bg-red-50 border-red-200" },
  }[risk] ?? { icon: ShieldCheck, cls: "text-muted-foreground bg-muted border-border" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded-full px-2.5 py-0.5 ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {risk} Risk
    </span>
  );
}

export default function ChangeControlDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, loading: isUserLoading } = useAuth();
  const userName = user?.name ?? "";
  const changeTypes = useSettingOptions("change_types", CHANGE_TYPES);
  const justificationTypes = useSettingOptions("justification_types", JUSTIFICATION_TYPES);
  const locations = useSettingOptions("locations", LOCATIONS);
  const departments = useSettingOptions("departments", DEPARTMENTS);

  const { data: cc, isLoading } = useGetChangeControl(Number(id), {
    query: { queryKey: getGetChangeControlQueryKey(Number(id)), enabled: !!id },
  });

  const update = useUpdateChangeControl();
  const closeCC = useCloseChangeControl();
  const acceptExpert = useAcceptChangeControlExpertReviews();
  const rejectExpert = useRejectChangeControlExpertReviews();
  const createExpertReviews = useCreateChangeControlExpertReviews();
  const submitExpertReview = useSubmitChangeControlExpertReview();
  const reassignExpertReview = useReassignChangeControlExpertReview();
  const createWorkPlans = useCreateChangeControlWorkPlans();
  const deleteWorkPlan = useDeleteChangeControlWorkPlan();
  const submitWorkPlan = useSubmitChangeControlWorkPlan();

  const { data: expertData, refetch: refetchExpert } = useListChangeControlExpertReviews(Number(id), {
    query: { queryKey: getListChangeControlExpertReviewsQueryKey(Number(id)), enabled: !!id },
  });
  const expertReviews = expertData?.data ?? [];

  const { data: workPlanData, refetch: refetchWorkPlans } = useListChangeControlWorkPlans(Number(id), {
    query: { queryKey: getListChangeControlWorkPlansQueryKey(Number(id)), enabled: !!id },
  });
  const workPlans = workPlanData?.data ?? [];

  // Request form state
  const [requestForm, setRequestForm] = useState({
    title: "", changeType: "", riskClassification: "",
    currentSituation: "", proposedSituation: "",
    externalReference: "", plannedImplementationDate: "", location: "",
    hierarchicResponsible: "", siteCoordinator: "",
    justification: "", justificationType: "",
    validationImpact: "", validationRequired: false,
    regulatoryImpact: "", regulatoryFilingRequired: false,
  });
  const [equipment, setEquipment] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestSaved, setRequestSaved] = useState(false);

  // HR / SC Decision
  const [hrComment, setHrComment] = useState("");
  const [hrRejectionReason, setHrRejectionReason] = useState("");
  const [hrSaving, setHrSaving] = useState(false);
  const [scComment, setScComment] = useState("");
  const [scRejectionReason, setScRejectionReason] = useState("");
  const [scSaving, setScSaving] = useState(false);

  // Expert Reviews
  const isQA = (user?.roles ?? []).includes("QA");
  const isAdmin = (user?.roles ?? []).includes("Admin");

  const [addExpertOpen, setAddExpertOpen] = useState(false);
  const [newAssignments, setNewAssignments] = useState([{ departmentName: "", managerName: "", expectedDate: "" }]);
  const [expertForms, setExpertForms] = useState<Record<number, { comment: string; actualDate: string; notApplicable: boolean; naReason: string }>>({});
  const [reassignForms, setReassignForms] = useState<Record<number, { managerName: string; expectedDate: string }>>({});
  const [expertCollapsed, setExpertCollapsed] = useState<Record<number, boolean>>({});
  const [expertSubmitting, setExpertSubmitting] = useState<number | null>(null);
  const [reassignSaving, setReassignSaving] = useState<number | null>(null);

  // Works Plan
  const [addWorkPlanOpen, setAddWorkPlanOpen] = useState(false);
  const [newWorkItems, setNewWorkItems] = useState([{ title: "", responsiblePerson: "", allocatedWorks: "", expectedDate: "" }]);
  const [wpForms, setWpForms] = useState<Record<number, { actualDate: string; worksComment: string }>>({});
  const [wpSubmitting, setWpSubmitting] = useState<number | null>(null);
  const [wpCollapsed, setWpCollapsed] = useState<Record<number, boolean>>({});

  // PIR
  const [pirForm, setPirForm] = useState({ pirComment: "", pirDate: "", pirOutcome: "" });
  const [pirSaving, setPirSaving] = useState(false);
  const [pirSaved, setPirSaved] = useState(false);

  // Closure
  const [closeComment, setCloseComment] = useState("");
  const [closeSaving, setCloseSaving] = useState(false);

  /* ── E-Signature gate ── */
  type EsigConfig = { title: string; description?: string; actionLabel?: string; withReason?: boolean; reasonLabel?: string; onConfirmed: (reason?: string) => void };
  const [esig, setEsig] = useState<EsigConfig | null>(null);

  useEffect(() => {
    if (!cc) return;
    setRequestForm({
      title: cc.title ?? "",
      changeType: cc.changeType ?? "",
      riskClassification: cc.riskClassification ?? "",
      currentSituation: cc.currentSituation ?? "",
      proposedSituation: cc.proposedSituation ?? "",
      externalReference: cc.externalReference ?? "",
      plannedImplementationDate: cc.plannedImplementationDate ?? "",
      location: cc.location ?? "",
      hierarchicResponsible: cc.hierarchicResponsible ?? "",
      siteCoordinator: cc.siteCoordinator ?? "",
      justification: cc.justification ?? "",
      justificationType: cc.justificationType ?? "",
      validationImpact: cc.validationImpact ?? "",
      validationRequired: cc.validationRequired ?? false,
      regulatoryImpact: cc.regulatoryImpact ?? "",
      regulatoryFilingRequired: cc.regulatoryFilingRequired ?? false,
    });
    setEquipment(parseJSON<string[]>(cc.equipment, []));
    setProducts(parseJSON<ProductRow[]>(cc.products, []));
    setHrComment(cc.hrComment ?? "");
    setScComment(cc.scComment ?? "");
    setPirForm({
      pirComment: cc.pirComment ?? "",
      pirDate: cc.pirDate ?? "",
      pirOutcome: cc.pirOutcome ?? "",
    });
    setCloseComment(cc.closeComment ?? "");
  }, [cc]);

  useEffect(() => {
    if (!expertReviews.length) return;
    setExpertForms((prev) => {
      const next = { ...prev };
      for (const er of expertReviews) {
        if (!(er.id in next)) {
          next[er.id] = {
            comment: er.comment ?? "",
            actualDate: er.actualDate ?? "",
            notApplicable: er.notApplicable ?? false,
            naReason: er.naReason ?? "",
          };
        }
      }
      return next;
    });
    setReassignForms((prev) => {
      const next = { ...prev };
      for (const er of expertReviews) {
        next[er.id] = { managerName: er.managerName, expectedDate: er.expectedDate };
      }
      return next;
    });
  }, [expertReviews]);

  useEffect(() => {
    if (!workPlans.length) return;
    setWpForms((prev) => {
      const next = { ...prev };
      for (const wp of workPlans) {
        if (!(wp.id in next)) {
          next[wp.id] = { actualDate: wp.actualDate ?? "", worksComment: wp.worksComment ?? "" };
        }
      }
      return next;
    });
  }, [workPlans]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetChangeControlQueryKey(Number(id)) });

  const handleRequestSave = () => {
    setRequestSaving(true);
    update.mutate({
      id: Number(id),
      data: {
        ...requestForm,
        equipment: JSON.stringify(equipment),
        products: JSON.stringify(products),
      },
    }, {
      onSuccess: () => { toast({ title: "Request saved" }); invalidate(); setRequestSaving(false); setRequestSaved(true); setTimeout(() => setRequestSaved(false), 3000); },
      onError: () => { toast({ title: "Failed to save", variant: "destructive" }); setRequestSaving(false); },
    });
  };

  const handleSubmitForReview = () => {
    update.mutate({ id: Number(id), data: { status: "HR Review" } }, {
      onSuccess: () => { toast({ title: "Submitted for Hierarchic Decision" }); invalidate(); },
      onError: () => toast({ title: "Failed to submit", variant: "destructive" }),
    });
  };

  const handleHrAccept = () => {
    if (!hrComment.trim()) { toast({ title: "Please enter an approval comment", variant: "destructive" }); return; }
    setHrSaving(true);
    update.mutate({ id: Number(id), data: { hrComment, status: "SC Review" } }, {
      onSuccess: () => { toast({ title: "HR Review approved" }); invalidate(); setHrSaving(false); },
      onError: () => { toast({ title: "Failed", variant: "destructive" }); setHrSaving(false); },
    });
  };

  const handleHrReject = () => {
    if (!hrRejectionReason.trim()) { toast({ title: "Please enter a rejection reason", variant: "destructive" }); return; }
    setHrSaving(true);
    update.mutate({ id: Number(id), data: { hrRejectionReason, status: "Rejected" } }, {
      onSuccess: () => { toast({ title: "HR Review rejected" }); invalidate(); setHrSaving(false); },
      onError: () => { toast({ title: "Failed", variant: "destructive" }); setHrSaving(false); },
    });
  };

  const handleScAccept = () => {
    if (!scComment.trim()) { toast({ title: "Please enter an approval comment", variant: "destructive" }); return; }
    setScSaving(true);
    update.mutate({ id: Number(id), data: { scComment, status: "Expert Review" } }, {
      onSuccess: () => { toast({ title: "SC Review approved" }); invalidate(); setScSaving(false); },
      onError: () => { toast({ title: "Failed", variant: "destructive" }); setScSaving(false); },
    });
  };

  const handleScReject = () => {
    if (!scRejectionReason.trim()) { toast({ title: "Please enter a rejection reason", variant: "destructive" }); return; }
    setScSaving(true);
    update.mutate({ id: Number(id), data: { scRejectionReason, status: "Rejected" } }, {
      onSuccess: () => { toast({ title: "SC Review rejected" }); invalidate(); setScSaving(false); },
      onError: () => { toast({ title: "Failed", variant: "destructive" }); setScSaving(false); },
    });
  };

  const handleCreateExpertReviews = () => {
    const valid = newAssignments.every(a => a.departmentName && a.managerName && a.expectedDate);
    if (!valid) { toast({ title: "Please fill all assignment fields", variant: "destructive" }); return; }
    setAddExpertOpen(false);
    setEsig({
      title: "Start Expert Review",
      description: "Your e-signature is required to initiate the expert review process.",
      actionLabel: "Start",
      onConfirmed: () => {
        createExpertReviews.mutate({ id: Number(id), data: { assignments: newAssignments } }, {
          onSuccess: () => {
            toast({ title: "Expert reviews started" });
            invalidate();
            refetchExpert();
            setNewAssignments([{ departmentName: "", managerName: "", expectedDate: "" }]);
          },
          onError: () => toast({ title: "Failed to start expert reviews", variant: "destructive" }),
        });
      },
    });
  };

  const handleSubmitExpertReview = (reviewId: number, notApplicable = false) => {
    const form = expertForms[reviewId];
    setExpertSubmitting(reviewId);
    submitExpertReview.mutate({
      reviewId,
      data: {
        comment: notApplicable ? null : (form?.comment ?? null),
        actualDate: notApplicable ? null : (form?.actualDate ?? null),
        notApplicable,
        naReason: notApplicable ? (form?.naReason ?? null) : null,
      },
    }, {
      onSuccess: () => { toast({ title: notApplicable ? "Expert review marked N/A" : "Expert review submitted" }); refetchExpert(); setExpertSubmitting(null); },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to submit";
        toast({ title: msg, variant: "destructive" });
        setExpertSubmitting(null);
      },
    });
  };

  const handleReassignExpertReview = (reviewId: number) => {
    const rForm = reassignForms[reviewId];
    if (!rForm?.managerName) { toast({ title: "Please select a manager to reassign to", variant: "destructive" }); return; }
    setReassignSaving(reviewId);
    reassignExpertReview.mutate({ reviewId, data: { managerName: rForm.managerName, expectedDate: rForm.expectedDate || null } }, {
      onSuccess: () => { toast({ title: "Expert review reassigned" }); refetchExpert(); setReassignSaving(null); },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to reassign";
        toast({ title: msg, variant: "destructive" });
        setReassignSaving(null);
      },
    });
  };

  const handleAcceptExpertReviews = () => {
    acceptExpert.mutate({ id: Number(id) }, {
      onSuccess: () => { toast({ title: "Expert reviews accepted — moved to Works Plan" }); invalidate(); },
      onError: () => toast({ title: "Failed to accept", variant: "destructive" }),
    });
  };

  const handleCreateWorkPlans = () => {
    const valid = newWorkItems.every(i => i.title && i.responsiblePerson && i.allocatedWorks && i.expectedDate);
    if (!valid) { toast({ title: "Please fill all work plan fields", variant: "destructive" }); return; }
    setAddWorkPlanOpen(false);
    setEsig({
      title: "Start Works Plan",
      description: "Your e-signature is required to initiate the works plan.",
      actionLabel: "Start",
      onConfirmed: () => {
        createWorkPlans.mutate({ id: Number(id), data: { items: newWorkItems } }, {
          onSuccess: () => {
            toast({ title: "Work plan items added" });
            refetchWorkPlans();
            setNewWorkItems([{ title: "", responsiblePerson: "", allocatedWorks: "", expectedDate: "" }]);
          },
          onError: () => toast({ title: "Failed to add work plans", variant: "destructive" }),
        });
      },
    });
  };

  const handleSubmitWorkPlan = (planId: number) => {
    const form = wpForms[planId];
    setWpSubmitting(planId);
    submitWorkPlan.mutate({ planId, data: { actualDate: form?.actualDate || null, worksComment: form?.worksComment || null } }, {
      onSuccess: () => { toast({ title: "Work plan submitted" }); refetchWorkPlans(); setWpSubmitting(null); },
      onError: () => { toast({ title: "Failed to submit", variant: "destructive" }); setWpSubmitting(null); },
    });
  };

  const handleSavePir = () => {
    setPirSaving(true);
    update.mutate({
      id: Number(id),
      data: {
        pirComment: pirForm.pirComment || null,
        pirDate: pirForm.pirDate || null,
        pirOutcome: pirForm.pirOutcome || null,
      },
    }, {
      onSuccess: () => { toast({ title: "PIR saved" }); invalidate(); setPirSaving(false); setPirSaved(true); setTimeout(() => setPirSaved(false), 3000); },
      onError: () => { toast({ title: "Failed to save PIR", variant: "destructive" }); setPirSaving(false); },
    });
  };

  const handleClose = () => {
    if (!closeComment.trim()) { toast({ title: "Please enter a close comment", variant: "destructive" }); return; }
    setCloseSaving(true);
    closeCC.mutate({ id: Number(id), data: { comment: closeComment } }, {
      onSuccess: () => { toast({ title: "Change Control closed" }); invalidate(); setCloseSaving(false); },
      onError: () => { toast({ title: "Failed to close", variant: "destructive" }); setCloseSaving(false); },
    });
  };

  if (isLoading) {
    return (
      <PageTransition className="p-6">
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-[500px] w-full" />
      </PageTransition>
    );
  }

  if (!cc) return <div className="p-6 text-sm text-muted-foreground">Change Control not found</div>;

  const isDraft = cc.status === "Draft";
  const isHrReview = cc.status === "HR Review";
  const isScReview = cc.status === "SC Review";
  const isExpertReview = cc.status === "Expert Review";
  const isWorksPlan = cc.status === "Works Plan";
  const isClosed = cc.status === "Closed";
  const isRejected = cc.status === "Rejected";
  const isTerminal = isClosed || isRejected;

  const hrDone = !!(cc.hrComment) || cc.status === "Rejected" && !!cc.hrRejectionReason;
  const scDone = !!(cc.scComment) || cc.status === "Rejected" && !!cc.scRejectionReason;

  const allExpertDone = expertReviews.length > 0 && expertReviews.every(r => !!r.submittedAt);
  const allWorksDone = workPlans.length > 0 && workPlans.every(p => !!p.submittedAt);
  const wpDoneCount = workPlans.filter(p => !!p.submittedAt).length;

  const DownloadReport = () => (
    <div className="px-6 pb-6">
      <Button size="sm" variant="outline" className="text-muted-foreground">
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Download Report
      </Button>
    </div>
  );

  const tabDef = [
    { value: "request",    label: "Request",       done: cc.status !== "Draft" },
    { value: "hrreview",   label: "HR Review",     done: hrDone },
    { value: "screview",   label: "SC Review",     done: scDone },
    { value: "experts",    label: "Expert Review", done: ["Works Plan","Closed"].includes(cc.status) },
    { value: "worksplan",  label: "Works Plan",    done: allWorksDone },
    { value: "closure",    label: "Closure",       done: isClosed },
    { value: "attachment", label: "Attachment",    done: false },
    { value: "logs",       label: "Logs",          done: false },
  ];

  return (
    <PageTransition className="pb-16">
      <div className="border-b bg-background px-6 pt-4 pb-0">
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1 flex-wrap">
          <span>Change Control Number:</span>
          <span className="font-medium text-foreground">{cc.changeControlNumber}</span>
          <StatusBadge status={cc.status} />
          <RiskBadge risk={cc.riskClassification} />
        </div>
        {(cc.capaNumber || cc.deviationNumber) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 flex-wrap">
            <GitBranch className="h-3 w-3 shrink-0" />
            <span>Linked to:</span>
            {cc.capaNumber && cc.capaId && (
              <Link
                href={`/capa/${cc.capaId}`}
                className="font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
              >
                {cc.capaNumber}
              </Link>
            )}
            {cc.capaNumber && cc.deviationNumber && (
              <span className="text-muted-foreground/60">→</span>
            )}
            {cc.deviationNumber && cc.deviationId && (
              <Link
                href={`/deviations/${cc.deviationId}`}
                className="font-medium text-cyan-600 hover:text-cyan-700 hover:underline"
              >
                {cc.deviationNumber}
              </Link>
            )}
          </div>
        )}

        <Tabs defaultValue="request" className="w-full">
          <TabsList className="w-full justify-start border-b-0 rounded-none h-10 bg-transparent p-0 gap-0 -mb-px overflow-x-auto">
            {tabDef.map(({ value, label, done }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600 data-[state=active]:bg-transparent px-4 h-10 text-sm font-medium text-muted-foreground hover:text-foreground shrink-0"
              >
                <span className={done ? "text-green-600 dark:text-green-500" : ""}>{label}</span>
                {done && <svg className="w-3 h-3 ml-1.5 text-green-600 dark:text-green-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm3.354-9.354a.5.5 0 0 0-.708-.708L7 8.586 5.354 6.94a.5.5 0 0 0-.708.708l2 2a.5.5 0 0 0 .708 0l4-4z" clipRule="evenodd" /></svg>}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── REQUEST TAB ── */}
          <TabsContent value="request" className="mt-0 px-0">
            <div className="p-6 space-y-5 max-w-4xl">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input value={requestForm.title} onChange={(e) => setRequestForm(f => ({ ...f, title: e.target.value }))} disabled={isTerminal} />
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type of Change</Label>
                  <Select value={requestForm.changeType} onValueChange={(v) => setRequestForm(f => ({ ...f, changeType: v }))} disabled={isTerminal}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{changeTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Risk Classification</Label>
                  <Select value={requestForm.riskClassification} onValueChange={(v) => setRequestForm(f => ({ ...f, riskClassification: v }))} disabled={isTerminal}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select risk" /></SelectTrigger>
                    <SelectContent>
                      {RISK_CLASSES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Planned Implementation Date</Label>
                  <Input type="date" className="h-9" value={requestForm.plannedImplementationDate} onChange={(e) => setRequestForm(f => ({ ...f, plannedImplementationDate: e.target.value }))} disabled={isTerminal} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Current Situation</Label>
                <Textarea rows={3} value={requestForm.currentSituation} onChange={(e) => setRequestForm(f => ({ ...f, currentSituation: e.target.value }))} disabled={isTerminal} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Proposed Situation</Label>
                <Textarea rows={3} value={requestForm.proposedSituation} onChange={(e) => setRequestForm(f => ({ ...f, proposedSituation: e.target.value }))} disabled={isTerminal} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">External Reference</Label>
                  <Input value={requestForm.externalReference} onChange={(e) => setRequestForm(f => ({ ...f, externalReference: e.target.value }))} disabled={isTerminal} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <Select value={requestForm.location} onValueChange={(v) => setRequestForm(f => ({ ...f, location: v }))} disabled={isTerminal}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Equipment */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Equipment</Label>
                <EquipmentPicker value={equipment} onChange={setEquipment} disabled={isTerminal} />
              </div>

              {/* Products */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Products</Label>
                <ProductsEditor rows={products} onChange={setProducts} disabled={isTerminal} />
              </div>

              {/* Justification */}
              <div className="border rounded-lg p-4 space-y-4">
                <p className="text-sm font-medium">Justification</p>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Justification Type</Label>
                  <Select value={requestForm.justificationType} onValueChange={(v) => setRequestForm(f => ({ ...f, justificationType: v }))} disabled={isTerminal}>
                    <SelectTrigger className="h-9 max-w-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{justificationTypes.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Justification Comment</Label>
                  <Textarea rows={3} value={requestForm.justification} onChange={(e) => setRequestForm(f => ({ ...f, justification: e.target.value }))} disabled={isTerminal} />
                </div>
              </div>

              {/* Validation Impact */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Validation Impact Assessment</p>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requestForm.validationRequired}
                      onChange={(e) => setRequestForm(f => ({ ...f, validationRequired: e.target.checked }))}
                      disabled={isTerminal}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-xs font-medium text-amber-700">Re-validation Required</span>
                  </label>
                </div>
                {requestForm.validationRequired && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    This change requires validation — ensure a validation plan is created and linked.
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Impact Description</Label>
                  <Textarea rows={2} value={requestForm.validationImpact} onChange={(e) => setRequestForm(f => ({ ...f, validationImpact: e.target.value }))} disabled={isTerminal} placeholder="Describe any impact on validated processes, equipment, or systems..." />
                </div>
              </div>

              {/* Regulatory Impact */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Regulatory Impact Assessment</p>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requestForm.regulatoryFilingRequired}
                      onChange={(e) => setRequestForm(f => ({ ...f, regulatoryFilingRequired: e.target.checked }))}
                      disabled={isTerminal}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-xs font-medium text-blue-700">Regulatory Filing Required</span>
                  </label>
                </div>
                {requestForm.regulatoryFilingRequired && (
                  <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Health authority notification or variation filing may be required before implementation.
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Regulatory Impact Description</Label>
                  <Textarea rows={2} value={requestForm.regulatoryImpact} onChange={(e) => setRequestForm(f => ({ ...f, regulatoryImpact: e.target.value }))} disabled={isTerminal} placeholder="Describe any regulatory impact or required submissions..." />
                </div>
              </div>

              {/* Hierarchic Agreement Info */}
              <div className="border rounded-lg p-4 space-y-4">
                <p className="text-sm font-medium">Information for Hierarchic Agreement</p>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Area Responsible (HR Reviewer)</Label>
                    <UserPicker value={requestForm.hierarchicResponsible} onChange={(v) => setRequestForm(f => ({ ...f, hierarchicResponsible: v }))} disabled={isTerminal} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Quality Expert (SC Reviewer)</Label>
                    <UserPicker value={requestForm.siteCoordinator} onChange={(v) => setRequestForm(f => ({ ...f, siteCoordinator: v }))} disabled={isTerminal} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {!isTerminal && (
                  <Button size="sm" onClick={handleRequestSave} disabled={requestSaving} className={requestSaved ? "bg-green-600 hover:bg-green-700 text-white border-0 transition-colors" : ""}>
                    {requestSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : requestSaved ? <Check className="h-3.5 w-3.5 mr-1.5" /> : null}
                    {requestSaved ? "Saved" : "Save"}
                  </Button>
                )}
                {isDraft && (
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0" onClick={() => setEsig({ title: "Submit Change Control", description: "This will submit the change control for Hierarchic Decision review.", actionLabel: "Submit", onConfirmed: handleSubmitForReview })} disabled={update.isPending}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Submit for Review
                  </Button>
                )}
                {!isDraft && !isTerminal && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Submitted — under review
                  </span>
                )}
                {isTerminal && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-full px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isClosed ? "Closed" : "Rejected"}
                  </span>
                )}
              </div>
            </div>
            <DownloadReport />
          </TabsContent>

          {/* ── HR REVIEW TAB ── */}
          <TabsContent value="hrreview" className="mt-0 px-0">
            <div className="p-6 space-y-6 max-w-4xl">
              {/* Sequential workflow indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`inline-flex items-center gap-1 font-medium px-2 py-1 rounded ${isDraft ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                  Step 1: HR Review
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="inline-flex items-center gap-1 font-medium px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
                  Step 2: SC Review
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-3">
                  <p className="text-sm font-semibold">Acceptance by the Area Responsible</p>
                  {hrDone && <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓ Completed</span>}
                  {isHrReview && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending decision</span>}
                </div>
                <div className="p-4 space-y-4">
                  <FieldDisplay label="Hierarchic Responsible" value={cc.hierarchicResponsible} />

                  {cc.hrComment ? (
                    <FieldDisplay label="Approval Comment" value={cc.hrComment} />
                  ) : cc.hrRejectionReason ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Rejection Reason</p>
                      <p className="text-sm text-destructive">{cc.hrRejectionReason}</p>
                    </div>
                  ) : isHrReview ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Approval Comment</Label>
                        <Textarea rows={3} value={hrComment} onChange={(e) => setHrComment(e.target.value)} placeholder="Enter approval comment..." disabled={userName !== cc.hierarchicResponsible} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Or, rejection reason</Label>
                        <Input value={hrRejectionReason} onChange={(e) => setHrRejectionReason(e.target.value)} placeholder="Reason for rejection..." disabled={userName !== cc.hierarchicResponsible} />
                      </div>
                      {userName === cc.hierarchicResponsible ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0" onClick={() => {
                            if (!hrComment.trim()) { toast({ title: "Please enter an approval comment", variant: "destructive" }); return; }
                            setEsig({ title: "Accept — HR Review", description: "Your e-signature confirms approval of this change control at Hierarchic level.", actionLabel: "Accept", onConfirmed: handleHrAccept });
                          }} disabled={hrSaving}>
                            {hrSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => {
                            if (!hrRejectionReason.trim()) { toast({ title: "Please enter a rejection reason", variant: "destructive" }); return; }
                            setEsig({ title: "Reject — HR Review", description: "Your e-signature confirms rejection of this change control at Hierarchic level.", actionLabel: "Reject", onConfirmed: handleHrReject });
                          }} disabled={hrSaving}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">Only <strong>{cc.hierarchicResponsible}</strong> can approve or reject at this stage.</p>
                      )}
                    </>
                  ) : isDraft ? (
                    <p className="text-xs text-muted-foreground italic">The change control must be submitted before HR review can begin.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Pending review</p>
                  )}
                </div>
              </div>

              {cc.hrComment && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  HR Review approved — the change control has advanced to SC Review.
                </div>
              )}
            </div>
            <DownloadReport />
          </TabsContent>

          {/* ── SC REVIEW TAB ── */}
          <TabsContent value="screview" className="mt-0 px-0">
            <div className="p-6 space-y-6 max-w-4xl">
              {/* Sequential workflow indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-1 font-medium px-2 py-1 rounded ${hrDone ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border"}`}>
                  {hrDone ? "✓ " : ""}Step 1: HR Review
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={`inline-flex items-center gap-1 font-medium px-2 py-1 rounded ${isScReview ? "bg-amber-50 text-amber-700 border border-amber-200" : scDone ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border"}`}>
                  {scDone ? "✓ " : ""}Step 2: SC Review
                </span>
              </div>

              {!hrDone && !isRejected && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  SC Review is locked until the Area Responsible completes Step 1 (HR Review).
                </div>
              )}

              <div className={`border rounded-lg overflow-hidden ${!hrDone && !isRejected ? "opacity-60" : ""}`}>
                <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-3">
                  <p className="text-sm font-semibold">Acceptance by the Quality Expert (Site Coordinator)</p>
                  {scDone && <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓ Completed</span>}
                  {isScReview && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending decision</span>}
                </div>
                <div className="p-4 space-y-4">
                  <FieldDisplay label="Site Coordinator" value={cc.siteCoordinator} />

                  {cc.scComment ? (
                    <FieldDisplay label="Approval Comment" value={cc.scComment} />
                  ) : cc.scRejectionReason ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Rejection Reason</p>
                      <p className="text-sm text-destructive">{cc.scRejectionReason}</p>
                    </div>
                  ) : isScReview ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Approval Comment</Label>
                        <Textarea rows={3} value={scComment} onChange={(e) => setScComment(e.target.value)} placeholder="Enter approval comment..." disabled={userName !== cc.siteCoordinator} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Or, rejection reason</Label>
                        <Input value={scRejectionReason} onChange={(e) => setScRejectionReason(e.target.value)} placeholder="Reason for rejection..." disabled={userName !== cc.siteCoordinator} />
                      </div>
                      {userName === cc.siteCoordinator ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0" onClick={() => {
                            if (!scComment.trim()) { toast({ title: "Please enter an approval comment", variant: "destructive" }); return; }
                            setEsig({ title: "Accept — SC Review", description: "Your e-signature confirms approval of this change control at Site Coordinator level.", actionLabel: "Accept", onConfirmed: handleScAccept });
                          }} disabled={scSaving}>
                            {scSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => {
                            if (!scRejectionReason.trim()) { toast({ title: "Please enter a rejection reason", variant: "destructive" }); return; }
                            setEsig({ title: "Reject — SC Review", description: "Your e-signature confirms rejection of this change control at Site Coordinator level.", actionLabel: "Reject", onConfirmed: handleScReject });
                          }} disabled={scSaving}>
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">Only <strong>{cc.siteCoordinator}</strong> can approve or reject at this stage.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">{hrDone ? "Pending review" : "Awaiting HR Review completion"}</p>
                  )}
                </div>
              </div>

              {cc.scComment && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  SC Review approved — the change control has advanced to Expert Review.
                </div>
              )}
            </div>
            <DownloadReport />
          </TabsContent>

          {/* ── EXPERTS REVIEW TAB ── */}
          <TabsContent value="experts" className="mt-0 px-0">
            <div className="p-6 max-w-4xl">
              {/* Progress indicator + Add button */}
              <div className="mb-4 flex items-center gap-3">
                {expertReviews.length > 0 ? (
                  <>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.round((expertReviews.filter(r => !!r.submittedAt).length / expertReviews.length) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {expertReviews.filter(r => !!r.submittedAt).length} / {expertReviews.length} complete
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {isExpertReview ? "No expert reviews added yet." : "Expert reviews are available once SC Review is approved."}
                  </span>
                )}
                {isExpertReview && !isTerminal && (isQA || isAdmin || (cc && userName === cc.siteCoordinator)) && (
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0 shrink-0" onClick={() => setAddExpertOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {expertReviews.length === 0 ? "Start Expert Review" : "Add Expert Review"}
                  </Button>
                )}
              </div>

              {/* Department review cards */}
              <div className="space-y-4">
                {expertReviews.map((er) => {
                  const form = expertForms[er.id] ?? { comment: "", actualDate: "", notApplicable: false, naReason: "" };
                  const rForm = reassignForms[er.id] ?? { managerName: er.managerName, expectedDate: er.expectedDate };
                  const collapsed = expertCollapsed[er.id] ?? false;
                  const isSubmitted = !!er.submittedAt;
                  const isNA = er.notApplicable;
                  const isAssignedManager = userName === er.managerName;
                  const canSubmit = isAssignedManager;
                  const canReassign = (isQA || isAdmin || (cc && userName === cc.siteCoordinator)) && !isSubmitted && !isTerminal;
                  return (
                    <div key={er.id} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-colors"
                        onClick={() => setExpertCollapsed(prev => ({ ...prev, [er.id]: !prev[er.id] }))}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{er.departmentName}</span>
                          <span className="text-xs text-muted-foreground">— {er.managerName}</span>
                          {isSubmitted && isNA && <span className="text-xs text-slate-600 font-medium bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5 flex items-center gap-1"><Ban className="h-3 w-3" />N/A</span>}
                          {isSubmitted && !isNA && <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓ Submitted</span>}
                          {!isSubmitted && !isTerminal && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending</span>}
                        </div>
                        {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                      </button>

                      {!collapsed && (
                        <div className="p-4 space-y-4">
                          <FieldDisplay label="Assigned Manager" value={er.managerName} />

                          <div className="grid grid-cols-2 gap-4">
                            <FieldDisplay label="Expected Date" value={er.expectedDate} />
                            {isSubmitted && er.actualDate && <FieldDisplay label="Actual Date" value={er.actualDate} />}
                          </div>

                          {/* Submitted: N/A display */}
                          {isSubmitted && isNA && (
                            <div className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                              <Ban className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">Marked as Not Applicable</p>
                                {er.naReason && <p className="mt-1 text-muted-foreground">{er.naReason}</p>}
                              </div>
                            </div>
                          )}

                          {/* Submitted: comment display */}
                          {isSubmitted && !isNA && er.comment && <FieldDisplay label="Pre-Assessment" value={er.comment} />}

                          {/* Active submission form */}
                          {!isSubmitted && !isTerminal && canSubmit && (
                            <div className="space-y-4 pt-2 border-t">
                              {/* N/A toggle */}
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={form.notApplicable}
                                  onChange={(e) => setExpertForms(prev => ({ ...prev, [er.id]: { ...prev[er.id], notApplicable: e.target.checked } }))}
                                  className="h-4 w-4 rounded border-input"
                                />
                                <span className="text-xs font-medium text-slate-700">Mark as Not Applicable</span>
                              </label>

                              {form.notApplicable ? (
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">Reason for N/A</Label>
                                  <Textarea rows={2} value={form.naReason} onChange={(e) => setExpertForms(prev => ({ ...prev, [er.id]: { ...prev[er.id], naReason: e.target.value } }))} placeholder="Explain why this department's review is not applicable..." />
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-xs text-muted-foreground">Actual Date</Label>
                                      <Input type="date" className="h-9" value={form.actualDate} onChange={(e) => setExpertForms(prev => ({ ...prev, [er.id]: { ...prev[er.id], actualDate: e.target.value } }))} />
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Pre-Assessment</Label>
                                    <Textarea rows={3} value={form.comment} onChange={(e) => setExpertForms(prev => ({ ...prev, [er.id]: { ...prev[er.id], comment: e.target.value } }))} placeholder="Pre-assessment notes..." />
                                  </div>
                                </>
                              )}

                              {form.notApplicable ? (
                                <Button size="sm" variant="outline" className="border-slate-300 text-slate-700" onClick={() => setEsig({ title: "Mark Expert Review N/A", description: `Your e-signature confirms this review is not applicable for ${er.departmentName}.`, actionLabel: "Confirm N/A", onConfirmed: () => handleSubmitExpertReview(er.id, true) })} disabled={expertSubmitting === er.id}>
                                  {expertSubmitting === er.id && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                  <Ban className="h-3.5 w-3.5 mr-1.5" />
                                  Confirm N/A
                                </Button>
                              ) : (
                                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0" onClick={() => setEsig({ title: "Submit Expert Review", description: `Your e-signature confirms the expert review submission for ${er.departmentName}.`, actionLabel: "Submit", onConfirmed: () => handleSubmitExpertReview(er.id, false) })} disabled={expertSubmitting === er.id}>
                                  {expertSubmitting === er.id && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                  <Send className="h-3.5 w-3.5 mr-1.5" />
                                  Submit Review
                                </Button>
                              )}
                            </div>
                          )}

                          {!isSubmitted && !isTerminal && !canSubmit && (
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">Only <strong>{er.managerName}</strong> can complete and submit this review.</p>
                          )}

                          {canReassign && (
                            <div className="pt-3 border-t space-y-3">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reassign</p>
                              <div className="grid grid-cols-2 gap-4 items-end">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">New Manager</Label>
                                  <UserPicker value={rForm.managerName} onChange={(v) => setReassignForms(prev => ({ ...prev, [er.id]: { ...prev[er.id], managerName: v } }))} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">New Expected Date</Label>
                                  <Input type="date" className="h-9" value={rForm.expectedDate} onChange={(e) => setReassignForms(prev => ({ ...prev, [er.id]: { ...prev[er.id], expectedDate: e.target.value } }))} />
                                </div>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleReassignExpertReview(er.id)} disabled={reassignSaving === er.id}>
                                {reassignSaving === er.id && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                Reassign
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isExpertReview && allExpertDone && (
                <div className="mt-6">
                  {isUserLoading ? (
                    <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
                  ) : (isQA || isAdmin || (cc && userName === cc.siteCoordinator)) ? (
                    <div className="flex gap-3">
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0" onClick={() => setEsig({ title: "Accept All Expert Reviews", description: "Your e-signature confirms acceptance of all expert reviews, moving the CC to Works Plan.", actionLabel: "Accept", onConfirmed: handleAcceptExpertReviews })} disabled={acceptExpert.isPending}>
                        {acceptExpert.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                        Accept Expert Reviews
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive" onClick={() => setEsig({ title: "Reject Expert Reviews", description: "This will reject all expert reviews and mark the Change Control as Rejected.", actionLabel: "Reject", withReason: true, reasonLabel: "Rejection Reason", onConfirmed: (reason) => {
                        rejectExpert.mutate({ id: Number(id), data: { reason: reason ?? "" } }, {
                          onSuccess: () => { toast({ title: "Expert reviews rejected" }); invalidate(); },
                          onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
                        });
                      }})}>
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">All reviews submitted. Only the <strong>Site Coordinator</strong> or <strong>QA</strong> can accept or reject.</p>
                  )}
                </div>
              )}
            </div>
            <DownloadReport />
          </TabsContent>

          {/* ── WORKS PLAN TAB ── */}
          <TabsContent value="worksplan" className="mt-0 px-0">
            <div className="p-6 max-w-4xl">
              {/* Progress indicator */}
              {workPlans.length > 0 && (
                <div className="mb-5 p-4 border rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Overall Progress</p>
                    <span className="text-sm font-semibold tabular-nums">
                      {wpDoneCount}/{workPlans.length} items complete
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${allWorksDone ? "bg-green-500" : "bg-cyan-500"}`}
                      style={{ width: workPlans.length > 0 ? `${Math.round((wpDoneCount / workPlans.length) * 100)}%` : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {allWorksDone ? "All work plan items are complete." : `${workPlans.length - wpDoneCount} item(s) remaining.`}
                  </p>
                </div>
              )}

              {!isUserLoading && isWorksPlan && !isClosed && (isQA || isAdmin || (cc && userName === cc.siteCoordinator)) && (
                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0 mb-6" onClick={() => setAddWorkPlanOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Works Plan
                </Button>
              )}

              {workPlans.length === 0 && (
                <p className="text-sm text-muted-foreground">No work plan items yet.</p>
              )}

              <div className="space-y-5">
                {workPlans.map((wp) => {
                  const form = wpForms[wp.id] ?? { actualDate: "", worksComment: "" };
                  const isSubmitted = !!wp.submittedAt;
                  const isResponsible = userName === wp.responsiblePerson;
                  const canSubmit = isResponsible;
                  const isCollapsed = wpCollapsed[wp.id] ?? false;
                  return (
                    <div key={wp.id} className="border rounded-lg overflow-hidden">
                      <div
                        className="bg-muted/20 px-4 py-3 border-b flex items-center justify-between cursor-pointer select-none hover:bg-muted/30 transition-colors"
                        onClick={() => setWpCollapsed(prev => ({ ...prev, [wp.id]: !prev[wp.id] }))}
                      >
                        <div className="flex items-center gap-3">
                          {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm font-semibold">{wp.title}</span>
                          {isSubmitted
                            ? <span className="text-xs text-green-600 font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓ Done</span>
                            : <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending</span>
                          }
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {!isUserLoading && !isSubmitted && !isClosed && (isQA || isAdmin) && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { deleteWorkPlan.mutate({ planId: wp.id }, { onSuccess: () => { toast({ title: "Deleted" }); refetchWorkPlans(); }, onError: () => toast({ title: "Failed", variant: "destructive" }) }); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {!isCollapsed && <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FieldDisplay label="Responsible Person" value={wp.responsiblePerson} />
                          <FieldDisplay label="Allocated Works" value={wp.allocatedWorks} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FieldDisplay label="Expected Date" value={wp.expectedDate} />
                          {!isSubmitted && canSubmit && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Actual Date</Label>
                              <Input type="date" className="h-9" value={form.actualDate} onChange={(e) => setWpForms(prev => ({ ...prev, [wp.id]: { ...prev[wp.id], actualDate: e.target.value } }))} />
                            </div>
                          )}
                          {isSubmitted && wp.actualDate && <FieldDisplay label="Actual Date" value={wp.actualDate} />}
                        </div>
                        {!isSubmitted && canSubmit && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Works Comment</Label>
                            <Textarea rows={2} value={form.worksComment} onChange={(e) => setWpForms(prev => ({ ...prev, [wp.id]: { ...prev[wp.id], worksComment: e.target.value } }))} placeholder="Work done comments..." />
                          </div>
                        )}
                        {isSubmitted && wp.worksComment && <FieldDisplay label="Works Comment" value={wp.worksComment} />}

                        {!isSubmitted && !isClosed && (
                          <>
                            <AttachmentsPanel module="CCWorkPlan" recordId={wp.id} readOnly={false} />
                            {canSubmit ? (
                              <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0" onClick={() => setEsig({ title: "Submit Work Plan Item", description: `Your e-signature confirms completion of work plan item: "${wp.title}".`, actionLabel: "Submit", onConfirmed: () => handleSubmitWorkPlan(wp.id) })} disabled={wpSubmitting === wp.id}>
                                {wpSubmitting === wp.id && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Submit
                              </Button>
                            ) : (
                              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">Only <strong>{wp.responsiblePerson}</strong> can submit this work plan item.</p>
                            )}
                          </>
                        )}
                        {isSubmitted && (
                          <AttachmentsPanel module="CCWorkPlan" recordId={wp.id} readOnly={true} />
                        )}
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <DownloadReport />
          </TabsContent>

          {/* ── CLOSURE TAB ── */}
          <TabsContent value="closure" className="mt-0 px-0">
            <div className="p-6 space-y-6 max-w-4xl">

              {/* PIR Section */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-4 py-3 border-b flex items-center gap-3">
                  <p className="text-sm font-semibold">Post-Implementation Review (PIR)</p>
                  {cc.pirOutcome && (
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 border ${cc.pirOutcome === "Effective" ? "text-green-700 bg-green-50 border-green-200" : cc.pirOutcome === "Not Effective" ? "text-red-700 bg-red-50 border-red-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                      {cc.pirOutcome}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Record the post-implementation review to verify that the change achieved its intended effect and had no unintended consequences.
                  </p>

                  {isClosed ? (
                    <div className="space-y-3">
                      <FieldDisplay label="PIR Date" value={cc.pirDate} />
                      <FieldDisplay label="PIR Outcome" value={cc.pirOutcome} />
                      <FieldDisplay label="PIR Findings" value={cc.pirComment} multiline />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">PIR Date</Label>
                          <Input type="date" className="h-9" value={pirForm.pirDate} onChange={(e) => setPirForm(f => ({ ...f, pirDate: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">PIR Outcome</Label>
                          <Select value={pirForm.pirOutcome} onValueChange={(v) => setPirForm(f => ({ ...f, pirOutcome: v }))}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select outcome" /></SelectTrigger>
                            <SelectContent>
                              {PIR_OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">PIR Findings / Comments</Label>
                        <Textarea rows={3} value={pirForm.pirComment} onChange={(e) => setPirForm(f => ({ ...f, pirComment: e.target.value }))} placeholder="Describe the outcome of the post-implementation review..." />
                      </div>
                      {(isWorksPlan || isClosed) && (isQA || isAdmin || (cc && userName === cc.siteCoordinator)) && (
                        <Button size="sm" variant="outline" onClick={handleSavePir} disabled={pirSaving} className={pirSaved ? "border-green-500 text-green-700" : ""}>
                          {pirSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : pirSaved ? <Check className="h-3.5 w-3.5 mr-1.5" /> : null}
                          {pirSaved ? "PIR Saved" : "Save PIR"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Closure Section */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/20 px-4 py-3 border-b">
                  <p className="text-sm font-semibold">Change Control Closure</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Closure Comment</Label>
                    <Textarea
                      rows={4}
                      value={closeComment}
                      onChange={(e) => setCloseComment(e.target.value)}
                      disabled={isClosed}
                      placeholder="Provide closure comment..."
                    />
                  </div>
                </div>
              </div>

              {isWorksPlan && allWorksDone && !isClosed && (
                isUserLoading ? (
                  <div className="h-8 w-28 bg-muted animate-pulse rounded-md" />
                ) : (isQA || isAdmin || (cc && userName === cc.siteCoordinator)) ? (
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white border-0" onClick={() => {
                    if (!closeComment.trim()) { toast({ title: "Please enter a close comment", variant: "destructive" }); return; }
                    setEsig({ title: "Close Change Control", description: "Your e-signature confirms the closure of this change control.", actionLabel: "Close", onConfirmed: handleClose });
                  }} disabled={closeSaving}>
                    {closeSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Close CC
                  </Button>
                ) : (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">Only QA or the Site Coordinator can close this change control.</p>
                )
              )}
            </div>
            <DownloadReport />
          </TabsContent>

          {/* ── ATTACHMENT TAB ── */}
          <TabsContent value="attachment" className="mt-0 px-0">
            <div className="p-6">
              <AttachmentsPanel module="ChangeControl" recordId={Number(id)} readOnly={isTerminal} />
            </div>
            <DownloadReport />
          </TabsContent>

          {/* ── LOGS TAB ── */}
          <TabsContent value="logs" className="mt-0 px-0">
            <div className="p-6">
              <AuditTrailTab module="Change Control" recordId={Number(id)} />
            </div>
            <DownloadReport />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Expert Review Dialog */}
      <Dialog open={addExpertOpen} onOpenChange={setAddExpertOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{expertReviews.length === 0 ? "Start Expert Review" : "Add Expert Review"}</DialogTitle>
            <DialogDescription>
              {expertReviews.length === 0
                ? "Assign departments to review this change control."
                : "Assign additional departments to review this change control."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {newAssignments.map((a, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Assignment {idx + 1}</p>
                  {newAssignments.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNewAssignments(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Department</Label>
                  <Select value={a.departmentName} onValueChange={(v) => setNewAssignments(prev => prev.map((item, i) => i === idx ? { ...item, departmentName: v } : item))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Manager</Label>
                  <UserPicker value={a.managerName} onChange={(v) => setNewAssignments(prev => prev.map((item, i) => i === idx ? { ...item, managerName: v } : item))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Expected Date</Label>
                  <Input type="date" className="h-9" value={a.expectedDate} onChange={(e) => setNewAssignments(prev => prev.map((item, i) => i === idx ? { ...item, expectedDate: e.target.value } : item))} />
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setNewAssignments(prev => [...prev, { departmentName: "", managerName: "", expectedDate: "" }])}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Department
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExpertOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateExpertReviews} disabled={createExpertReviews.isPending}>
              {createExpertReviews.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Start Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* E-Signature Dialog */}
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

      {/* Add Works Plan Dialog */}
      <Dialog open={addWorkPlanOpen} onOpenChange={setAddWorkPlanOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Works Plan Items</DialogTitle>
            <DialogDescription>Add work plan items for this change control.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {newWorkItems.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Item {idx + 1}</p>
                  {newWorkItems.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setNewWorkItems(prev => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Title <span className="text-destructive">*</span></Label>
                  <Input value={item.title} onChange={(e) => setNewWorkItems(prev => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Responsible Person <span className="text-destructive">*</span></Label>
                  <UserPicker value={item.responsiblePerson} onChange={(v) => setNewWorkItems(prev => prev.map((it, i) => i === idx ? { ...it, responsiblePerson: v } : it))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Allocated Works <span className="text-destructive">*</span></Label>
                  <Textarea rows={2} value={item.allocatedWorks} onChange={(e) => setNewWorkItems(prev => prev.map((it, i) => i === idx ? { ...it, allocatedWorks: e.target.value } : it))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Expected Date <span className="text-destructive">*</span></Label>
                  <Input type="date" className="h-9" value={item.expectedDate} onChange={(e) => setNewWorkItems(prev => prev.map((it, i) => i === idx ? { ...it, expectedDate: e.target.value } : it))} />
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setNewWorkItems(prev => [...prev, { title: "", responsiblePerson: "", allocatedWorks: "", expectedDate: "" }])}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Item
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWorkPlanOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkPlans} disabled={createWorkPlans.isPending}>
              {createWorkPlans.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
