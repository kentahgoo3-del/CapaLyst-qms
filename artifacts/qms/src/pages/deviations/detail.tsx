import React, { useState, useEffect, useCallback } from "react";
  import { useParams, Link, useLocation } from "wouter";
  import { PageTransition } from "@/components/page-transition";
  import { StatusBadge } from "@/components/status-badge";
  import {
    useGetDeviation, useUpdateDeviation, getGetDeviationQueryKey,
    useListCapa, getListCapaQueryKey,
    useListEfficacyReviews, getListEfficacyReviewsQueryKey,
    useGetSimilarDeviations, getGetSimilarDeviationsQueryKey,
    useGetRelatedDeviations, getGetRelatedDeviationsQueryKey,
    useAddRelatedDeviation, useRemoveRelatedDeviation,
    useListDeviations, getListDeviationsQueryKey,
  } from "@workspace/api-client-react";
  import { useSettingOptions } from "@/hooks/use-setting-options";
  import { useAuth } from "@/context/auth-context";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import { Skeleton } from "@/components/ui/skeleton";
  import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import {
    ChevronLeft, FileText, CheckCircle2, Users, Activity, ShieldAlert, GitBranch,
    Link as LinkIcon, Flag, Paperclip, History, Pencil, Loader2, Zap, Printer, Eye,
    AlertTriangle, XCircle, CheckCircle, FlaskConical, Download,
  } from "lucide-react";
  import { AuditTrailTab } from "@/components/audit-trail-tab";
  import { AttachmentsPanel } from "@/components/attachments-panel";
  import { ESignatureDialog, type ESignatureDialogProps } from "@/components/esignature-dialog";
  import { UserPicker, MultiUserPicker } from "@/components/user-picker";
  import { EquipmentPicker, ProductsEditor, DEVIATION_TYPES, OPERATIONS, parseJSON, type ProductRow } from "@/components/deviation-fields";
  import { format } from "date-fns";
  import jsPDF from "jspdf";
  import autoTable from "jspdf-autotable";
  import { useQueryClient } from "@tanstack/react-query";
  import { useToast } from "@/hooks/use-toast";

  /* ─── Workflow status config ───────────────────────────────────── */
  const WF_BADGE: Record<string, { label: string; className: string }> = {
    Draft: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    Submitted: { label: "Pending Area Review", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    Area_Rejected: { label: "Rejected by Area", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    Area_Accepted: { label: "Area Accepted", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    QA_Rejected: { label: "Rejected by QA", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    QA_Accepted: { label: "QA Accepted", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    Roles_Assigned: { label: "Roles Assigned", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
    Investigation_Submitted: { label: "Investigation Submitted", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
    Risk_Mgmt_Submitted: { label: "Risk Mgmt Submitted", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    Root_Cause_Submitted: { label: "Root Cause Submitted", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
    CAPA_ER_Submitted: { label: "CAPA & ER Submitted", className: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
    Completed: { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  };

  /* Stage ordering for "is stage past X?" checks */
  const WF_ORDER = [
    "Draft", "Submitted", "Area_Rejected", "Area_Accepted", "QA_Rejected",
    "QA_Accepted", "Roles_Assigned", "Investigation_Submitted",
    "Risk_Mgmt_Submitted", "Root_Cause_Submitted", "CAPA_ER_Submitted", "Completed",
  ];
  function wfPast(current: string, milestone: string): boolean {
    return WF_ORDER.indexOf(current) > WF_ORDER.indexOf(milestone);
  }
  function wfAtOrPast(current: string, milestone: string): boolean {
    return WF_ORDER.indexOf(current) >= WF_ORDER.indexOf(milestone);
  }

  /* ─── Local constants ──────────────────────────────────────────── */
  const PRIORITY_LEVELS = ["Low", "Medium", "High", "Critical"];
  const IMPACT_LEVELS = ["None", "Minor", "Moderate", "Major", "Critical"];
  const BARRIER_TYPES = ["Technical", "Human", "Procedural", "Environmental", "Organizational", "Other"];
  const ROOT_CAUSE_CATEGORIES = [
    "Laboratory equipment failure", "Human error", "Process failure", "Material/reagent failure",
    "Environmental conditions", "Documentation error", "Training inadequacy", "Equipment failure",
    "Software/system failure", "Other",
  ];
  const SOLVING_METHODS = ["5-Why Analysis", "Fishbone Diagram", "Fault Tree Analysis", "FMEA", "Root Cause Mapping", "Other"];

  function DataField({ label, value, multiline = false }: { label: string; value?: string | null; multiline?: boolean }) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        {multiline ? (
          <div className="text-sm p-3 bg-muted/30 rounded-md border border-border/50 min-h-[72px] whitespace-pre-wrap">
            {value || <span className="text-muted-foreground italic">Not provided</span>}
          </div>
        ) : (
          <div className="text-sm font-medium">{value || <span className="text-muted-foreground italic">—</span>}</div>
        )}
      </div>
    );
  }

  function SectionHeader({ title }: { title: string }) {
    return (
      <div className="bg-muted/40 border rounded-md px-4 py-2.5 mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
    );
  }

  function YesNoRadio({ label, value, onChange, disabled, id }: { label: string; value: boolean | null | undefined; onChange: (v: boolean) => void; disabled?: boolean; id: string }) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <RadioGroup value={value === true ? "yes" : "no"} onValueChange={(v) => onChange(v === "yes")} disabled={disabled} className="flex gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`${id}-no`} />
            <Label htmlFor={`${id}-no`} className="font-normal cursor-pointer">No</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`${id}-yes`} />
            <Label htmlFor={`${id}-yes`} className="font-normal cursor-pointer">Yes</Label>
          </div>
        </RadioGroup>
      </div>
    );
  }

  function RejectionBanner({ reason, by }: { reason: string; by: string }) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 flex gap-3 mb-4">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">Rejected by {by}</p>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">{reason}</p>
        </div>
      </div>
    );
  }

  function AcceptedBadge({ label }: { label: string }) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 pt-1">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">{label}</span>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     Main component
  ═══════════════════════════════════════════════════════════════ */
  export default function DeviationDetail() {
    const { id } = useParams<{ id: string }>();
    const [, navigate] = useLocation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user: currentUser, loading: isUserLoading } = useAuth();

    const priorityLevels = useSettingOptions("priority_levels", PRIORITY_LEVELS);
    const impactLevels = useSettingOptions("impact_levels", IMPACT_LEVELS);
    const barrierTypes = useSettingOptions("barrier_types", BARRIER_TYPES);
    const rootCauseCategories = useSettingOptions("root_cause_categories", ROOT_CAUSE_CATEGORIES);
    const solvingMethods = useSettingOptions("solving_methods", SOLVING_METHODS);
    const deviationTypes = useSettingOptions("deviation_types", DEVIATION_TYPES);
    const operations = useSettingOptions("operations", OPERATIONS);

    const { data: dev, isLoading } = useGetDeviation(Number(id), {
      query: { queryKey: getGetDeviationQueryKey(Number(id)), enabled: !!id },
    });
    const update = useUpdateDeviation();

    const linkedCapasQuery = useListCapa(
      { deviationId: Number(id), pageSize: 50 },
      { query: { queryKey: getListCapaQueryKey({ deviationId: Number(id), pageSize: 50 }), enabled: !!id } }
    );
    const linkedCapas = linkedCapasQuery.data?.data ?? [];
    const firstCapaId = linkedCapas[0]?.id;
    const linkedERsQuery = useListEfficacyReviews(
      { capaId: firstCapaId ?? 0, pageSize: 50 },
      { query: { queryKey: getListEfficacyReviewsQueryKey({ capaId: firstCapaId ?? 0, pageSize: 50 }), enabled: !!firstCapaId } }
    );
    const linkedERs = linkedERsQuery.data?.data ?? [];

    /* ── Edit dialog form ── */
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({
      title: "", description: "", immediateAction: "", deviationType: "",
      location: "", externalReference: "", areaResponsible: "", qaExpert: "",
      eventDate: "", detectionDate: "", operation: "", batchLotNumber: "",
    });
    const [editEquipment, setEditEquipment] = useState<string[]>([]);
    const [editProducts, setEditProducts] = useState<ProductRow[]>([]);
    const [linkQuery, setLinkQuery] = useState("");

    /* ── Similar & Related deviations ── */
    const { data: similarData } = useGetSimilarDeviations(Number(id), {
      query: { queryKey: getGetSimilarDeviationsQueryKey(Number(id)), enabled: !!id },
    });
    const similarItems = similarData?.items ?? [];

    const { data: relatedData } = useGetRelatedDeviations(Number(id), {
      query: { queryKey: getGetRelatedDeviationsQueryKey(Number(id)), enabled: !!id },
    });
    const relatedLinks = relatedData ?? [];

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  async function generateTraceabilityReport() {
    if (!dev) return;
    setIsGeneratingReport(true);
    try {
      const resp = await fetch(`/api/deviations/${dev.id}/traceability-report`);
      if (!resp.ok) throw new Error("Failed to fetch report data");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await resp.json();
      const { deviation, capas, efficacyReviews, changeControls, expertReviews, workPlans } = data;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const NAVY: [number, number, number] = [26, 41, 66];
      const NAVY2: [number, number, number] = [42, 65, 105];
      const LIGHT: [number, number, number] = [245, 247, 250];
      const MUTED: [number, number, number] = [120, 130, 145];
      const CELL_HDR: [number, number, number] = [220, 228, 240];
      const margins = { left: 14, right: 14 };
      const contentW = pageW - 28;
      const headStyles = { fillColor: NAVY, textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const, fontSize: 8 };
      const bodyStyles = { fontSize: 8, cellPadding: 2.5 };

      const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

      const drawHeader = () => {
        doc.setFillColor(...NAVY);
        doc.rect(0, 0, pageW, 20, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold"); doc.setFontSize(12);
        doc.text("CAPALYST", 14, 9);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
        doc.text("CPT Quality Management System", 14, 15.5);
        doc.setTextColor(180, 200, 230);
        doc.text("CONTROLLED DOCUMENT — FOR INTERNAL USE ONLY", pageW - 14, 9, { align: "right" });
        doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, pageW - 14, 15.5, { align: "right" });
      };

      const drawSection = (label: string, y: number) => {
        doc.setFillColor(...NAVY);
        doc.rect(14, y, contentW, 8, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text(label, 18, y + 5.5);
        return y + 12;
      };

      const drawSubSection = (label: string, y: number) => {
        doc.setFillColor(...NAVY2);
        doc.rect(14, y, contentW, 6.5, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
        doc.text(label, 18, y + 4.5);
        return y + 10;
      };

      const drawNarrative = (label: string, value: string | null | undefined, y: number) => {
        if (!value?.trim()) return y;
        const yy = checkPage(y, 20);
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(30, 40, 55);
        doc.text(label + ":", 14, yy);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(55, 65, 80);
        const lines = doc.splitTextToSize(value, contentW);
        doc.text(lines, 14, yy + 5);
        return yy + 5 + lines.length * 4.2 + 4;
      };

      const checkPage = (y: number, needed = 30) => {
        if (y > pageH - needed) { doc.addPage(); drawHeader(); return 28; }
        return y;
      };

      const colStyles = {
        0: { fontStyle: "bold" as const, fillColor: CELL_HDR, cellWidth: 40 },
        1: { cellWidth: 56 },
        2: { fontStyle: "bold" as const, fillColor: CELL_HDR, cellWidth: 40 },
        3: { cellWidth: 56 },
      };

      const didDraw = (d: { pageNumber: number }) => { if (d.pageNumber > 1) drawHeader(); };

      // ── COVER PAGE ──────────────────────────────────────────────────
      drawHeader();
      doc.setFillColor(30, 40, 55);
      doc.rect(0, 22, pageW, 30, "F");
      doc.setTextColor(160, 185, 220); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
      doc.text("QUALITY MANAGEMENT SYSTEM", 14, 31);
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15);
      doc.text("Quality Event Traceability Report", 14, 40);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(190, 210, 235);
      doc.text(`${deviation.deviationNumber}  ·  ${deviation.title}`, 14, 48, { maxWidth: contentW });

      let y = 62;

      autoTable(doc, {
        startY: y,
        head: [],
        body: [
          ["Document Type", "Quality Event Traceability Report", "Reference", deviation.deviationNumber],
          ["Regulatory Basis", "ICH Q10 · 21 CFR Part 211.192 · EU GMP Annex 11", "Classification", deviation.classification || "Not specified"],
          ["Generated By", currentUser?.name ?? "System", "Date & Time", format(new Date(), "dd MMM yyyy, HH:mm")],
          ["Report Status", "CONTROLLED DOCUMENT", "System Version", "v1.0.0"],
        ],
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: LIGHT, cellWidth: 40 },
          1: { cellWidth: 56 },
          2: { fontStyle: "bold", fillColor: LIGHT, cellWidth: 40 },
          3: { cellWidth: 56 },
        },
        margin: margins,
        didDrawPage: didDraw,
      });
      y = lastY() + 8;

      const summaries = [
        { label: "Deviation", count: "1", sub: deviation.deviationNumber },
        { label: "CAPAs", count: String(capas.length), sub: capas.length > 0 ? capas.map((c: { capaNumber: string }) => c.capaNumber).join(", ") : "None" },
        { label: "Efficacy Reviews", count: String(efficacyReviews.length), sub: efficacyReviews.length > 0 ? `${efficacyReviews.filter((e: { status: string }) => e.status === "Completed").length} completed` : "None" },
        { label: "Change Controls", count: String(changeControls.length), sub: changeControls.length > 0 ? changeControls.map((c: { changeControlNumber: string }) => c.changeControlNumber).join(", ") : "None" },
      ];
      const boxW = (contentW - 6) / 4;
      summaries.forEach((s, i) => {
        const x = 14 + i * (boxW + 2);
        doc.setFillColor(...LIGHT); doc.roundedRect(x, y, boxW, 22, 2, 2, "F");
        doc.setDrawColor(200, 210, 225); doc.setLineWidth(0.3); doc.roundedRect(x, y, boxW, 22, 2, 2, "S");
        doc.setTextColor(...NAVY); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
        doc.text(s.count, x + boxW / 2, y + 11, { align: "center" });
        doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(60, 80, 110);
        doc.text(s.label, x + boxW / 2, y + 16.5, { align: "center" });
        doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(...MUTED);
        const sub = doc.splitTextToSize(s.sub, boxW - 4);
        doc.text(sub[0] ?? "", x + boxW / 2, y + 20.5, { align: "center" });
      });
      y += 30;

      // ── SECTION 1: DEVIATION ─────────────────────────────────────────
      y = checkPage(y, 80);
      y = drawSection("SECTION 1 — DEVIATION", y);

      autoTable(doc, {
        startY: y, head: [["Field", "Value", "Field", "Value"]],
        body: [
          ["Deviation Number", deviation.deviationNumber, "Deviation Type", deviation.deviationType],
          ["Title", { content: deviation.title, colSpan: 3 }],
          ["Classification", deviation.classification || "—", "Priority", deviation.eventPriority || "—"],
          ["Area Responsible", deviation.areaResponsible, "Location", deviation.location || "—"],
          ["QA Expert", deviation.qaExpert, "Investigation Leader", deviation.investigationLeader || "—"],
          ["Event Date", deviation.eventDate, "Detection Date", deviation.detectionDate],
          ["Due Date", deviation.dueDate, "Extended Date", deviation.extendedDate || "—"],
          ["Workflow Status", WF_BADGE[deviation.workflowStatus ?? ""]?.label ?? deviation.workflowStatus ?? "—", "Status", deviation.status],
          ["Products", deviation.products ? (() => { try { return (JSON.parse(deviation.products) as { name?: string }[]).map(p => p.name || "").filter(Boolean).join(", "); } catch { return deviation.products; } })() : "—", "Batch / Lot", deviation.batchLotNumber || "—"],
          ["Equipment", deviation.equipment || "—", "Operation", deviation.operation || "—"],
          ["Assigned Expert", deviation.assignedExpert || "—", "Risk Manager", deviation.riskManager || "—"],
          ["Team Members", deviation.teamMembers || "—", "External Reference", deviation.externalReference || "—"],
          ["CAPA Required", deviation.capaNeeded === true ? "Yes" : deviation.capaNeeded === false ? "No" : "—", "ER Required", deviation.erNeeded === true ? "Yes" : deviation.erNeeded === false ? "No" : "—"],
          ["Repeated Deviation", deviation.isRepeatedDeviation === true ? "Yes" : deviation.isRepeatedDeviation === false ? "No" : "—", "Solving Method", deviation.solvingMethod || "—"],
        ],
        headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
        columnStyles: colStyles, margin: margins, didDrawPage: didDraw,
      });
      y = lastY() + 6;

      y = drawNarrative("Description of Event", deviation.description, y);
      y = drawNarrative("Immediate Action Taken", deviation.immediateAction, y);
      y = drawNarrative("Investigation Summary", deviation.investigation, y);
      y = drawNarrative("Root Cause Category", deviation.rootCauseCategory, y);
      y = drawNarrative("Root Cause Details", deviation.rootCause, y);
      y = drawNarrative("Barrier / Control", deviation.barrier, y);
      y = drawNarrative("Second Barrier", deviation.secondBarrier, y);
      y = drawNarrative("Product Impact", deviation.productImpact, y);
      y = drawNarrative("GxP / GMP Compliance Impact", deviation.gxpCompliance, y);
      y = drawNarrative("GMP Comment", deviation.gmpComment, y);
      y = drawNarrative("CAPA Comment", deviation.capaComment, y);
      y = drawNarrative("QA Comment", deviation.qaComment, y);
      y = drawNarrative("Completion Comment", deviation.completionComment, y);

      // ── SECTION 2: CAPAs ─────────────────────────────────────────────
      for (let ci = 0; ci < capas.length; ci++) {
        const capa = capas[ci];
        y = checkPage(y, 80);
        y = drawSection(`SECTION 2.${ci + 1} — CORRECTIVE & PREVENTIVE ACTION (CAPA)`, y);

        autoTable(doc, {
          startY: y, head: [["Field", "Value", "Field", "Value"]],
          body: [
            ["CAPA Number", capa.capaNumber, "CAPA Type", capa.capaType],
            ["Title", { content: capa.title, colSpan: 3 }],
            ["Status", capa.status, "Workflow Status", capa.workflowStatus || "—"],
            ["Location", capa.location, "Implementation Leader", capa.implementationLeader],
            ["Creation Date", capa.creationDate, "Initial Planned Date", capa.initialPlannedDate],
            ["Updated Planned Date", capa.updatedPlannedDate || "—", "Implementation Date", capa.implementationDate || "—"],
            ["Source Type", capa.sourceType || "—", "External References", capa.externalReferences || "—"],
            ["Specific Attribute", capa.specificAttribute || "—", "Extension Requested By", capa.extensionRequestedBy || "—"],
          ],
          headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
          columnStyles: colStyles, margin: margins, didDrawPage: didDraw,
        });
        y = lastY() + 6;

        y = drawNarrative("Description", capa.description, y);
        y = drawNarrative("Implementation Summary", capa.implementationSummary, y);
        y = drawNarrative("Extension Reason", capa.extensionRequestedReason, y);
        y = drawNarrative("Close Comment", capa.closeComment, y);

        const capaErs = efficacyReviews.filter((e: { capaId: number }) => e.capaId === capa.id);
        if (capaErs.length > 0) {
          y = checkPage(y, 40);
          y = drawSubSection(`Efficacy Review(s) — ${capa.capaNumber}`, y);
          autoTable(doc, {
            startY: y,
            head: [["Round", "Reviewer", "Status", "Expected Date", "Review Date", "Outcome", "Review Notes / Criteria"]],
            body: capaErs.map((e: { round: number; reviewer: string; status: string; expectedDate: string; reviewDate?: string | null; outcome?: string | null; review?: string | null; criteria?: string | null }) => [
              e.round, e.reviewer, e.status, e.expectedDate,
              e.reviewDate || "—", e.outcome || "—",
              [e.review, e.criteria].filter(Boolean).join(" | ") || "—",
            ]),
            headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
            margin: margins,
            columnStyles: { 0: { cellWidth: 14, halign: "center" as const }, 6: { cellWidth: 52 } },
            didDrawPage: didDraw,
          });
          y = lastY() + 8;
        }
      }

      // ── SECTION 3: CHANGE CONTROLS ──────────────────────────────────
      for (let ci = 0; ci < changeControls.length; ci++) {
        const cc = changeControls[ci];
        y = checkPage(y, 80);
        y = drawSection(`SECTION 3.${ci + 1} — CHANGE CONTROL`, y);

        autoTable(doc, {
          startY: y, head: [["Field", "Value", "Field", "Value"]],
          body: [
            ["CC Number", cc.changeControlNumber, "Change Type", cc.changeType],
            ["Title", { content: cc.title, colSpan: 3 }],
            ["Status", cc.status, "Risk Classification", cc.riskClassification || "—"],
            ["Location", cc.location, "Planned Implementation Date", cc.plannedImplementationDate],
            ["Hierarchic Responsible", cc.hierarchicResponsible, "Site Coordinator", cc.siteCoordinator],
            ["Validation Required", cc.validationRequired ? "Yes" : "No", "Validation Impact", cc.validationImpact || "—"],
            ["Regulatory Filing Required", cc.regulatoryFilingRequired ? "Yes" : "No", "Regulatory Impact", cc.regulatoryImpact || "—"],
            ["Equipment", cc.equipment || "—", "Products", cc.products || "—"],
            ["External Reference", cc.externalReference || "—", "Justification Type", cc.justificationType || "—"],
            ["Linked CAPA", cc.capaNumber || "—", "Linked Deviation", cc.deviationNumber || "—"],
          ],
          headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
          columnStyles: colStyles, margin: margins, didDrawPage: didDraw,
        });
        y = lastY() + 6;

        y = drawNarrative("Current Situation", cc.currentSituation, y);
        y = drawNarrative("Proposed Situation", cc.proposedSituation, y);
        y = drawNarrative("Justification", cc.justification, y);

        if (cc.hrComment || cc.hrRejectionReason || cc.scComment || cc.scRejectionReason) {
          y = checkPage(y, 35);
          y = drawSubSection("Hierarchic Review (HR) & Steering Committee (SC) Review", y);
          autoTable(doc, {
            startY: y,
            head: [["Review Stage", "Decision / Comment", "Rejection Reason (if any)"]],
            body: [
              ["HR Review", cc.hrComment || "—", cc.hrRejectionReason || "—"],
              ["SC Review", cc.scComment || "—", cc.scRejectionReason || "—"],
            ],
            headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
            margin: margins,
            columnStyles: { 0: { fontStyle: "bold" as const, cellWidth: 38 }, 2: { cellWidth: 55 } },
            didDrawPage: didDraw,
          });
          y = lastY() + 6;
        }

        const ccExperts = expertReviews.filter((e: { changeControlId: number }) => e.changeControlId === cc.id);
        if (ccExperts.length > 0) {
          y = checkPage(y, 40);
          y = drawSubSection("Expert Reviews", y);
          autoTable(doc, {
            startY: y,
            head: [["Department", "Manager", "Has Impact", "Quality Impact", "Pre-Assessment Comment", "Expected Date", "Actual Date", "N/A"]],
            body: ccExperts.map((e: { departmentName: string; managerName: string; hasImpact?: boolean | null; hasQualityImpact?: boolean | null; comment?: string | null; expectedDate: string; actualDate?: string | null; notApplicable: boolean }) => [
              e.departmentName, e.managerName,
              e.hasImpact === true ? "Yes" : e.hasImpact === false ? "No" : "—",
              e.hasQualityImpact === true ? "Yes" : e.hasQualityImpact === false ? "No" : "—",
              e.comment || "—", e.expectedDate, e.actualDate || "—",
              e.notApplicable ? "Yes" : "No",
            ]),
            headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
            margin: margins,
            columnStyles: { 4: { cellWidth: 44 }, 7: { cellWidth: 12, halign: "center" as const } },
            didDrawPage: didDraw,
          });
          y = lastY() + 6;
        }

        const ccPlans = workPlans.filter((w: { changeControlId: number }) => w.changeControlId === cc.id);
        if (ccPlans.length > 0) {
          y = checkPage(y, 40);
          y = drawSubSection("Works Plan", y);
          autoTable(doc, {
            startY: y,
            head: [["#", "Work Item Title", "Responsible Person", "Allocated Works", "Expected Date", "Actual Date"]],
            body: ccPlans.map((w: { title: string; responsiblePerson: string; allocatedWorks: string; expectedDate: string; actualDate?: string | null }, idx: number) => [
              idx + 1, w.title, w.responsiblePerson, w.allocatedWorks, w.expectedDate, w.actualDate || "—",
            ]),
            headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
            margin: margins,
            columnStyles: { 0: { cellWidth: 10, halign: "center" as const }, 3: { cellWidth: 48 } },
            didDrawPage: didDraw,
          });
          y = lastY() + 6;
        }

        if (cc.pirOutcome || cc.pirComment || cc.closeComment) {
          y = checkPage(y, 35);
          y = drawSubSection("Post-Implementation Review (PIR) & Closure", y);
          autoTable(doc, {
            startY: y,
            head: [["Field", "Value"]],
            body: [
              ["PIR Outcome", cc.pirOutcome || "—"],
              ["PIR Date", cc.pirDate || "—"],
              ["PIR Comment", cc.pirComment || "—"],
              ["Close Comment", cc.closeComment || "—"],
            ],
            headStyles, bodyStyles, alternateRowStyles: { fillColor: LIGHT },
            margin: margins,
            columnStyles: { 0: { fontStyle: "bold" as const, fillColor: LIGHT, cellWidth: 45 } },
            didDrawPage: didDraw,
          });
          y = lastY() + 8;
        }
      }

      // ── PAGE FOOTERS ─────────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
        doc.setDrawColor(200, 210, 225); doc.setLineWidth(0.3);
        doc.line(14, pageH - 10, pageW - 14, pageH - 10);
        doc.text(`Capalyst QMS  ·  CPT  ·  ${deviation.deviationNumber}  ·  CONTROLLED DOCUMENT`, 14, pageH - 5.5);
        doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 5.5, { align: "right" });
      }

      const ts = format(new Date(), "yyyyMMdd_HHmm");
      doc.save(`TraceabilityReport_${deviation.deviationNumber}_${ts}.pdf`);
      toast({ title: "Report downloaded", description: `${pageCount}-page PDF — ${deviation.deviationNumber}` });
    } catch (e) {
      toast({ title: "Report generation failed", description: "Please try again.", variant: "destructive" });
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  }


    const addRelated = useAddRelatedDeviation();
    const removeRelated = useRemoveRelatedDeviation();

    const linkSearchQuery = useListDeviations(
      { search: linkQuery, pageSize: 8 },
      { query: { queryKey: getListDeviationsQueryKey({ search: linkQuery, pageSize: 8 }), enabled: linkQuery.length >= 2 } }
    );
    const linkSearchResults = linkSearchQuery.data?.data ?? [];

    const invalidateRelated = () =>
      queryClient.invalidateQueries({ queryKey: getGetRelatedDeviationsQueryKey(Number(id)) });

    /* ── Accept tab ── */
    const [acceptForm, setAcceptForm] = useState({ eventPriority: "", areaResponsibleComment: "", requiresInvestigation: false, qaComment: "" });
    const [acceptSaving, setAcceptSaving] = useState(false);

    /* ── Delegate QA Expert ── */
    const [delegateOpen, setDelegateOpen] = useState(false);
    const [delegateUser, setDelegateUser] = useState("");
    const [delegateSaving, setDelegateSaving] = useState(false);

    /* ── Delegate Area Responsible ── */
    const [delegateAreaOpen, setDelegateAreaOpen] = useState(false);
    const [delegateAreaUser, setDelegateAreaUser] = useState("");
    const [delegateAreaSaving, setDelegateAreaSaving] = useState(false);

    /* ── Delegate Investigation Leader ── */
    const [delegateLeaderOpen, setDelegateLeaderOpen] = useState(false);
    const [delegateLeaderUser, setDelegateLeaderUser] = useState("");
    const [delegateLeaderSaving, setDelegateLeaderSaving] = useState(false);

    /* ── Role Assignment tab ── */
    const [roleForm, setRoleForm] = useState({ investigationLeader: "", assignedExpert: "", riskManager: "", assignedAdditionalQa: "" });
    const [roleSaving, setRoleSaving] = useState(false);

    /* ── QA Investigation tab ── */
    const [invForm, setInvForm] = useState({
      investigation: "", productImpact: "", gxpCompliance: "", gmpComment: "",
      extendedDate: "", extendedDateComment: "", barrier: "", secondBarrier: "", teamMembers: "",
    });
    const [invSaving, setInvSaving] = useState(false);

    /* ── Risk Management tab ── */
    const [rmForm, setRmForm] = useState({ rmPotentialRisk: false, rmComment: "" });
    const [rmSaving, setRmSaving] = useState(false);

    /* ── Root Cause tab ── */
    const [rcForm, setRcForm] = useState({ rootCauseCategory: "", rootCause: "", solvingMethod: "", isRepeatedDeviation: false, repeatedDeviationComment: "" });
    const [rcSaving, setRcSaving] = useState(false);

    /* ── CAPA & ER tab ── */
    const [capaForm, setCapaForm] = useState({ capaNeeded: false, capaComment: "", erNeeded: false, erComment: "" });
    const [capaSaving, setCapaSaving] = useState(false);
    const [genCapaLoading, setGenCapaLoading] = useState(false);

    /* ── Completion ── */
    const [completionComment, setCompletionComment] = useState("");
    const [closingSaving, setClosingSaving] = useState(false);

    /* ── Workflow loading ── */
    const [wfLoading, setWfLoading] = useState(false);

    /* ── E-Signature gate ── */
    type EsigConfig = Omit<ESignatureDialogProps, "open" | "onOpenChange">;
    const [esig, setEsig] = useState<EsigConfig | null>(null);
    const openEsig = (cfg: EsigConfig) => setEsig(cfg);

    useEffect(() => {
      if (!dev) return;
      setEditForm({
        title: dev.title ?? "", description: dev.description ?? "",
        immediateAction: dev.immediateAction ?? "", deviationType: dev.deviationType ?? "",
        location: dev.location ?? "", externalReference: dev.externalReference ?? "",
        areaResponsible: dev.areaResponsible ?? "", qaExpert: dev.qaExpert ?? "",
        eventDate: dev.eventDate ?? "", detectionDate: dev.detectionDate ?? "",
        operation: dev.operation ?? "",
        batchLotNumber: (dev as unknown as Record<string, string>).batchLotNumber ?? "",
      });
      setEditEquipment(parseJSON<string[]>(dev.equipment, []));
      setEditProducts(parseJSON<ProductRow[]>(dev.products, []));
      setAcceptForm({ eventPriority: dev.eventPriority ?? "", areaResponsibleComment: dev.areaResponsibleComment ?? "", requiresInvestigation: dev.requiresInvestigation ?? false, qaComment: dev.qaComment ?? "" });
      setRoleForm({ investigationLeader: dev.investigationLeader ?? "", assignedExpert: dev.assignedExpert ?? "", riskManager: dev.riskManager ?? "", assignedAdditionalQa: dev.assignedAdditionalQa ?? "" });
      setInvForm({ investigation: dev.investigation ?? "", productImpact: dev.productImpact ?? "", gxpCompliance: dev.gxpCompliance ?? "", gmpComment: dev.gmpComment ?? "", extendedDate: dev.extendedDate ?? "", extendedDateComment: dev.extendedDateComment ?? "", barrier: dev.barrier ?? "", secondBarrier: dev.secondBarrier ?? "", teamMembers: dev.teamMembers ?? "" });
      setRmForm({ rmPotentialRisk: dev.rmPotentialRisk ?? false, rmComment: dev.rmComment ?? "" });
      setRcForm({ rootCauseCategory: dev.rootCauseCategory ?? "", rootCause: dev.rootCause ?? "", solvingMethod: dev.solvingMethod ?? "", isRepeatedDeviation: dev.isRepeatedDeviation ?? false, repeatedDeviationComment: dev.repeatedDeviationComment ?? "" });
      setCapaForm({ capaNeeded: dev.capaNeeded ?? false, capaComment: dev.capaComment ?? "", erNeeded: dev.erNeeded ?? false, erComment: dev.erComment ?? "" });
      setCompletionComment(dev.completionComment ?? "");
    }, [dev]);

    const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: getGetDeviationQueryKey(Number(id)) }), [queryClient, id]);
    const invalidateCapas = () => queryClient.invalidateQueries({ queryKey: getListCapaQueryKey({ deviationId: Number(id), pageSize: 50 }) });

    const doUpdate = (data: Parameters<typeof update.mutate>[0]["data"], onDone?: () => void) => {
      update.mutate({ id: Number(id), data }, {
        onSuccess: () => { toast({ title: "Saved successfully" }); invalidate(); onDone?.(); },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      });
    };

    const handleEditSave = () => doUpdate({
      ...editForm,
      equipment: JSON.stringify(editEquipment),
      products: JSON.stringify(editProducts),
    }, () => setEditOpen(false));

    /* ── Workflow API helper ── */
    const callWorkflow = async (action: string, body: Record<string, unknown> = {}): Promise<void> => {
      const res = await fetch(`/api/deviations/${id}/${action}`, {
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

    const runWf = (action: string, body: Record<string, unknown>, successMsg: string) => async () => {
      setWfLoading(true);
      try {
        await callWorkflow(action, body);
        toast({ title: successMsg });
        invalidate();
      } catch (e) {
        toast({ title: (e as Error).message, variant: "destructive" });
      } finally {
        setWfLoading(false);
      }
    };

    const handleGenerateCapa = async () => {
      setGenCapaLoading(true);
      try {
        const res = await fetch(`/api/deviations/${id}/generate-capa`, { method: "POST", credentials: "include" });
        if (res.status === 409) {
          const data = await res.json();
          toast({ title: "CAPA already exists", description: data.existing?.capaNumber ?? "" });
          if (data.existing?.id) navigate(`/capa/${data.existing.id}`);
          return;
        }
        if (!res.ok) { toast({ title: "Failed to generate CAPA", variant: "destructive" }); return; }
        const data = await res.json();
        toast({ title: `${data.capaNumber} created` });
        invalidate(); invalidateCapas();
      } catch { toast({ title: "Network error", variant: "destructive" }); }
      finally { setGenCapaLoading(false); }
    };

    /* ── Loading ── */
    if (isLoading) return (
      <PageTransition className="p-6">
        <Skeleton className="h-8 w-64 mb-8" />
        <Skeleton className="h-[600px] w-full" />
      </PageTransition>
    );
    if (!dev) return <div className="p-6">Deviation not found</div>;

    /* ── Computed values ── */
    const isClosed = dev.status === "Closed";
    const wfStatus: string = (dev as Record<string, unknown>).workflowStatus as string ??
      (dev.status === "Closed" ? "Completed" : dev.status === "Draft" ? "Draft" : "Submitted");
    const isCompleted = wfStatus === "Completed" || isClosed;

    const currentUserName = currentUser?.name ?? "";
    const isQA = currentUser?.roles?.includes("QA") ?? false;
    const isAreaResponsible = currentUserName !== "" && currentUserName === dev.areaResponsible;
    const isQAExpert = currentUserName !== "" && currentUserName === dev.qaExpert;
    const isInvestigationLeader = !!dev.investigationLeader && currentUserName === dev.investigationLeader;
    const isAssignedExpert = !!dev.assignedExpert && currentUserName === dev.assignedExpert;

    const devEquipment = parseJSON<string[]>(dev.equipment, []);
    const devProducts = parseJSON<ProductRow[]>(dev.products, []);

    const wfBadge = WF_BADGE[wfStatus] ?? { label: wfStatus, className: "bg-gray-100 text-gray-700" };

    const priorityColor = (p?: string | null) => {
      if (p === "Critical") return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300";
      if (p === "High" || p === "Major") return "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300";
      if (p === "Medium" || p === "Moderate") return "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300";
      if (p === "Minor" || p === "Low" || p === "None") return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300";
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300";
    };

    const IMPACT_SEVERITY_ORDER = ["None", "Minor", "Moderate", "Major", "Critical"];
    const derivedPriority = (() => {
      const a = IMPACT_SEVERITY_ORDER.indexOf(invForm.productImpact);
      const b = IMPACT_SEVERITY_ORDER.indexOf(invForm.gxpCompliance);
      if (a < 0 && b < 0) return null;
      if (a < 0) return invForm.gxpCompliance || null;
      if (b < 0) return invForm.productImpact || null;
      return a >= b ? invForm.productImpact : invForm.gxpCompliance;
    })();

    const tabs = [
      { value: "general",        icon: FileText,    label: "General",          done: false },
      { value: "accept",         icon: CheckCircle2, label: "Accept",          done: wfAtOrPast(wfStatus, "QA_Accepted") },
      { value: "roles",          icon: Users,        label: "Role Assignment",  done: wfAtOrPast(wfStatus, "Roles_Assigned") },
      { value: "investigation",  icon: Activity,     label: "QA Investigation", done: wfAtOrPast(wfStatus, "Investigation_Submitted") },
      { value: "riskmanagement", icon: ShieldAlert,  label: "Risk Management",  done: wfAtOrPast(wfStatus, "Risk_Mgmt_Submitted") },
      { value: "rootcause",      icon: GitBranch,    label: "Root Cause",       done: wfAtOrPast(wfStatus, "Root_Cause_Submitted") },
      { value: "capa",           icon: LinkIcon,     label: "CAPA & ER",        done: wfAtOrPast(wfStatus, "CAPA_ER_Submitted") },
      { value: "completion",     icon: Flag,         label: "Completion",       done: isCompleted },
      { value: "attachments",    icon: Paperclip,    label: "Attachment",       done: false },
      { value: "history",        icon: History,      label: "Logs",             done: false },
    ];

    /* ── Workflow submit button component ── */
    const WfSubmitBtn = ({
      label, action, body, esigTitle, esigDesc, canAct, saving,
    }: {
      label: string; action: string; body: Record<string, unknown>;
      esigTitle: string; esigDesc?: string; canAct: boolean; saving?: boolean;
    }) => {
      if (isCompleted) return null;
      if (!canAct) {
        if (isUserLoading) {
          return (
            <div className="pt-2">
              <Button size="sm" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </Button>
            </div>
          );
        }
        return (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground italic">You do not have permission to submit this section, or the workflow is not at this stage yet.</p>
          </div>
        );
      }
      return (
        <div className="flex justify-start pt-2">
          <Button size="sm" onClick={() => openEsig({
            title: esigTitle,
            description: esigDesc,
            actionLabel: "Submit",
            onConfirmed: runWf(action, body, `${label} submitted`),
          })} disabled={wfLoading || saving}>
            {(wfLoading || saving) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {label}
          </Button>
        </div>
      );
    };

    return (
      <PageTransition className="p-6 pb-20">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
            <Link href="/deviations"><ChevronLeft className="h-4 w-4 mr-1" />Back to Deviations</Link>
          </Button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight">{dev.deviationNumber}</h1>
                <StatusBadge status={dev.status} className="text-sm" />
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${wfBadge.className}`}>{wfBadge.label}</span>
                {dev.eventPriority && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColor(dev.eventPriority)}`}>{dev.eventPriority}</span>
                )}
                {dev.isOverdue && !isCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </span>
                )}
              </div>
              <h2 className="text-base text-muted-foreground">{dev.title}</h2>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => void generateTraceabilityReport()} disabled={isGeneratingReport} className="no-print">
                {isGeneratingReport ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                {isGeneratingReport ? "Generating..." : "Download Report"}
              </Button>
              {!isCompleted && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-1.5" />Edit
                </Button>
              )}
              {(wfStatus === "Draft" || wfStatus === "Area_Rejected" || wfStatus === "QA_Rejected") && (
                <Button size="sm" onClick={() => openEsig({
                  title: wfStatus === "Draft" ? "Submit Deviation" : "Re-Submit Deviation",
                  description: "This deviation will be submitted for area responsible review. Your e-signature confirms this action.",
                  actionLabel: "Submit",
                  onConfirmed: runWf("submit", {}, wfStatus === "Draft" ? "Deviation submitted" : "Deviation re-submitted"),
                })} disabled={wfLoading}>
                  {wfLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Zap className="h-4 w-4 mr-1.5" />}
                  {wfStatus === "Draft" ? "Submit Deviation" : "Re-Submit Deviation"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mb-4">
          <span className="font-medium">Deviation Number:</span>{" "}
          <span className="font-semibold text-foreground">{dev.deviationNumber}</span>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto bg-transparent p-0 flex-wrap gap-0 mb-0">
            {tabs.map(({ value, icon: Icon, label, done }) => (
              <TabsTrigger key={value} value={value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-3 text-sm font-medium">
                <Icon className={`w-4 h-4 mr-1.5 ${done ? "text-green-600 dark:text-green-500" : ""}`} />
                <span className={done ? "text-green-600 dark:text-green-500" : ""}>{label}</span>
                {done && <svg className="w-3 h-3 ml-1 text-green-600 dark:text-green-500 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm3.354-9.354a.5.5 0 0 0-.708-.708L7 8.586 5.354 6.94a.5.5 0 0 0-.708.708l2 2a.5.5 0 0 0 .708 0l4-4z" clipRule="evenodd" /></svg>}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── GENERAL ── */}
          <TabsContent value="general" className="mt-6 space-y-6">
            {similarItems.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">
                    {similarItems.length} similar deviation{similarItems.length !== 1 ? "s" : ""} detected in the past 12 months
                  </span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">Each result shares the deviation type plus at least one additional matching field</p>
                <div className="space-y-2 mt-1">
                  {similarItems.map((s) => (
                    <div key={s.id} className="text-xs bg-white dark:bg-zinc-900 rounded px-3 py-2 border border-amber-100 dark:border-amber-800/30 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-amber-900 dark:text-amber-200 shrink-0">{s.deviationNumber}</span>
                        <span className="text-muted-foreground truncate flex-1">{s.title}</span>
                        <Link to={`/deviations/${s.id}`} className="text-primary hover:underline shrink-0">View</Link>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {s.matchedFields.map((field) => (
                          <span key={field} className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-medium">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Card>
              <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <DataField label="Title" value={dev.title} />
                  <DataField label="Type" value={dev.deviationType} />
                  <DataField label="Operation" value={dev.operation} />
                  <DataField label="Event Date" value={format(new Date(dev.eventDate), "PPP")} />
                  <DataField label="Detection Date" value={format(new Date(dev.detectionDate), "PPP")} />
                  {dev.isOverdue && !isCompleted ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Due Date</p>
                      <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                        {format(new Date(dev.dueDate), "PPP")}
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      </p>
                    </div>
                  ) : (
                    <DataField label="Due Date" value={format(new Date(dev.dueDate), "PPP")} />
                  )}
                  {dev.extendedDate && <DataField label="Extended Date" value={format(new Date(dev.extendedDate), "PPP")} />}
                  <DataField label="Location" value={dev.location} />
                  <DataField label="External Reference" value={dev.externalReference} />
                  {(dev as unknown as Record<string, string>).batchLotNumber && (
                    <DataField label="Batch / Lot Number" value={(dev as unknown as Record<string, string>).batchLotNumber} />
                  )}
                  <DataField label="Area Responsible" value={dev.areaResponsible} />
                  <DataField label="QA Expert" value={dev.qaExpert} />
                </div>
                <DataField label="Description" value={dev.description} multiline />
                {dev.immediateAction && <DataField label="Immediate Action Taken" value={dev.immediateAction} multiline />}
                {devEquipment.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Equipment</label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/20">
                      {devEquipment.map((e) => (
                        <span key={e} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
                {devProducts.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Products</label>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="text-xs">Product Code</TableHead>
                            <TableHead className="text-xs">Lot</TableHead>
                            <TableHead className="text-xs">Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {devProducts.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm">{p.code || "—"}</TableCell>
                              <TableCell className="text-sm">{p.lot || "—"}</TableCell>
                              <TableCell className="text-sm">{p.description || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── RELATED DEVIATIONS ── */}
            <Card>
              <CardHeader><CardTitle className="text-base">Related Deviations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {relatedLinks.length > 0 && (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs">Number</TableHead>
                          <TableHead className="text-xs">Title</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(relatedLinks as unknown as Array<Record<string, string | number>>).map((link) => {
                          const otherId = link.deviationId === Number(id) ? link.relatedDeviationId : link.deviationId;
                          return (
                            <TableRow key={link.id}>
                              <TableCell className="text-sm font-medium">
                                <Link to={`/deviations/${otherId}`} className="text-primary hover:underline">
                                  {String(link.relatedDeviationNumber)}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{String(link.relatedTitle)}</TableCell>
                              <TableCell className="text-sm">
                                <StatusBadge status={String(link.relatedStatus)} />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  disabled={removeRelated.isPending}
                                  onClick={() => removeRelated.mutate({ id: Number(id), relatedId: Number(otherId) }, { onSuccess: () => invalidateRelated() })}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {!isCompleted && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Link a deviation</Label>
                    <Input
                      placeholder="Search by deviation number or title…"
                      value={linkQuery}
                      onChange={(e) => setLinkQuery(e.target.value)}
                    />
                    {linkQuery.length >= 2 && linkSearchResults.length > 0 && (
                      <div className="rounded-md border divide-y max-h-52 overflow-y-auto">
                        {linkSearchResults
                          .filter((r) => r.id !== Number(id))
                          .map((r) => (
                            <div key={r.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 text-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium shrink-0">{r.deviationNumber}</span>
                                <span className="text-muted-foreground truncate">{r.title}</span>
                              </div>
                              <Button
                                variant="outline" size="sm" className="shrink-0 ml-2 h-7 text-xs"
                                disabled={addRelated.isPending}
                                onClick={() => addRelated.mutate(
                                  { id: Number(id), data: { relatedDeviationId: r.id } },
                                  { onSuccess: () => { setLinkQuery(""); invalidateRelated(); } }
                                )}
                              >Link</Button>
                            </div>
                          ))}
                      </div>
                    )}
                    {linkQuery.length >= 2 && !linkSearchQuery.isLoading && linkSearchResults.filter(r => r.id !== Number(id)).length === 0 && (
                      <p className="text-xs text-muted-foreground">No deviations found for "{linkQuery}"</p>
                    )}
                  </div>
                )}

                {relatedLinks.length === 0 && isCompleted && (
                  <p className="text-sm text-muted-foreground">No related deviations linked.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ACCEPT ── */}
          <TabsContent value="accept" className="mt-6 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-6">

                {/* ── Area Responsible Section ── */}
                <SectionHeader title="Acceptance by Area Responsible" />
                {wfStatus === "Area_Rejected" && (dev as Record<string, unknown>).areaRejectReason && (
                  <RejectionBanner reason={(dev as Record<string, unknown>).areaRejectReason as string} by="Area Responsible" />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Event Priority</Label>
                    <Select
                      value={acceptForm.eventPriority}
                      onValueChange={(v) => setAcceptForm((f) => ({ ...f, eventPriority: v }))}
                      disabled={isCompleted || !["Submitted", "Area_Rejected"].includes(wfStatus)}>
                      <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>{priorityLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <DataField label="Area Responsible" value={dev.areaResponsible} />
                </div>
                <div className="space-y-1.5">
                  <Label>Area Responsible Comment</Label>
                  <Textarea
                    rows={3}
                    placeholder="Enter area responsible acceptance comments..."
                    value={acceptForm.areaResponsibleComment}
                    onChange={(e) => setAcceptForm((f) => ({ ...f, areaResponsibleComment: e.target.value }))}
                    disabled={isCompleted || !["Submitted", "Area_Rejected"].includes(wfStatus)} />
                </div>

                {/* Area action buttons */}
                {!isUserLoading && ["Submitted", "Area_Rejected"].includes(wfStatus) && isAreaResponsible && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => openEsig({
                      title: "Accept Deviation — Area Responsible",
                      description: "Your e-signature confirms acceptance of this deviation as the Area Responsible.",
                      actionLabel: "Accept",
                      onConfirmed: runWf("area-accept", { eventPriority: acceptForm.eventPriority, areaResponsibleComment: acceptForm.areaResponsibleComment }, "Area accepted the deviation"),
                    })} disabled={wfLoading}>
                      {wfLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                      Accept
                    </Button>
                    {wfStatus === "Submitted" && (
                      <Button size="sm" variant="destructive" onClick={() => openEsig({
                        title: "Reject Deviation — Area Responsible",
                        description: "Provide a reason so the submitter knows what to correct.",
                        actionLabel: "Reject",
                        withReason: true,
                        reasonLabel: "Rejection Reason",
                        onConfirmed: (reason) => runWf("area-reject", { reason, areaResponsibleComment: acceptForm.areaResponsibleComment }, "Deviation rejected by area")(),
                      })} disabled={wfLoading}>
                        <XCircle className="h-4 w-4 mr-1.5" />Reject
                      </Button>
                    )}
                  </div>
                )}
                {wfAtOrPast(wfStatus, "Area_Accepted") && wfStatus !== "QA_Rejected" && (
                  <AcceptedBadge label="Accepted by Area Responsible" />
                )}

                <div className="h-px bg-border" />

                {/* ── QA Section ── */}
                <SectionHeader title="Acceptance by Quality Expert" />
                {wfStatus === "QA_Rejected" && (dev as Record<string, unknown>).qaRejectReason && (
                  <RejectionBanner reason={(dev as Record<string, unknown>).qaRejectReason as string} by="QA" />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <YesNoRadio
                    label="QA investigation needed"
                    value={acceptForm.requiresInvestigation}
                    onChange={(v) => setAcceptForm((f) => ({ ...f, requiresInvestigation: v }))}
                    disabled={isCompleted || !["Area_Accepted", "QA_Rejected"].includes(wfStatus)}
                    id="qa-invest" />
                  <DataField label="QA Expert" value={dev.qaExpert} />
                </div>
                <div className="space-y-1.5">
                  <Label>QA Comment</Label>
                  <Textarea
                    rows={3}
                    placeholder="Enter QA acceptance comments..."
                    value={acceptForm.qaComment}
                    onChange={(e) => setAcceptForm((f) => ({ ...f, qaComment: e.target.value }))}
                    disabled={isCompleted || !["Area_Accepted", "QA_Rejected"].includes(wfStatus)} />
                </div>

                {/* QA action buttons — the assigned QA Expert or any QA-role user can Accept/Reject */}
                {!isUserLoading && ["Area_Accepted", "QA_Rejected"].includes(wfStatus) && (isQAExpert || isQA) && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => openEsig({
                      title: "Accept Deviation — QA",
                      description: "Your e-signature confirms QA acceptance of this deviation.",
                      actionLabel: "Accept",
                      onConfirmed: runWf("qa-accept", { requiresInvestigation: acceptForm.requiresInvestigation, qaComment: acceptForm.qaComment }, "QA accepted the deviation"),
                    })} disabled={wfLoading}>
                      {wfLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                      Accept
                    </Button>
                    {wfStatus === "Area_Accepted" && (
                      <Button size="sm" variant="destructive" onClick={() => openEsig({
                        title: "Reject Deviation — QA",
                        description: "Provide a reason so the submitter knows what to correct.",
                        actionLabel: "Reject",
                        withReason: true,
                        reasonLabel: "Rejection Reason",
                        onConfirmed: (reason) => runWf("qa-reject", { reason, qaComment: acceptForm.qaComment }, "QA rejected the deviation")(),
                      })} disabled={wfLoading}>
                        <XCircle className="h-4 w-4 mr-1.5" />Reject
                      </Button>
                    )}
                  </div>
                )}
                {/* QA Admin can delegate to a different expert if the assigned one is unavailable */}
                {!isUserLoading && ["Area_Accepted", "QA_Rejected"].includes(wfStatus) && isQA && !isQAExpert && (
                  <div className="pt-1">
                    <Button size="sm" variant="outline" onClick={() => { setDelegateUser(dev.qaExpert ?? ""); setDelegateOpen(true); }} disabled={wfLoading}>
                      <Users className="h-4 w-4 mr-1.5" />Delegate QA Expert
                    </Button>
                  </div>
                )}
                {/* QA can reassign the Area Responsible if the original is unavailable */}
                {!isUserLoading && !isCompleted && wfStatus !== "Draft" && isQA && !isAreaResponsible && (
                  <div className="pt-1">
                    <Button size="sm" variant="outline" onClick={() => { setDelegateAreaUser(dev.areaResponsible ?? ""); setDelegateAreaOpen(true); }} disabled={wfLoading}>
                      <Users className="h-4 w-4 mr-1.5" />Delegate Area Responsible
                    </Button>
                  </div>
                )}
                {wfAtOrPast(wfStatus, "QA_Accepted") && (
                  <AcceptedBadge label="Accepted by QA" />
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ROLE ASSIGNMENT ── */}
          <TabsContent value="roles" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Role Assignment</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Investigation Leader</Label>
                    <UserPicker value={roleForm.investigationLeader} onChange={(v) => setRoleForm((f) => ({ ...f, investigationLeader: v }))} disabled={isCompleted || wfStatus !== "QA_Accepted"} placeholder="Select investigation leader..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Assigned Expert</Label>
                    <UserPicker value={roleForm.assignedExpert} onChange={(v) => setRoleForm((f) => ({ ...f, assignedExpert: v }))} disabled={isCompleted || wfStatus !== "QA_Accepted"} placeholder="Select assigned expert..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Risk Manager</Label>
                    <UserPicker value={roleForm.riskManager} onChange={(v) => setRoleForm((f) => ({ ...f, riskManager: v }))} disabled={isCompleted || wfStatus !== "QA_Accepted"} placeholder="Select risk manager..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Assigned Additional QA</Label>
                    <UserPicker value={roleForm.assignedAdditionalQa} onChange={(v) => setRoleForm((f) => ({ ...f, assignedAdditionalQa: v }))} disabled={isCompleted || wfStatus !== "QA_Accepted"} placeholder="Select additional QA..." />
                  </div>
                </div>
                {wfAtOrPast(wfStatus, "Roles_Assigned") ? (
                  <AcceptedBadge label="Roles assigned and submitted" />
                ) : (
                  <WfSubmitBtn
                    label="Submit Role Assignment"
                    action="submit-roles"
                    body={roleForm}
                    esigTitle="Submit Role Assignment"
                    esigDesc="Your e-signature confirms the role assignments for this deviation investigation. Only QA users can submit this section."
                    canAct={isQA && wfStatus === "QA_Accepted"}
                    saving={roleSaving}
                  />
                )}
                {/* QA can reassign the Investigation Leader if the original is unavailable */}
                {!isUserLoading && !isCompleted && wfAtOrPast(wfStatus, "Roles_Assigned") && isQA && !isInvestigationLeader && (
                  <div className="pt-1">
                    <Button size="sm" variant="outline" onClick={() => { setDelegateLeaderUser(dev.investigationLeader ?? ""); setDelegateLeaderOpen(true); }}>
                      <Users className="h-4 w-4 mr-1.5" />Delegate Investigation Leader
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── QA INVESTIGATION ── */}
          <TabsContent value="investigation" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-5">
                <SectionHeader title="QA - Event Assessment" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Product Impact</Label>
                    <Select value={invForm.productImpact} onValueChange={(v) => setInvForm((f) => ({ ...f, productImpact: v }))} disabled={isCompleted || wfStatus !== "Roles_Assigned"}>
                      <SelectTrigger><SelectValue placeholder="Select impact" /></SelectTrigger>
                      <SelectContent>{impactLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>GxP Compliance</Label>
                    <Select value={invForm.gxpCompliance} onValueChange={(v) => setInvForm((f) => ({ ...f, gxpCompliance: v }))} disabled={isCompleted || wfStatus !== "Roles_Assigned"}>
                      <SelectTrigger><SelectValue placeholder="Select GxP compliance" /></SelectTrigger>
                      <SelectContent>{impactLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {derivedPriority && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Event Priority:</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${priorityColor(derivedPriority)}`}>
                      {derivedPriority}
                    </span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Impact comment</Label>
                  <Textarea rows={3} placeholder="Describe the impact..." value={invForm.gmpComment} onChange={(e) => setInvForm((f) => ({ ...f, gmpComment: e.target.value }))} disabled={isCompleted || wfStatus !== "Roles_Assigned"} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input type="date" value={dev.dueDate} readOnly className="bg-muted/30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Extended Due Date</Label>
                    <Input type="date" value={invForm.extendedDate} min={dev.dueDate} onChange={(e) => setInvForm((f) => ({ ...f, extendedDate: e.target.value }))} disabled={isCompleted || wfStatus !== "Roles_Assigned" || (!isQA && !isQAExpert)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Extended due date comment</Label>
                  <Textarea rows={2} placeholder="Reason for extending..." value={invForm.extendedDateComment} onChange={(e) => setInvForm((f) => ({ ...f, extendedDateComment: e.target.value }))} disabled={isCompleted || wfStatus !== "Roles_Assigned" || (!isQA && !isQAExpert)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Barrier</Label>
                    <Select value={invForm.barrier} onValueChange={(v) => setInvForm((f) => ({ ...f, barrier: v }))} disabled={isCompleted || wfStatus !== "Roles_Assigned"}>
                      <SelectTrigger><SelectValue placeholder="Select barrier type" /></SelectTrigger>
                      <SelectContent>{barrierTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>2nd Barrier</Label>
                    <Select value={invForm.secondBarrier} onValueChange={(v) => setInvForm((f) => ({ ...f, secondBarrier: v }))} disabled={isCompleted || wfStatus !== "Roles_Assigned"}>
                      <SelectTrigger><SelectValue placeholder="Select 2nd barrier" /></SelectTrigger>
                      <SelectContent>{barrierTypes.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Team members</Label>
                  <MultiUserPicker value={invForm.teamMembers} onChange={(v) => setInvForm((f) => ({ ...f, teamMembers: v }))} disabled={isCompleted || wfStatus !== "Roles_Assigned"} />
                </div>
                <div className="space-y-1.5">
                  <Label>Investigation Summary</Label>
                  <Textarea rows={4} placeholder="Describe the investigation findings..." value={invForm.investigation} onChange={(e) => setInvForm((f) => ({ ...f, investigation: e.target.value }))} disabled={isCompleted || wfStatus !== "Roles_Assigned"} />
                </div>
                {wfAtOrPast(wfStatus, "Investigation_Submitted") ? (
                  <AcceptedBadge label="Investigation submitted" />
                ) : (
                  <WfSubmitBtn
                    label="Submit Investigation"
                    action="submit-investigation"
                    body={invForm}
                    esigTitle="Submit QA Investigation"
                    esigDesc="Your e-signature confirms the QA investigation summary. Only the QA Expert can submit this section."
                    canAct={(isQAExpert || isQA) && wfStatus === "Roles_Assigned"}
                    saving={invSaving}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── RISK MANAGEMENT ── */}
          <TabsContent value="riskmanagement" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-5">
                <SectionHeader title="Potential risk" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <YesNoRadio label="RM - Potential Risk" value={rmForm.rmPotentialRisk} onChange={(v) => setRmForm((f) => ({ ...f, rmPotentialRisk: v }))} disabled={isCompleted || wfStatus !== "Investigation_Submitted"} id="rm-risk" />
                  <DataField label="Risk Manager" value={dev.riskManager || roleForm.riskManager || "—"} />
                </div>
                <div className="space-y-1.5">
                  <Label>RM Comment</Label>
                  <Textarea rows={4} placeholder="Describe the potential risk..." value={rmForm.rmComment} onChange={(e) => setRmForm((f) => ({ ...f, rmComment: e.target.value }))} disabled={isCompleted || wfStatus !== "Investigation_Submitted"} />
                </div>
                {wfAtOrPast(wfStatus, "Risk_Mgmt_Submitted") ? (
                  <AcceptedBadge label="Risk management submitted" />
                ) : (
                  <WfSubmitBtn
                    label="Submit Risk Management"
                    action="submit-risk-management"
                    body={rmForm}
                    esigTitle="Submit Risk Management"
                    esigDesc="Your e-signature confirms the risk management assessment. Only QA users can submit this section."
                    canAct={isQA && wfStatus === "Investigation_Submitted"}
                    saving={rmSaving}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ROOT CAUSE ── */}
          <TabsContent value="rootcause" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={rcForm.rootCauseCategory} onValueChange={(v) => setRcForm((f) => ({ ...f, rootCauseCategory: v }))} disabled={isCompleted || wfStatus !== "Risk_Mgmt_Submitted"}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>{rootCauseCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Solving Method</Label>
                    <Select value={rcForm.solvingMethod} onValueChange={(v) => setRcForm((f) => ({ ...f, solvingMethod: v }))} disabled={isCompleted || wfStatus !== "Risk_Mgmt_Submitted"}>
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>{solvingMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Root Cause Summary</Label>
                  <Textarea rows={4} placeholder="Describe the identified root cause(s)..." value={rcForm.rootCause} onChange={(e) => setRcForm((f) => ({ ...f, rootCause: e.target.value }))} disabled={isCompleted || wfStatus !== "Risk_Mgmt_Submitted"} />
                </div>
                {similarItems.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-semibold">
                        {similarItems.length} similar deviation{similarItems.length !== 1 ? "s" : ""} detected in the past 12 months
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">Each result shares the deviation type plus at least one additional matching field</p>
                    <div className="space-y-2 mt-1">
                      {similarItems.map((s) => (
                        <div key={s.id} className="text-xs bg-white dark:bg-zinc-900 rounded px-3 py-2 border border-amber-100 dark:border-amber-800/30 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-amber-900 dark:text-amber-200 shrink-0">{s.deviationNumber}</span>
                            <span className="text-muted-foreground truncate flex-1">{s.title}</span>
                            <Link to={`/deviations/${s.id}`} className="text-primary hover:underline shrink-0">View</Link>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {s.matchedFields.map((field) => (
                              <span key={field} className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-medium">
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <YesNoRadio label="Repeated Deviation" value={rcForm.isRepeatedDeviation} onChange={(v) => setRcForm((f) => ({ ...f, isRepeatedDeviation: v }))} disabled={isCompleted || wfStatus !== "Risk_Mgmt_Submitted"} id="rc-repeated" />
                {rcForm.isRepeatedDeviation && (
                  <div className="space-y-1.5">
                    <Label>Repeated Deviation Comment</Label>
                    <Textarea rows={3} placeholder="Explain why this deviation is repeated..." value={rcForm.repeatedDeviationComment} onChange={(e) => setRcForm((f) => ({ ...f, repeatedDeviationComment: e.target.value }))} disabled={isCompleted || wfStatus !== "Risk_Mgmt_Submitted"} />
                  </div>
                )}
                {wfAtOrPast(wfStatus, "Root_Cause_Submitted") ? (
                  <AcceptedBadge label="Root cause submitted" />
                ) : (
                  <WfSubmitBtn
                    label="Submit Root Cause"
                    action="submit-root-cause"
                    body={rcForm}
                    esigTitle="Submit Root Cause Analysis"
                    esigDesc="Your e-signature confirms the root cause analysis. Only the Investigation Leader or Assigned Expert can submit this section."
                    canAct={(isInvestigationLeader || isAssignedExpert) && wfStatus === "Risk_Mgmt_Submitted"}
                    saving={rcSaving}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CAPA & ER ── */}
          <TabsContent value="capa" className="mt-6 space-y-4">
            {!isUserLoading && !isCompleted && (isQA || isQAExpert) && (
              <div className="flex justify-start gap-2">
                <Button variant="outline" size="sm" onClick={() => openEsig({
                  title: "Generate CAPA",
                  description: "A new CAPA record will be created and linked to this deviation. Only QA Expert or QA can generate a CAPA.",
                  actionLabel: "Generate",
                  onConfirmed: handleGenerateCapa,
                })} disabled={genCapaLoading}>
                  {genCapaLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Zap className="h-4 w-4 mr-1.5" />}
                  Generate CAPA
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!firstCapaId}
                  title={firstCapaId ? "Open the Efficacy Review tab for the linked CAPA" : "Generate a CAPA first before creating an ER"}
                  onClick={() => {
                    if (!firstCapaId) {
                      toast({ title: "No CAPA linked", description: "Generate a CAPA for this deviation first." });
                      return;
                    }
                    navigate(`/capa/${firstCapaId}?tab=er`);
                  }}
                >
                  <FlaskConical className="h-4 w-4 mr-1.5" />
                  Generate ER
                </Button>
              </div>
            )}
            <Card>
              <CardHeader className="py-4"><CardTitle className="text-base">CAPA</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <YesNoRadio label="Capa needed" value={capaForm.capaNeeded} onChange={(v) => setCapaForm((f) => ({ ...f, capaNeeded: v }))} disabled={isCompleted || wfStatus !== "Root_Cause_Submitted"} id="capa-needed" />
                <div className="space-y-1.5">
                  <Label>Capa Comment</Label>
                  <Textarea rows={3} placeholder="CAPA instructions or comments..." value={capaForm.capaComment} onChange={(e) => setCapaForm((f) => ({ ...f, capaComment: e.target.value }))} disabled={isCompleted || wfStatus !== "Root_Cause_Submitted"} />
                </div>
                {linkedCapas.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs">CAPA Number</TableHead>
                          <TableHead className="text-xs">Title</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Initial Planned Date</TableHead>
                          <TableHead className="text-xs">Updated Planned Date</TableHead>
                          <TableHead className="text-xs">Implementation Date</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedCapas.map((capa) => (
                          <TableRow key={capa.id}>
                            <TableCell className="text-xs font-medium"><Link href={`/capa/${capa.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">{capa.capaNumber}</Link></TableCell>
                            <TableCell className="text-xs max-w-[180px] truncate">{capa.title}</TableCell>
                            <TableCell className="text-xs">{capa.capaType}</TableCell>
                            <TableCell className="text-xs">{capa.initialPlannedDate ? format(new Date(capa.initialPlannedDate), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-xs">{capa.updatedPlannedDate ? format(new Date(capa.updatedPlannedDate), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-xs">{capa.implementationDate ? format(new Date(capa.implementationDate), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell><StatusBadge status={capa.status} className="text-xs" /></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/capa/${capa.id}`)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No CAPAs linked to this deviation.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4"><CardTitle className="text-base">ER</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <YesNoRadio label="ER needed" value={capaForm.erNeeded} onChange={(v) => setCapaForm((f) => ({ ...f, erNeeded: v }))} disabled={isCompleted || wfStatus !== "Root_Cause_Submitted"} id="er-needed" />
                <div className="space-y-1.5">
                  <Label>ER Comment</Label>
                  <Textarea rows={3} placeholder="ER instructions or comments..." value={capaForm.erComment} onChange={(e) => setCapaForm((f) => ({ ...f, erComment: e.target.value }))} disabled={isCompleted || wfStatus !== "Root_Cause_Submitted"} />
                </div>
                {linkedERs.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs">CAPA Number</TableHead>
                          <TableHead className="text-xs">Instruction</TableHead>
                          <TableHead className="text-xs">Expected Date</TableHead>
                          <TableHead className="text-xs">Reviewed Date</TableHead>
                          <TableHead className="text-xs">Assigned</TableHead>
                          <TableHead className="text-xs">Review</TableHead>
                          <TableHead className="text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {linkedERs.map((er) => (
                          <TableRow key={er.id}>
                            <TableCell className="text-xs font-medium">{er.capaNumber ?? "—"}</TableCell>
                            <TableCell className="text-xs max-w-[180px] truncate">{er.instruction ?? "—"}</TableCell>
                            <TableCell className="text-xs">{er.expectedDate ? format(new Date(er.expectedDate), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-xs">{er.reviewDate ? format(new Date(er.reviewDate), "dd MMM yyyy") : "—"}</TableCell>
                            <TableCell className="text-xs">{er.reviewer}</TableCell>
                            <TableCell><StatusBadge status={er.status} className="text-xs" /></TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/capa/${firstCapaId}`)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No efficacy reviews linked.</p>
                )}
                {wfAtOrPast(wfStatus, "CAPA_ER_Submitted") ? (
                  <AcceptedBadge label="CAPA & ER requirements submitted" />
                ) : (
                  <WfSubmitBtn
                    label="Submit CAPA & ER Requirements"
                    action="submit-capa-er"
                    body={capaForm}
                    esigTitle="Submit CAPA & ER Requirements"
                    esigDesc="Your e-signature confirms the CAPA and ER decisions. Only QA users or the QA Expert can submit this section."
                    canAct={(isQA || isQAExpert) && wfStatus === "Root_Cause_Submitted"}
                    saving={capaSaving}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── COMPLETION ── */}
          <TabsContent value="completion" className="mt-6">
            <Card>
              <CardContent className="pt-6 space-y-5">
                <SectionHeader title="QA - No further investigation" />
                {isCompleted ? (
                  <div className="space-y-4">
                    <DataField label="Comment" value={dev.completionComment} multiline />
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">✓ This deviation has been completed.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>Comment</Label>
                      <Textarea
                        rows={5}
                        placeholder="Summarize the actions taken and confirm resolution..."
                        value={completionComment}
                        onChange={(e) => setCompletionComment(e.target.value)}
                        disabled={wfStatus !== "CAPA_ER_Submitted"} />
                    </div>
                    <div className="rounded-lg bg-muted/40 border p-4 text-sm text-muted-foreground">
                      Completing this deviation will change its status to <strong>Closed</strong>. This cannot be undone.
                    </div>
                    {isUserLoading ? (
                      <div className="h-8 w-36 bg-muted animate-pulse rounded-md" />
                    ) : wfStatus === "CAPA_ER_Submitted" && (isQAExpert || isQA) ? (
                      <div className="flex justify-start">
                        <Button size="sm" onClick={() => {
                          if (!completionComment) { toast({ title: "Please provide a completion comment", variant: "destructive" }); return; }
                          openEsig({
                            title: "Complete Deviation",
                            description: "This will permanently close the deviation and cannot be undone. Only the QA Expert can complete a deviation.",
                            actionLabel: "Complete Deviation",
                            onConfirmed: runWf("complete", { completionComment }, "Deviation completed and closed"),
                          });
                        }} disabled={closingSaving || wfLoading}>
                          {(closingSaving || wfLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Complete Deviation
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {wfStatus !== "CAPA_ER_Submitted"
                          ? "Complete the CAPA & ER submission before closing the deviation."
                          : "Only the QA Expert can complete the deviation."}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ATTACHMENTS ── */}
          <TabsContent value="attachments" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <AttachmentsPanel module="Deviation" recordId={Number(id)} readOnly={isCompleted} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LOGS ── */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <AuditTrailTab module="Deviation" recordId={Number(id)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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

        {/* ════ DELEGATE QA EXPERT DIALOG ════ */}
        <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delegate QA Expert</DialogTitle>
              <DialogDescription>
                Reassign the QA Expert to another user. The selected user will be responsible for accepting this deviation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>New QA Expert</Label>
                <UserPicker value={delegateUser} onChange={setDelegateUser} placeholder="Select QA Expert..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDelegateOpen(false)} disabled={delegateSaving}>Cancel</Button>
              <Button
                disabled={!delegateUser || delegateSaving}
                onClick={async () => {
                  setDelegateSaving(true);
                  try {
                    const res = await fetch(`/api/deviations/${id}/delegate-qa`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ qaExpert: delegateUser }),
                    });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({})) as { error?: string };
                      toast({ title: d.error ?? "Failed to delegate", variant: "destructive" });
                      return;
                    }
                    toast({ title: `QA Expert reassigned to ${delegateUser}` });
                    setDelegateOpen(false);
                    invalidate();
                  } catch {
                    toast({ title: "Network error", variant: "destructive" });
                  } finally {
                    setDelegateSaving(false);
                  }
                }}
              >
                {delegateSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                Confirm Delegation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ════ DELEGATE AREA RESPONSIBLE DIALOG ════ */}
        <Dialog open={delegateAreaOpen} onOpenChange={setDelegateAreaOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delegate Area Responsible</DialogTitle>
              <DialogDescription>
                Reassign the Area Responsible to another user. The selected user will be responsible for accepting this deviation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>New Area Responsible</Label>
                <UserPicker value={delegateAreaUser} onChange={setDelegateAreaUser} placeholder="Select Area Responsible..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDelegateAreaOpen(false)} disabled={delegateAreaSaving}>Cancel</Button>
              <Button
                disabled={!delegateAreaUser || delegateAreaSaving}
                onClick={async () => {
                  setDelegateAreaSaving(true);
                  try {
                    const res = await fetch(`/api/deviations/${id}/delegate-area-responsible`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ areaResponsible: delegateAreaUser }),
                    });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({})) as { error?: string };
                      toast({ title: d.error ?? "Failed to delegate", variant: "destructive" });
                      return;
                    }
                    toast({ title: `Area Responsible reassigned to ${delegateAreaUser}` });
                    setDelegateAreaOpen(false);
                    invalidate();
                  } catch {
                    toast({ title: "Network error", variant: "destructive" });
                  } finally {
                    setDelegateAreaSaving(false);
                  }
                }}
              >
                {delegateAreaSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                Confirm Delegation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ════ DELEGATE INVESTIGATION LEADER DIALOG ════ */}
        <Dialog open={delegateLeaderOpen} onOpenChange={setDelegateLeaderOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delegate Investigation Leader</DialogTitle>
              <DialogDescription>
                Reassign the Investigation Leader to another user. The selected user will be responsible for completing the root cause analysis.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>New Investigation Leader</Label>
                <UserPicker value={delegateLeaderUser} onChange={setDelegateLeaderUser} placeholder="Select Investigation Leader..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDelegateLeaderOpen(false)} disabled={delegateLeaderSaving}>Cancel</Button>
              <Button
                disabled={!delegateLeaderUser || delegateLeaderSaving}
                onClick={async () => {
                  setDelegateLeaderSaving(true);
                  try {
                    const res = await fetch(`/api/deviations/${id}/delegate-investigation-leader`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ investigationLeader: delegateLeaderUser }),
                    });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({})) as { error?: string };
                      toast({ title: d.error ?? "Failed to delegate", variant: "destructive" });
                      return;
                    }
                    toast({ title: `Investigation Leader reassigned to ${delegateLeaderUser}` });
                    setDelegateLeaderOpen(false);
                    invalidate();
                  } catch {
                    toast({ title: "Network error", variant: "destructive" });
                  } finally {
                    setDelegateLeaderSaving(false);
                  }
                }}
              >
                {delegateLeaderSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                Confirm Delegation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ════ EDIT DIALOG ════ */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Deviation — {dev.deviationNumber}</DialogTitle>
              <DialogDescription>Update the general details of this deviation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Title <span className="text-destructive">*</span></Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea rows={3} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Immediate Action Taken</Label>
                  <Textarea rows={2} value={editForm.immediateAction} onChange={(e) => setEditForm((f) => ({ ...f, immediateAction: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Type <span className="text-destructive">*</span></Label>
                  <Select value={editForm.deviationType} onValueChange={(v) => setEditForm((f) => ({ ...f, deviationType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{deviationTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Operation</Label>
                  <Select value={editForm.operation} onValueChange={(v) => setEditForm((f) => ({ ...f, operation: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select operation" /></SelectTrigger>
                    <SelectContent>{operations.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>External Reference</Label>
                  <Input value={editForm.externalReference} onChange={(e) => setEditForm((f) => ({ ...f, externalReference: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Batch / Lot Number</Label>
                  <Input placeholder="e.g. LOT-2024-001" value={editForm.batchLotNumber} onChange={(e) => setEditForm((f) => ({ ...f, batchLotNumber: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Event Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={editForm.eventDate} onChange={(e) => setEditForm((f) => ({ ...f, eventDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Detection Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={editForm.detectionDate} onChange={(e) => setEditForm((f) => ({ ...f, detectionDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3">Correspondants</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Area Responsible <span className="text-destructive">*</span></Label>
                    <UserPicker value={editForm.areaResponsible} onChange={(v) => setEditForm((f) => ({ ...f, areaResponsible: v }))} placeholder="Select area responsible..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>QA Expert <span className="text-destructive">*</span></Label>
                    <UserPicker value={editForm.qaExpert} onChange={(v) => setEditForm((f) => ({ ...f, qaExpert: v }))} placeholder="Select QA expert..." />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3">Equipment</p>
                <EquipmentPicker value={editEquipment} onChange={setEditEquipment} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-3">Products</p>
                <ProductsEditor rows={editProducts} onChange={setEditProducts} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} disabled={update.isPending}>
                {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    );
  }
  