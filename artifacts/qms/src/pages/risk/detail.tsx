import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import jsPDF from "jspdf";
import {
  useGetRiskAssessment,
  useListFmeaEntries,
  useUpdateRiskAssessment,
  useSubmitRiskAssessment,
  useApproveRiskAssessment,
  useRejectRiskAssessment,
  useCloseRiskAssessment,
  useCreateFmeaEntry,
  useUpdateFmeaEntry,
  useDeleteFmeaEntry,
  useListRaTeamMembers,
  useAddRaTeamMember,
  useDeleteRaTeamMember,
  useAcknowledgeRaTeamMember,
  useListRaCommunicationLog,
  useAddRaCommunicationEntry,
  useDeleteRaCommunicationEntry,
  useListRaReviewReports,
  useCreateRaReviewReport,
  useUpdateRaReviewReport,
  useListRaLinks,
  useAddRaLink,
  useDeleteRaLink,
  useClassifyRiskAssessment,
  useReAssessRiskAssessment,
  useGenerateCapaFromEntry,
  useGenerateCcFromEntry,
} from "@workspace/api-client-react";
import type { FmeaEntry, RiskAssessment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, CheckCircle2, Download, Loader2, Lock, Pencil, Plus,
  Send, Trash2, XCircle, AlertTriangle, Save, CheckCheck, WifiOff,
  ShieldCheck, Users, FileText, Link2, RefreshCw, Star,
  MessageSquare, Check,
} from "lucide-react";

// ─── SOPPQA016 v05 Scoring Scales ────────────────────────────────────────────

const S_SCALE = [
  { value: 1, label: "1 - Negligible" },
  { value: 2, label: "2 - Minor" },
  { value: 4, label: "4 - Major" },
  { value: 8, label: "8 - Critical" },
];

const P_SCALE = [
  { value: 1, label: "1 - Remote" },
  { value: 2, label: "2 - Low" },
  { value: 4, label: "4 - Moderate" },
  { value: 8, label: "8 - High" },
];

const D_SCALE = [
  { value: 1, label: "1 - Almost Certain" },
  { value: 2, label: "2 - High" },
  { value: 3, label: "3 - Low" },
  { value: 4, label: "4 - Absolute Uncertainty" },
];

const ACTION_STATUSES = ["Open", "In Progress", "Completed", "N/A"];
const RESIDUAL_OPTIONS = ["Yes", "No", "Conditionally"];

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

const CLASS_REVIEW_PERIOD: Record<string, string> = {
  "Class I":   "2 years",
  "Class II":  "3 years",
  "Class III": "4 years",
  "Class IV":  "Event-driven",
};

// ─── SOP Risk Computation ─────────────────────────────────────────────────────

function computeRES(s: number, p: number) { return s * p; }
function computeRPN(s: number, p: number, d: number) {
  const res = s * p;
  const rpn = res * d;
  return { res, rpn, riskLevel: rpn > 8 ? "Major" : "Minor" };
}

function nearestValid(v: number, valid: number[]) {
  return valid.reduce((prev, curr) => Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev);
}

function RpnBadge({ rpn, level }: { rpn: number; level: string }) {
  const color = level === "Major"
    ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    : "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {rpn} <span className="opacity-60">({level})</span>
    </span>
  );
}

// ─── Inline FMEA Worksheet ───────────────────────────────────────────────────

interface WorksheetEntry extends FmeaEntry { _saving: boolean; _error: boolean; }

function InlineWorksheet({ assessmentId, canEdit, assessmentNumber }: {
  assessmentId: number;
  canEdit: boolean;
  assessmentNumber: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<WorksheetEntry[]>([]);
  const localRef = useRef<WorksheetEntry[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const [addingRow, setAddingRow] = useState(false);
  const [delId, setDelId] = useState<number | null>(null);
  const [generatingCapa, setGeneratingCapa] = useState<number | null>(null);
  const [generatingCc, setGeneratingCc] = useState<number | null>(null);

  const query = useListFmeaEntries(assessmentId);
  const { mutateAsync: updateAsync } = useUpdateFmeaEntry();
  const { mutateAsync: createAsync } = useCreateFmeaEntry();
  const { mutateAsync: deleteAsync } = useDeleteFmeaEntry();
  const { mutateAsync: genCapaAsync } = useGenerateCapaFromEntry();
  const { mutateAsync: genCcAsync } = useGenerateCcFromEntry();

  useEffect(() => {
    if (query.data?.data) {
      const m = query.data.data.map(e => ({ ...e, _saving: false, _error: false }));
      setLocal(m); localRef.current = m;
    }
  }, [query.data]);

  useEffect(() => { localRef.current = local; }, [local]);

  function schedSave(id: number) {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.set(id, setTimeout(() => { timers.current.delete(id); void doSave(id); }, 800));
  }

  async function doSave(id: number) {
    const e = localRef.current.find(x => x.id === id);
    if (!e) return;
    setLocal(p => p.map(x => x.id === id ? { ...x, _saving: true, _error: false } : x));
    try {
      await updateAsync({ id: assessmentId, entryId: id, data: {
        processStep: e.processStep, failureMode: e.failureMode, potentialEffects: e.potentialEffects,
        severity: e.severity, potentialCauses: e.potentialCauses, occurrence: e.occurrence,
        currentControlsPrevention: e.currentControlsPrevention, currentControlsDetection: e.currentControlsDetection,
        detection: e.detection, recommendedAction: e.recommendedAction, responsiblePerson: e.responsiblePerson,
        targetDate: e.targetDate, actionStatus: e.actionStatus, actionTaken: e.actionTaken,
        revisedSeverity: e.revisedSeverity, revisedOccurrence: e.revisedOccurrence, revisedDetection: e.revisedDetection,
        residualRiskAcceptable: e.residualRiskAcceptable, residualRiskJustification: e.residualRiskJustification,
      }});
      setLocal(p => p.map(x => x.id === id ? { ...x, _saving: false } : x));
    } catch {
      setLocal(p => p.map(x => x.id === id ? { ...x, _saving: false, _error: true } : x));
    }
  }

  function ch(id: number, field: string, value: unknown) {
    setLocal(p => p.map(e => {
      if (e.id !== id) return e;
      const u: WorksheetEntry = { ...e, [field]: value };
      if (["severity", "occurrence", "detection"].includes(field)) {
        const s = field === "severity" ? value as number : e.severity;
        const o = field === "occurrence" ? value as number : e.occurrence;
        const d = field === "detection" ? value as number : e.detection;
        const { res, rpn, riskLevel } = computeRPN(s, o, d);
        u.rpn = rpn; u.riskLevel = riskLevel;
        u.res = res;
      }
      if (["revisedSeverity", "revisedOccurrence", "revisedDetection"].includes(field)) {
        const rs = field === "revisedSeverity" ? value as number | null : e.revisedSeverity;
        const ro = field === "revisedOccurrence" ? value as number | null : e.revisedOccurrence;
        const rd = field === "revisedDetection" ? value as number | null : e.revisedDetection;
        if (rs != null && ro != null && rd != null) {
          const { rpn, riskLevel } = computeRPN(rs, ro, rd);
          u.revisedRpn = rpn; u.revisedRiskLevel = riskLevel;
        } else { u.revisedRpn = null; u.revisedRiskLevel = null; }
      }
      return u;
    }));
    schedSave(id);
  }

  async function addRow() {
    setAddingRow(true);
    try {
      const r = await createAsync({ id: assessmentId, data: { processStep: "New step", failureMode: "Failure mode", severity: 1, occurrence: 1, detection: 1 } });
      const ne: WorksheetEntry = { ...r, _saving: false, _error: false };
      setLocal(p => [...p, ne]); localRef.current = [...localRef.current, ne];
    } catch { toast({ title: "Failed to add row", variant: "destructive" }); }
    finally { setAddingRow(false); }
  }

  async function delRow(id: number) {
    await deleteAsync({ id: assessmentId, entryId: id });
    setLocal(p => p.filter(e => e.id !== id)); setDelId(null);
  }

  async function handleGenCapa(entryId: number) {
    setGeneratingCapa(entryId);
    try {
      const result = await genCapaAsync({ id: assessmentId, entryId });
      const r = result as { capaNumber?: string };
      toast({ title: "CAPA created", description: `Created ${r.capaNumber ?? "CAPA"} — view in CAPA module.` });
      queryClient.invalidateQueries({ queryKey: [`/api/risk-assessments/${assessmentId}/links`] });
    } catch {
      toast({ title: "Failed to generate CAPA", variant: "destructive" });
    } finally { setGeneratingCapa(null); }
  }

  async function handleGenCc(entryId: number) {
    setGeneratingCc(entryId);
    try {
      const result = await genCcAsync({ id: assessmentId, entryId });
      const r = result as { changeControlNumber?: string };
      toast({ title: "Change Control created", description: `Created ${r.changeControlNumber ?? "CC"} — view in Change Control module.` });
      queryClient.invalidateQueries({ queryKey: [`/api/risk-assessments/${assessmentId}/links`] });
    } catch {
      toast({ title: "Failed to generate CC", variant: "destructive" });
    } finally { setGeneratingCc(null); }
  }

  const S_V = S_SCALE.map(s => s.value);
  const P_V = P_SCALE.map(s => s.value);
  const D_V = D_SCALE.map(s => s.value);

  const tin = "w-full text-xs px-1 py-0.5 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded";
  const sel = "text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-0.5 py-0.5 w-full cursor-pointer";

  function RateSel({ id, field, val, scale }: { id: number; field: string; val: number; scale: { value: number; label: string }[] }) {
    const nearest = scale.find(s => s.value === val) ? val : nearestValid(val, scale.map(s => s.value));
    return (
      <select className={sel} value={nearest} disabled={!canEdit} onChange={e => ch(id, field, parseInt(e.target.value, 10))}
        title={scale.find(s => s.value === nearest)?.label}>
        {scale.map(s => <option key={s.value} value={s.value} title={s.label}>{s.value}</option>)}
      </select>
    );
  }

  if (query.isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            SOPPQA016 v05 · RPN = S × P × D · RES = S × P ·{" "}
            <span className="text-red-600 font-semibold">Major: RPN &gt; 8</span>
            {" · "}
            <span className="text-green-600 font-semibold">Minor: RPN ≤ 8</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            S: {S_V.join(", ")} · P: {P_V.join(", ")} · D: {D_V.join(", ")} (hover for descriptions)
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={addRow} disabled={addingRow} className="gap-1.5 shrink-0">
            {addingRow ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add Row
          </Button>
        )}
      </div>

      {local.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
          <p className="text-slate-400 text-sm">No FMEA entries. Add a row to begin the analysis.</p>
          {canEdit && (
            <Button onClick={addRow} variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add First Row
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-sm">
          <table className="text-xs border-collapse" style={{ minWidth: "2200px" }}>
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-900 text-white">
                {[
                  { h: "#", w: "32px" },
                  { h: "Process Step", w: "140px" },
                  { h: "Failure Mode", w: "140px" },
                  { h: "Potential Effects", w: "120px" },
                  { h: "S", w: "46px", title: "Severity: 1=Negligible, 2=Minor, 4=Major, 8=Critical" },
                  { h: "Potential Causes", w: "120px" },
                  { h: "P", w: "46px", title: "Probability: 1=Remote, 2=Low, 4=Moderate, 8=High" },
                  { h: "RES", w: "52px", title: "Risk Estimation Score = S × P" },
                  { h: "Prev Controls", w: "120px" },
                  { h: "Det Controls", w: "120px" },
                  { h: "D", w: "46px", title: "Detection: 1=Almost Certain, 2=High, 3=Low, 4=Absolute Uncertainty" },
                  { h: "RPN", w: "90px", title: "Risk Priority Number = RES × D" },
                  { h: "Recommended Action", w: "140px" },
                  { h: "Responsible", w: "110px" },
                  { h: "Target Date", w: "100px" },
                  { h: "Status", w: "100px" },
                  { h: "Action Taken", w: "120px" },
                  { h: "Rev S", w: "46px" },
                  { h: "Rev P", w: "46px" },
                  { h: "Rev D", w: "46px" },
                  { h: "Rev RPN", w: "90px" },
                  { h: "Residual OK?", w: "100px" },
                  { h: "Justification", w: "110px" },
                  { h: "Actions", w: "80px" },
                ].map(({ h, w, title }) => (
                  <th key={h} style={{ minWidth: w }} title={title}
                    className="px-2 py-2.5 text-left font-semibold border-r border-slate-700 last:border-r-0 whitespace-nowrap text-[11px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {local.map((e, idx) => {
                const res = computeRES(e.severity, e.occurrence);
                const isMajor = e.riskLevel === "Major";
                const rowBg = isMajor ? "bg-red-50/60 dark:bg-red-950/20" : "";
                const td = `border-b border-slate-100 dark:border-slate-800 border-r border-slate-100 dark:border-slate-800 px-1.5 py-1 align-middle last:border-r-0`;
                return (
                  <tr key={e.id} className={`${rowBg} hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors`}>
                    <td className={`${td} text-center text-slate-400 font-mono text-[10px]`}>{idx + 1}</td>
                    <td className={td}><input className={tin} value={e.processStep} disabled={!canEdit} onChange={ev => ch(e.id, "processStep", ev.target.value)} /></td>
                    <td className={td}><input className={tin} value={e.failureMode} disabled={!canEdit} onChange={ev => ch(e.id, "failureMode", ev.target.value)} /></td>
                    <td className={td}><input className={tin} value={e.potentialEffects ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "potentialEffects", ev.target.value || null)} /></td>
                    <td className={`${td} text-center`}><RateSel id={e.id} field="severity" val={e.severity} scale={S_SCALE} /></td>
                    <td className={td}><input className={tin} value={e.potentialCauses ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "potentialCauses", ev.target.value || null)} /></td>
                    <td className={`${td} text-center`}><RateSel id={e.id} field="occurrence" val={e.occurrence} scale={P_SCALE} /></td>
                    <td className={`${td} text-center`}>
                      <span className={`inline-block px-1 py-0.5 rounded text-[11px] font-bold ${res > 8 ? "bg-red-100 text-red-700" : res > 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {res}
                      </span>
                    </td>
                    <td className={td}><input className={tin} value={e.currentControlsPrevention ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "currentControlsPrevention", ev.target.value || null)} /></td>
                    <td className={td}><input className={tin} value={e.currentControlsDetection ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "currentControlsDetection", ev.target.value || null)} /></td>
                    <td className={`${td} text-center`}><RateSel id={e.id} field="detection" val={e.detection} scale={D_SCALE} /></td>
                    <td className={`${td} text-center`}><RpnBadge rpn={e.rpn} level={e.riskLevel} /></td>
                    <td className={td}><input className={tin} value={e.recommendedAction ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "recommendedAction", ev.target.value || null)} /></td>
                    <td className={td}><input className={tin} value={e.responsiblePerson ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "responsiblePerson", ev.target.value || null)} /></td>
                    <td className={td}><input type="date" className={`${tin} min-w-[90px]`} value={e.targetDate ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "targetDate", ev.target.value || null)} /></td>
                    <td className={td}>
                      <select className={sel} value={e.actionStatus ?? "Open"} disabled={!canEdit} onChange={ev => ch(e.id, "actionStatus", ev.target.value)}>
                        {ACTION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={td}><input className={tin} value={e.actionTaken ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "actionTaken", ev.target.value || null)} /></td>
                    <td className={`${td} text-center`}>
                      <select className={sel} value={e.revisedSeverity ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "revisedSeverity", ev.target.value ? parseInt(ev.target.value, 10) : null)}>
                        <option value="">—</option>
                        {S_SCALE.map(s => <option key={s.value} value={s.value} title={s.label}>{s.value}</option>)}
                      </select>
                    </td>
                    <td className={`${td} text-center`}>
                      <select className={sel} value={e.revisedOccurrence ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "revisedOccurrence", ev.target.value ? parseInt(ev.target.value, 10) : null)}>
                        <option value="">—</option>
                        {P_SCALE.map(s => <option key={s.value} value={s.value} title={s.label}>{s.value}</option>)}
                      </select>
                    </td>
                    <td className={`${td} text-center`}>
                      <select className={sel} value={e.revisedDetection ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "revisedDetection", ev.target.value ? parseInt(ev.target.value, 10) : null)}>
                        <option value="">—</option>
                        {D_SCALE.map(s => <option key={s.value} value={s.value} title={s.label}>{s.value}</option>)}
                      </select>
                    </td>
                    <td className={`${td} text-center`}>
                      {e.revisedRpn != null && e.revisedRiskLevel
                        ? <RpnBadge rpn={e.revisedRpn} level={e.revisedRiskLevel} />
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className={td}>
                      <select className={sel} value={e.residualRiskAcceptable ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "residualRiskAcceptable", ev.target.value || null)}>
                        <option value="">—</option>
                        {RESIDUAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className={td}><input className={tin} value={e.residualRiskJustification ?? ""} disabled={!canEdit} onChange={ev => ch(e.id, "residualRiskJustification", ev.target.value || null)} /></td>
                    <td className={`${td} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        {e._saving ? <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                          : e._error ? <span title="Save failed"><WifiOff className="h-3 w-3 text-red-400" /></span>
                          : <CheckCheck className="h-3 w-3 text-slate-300 dark:text-slate-600" />}
                        {canEdit && (
                          <>
                            <button title="Generate CAPA" disabled={generatingCapa === e.id}
                              className="text-slate-300 hover:text-blue-500 transition-colors"
                              onClick={() => void handleGenCapa(e.id)}>
                              {generatingCapa === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                            </button>
                            <button title="Generate CC" disabled={generatingCc === e.id}
                              className="text-slate-300 hover:text-purple-500 transition-colors"
                              onClick={() => void handleGenCc(e.id)}>
                              {generatingCc === e.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                            </button>
                            <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => setDelId(e.id)} title="Delete row">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && local.length > 0 && (
        <Button size="sm" variant="outline" onClick={addRow} disabled={addingRow} className="gap-1.5">
          {addingRow ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add Row
        </Button>
      )}

      <AlertDialog open={delId !== null} onOpenChange={open => !open && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FMEA Entry?</AlertDialogTitle>
            <AlertDialogDescription>This row will be permanently removed from the worksheet.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => delId != null && void delRow(delId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Risk Matrix 4×4 (SOPPQA016) ─────────────────────────────────────────────

const S_AXIS = [1, 2, 4, 8];
const P_AXIS_DESC = [8, 4, 2, 1];

function matrixCellColor(s: number, p: number) {
  const res = s * p;
  if (res >= 16) return "bg-red-200 dark:bg-red-900/60";
  if (res >= 4) return "bg-amber-100 dark:bg-amber-900/40";
  return "bg-green-100 dark:bg-green-900/40";
}

function RiskMatrix4x4({ entries }: { entries: FmeaEntry[] }) {
  const cellMap: Record<string, FmeaEntry[]> = {};
  for (const e of entries) {
    const ns = nearestValid(e.severity, S_AXIS);
    const np = nearestValid(e.occurrence, P_AXIS_DESC);
    const key = `${ns}-${np}`;
    if (!cellMap[key]) cellMap[key] = [];
    cellMap[key].push(e);
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Risk Matrix — Severity (S) vs. Probability (P)</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            SOPPQA016 v05 · Cell colour: RES = S×P. Major = RPN &gt; 8. Entries plotted by S and P scores.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="pb-2 pr-4 text-right text-xs font-medium text-slate-500 align-bottom whitespace-nowrap">P ↓ / S →</th>
                    {S_AXIS.map(s => (
                      <th key={s} className="pb-2 text-center w-24 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <div className="font-bold text-sm">{s}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{S_SCALE.find(x => x.value === s)?.label?.split(" - ")[1]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {P_AXIS_DESC.map(p => (
                    <tr key={p}>
                      <td className="pr-4 text-right text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap py-1">
                        <span className="font-bold">{p}</span>
                        <span className="ml-1 text-[10px] text-slate-400">{P_SCALE.find(x => x.value === p)?.label?.split(" - ")[1]}</span>
                      </td>
                      {S_AXIS.map(s => {
                        const key = `${s}-${p}`;
                        const list = cellMap[key] ?? [];
                        return (
                          <td key={s} className={`w-24 h-16 text-center border-2 border-white dark:border-slate-900 rounded transition-all ${matrixCellColor(s, p)} ${list.length > 0 ? "ring-2 ring-inset ring-slate-500 dark:ring-slate-400" : ""}`}>
                            <div className="text-[9px] text-slate-500 mb-0.5">RES={s * p}</div>
                            {list.length > 0 && (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-xl font-bold">{list.length}</span>
                                <span className="text-[10px] text-slate-600 dark:text-slate-400">{list.length === 1 ? "entry" : "entries"}</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="shrink-0 space-y-4 pt-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Legend (RES = S × P)</p>
                {[
                  { label: "RES ≥ 16: always Major", color: "bg-red-200 dark:bg-red-900/60", text: "Action required" },
                  { label: "RES 4–8: context-dependent", color: "bg-amber-100 dark:bg-amber-900/40", text: "Assess with D score" },
                  { label: "RES ≤ 2: likely Minor", color: "bg-green-100 dark:bg-green-900/40", text: "Monitor" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-xs">
                    <span className={`w-8 h-5 rounded ${l.color} shrink-0`} />
                    <div>
                      <div className="font-medium text-slate-700 dark:text-slate-300">{l.label}</div>
                      <div className="text-slate-400">{l.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Scale Reference</p>
                {[
                  { title: "Severity (S)", scale: S_SCALE },
                  { title: "Probability (P)", scale: P_SCALE },
                  { title: "Detection (D)", scale: D_SCALE },
                ].map(({ title, scale }) => (
                  <div key={title}>
                    <p className="text-[11px] font-semibold text-slate-500 mb-1">{title}</p>
                    <div className="space-y-0.5">
                      {scale.map(r => (
                        <div key={r.value} className="text-[10px] text-slate-500 flex gap-1">
                          <span className="font-bold w-3">{r.value}</span>
                          <span>{r.label.split(" - ")[1]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Team & Communication Tab ─────────────────────────────────────────────────

function TeamTab({ assessmentId, isQA }: { assessmentId: number; isQA: boolean }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const teamKey = { queryKey: [`/api/risk-assessments/${assessmentId}/team-members`] };
  const commKey = { queryKey: [`/api/risk-assessments/${assessmentId}/communication-log`] };

  const teamQ = useListRaTeamMembers(assessmentId);
  const commQ = useListRaCommunicationLog(assessmentId);

  const addMemberMut = useAddRaTeamMember({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(teamKey); setAddMemberOpen(false); setMemberForm({ name: "", role: "", department: "", email: "" }); toast({ title: "Team member added" }); },
    onError: () => toast({ title: "Failed to add member", variant: "destructive" }),
  }});
  const delMemberMut = useDeleteRaTeamMember({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(teamKey); toast({ title: "Removed" }); },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  }});
  const ackMut = useAcknowledgeRaTeamMember({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(teamKey); toast({ title: "Acknowledged" }); },
    onError: () => toast({ title: "Failed to acknowledge", variant: "destructive" }),
  }});
  const addCommMut = useAddRaCommunicationEntry({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(commKey); setCommOpen(false); setCommForm({ communicatedTo: "", method: "Meeting", summary: "", communicationDate: new Date().toISOString().split("T")[0], loggedBy: user?.name ?? "" }); toast({ title: "Entry logged" }); },
    onError: () => toast({ title: "Failed to log entry", variant: "destructive" }),
  }});
  const delCommMut = useDeleteRaCommunicationEntry({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(commKey); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  }});

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", area: "", designation: "", role: "" });
  const [commOpen, setCommOpen] = useState(false);
  const [commForm, setCommForm] = useState({ communicatedTo: "", method: "Meeting", summary: "", communicationDate: new Date().toISOString().split("T")[0], loggedBy: user?.name ?? "" });

  const METHODS = ["Meeting", "Email", "Training", "Report", "Memo", "Other"];

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-base font-semibold">RA Team Register</CardTitle>
          </div>
          {isQA && (
            <Button size="sm" variant="outline" onClick={() => setAddMemberOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {teamQ.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : (teamQ.data?.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No team members added yet</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  {["Name", "Role", "Area", "Designation", "Acknowledged", ""].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 dark:border-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(teamQ.data?.data ?? []).map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-3 py-2 font-medium">{m.name}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{m.role}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{m.area}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{m.designation ?? "—"}</td>
                    <td className="px-3 py-2">
                      {m.acknowledgedAt ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <Check className="h-3.5 w-3.5" /> {m.acknowledgedAt.toString().slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {!m.acknowledgedAt && (
                          <button onClick={() => ackMut.mutate({ id: assessmentId, memberId: m.id })}
                            className="text-xs text-blue-600 hover:underline">Acknowledge</button>
                        )}
                        {isQA && (
                          <button onClick={() => delMemberMut.mutate({ id: assessmentId, memberId: m.id })}
                            className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Communication Log */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-base font-semibold">Communication Log</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setCommOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Log Communication
          </Button>
        </CardHeader>
        <CardContent>
          {commQ.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : (commQ.data?.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No communication entries yet</p>
          ) : (
            <div className="space-y-2">
              {(commQ.data?.data ?? []).map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.method}</span>
                      <span className="text-xs text-slate-400">to</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{c.communicatedTo}</span>
                      <span className="text-xs text-slate-400">by {c.loggedBy}</span>
                      {c.communicationDate && <span className="text-xs text-slate-400">{c.communicationDate}</span>}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{c.summary}</p>
                  </div>
                  {isQA && (
                    <button onClick={() => delCommMut.mutate({ id: assessmentId, logId: c.id })}
                      className="text-slate-300 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={memberForm.name} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="grid gap-1.5">
              <Label>Area <span className="text-red-500">*</span></Label>
              <Input value={memberForm.area} onChange={e => setMemberForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. Quality Assurance" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Role</Label>
                <Input value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Risk Team Leader" />
              </div>
              <div className="grid gap-1.5">
                <Label>Designation</Label>
                <Input value={memberForm.designation} onChange={e => setMemberForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. QA Manager" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={() => addMemberMut.mutate({ id: assessmentId, data: { name: memberForm.name, area: memberForm.area, role: memberForm.role || undefined, designation: memberForm.designation || null } })} disabled={!memberForm.name.trim() || !memberForm.area.trim() || addMemberMut.isPending}>
              {addMemberMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Communication Dialog */}
      <Dialog open={commOpen} onOpenChange={setCommOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Communicated To <span className="text-red-500">*</span></Label>
                <Input value={commForm.communicatedTo} onChange={e => setCommForm(f => ({ ...f, communicatedTo: e.target.value }))} placeholder="e.g. QA Team, Site Management" />
              </div>
              <div className="grid gap-1.5">
                <Label>Method</Label>
                <Select value={commForm.method} onValueChange={v => setCommForm(f => ({ ...f, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Communication Date</Label>
                <Input type="date" value={commForm.communicationDate} onChange={e => setCommForm(f => ({ ...f, communicationDate: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Logged By</Label>
                <Input value={commForm.loggedBy} onChange={e => setCommForm(f => ({ ...f, loggedBy: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Summary <span className="text-red-500">*</span></Label>
              <Textarea rows={3} value={commForm.summary} onChange={e => setCommForm(f => ({ ...f, summary: e.target.value }))} placeholder="Describe what was communicated..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommOpen(false)}>Cancel</Button>
            <Button onClick={() => addCommMut.mutate({ id: assessmentId, data: { communicatedTo: commForm.communicatedTo, method: commForm.method, communicationDate: commForm.communicationDate, summary: commForm.summary } })} disabled={!commForm.communicatedTo.trim() || !commForm.summary.trim() || addCommMut.isPending}>
              {addCommMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Review Reports Tab ───────────────────────────────────────────────────────

function ReviewReportsTab({ assessmentId, isQA }: { assessmentId: number; isQA: boolean }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const rarrKey = { queryKey: [`/api/risk-assessments/${assessmentId}/review-reports`] };

  const rarrQ = useListRaReviewReports(assessmentId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRarr, setEditRarr] = useState<{ id: number; status: string; notes: string; reviewedBy: string; reviewDate: string; outcome: string } | null>(null);

  const createMut = useCreateRaReviewReport({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(rarrKey); setCreateOpen(false); setNewRarr({ reviewDate: "", outcome: "Maintain", reviewedBy: user?.name ?? "", status: "Draft", newReviewDate: "", deviationsReviewed: "", changesReviewed: "", notes: "" }); toast({ title: "Review report created" }); },
    onError: () => toast({ title: "Failed to create", variant: "destructive" }),
  }});
  const updateMut = useUpdateRaReviewReport({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(rarrKey); setEditRarr(null); toast({ title: "Updated" }); },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  }});

  const OUTCOMES = ["Maintain", "Update Required", "Withdraw", "Escalate"];

  const [newRarr, setNewRarr] = useState({ reviewDate: "", outcome: "Maintain", reviewedBy: user?.name ?? "", status: "Draft", newReviewDate: "", deviationsReviewed: "", changesReviewed: "", notes: "" });

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-base font-semibold">Risk Assessment Review Reports (RARR)</CardTitle>
          </div>
          {isQA && (
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New RARR
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {rarrQ.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : (rarrQ.data?.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No review reports yet</p>
          ) : (
            <div className="space-y-3">
              {(rarrQ.data?.data ?? []).map((r) => (
                <div key={r.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{r.rarrNumber}</span>
                      <Badge className={`text-xs border-0 ${r.outcome === "Maintain" ? "bg-green-100 text-green-700" : r.outcome === "Withdraw" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.outcome}
                      </Badge>
                      {r.status && <Badge className="text-xs border-0 bg-slate-100 text-slate-600">{r.status}</Badge>}
                    </div>
                    {isQA && (
                      <Button size="sm" variant="ghost" onClick={() => setEditRarr({ id: r.id, status: r.status ?? "Draft", notes: r.notes ?? "", reviewedBy: r.reviewedBy, reviewDate: r.reviewDate, outcome: r.outcome })} className="gap-1 text-xs h-7">
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-xs text-slate-400">Review Date</span><p className="font-medium">{r.reviewDate}</p></div>
                    <div><span className="text-xs text-slate-400">Reviewed By</span><p className="font-medium">{r.reviewedBy}</p></div>
                    <div><span className="text-xs text-slate-400">Next Review</span><p className="font-medium">{r.newReviewDate ?? "—"}</p></div>
                  </div>
                  {r.notes && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create RARR Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Risk Assessment Review Report</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Review Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={newRarr.reviewDate} onChange={e => setNewRarr(f => ({ ...f, reviewDate: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Outcome <span className="text-red-500">*</span></Label>
                <Select value={newRarr.outcome} onValueChange={v => setNewRarr(f => ({ ...f, outcome: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTCOMES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Reviewed By <span className="text-red-500">*</span></Label>
                <Input value={newRarr.reviewedBy} onChange={e => setNewRarr(f => ({ ...f, reviewedBy: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label>Next Review Date</Label>
                <Input type="date" value={newRarr.newReviewDate} onChange={e => setNewRarr(f => ({ ...f, newReviewDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Deviations Reviewed</Label>
                <Input value={newRarr.deviationsReviewed} onChange={e => setNewRarr(f => ({ ...f, deviationsReviewed: e.target.value }))} placeholder="e.g. DEV-2025-001" />
              </div>
              <div className="grid gap-1.5">
                <Label>Changes Reviewed</Label>
                <Input value={newRarr.changesReviewed} onChange={e => setNewRarr(f => ({ ...f, changesReviewed: e.target.value }))} placeholder="e.g. CC-2025-001" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={newRarr.notes} onChange={e => setNewRarr(f => ({ ...f, notes: e.target.value }))} placeholder="Review conclusions and observations..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate({ id: assessmentId, data: { reviewDate: newRarr.reviewDate, outcome: newRarr.outcome, reviewedBy: newRarr.reviewedBy, status: newRarr.status || null, newReviewDate: newRarr.newReviewDate || null, deviationsReviewed: newRarr.deviationsReviewed || null, changesReviewed: newRarr.changesReviewed || null, notes: newRarr.notes || null } })} disabled={!newRarr.reviewDate || !newRarr.reviewedBy.trim() || createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit RARR Dialog */}
      <Dialog open={editRarr !== null} onOpenChange={open => !open && setEditRarr(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Review Report</DialogTitle></DialogHeader>
          {editRarr && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={editRarr.status} onValueChange={v => setEditRarr(f => f ? { ...f, status: v } : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Draft", "In Review", "Approved"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Notes</Label>
                <Textarea rows={4} value={editRarr.notes} onChange={e => setEditRarr(f => f ? { ...f, notes: e.target.value } : null)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRarr(null)}>Cancel</Button>
            <Button onClick={() => editRarr && updateMut.mutate({ id: assessmentId, rarrId: editRarr.id, data: { reviewedBy: editRarr.reviewedBy, reviewDate: editRarr.reviewDate, outcome: editRarr.outcome, status: editRarr.status || null, notes: editRarr.notes || null } })} disabled={updateMut.isPending}>
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Links Tab ────────────────────────────────────────────────────────────────

function LinksTab({ assessmentId, isQA }: { assessmentId: number; isQA: boolean }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const linksKey = { queryKey: [`/api/risk-assessments/${assessmentId}/links`] };

  const linksQ = useListRaLinks(assessmentId);
  const addLinkMut = useAddRaLink({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(linksKey); setOpen(false); setForm({ moduleType: "Deviation", moduleNumber: "", moduleId: "", moduleTitle: "" }); toast({ title: "Link added" }); },
    onError: () => toast({ title: "Failed to add link", variant: "destructive" }),
  }});
  const delLinkMut = useDeleteRaLink({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(linksKey); toast({ title: "Link removed" }); },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  }});

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ moduleType: "Deviation", moduleNumber: "", moduleId: "", moduleTitle: "" });
  const MODULE_TYPES = ["Deviation", "CAPA", "ChangeControl"];

  const MODULE_COLORS: Record<string, string> = {
    Deviation: "bg-orange-100 text-orange-700",
    CAPA: "bg-blue-100 text-blue-700",
    ChangeControl: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-base font-semibold">Cross-Module Links</CardTitle>
          </div>
          {isQA && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Link
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {linksQ.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : (linksQ.data?.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No cross-module links yet. Links are also created automatically when generating CAPAs or CCs from entries.</p>
          ) : (
            <div className="space-y-2">
              {(linksQ.data?.data ?? []).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs border-0 ${MODULE_COLORS[l.moduleType] ?? "bg-slate-100 text-slate-600"}`}>{l.moduleType}</Badge>
                    <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">{l.moduleNumber}</span>
                    {l.moduleTitle && <span className="text-sm text-slate-500">{l.moduleTitle}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {l.linkedBy && <span className="text-xs text-slate-400">{l.linkedBy}</span>}
                    {isQA && (
                      <button onClick={() => delLinkMut.mutate({ id: assessmentId, linkId: l.id })}
                        className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Cross-Module Link</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Module Type <span className="text-red-500">*</span></Label>
              <Select value={form.moduleType} onValueChange={v => setForm(f => ({ ...f, moduleType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODULE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Record Number <span className="text-red-500">*</span></Label>
                <Input value={form.moduleNumber} onChange={e => setForm(f => ({ ...f, moduleNumber: e.target.value }))} placeholder="e.g. DEV-2025-001" />
              </div>
              <div className="grid gap-1.5">
                <Label>Record ID (numeric)</Label>
                <Input type="number" value={form.moduleId} onChange={e => setForm(f => ({ ...f, moduleId: e.target.value }))} placeholder="Database ID" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Title (optional)</Label>
              <Input value={form.moduleTitle} onChange={e => setForm(f => ({ ...f, moduleTitle: e.target.value }))} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addLinkMut.mutate({ id: assessmentId, data: { moduleType: form.moduleType, moduleId: parseInt(form.moduleId, 10) || 0, moduleNumber: form.moduleNumber.trim(), moduleTitle: form.moduleTitle || null } })} disabled={!form.moduleNumber.trim() || addLinkMut.isPending}>
              {addLinkMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Classification Wizard ────────────────────────────────────────────────────

function ClassifyWizard({ assessmentId, onClose, onDone }: { assessmentId: number; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");

  const classifyMut = useClassifyRiskAssessment({ mutation: {
    onSuccess: () => { onDone(); toast({ title: "Assessment classified", description: `Classified as ${selectedClass}` }); },
    onError: () => toast({ title: "Classification failed", variant: "destructive" }),
  }});

  const CLASS_DEFINITIONS = [
    { id: "Class I", label: "Class I", color: "border-green-300 bg-green-50", badge: CLASS_COLORS["Class I"], description: "Low risk. Minor RPN scores across all entries. Standard monitoring applies.", review: "2 years" },
    { id: "Class II", label: "Class II", color: "border-blue-300 bg-blue-50", badge: CLASS_COLORS["Class II"], description: "Medium risk. Some elevated RPN scores with effective controls. Periodic review.", review: "3 years" },
    { id: "Class III", label: "Class III", color: "border-amber-300 bg-amber-50", badge: CLASS_COLORS["Class III"], description: "High risk. Major RPN scores requiring active mitigation and close monitoring.", review: "4 years" },
    { id: "Class IV", label: "Class IV", color: "border-red-300 bg-red-50", badge: CLASS_COLORS["Class IV"], description: "Critical risk. Regulatory or patient-safety significance. Event-driven review required.", review: "Event-driven" },
  ];

  function autoReviewDate(cls: string) {
    if (cls === "Class IV") return "";
    const years = cls === "Class I" ? 2 : cls === "Class II" ? 3 : 4;
    const d = new Date();
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().split("T")[0];
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-500" />
            Risk Assessment Classification (SOPPQA016 v05 §5.5.4)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {CLASS_DEFINITIONS.map(cls => (
              <button key={cls.id} type="button"
                onClick={() => { setSelectedClass(cls.id); setNextReviewDate(autoReviewDate(cls.id)); }}
                className={`text-left p-3 rounded-xl border-2 transition-all ${selectedClass === cls.id ? cls.color + " ring-2 ring-offset-1 ring-blue-400" : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-700"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs border-0 ${cls.badge}`}>{cls.label}</Badge>
                  <span className="text-xs text-slate-400">Review: {cls.review}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{cls.description}</p>
              </button>
            ))}
          </div>

          {selectedClass && (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Classification Rationale <span className="text-red-500">*</span></Label>
                <Textarea rows={3} value={rationale} onChange={e => setRationale(e.target.value)} placeholder="Provide justification for this classification based on FMEA results..." />
              </div>
              <div className="grid gap-1.5">
                <Label>Next Review Date {selectedClass !== "Class IV" ? "(auto-calculated)" : "(event-driven — optional)"}</Label>
                <Input type="date" value={nextReviewDate} onChange={e => setNextReviewDate(e.target.value)} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => selectedClass && classifyMut.mutate({ id: assessmentId, data: { riskClass: selectedClass, decisionTreeData: rationale || null, nextReviewDate: nextReviewDate || null } })} disabled={!selectedClass || !rationale.trim() || classifyMut.isPending}>
            {classifyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Classify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── PDF Generation ──────────────────────────────────────────────────────────

function generatePdf(ra: RiskAssessment, entries: FmeaEntry[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; const H = 297; const M = 14;
  const NAVY: [number, number, number] = [20, 40, 80];
  const DARK: [number, number, number] = [30, 30, 50];
  const MUTED: [number, number, number] = [120, 130, 150];
  const RED: [number, number, number] = [180, 30, 30];
  const GREEN: [number, number, number] = [30, 130, 80];
  let pg = 1;

  const hdr = () => {
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, 18, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
    doc.text("CAPALYST", M, 11);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
    doc.text("CPT Quality Management System", M, 16);
    doc.setTextColor(180, 200, 220);
    doc.text("CONTROLLED DOCUMENT — FOR INTERNAL USE ONLY", W - M, 11, { align: "right" });
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy")}`, W - M, 16, { align: "right" });
  };
  const ftr = () => {
    doc.setDrawColor(200, 210, 220); doc.setLineWidth(0.3); doc.line(M, H - 12, W - M, H - 12);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(`${ra.assessmentNumber} — ${ra.title}`, M, H - 7);
    doc.text(`Page ${pg}`, W - M, H - 7, { align: "right" });
  };
  const newPg = () => { doc.addPage(); pg++; hdr(); ftr(); return 24; };
  const sec = (t: string, y: number) => {
    doc.setFillColor(240, 243, 250); doc.rect(M, y, W - M * 2, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...DARK);
    doc.text(t, M + 2, y + 5); return y + 10;
  };
  const body = (t: string, y: number) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(t || "—", W - M * 2);
    doc.text(lines, M, y); return y + lines.length * 4 + 2;
  };

  // Title page
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 55, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(255, 255, 255);
  doc.text("CAPALYST", M, 18);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(170, 190, 215);
  doc.text("Chemical Process Technologies — Quality Management System", M, 25);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(255, 255, 255);
  doc.text("Quality Risk Assessment (SOPPQA016 v05)", M, 36);
  const titleL = doc.splitTextToSize(ra.title, W - M * 2);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 215, 240);
  doc.text(titleL, M, 44);

  let ty = 64;
  const info: [string, string][] = [
    ["Document Number:", ra.documentNumber || ra.assessmentNumber],
    ["Revision:", ra.revision || "001"],
    ["Risk Class:", (ra as { riskClass?: string | null }).riskClass || "Not classified"],
    ["Assessment Type:", ra.assessmentType],
    ["Area:", (ra as { raArea?: string | null }).raArea || "—"],
    ["Regulatory Context:", ra.regulatoryContext || "ICH Q9, SOPPQA016"],
    ["Product / Process:", ra.productProcess || "—"],
    ["Initiated by:", ra.initiatedBy],
    ["Approval Date:", ra.approvalDate || "—"],
    ["Next Review:", (ra as { nextReviewDate?: string | null }).nextReviewDate || "—"],
    ["Status:", ra.status],
  ];
  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...DARK); doc.text(label, M, ty);
    doc.setFont("helvetica", "normal"); doc.setTextColor(50, 80, 130); doc.text(value, 68, ty);
    ty += 6;
  });
  ftr();

  // Rating scales page
  let y = newPg();
  y = sec("1. Risk Identification", y);
  y = body(ra.riskIdentification || ra.scope || "See scope.", y);
  y += 4;
  y = sec("2. SOPPQA016 v05 Scoring Scales", y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...DARK);

  const scaleTbl = (title: string, rows: string[][], y2: number) => {
    doc.text(title, M, y2); y2 += 4;
    const colW = [40, 20, W - M * 2 - 60];
    doc.setFillColor(...NAVY); doc.rect(M, y2, W - M * 2, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
    let tx = M;
    ["Level", "Rating", "Description"].forEach((h, i) => { doc.text(h, tx + 1, y2 + 4.5); tx += colW[i]; });
    y2 += 6;
    rows.forEach((row, ri) => {
      doc.setFillColor(...((ri % 2 === 0 ? [248, 250, 255] : [255, 255, 255]) as [number, number, number]));
      doc.rect(M, y2, W - M * 2, 7, "F");
      doc.setDrawColor(210, 220, 235); doc.setLineWidth(0.2); doc.rect(M, y2, W - M * 2, 7, "S");
      tx = M;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...DARK);
      row.forEach((cell, ci) => { doc.text(cell, tx + 1, y2 + 5); tx += colW[ci]; });
      y2 += 7;
    });
    return y2 + 4;
  };

  y = scaleTbl("Severity (S)", [["Negligible", "1", "No patient risk, no functional quality impact"], ["Minor", "2", "Minor injury, efficacy slightly reduced"], ["Major", "4", "Serious injury, significant efficacy impact"], ["Critical", "8", "Life-threatening, batch failure/recall"]], y);
  y = scaleTbl("Probability (P)", [["Remote", "1", "No historical evidence (0%)"], ["Low", "2", "Few historical events (< 25%)"], ["Moderate", "4", "Occasional occurrence (25–50%)"], ["High", "8", "Occurs frequently (> 50%)"]], y);
  y = scaleTbl("Detection (D)", [["Almost Certain", "1", "Validated 100% automatic detection"], ["High", "2", "Statistical sampling, frequent detection"], ["Low", "3", "Indirect/manual single sample point"], ["Absolute Uncertainty", "4", "No detection method in place"]], y);
  y += 2;
  y = scaleTbl("RPN Threshold (RPN = S × P × D)", [["Minor", "1–8", "Acceptable risk — monitor"], ["Major", "> 8", "Unacceptable risk — mitigation required"]], y);

  // FMEA Worksheet (landscape)
  doc.addPage("a4", "landscape"); pg++;
  const LW = 297; const LH = 210; const LM = 10;
  doc.setFillColor(...NAVY); doc.rect(0, 0, LW, 14, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
  doc.text("CAPALYST — FMEA Worksheet (SOPPQA016 v05)", LM, 9);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(170, 195, 220);
  doc.text(`${ra.assessmentNumber} | Major: RPN > 8 | Minor: RPN ≤ 8 | Page ${pg}`, LW - LM, 9, { align: "right" });
  doc.setDrawColor(200, 210, 220); doc.setLineWidth(0.3); doc.line(LM, LH - 8, LW - LM, LH - 8);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
  doc.text("CONTROLLED DOCUMENT — FOR INTERNAL USE ONLY  |  CPT Quality Management System", LM, LH - 4);

  const cols = [
    { h: "#", w: 7 }, { h: "Process Step", w: 25 }, { h: "Failure Mode", w: 24 },
    { h: "Potential Effects", w: 21 }, { h: "S", w: 7 }, { h: "Potential Causes", w: 21 },
    { h: "P", w: 7 }, { h: "RES", w: 10 }, { h: "Prev Controls", w: 18 }, { h: "Det Controls", w: 18 },
    { h: "D", w: 7 }, { h: "RPN", w: 12 }, { h: "Risk Level", w: 14 },
    { h: "Recommended Action", w: 22 }, { h: "Responsible", w: 16 }, { h: "Target", w: 14 },
    { h: "Status", w: 13 }, { h: "Action Taken", w: 18 },
    { h: "Rev S", w: 8 }, { h: "Rev P", w: 8 }, { h: "Rev D", w: 8 },
    { h: "Rev RPN", w: 13 }, { h: "Resid OK?", w: 14 },
  ];

  let fy = 18;
  doc.setFillColor(...NAVY); doc.rect(LM, fy, LW - LM * 2, 8, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255);
  let cx = LM; cols.forEach(c => { doc.text(c.h, cx + 0.5, fy + 5.5); cx += c.w; }); fy += 8;

  if (entries.length === 0) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text("No FMEA entries recorded.", LM + 4, fy + 10);
  } else {
    entries.forEach((e, idx) => {
      if (fy > LH - 22) {
        doc.addPage("a4", "landscape"); pg++;
        doc.setFillColor(...NAVY); doc.rect(0, 0, LW, 14, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
        doc.text("CAPALYST — FMEA Worksheet (continued)", LM, 9);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(170, 195, 220);
        doc.text(`Page ${pg}`, LW - LM, 9, { align: "right" });
        doc.setDrawColor(200, 210, 220); doc.setLineWidth(0.3); doc.line(LM, LH - 8, LW - LM, LH - 8);
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
        doc.text("CONTROLLED DOCUMENT — FOR INTERNAL USE ONLY  |  CPT Quality Management System", LM, LH - 4);
        fy = 18;
        doc.setFillColor(...NAVY); doc.rect(LM, fy, LW - LM * 2, 8, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255);
        cx = LM; cols.forEach(c => { doc.text(c.h, cx + 0.5, fy + 5.5); cx += c.w; }); fy += 8;
      }
      const rH = 10;
      doc.setFillColor(...((idx % 2 === 0 ? [250, 251, 255] : [255, 255, 255]) as [number, number, number]));
      doc.rect(LM, fy, LW - LM * 2, rH, "F");
      doc.setDrawColor(210, 215, 230); doc.setLineWidth(0.15); doc.rect(LM, fy, LW - LM * 2, rH, "S");
      const res = e.severity * e.occurrence;
      const cells = [
        String(idx + 1), e.processStep, e.failureMode, e.potentialEffects || "—",
        String(e.severity), e.potentialCauses || "—", String(e.occurrence),
        String(res),
        e.currentControlsPrevention || "—", e.currentControlsDetection || "—",
        String(e.detection), String(e.rpn), e.riskLevel,
        e.recommendedAction || "—", e.responsiblePerson || "—", e.targetDate || "—",
        e.actionStatus || "—", e.actionTaken || "—",
        e.revisedSeverity != null ? String(e.revisedSeverity) : "—",
        e.revisedOccurrence != null ? String(e.revisedOccurrence) : "—",
        e.revisedDetection != null ? String(e.revisedDetection) : "—",
        e.revisedRpn != null ? `${e.revisedRpn}(${e.revisedRiskLevel})` : "—",
        e.residualRiskAcceptable || "—",
      ];
      cx = LM;
      cells.forEach((cell, ci) => {
        if (ci === 12) {
          const rc = e.riskLevel === "Major" ? RED : GREEN;
          doc.setTextColor(...rc); doc.setFont("helvetica", "bold");
        } else if (ci === 11) {
          doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
        } else {
          doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
        }
        doc.setFontSize(6.5);
        const t = (doc.splitTextToSize(cell, cols[ci].w - 1) as string[])[0] ?? "";
        doc.text(t, cx + 0.5, fy + 6.5);
        cx += cols[ci].w;
      });
      fy += rH;
    });
  }

  // Narrative pages
  y = newPg();
  const majorC = entries.filter(e => e.riskLevel === "Major").length;
  const minorC = entries.filter(e => e.riskLevel === "Minor").length;
  const maxRPN = entries.length > 0 ? Math.max(...entries.map(e => e.rpn)) : 0;

  y = sec("3. Risk Evaluation Summary", y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...DARK);
  doc.text(`Total FMEA Entries: ${entries.length}   Major: ${majorC}   Minor: ${minorC}   Max RPN: ${maxRPN}   Risk Class: ${(ra as { riskClass?: string | null }).riskClass || "Not classified"}`, M, y);
  y += 6;
  y = body(ra.riskEvaluation || (ra as { riskAnalysis?: string | null }).riskAnalysis || "—", y);
  y += 5;

  y = sec("4. Risk Control", y);
  y = body(ra.actionPlans || (ra as { riskControl?: string | null }).riskControl || "—", y);
  y += 5;

  if (y > H - 60) { y = newPg(); }
  y = sec("5. Risk Communication & Monitoring", y);
  y = body(ra.riskCommunication || (ra as { riskMonitoring?: string | null }).riskMonitoring || "—", y);
  y += 5;

  y = sec("6. Conclusion", y);
  y = body(ra.conclusion || "—", y);
  y += 8;

  if (ra.approvedBy) {
    doc.setFillColor(244, 248, 254); doc.rect(M, y, W - M * 2, 16, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...DARK);
    doc.text("Approved by:", M + 3, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(`${ra.approvedBy}${ra.approvalDate ? `  |  ${ra.approvalDate}` : ""}`, M + 32, y + 7);
  }

  const ts = format(new Date(), "yyyyMMdd_HHmm");
  doc.save(`CPT_RA_${ra.assessmentNumber}_${ts}.pdf`);
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

type OForm = {
  title: string; assessmentType: string; documentNumber: string; revision: string; sopReference: string; raArea: string;
  scope: string; productProcess: string; regulatoryContext: string; riskAcceptanceCriteria: string;
  initiatedBy: string; compiledByDesignation: string;
  approver1Area: string; approver1Name: string; approver1Designation: string;
  approver2Area: string; approver2Name: string; approver2Designation: string;
  riskIdentification: string; riskAnalysis: string; riskControl: string; riskMonitoring: string;
  riskEvaluation: string; actionPlans: string; riskCommunication: string; conclusion: string;
};

function OverviewTab({ ra, canEdit, onSaved }: { ra: RiskAssessment; canEdit: boolean; onSaved: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<OForm>({} as OForm);
  const raExt = ra as RiskAssessment & { sopReference?: string | null; raArea?: string | null; riskAnalysis?: string | null; riskControl?: string | null; riskMonitoring?: string | null; };

  const updateRa = useUpdateRiskAssessment({
    mutation: {
      onSuccess: () => { onSaved(); setEditing(false); toast({ title: "Saved" }); },
      onError: () => toast({ title: "Save failed", variant: "destructive" }),
    },
  });

  function startEdit() {
    setForm({
      title: ra.title, assessmentType: ra.assessmentType,
      documentNumber: ra.documentNumber ?? "", revision: ra.revision ?? "001",
      sopReference: raExt.sopReference ?? "SOPPQA016", raArea: raExt.raArea ?? "",
      scope: ra.scope ?? "", productProcess: ra.productProcess ?? "",
      regulatoryContext: ra.regulatoryContext ?? "", riskAcceptanceCriteria: ra.riskAcceptanceCriteria ?? "",
      initiatedBy: ra.initiatedBy, compiledByDesignation: ra.compiledByDesignation ?? "",
      approver1Area: ra.approver1Area ?? "", approver1Name: ra.approver1Name ?? "", approver1Designation: ra.approver1Designation ?? "",
      approver2Area: ra.approver2Area ?? "", approver2Name: ra.approver2Name ?? "", approver2Designation: ra.approver2Designation ?? "",
      riskIdentification: ra.riskIdentification ?? "", riskAnalysis: raExt.riskAnalysis ?? "",
      riskControl: raExt.riskControl ?? "", riskMonitoring: raExt.riskMonitoring ?? "",
      riskEvaluation: ra.riskEvaluation ?? "", actionPlans: ra.actionPlans ?? "",
      riskCommunication: ra.riskCommunication ?? "", conclusion: ra.conclusion ?? "",
    });
    setEditing(true);
  }

  const s = (k: keyof OForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    updateRa.mutate({
      id: ra.id,
      data: {
        title: form.title, assessmentType: form.assessmentType,
        documentNumber: form.documentNumber || null, revision: form.revision || null,
        sopReference: form.sopReference || null, raArea: form.raArea || null,
        scope: form.scope || null, productProcess: form.productProcess || null,
        regulatoryContext: form.regulatoryContext || null, riskAcceptanceCriteria: form.riskAcceptanceCriteria || null,
        initiatedBy: form.initiatedBy, compiledByDesignation: form.compiledByDesignation || null,
        approver1Area: form.approver1Area || null, approver1Name: form.approver1Name || null, approver1Designation: form.approver1Designation || null,
        approver2Area: form.approver2Area || null, approver2Name: form.approver2Name || null, approver2Designation: form.approver2Designation || null,
        riskIdentification: form.riskIdentification || null, riskAnalysis: form.riskAnalysis || null,
        riskControl: form.riskControl || null, riskMonitoring: form.riskMonitoring || null,
        riskEvaluation: form.riskEvaluation || null, actionPlans: form.actionPlans || null,
        riskCommunication: form.riskCommunication || null, conclusion: form.conclusion || null,
      },
    });
  }

  const fi = (lbl: string, key: keyof OForm, ph?: string, span2?: boolean) => (
    <div className={`grid gap-1.5 ${span2 ? "col-span-2" : ""}`}>
      <Label className="text-xs">{lbl}</Label>
      <Input value={form[key]} onChange={e => s(key, e.target.value)} placeholder={ph} className="text-sm h-8" />
    </div>
  );
  const ta = (lbl: string, key: keyof OForm, rows = 3) => (
    <div className="grid gap-1.5 col-span-2">
      <Label className="text-xs">{lbl}</Label>
      <Textarea value={form[key]} onChange={e => s(key, e.target.value)} rows={rows} className="text-sm" />
    </div>
  );
  const ro = (lbl: string, val?: string | null) => (
    <div className="grid gap-0.5">
      <dt className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{lbl}</dt>
      <dd className="text-sm text-slate-800 dark:text-slate-200">{val || "—"}</dd>
    </div>
  );

  if (!editing) return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Document Information</CardTitle>
          {canEdit && <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</Button>}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            {ro("Assessment Number", ra.assessmentNumber)}
            {ro("Document Number", ra.documentNumber)}
            {ro("Revision", ra.revision || "001")}
            {ro("SOP Reference", raExt.sopReference || "SOPPQA016")}
            {ro("Status", ra.status)}
            {ro("Risk Class", (raExt as { riskClass?: string | null }).riskClass)}
            {ro("Assessment Type", ra.assessmentType)}
            {ro("Area", raExt.raArea)}
            {ro("Product / Process", ra.productProcess)}
            {ro("Regulatory Context", ra.regulatoryContext || "ICH Q9, SOPPQA016")}
            {ro("Risk Acceptance Criteria", ra.riskAcceptanceCriteria)}
            {ro("Approval Date", ra.approvalDate)}
            {ro("Approved By", ra.approvedBy)}
            {ro("Next Review", (raExt as { nextReviewDate?: string | null }).nextReviewDate)}
            {ro("Version", `v${(raExt as { riskVersion?: number }).riskVersion ?? 1}`)}
          </dl>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Signatories</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                {["Role", "Functional Area", "Name", "Designation"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 border border-slate-200 dark:border-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { role: "Compiled by", area: "Quality Control / Quality Assurance", name: ra.initiatedBy, des: ra.compiledByDesignation },
                { role: "Approved by", area: ra.approver1Area, name: ra.approver1Name, des: ra.approver1Designation },
                { role: "Approved by", area: ra.approver2Area, name: ra.approver2Name, des: ra.approver2Designation },
              ].map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  {[row.role, row.area || "—", row.name || "—", row.des || "—"].map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-sm">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">ICH Q9 Risk Management Sections</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { lbl: "Scope", val: ra.scope },
            { lbl: "Risk Identification", val: ra.riskIdentification },
            { lbl: "Risk Analysis", val: raExt.riskAnalysis },
            { lbl: "Risk Control", val: raExt.riskControl },
            { lbl: "Risk Monitoring", val: raExt.riskMonitoring },
            { lbl: "Risk Communication", val: ra.riskCommunication },
            { lbl: "Risk Evaluation / Conclusion", val: ra.riskEvaluation || ra.conclusion },
          ].map(({ lbl, val }) => (
            <div key={lbl} className="border-t first:border-t-0 pt-4 first:pt-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{lbl}</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{val || "—"}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Document Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {fi("Title *", "title", "Risk assessment title", true)}
          {fi("Assessment Type", "assessmentType")}
          {fi("SOP Reference", "sopReference", "SOPPQA016")}
          {fi("Document Number", "documentNumber", "e.g. CPT/QC/CRA/SC/001")}
          {fi("Revision", "revision", "e.g. 001")}
          {fi("Area (Attachment 3)", "raArea", "e.g. Manufacturing, Quality, Warehouse")}
          {fi("Product / Process", "productProcess")}
          {fi("Regulatory Context", "regulatoryContext")}
          {fi("Risk Acceptance Criteria", "riskAcceptanceCriteria")}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Signatories</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Compiled by</p></div>
          {fi("Name *", "initiatedBy")}
          {fi("Designation", "compiledByDesignation", "e.g. Quality Control Manager")}
          <div className="col-span-2 border-t pt-3"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approved by 1</p></div>
          {fi("Functional Area", "approver1Area")}
          {fi("Name", "approver1Name")}
          {fi("Designation", "approver1Designation", "", true)}
          <div className="col-span-2 border-t pt-3"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Approved by 2</p></div>
          {fi("Functional Area", "approver2Area")}
          {fi("Name", "approver2Name")}
          {fi("Designation", "approver2Designation", "", true)}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">ICH Q9 Risk Management Sections</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {ta("Scope", "scope")}
          {ta("Risk Identification", "riskIdentification")}
          {ta("Risk Analysis", "riskAnalysis")}
          {ta("Risk Control", "riskControl")}
          {ta("Risk Monitoring", "riskMonitoring")}
          {ta("Risk Communication", "riskCommunication")}
          {ta("Risk Evaluation", "riskEvaluation")}
          {ta("Conclusion", "conclusion")}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={updateRa.isPending} className="gap-1.5">
          {updateRa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
        <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Report Preview ───────────────────────────────────────────────────────────

function ReportPreview({ ra, entries }: { ra: RiskAssessment; entries: FmeaEntry[] }) {
  const majorC = entries.filter(e => e.riskLevel === "Major").length;
  const minorC = entries.filter(e => e.riskLevel === "Minor").length;
  const maxEntry = entries.length > 0 ? entries.reduce((p, c) => c.rpn > p.rpn ? c : p) : null;
  const raExt = ra as RiskAssessment & { riskClass?: string | null; nextReviewDate?: string | null; riskVersion?: number; raArea?: string | null; };

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="rounded-xl bg-slate-900 text-white overflow-hidden">
        <div className="p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">CPT Quality Management System — SOPPQA016 v05</p>
          <h2 className="text-xl font-bold">Quality Risk Assessment Report</h2>
          <p className="text-slate-300 mt-1">{ra.title}</p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-slate-300">
            <div><span className="text-slate-500">Doc #:</span> {ra.documentNumber || ra.assessmentNumber}</div>
            <div><span className="text-slate-500">Risk Class:</span> {raExt.riskClass || "Not classified"}</div>
            <div><span className="text-slate-500">Generated:</span> {format(new Date(), "dd MMM yyyy")}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { lbl: "Total Entries", val: entries.length, c: "border-slate-200" },
          { lbl: "Major (RPN > 8)", val: majorC, c: majorC > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : "border-slate-200" },
          { lbl: "Minor (RPN ≤ 8)", val: minorC, c: "border-green-200 bg-green-50 dark:bg-green-950/20" },
          { lbl: "Max RPN", val: entries.length > 0 ? Math.max(...entries.map(e => e.rpn)) : 0, c: "border-slate-200" },
        ].map(k => (
          <div key={k.lbl} className={`rounded-lg border p-3 text-center ${k.c}`}>
            <div className="text-2xl font-bold">{k.val}</div>
            <div className="text-xs text-slate-500 mt-0.5">{k.lbl}</div>
          </div>
        ))}
      </div>
      {maxEntry && <p className="text-sm text-slate-500">Highest RPN: <strong>{maxEntry.rpn}</strong> ({maxEntry.riskLevel}) — {maxEntry.processStep}: {maxEntry.failureMode}</p>}

      {entries.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">FMEA Worksheet Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" style={{ minWidth: "1200px" }}>
                <thead>
                  <tr className="bg-slate-800 text-white">
                    {["#", "Process Step", "Failure Mode", "S", "P", "RES", "D", "RPN", "Risk Level", "Action", "Status", "Rev RPN"].map(h => (
                      <th key={h} className="px-2 py-2 text-left border border-slate-700 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id} className={i % 2 === 0 ? "" : "bg-slate-50 dark:bg-slate-800/30"}>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-400">{i + 1}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 font-medium">{e.processStep}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700">{e.failureMode}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-center font-bold">{e.severity}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-center font-bold">{e.occurrence}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-center font-semibold">{e.severity * e.occurrence}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-center font-bold">{e.detection}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-center"><RpnBadge rpn={e.rpn} level={e.riskLevel} /></td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${e.riskLevel === "Major" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{e.riskLevel}</span>
                      </td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700">{e.recommendedAction || "—"}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700">{e.actionStatus || "—"}</td>
                      <td className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-center">
                        {e.revisedRpn != null ? <RpnBadge rpn={e.revisedRpn} level={e.revisedRiskLevel ?? "Minor"} /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="border-t pt-4 text-center text-xs text-slate-400">
        <p className="font-medium">CONTROLLED DOCUMENT — FOR INTERNAL USE ONLY</p>
        <p>CPT Quality Management System · {ra.assessmentNumber} · Generated: {format(new Date(), "dd MMM yyyy, HH:mm")}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RiskAssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const numId = parseInt(id ?? "0", 10);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isQA = !!(user?.roles?.includes("QA") || user?.roles?.includes("Admin"));

  const raQuery = useGetRiskAssessment(numId);
  const entriesQuery = useListFmeaEntries(numId);
  const ra = raQuery.data;
  const entries = entriesQuery.data?.data ?? [];

  const [tab, setTab] = useState("overview");
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [closeDialog, setCloseDialog] = useState(false);
  const [closeComment, setCloseComment] = useState("");
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [reAssessConfirm, setReAssessConfirm] = useState(false);

  const qcKey = { queryKey: [`/api/risk-assessments/${numId}`] };

  const submitMut = useSubmitRiskAssessment({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(qcKey); toast({ title: "Submitted for QA review" }); },
    onError: (e: unknown) => { const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Submit failed"; toast({ title: "Error", description: msg, variant: "destructive" }); },
  }});
  const approveMut = useApproveRiskAssessment({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(qcKey); toast({ title: "Assessment approved" }); },
    onError: () => toast({ title: "Approve failed", variant: "destructive" }),
  }});
  const rejectMut = useRejectRiskAssessment({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(qcKey); setRejectDialog(false); setRejectReason(""); toast({ title: "Returned to Draft" }); },
    onError: () => toast({ title: "Reject failed", variant: "destructive" }),
  }});
  const closeMut = useCloseRiskAssessment({ mutation: {
    onSuccess: () => { queryClient.invalidateQueries(qcKey); setCloseDialog(false); setCloseComment(""); toast({ title: "Assessment closed" }); },
    onError: () => toast({ title: "Close failed", variant: "destructive" }),
  }});
  const reAssessMut = useReAssessRiskAssessment({ mutation: {
    onSuccess: (data) => {
      const d = data as { id?: number };
      if (d.id) navigate(`/risk/${d.id}`);
      toast({ title: "Re-assessment created", description: "A new version has been created." });
    },
    onError: () => toast({ title: "Re-assessment failed", variant: "destructive" }),
  }});

  if (raQuery.isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
  if (!ra) return <div className="p-6 text-slate-500">Risk assessment not found.</div>;

  const isDraft = ra.status === "Draft";
  const isInReview = ra.status === "In Review";
  const isApproved = ra.status === "Approved";
  const canEdit = isDraft;

  const raExt = ra as RiskAssessment & { riskClass?: string | null; nextReviewDate?: string | null; riskVersion?: number; raArea?: string | null; };
  const majorCount = entries.filter(e => e.riskLevel === "Major").length;
  const minorCount = entries.filter(e => e.riskLevel === "Minor").length;
  const maxRPN = entries.length > 0 ? Math.max(...entries.map(e => e.rpn)) : 0;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/risk")} className="mt-0.5"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm text-slate-500">{ra.assessmentNumber}</span>
              {raExt.riskVersion && raExt.riskVersion > 1 && <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">v{raExt.riskVersion}</span>}
              <Badge className={`text-xs font-medium border-0 ${STATUS_COLORS[ra.status] ?? ""}`}>{ra.status}</Badge>
              {raExt.riskClass && <Badge className={`text-xs font-medium border-0 ${CLASS_COLORS[raExt.riskClass] ?? ""}`}>{raExt.riskClass}</Badge>}
            </div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{ra.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{ra.assessmentType}{raExt.raArea ? ` · ${raExt.raArea}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {isDraft && !raExt.riskClass && isQA && (
            <Button variant="outline" onClick={() => setClassifyOpen(true)} className="gap-2">
              <Star className="h-4 w-4" /> Classify
            </Button>
          )}
          {isApproved && isQA && (
            <Button variant="outline" onClick={() => setReAssessConfirm(true)} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Re-assess
            </Button>
          )}
          {isDraft && (
            <Button onClick={() => submitMut.mutate({ id: numId })} disabled={submitMut.isPending} className="gap-2">
              {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit for Review
            </Button>
          )}
          {isInReview && isQA && (
            <>
              <Button variant="outline" onClick={() => setRejectDialog(true)} className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950">
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button onClick={() => approveMut.mutate({ id: numId })} disabled={approveMut.isPending} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve
              </Button>
            </>
          )}
          {isApproved && isQA && (
            <Button variant="outline" onClick={() => setCloseDialog(true)} className="gap-2"><Lock className="h-4 w-4" /> Close</Button>
          )}
          <Button variant="outline" onClick={() => generatePdf(ra, entries)} className="gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {ra.qaRejectReason && isDraft && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div><span className="font-medium">Returned from QA: </span>{ra.qaRejectReason}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Entries", value: entries.length, color: "text-slate-700 dark:text-slate-300" },
          { label: "Major (RPN > 8)", value: majorCount, color: majorCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300" },
          { label: "Minor (RPN ≤ 8)", value: minorCount, color: "text-green-600 dark:text-green-400" },
          { label: "Max RPN", value: maxRPN, color: maxRPN > 8 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400" },
        ].map(k => (
          <Card key={k.label} className="border-slate-200 dark:border-slate-800">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex-wrap h-auto">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="worksheet" className="rounded-lg">FMEA Worksheet</TabsTrigger>
          <TabsTrigger value="matrix" className="rounded-lg">Risk Matrix</TabsTrigger>
          <TabsTrigger value="team" className="rounded-lg">
            <Users className="h-3.5 w-3.5 mr-1.5" />Team
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg">
            <FileText className="h-3.5 w-3.5 mr-1.5" />Review Reports
          </TabsTrigger>
          <TabsTrigger value="links" className="rounded-lg">
            <Link2 className="h-3.5 w-3.5 mr-1.5" />Links
          </TabsTrigger>
          <TabsTrigger value="report" className="rounded-lg">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab ra={ra} canEdit={canEdit} onSaved={() => queryClient.invalidateQueries(qcKey)} />
        </TabsContent>

        <TabsContent value="worksheet" className="mt-4">
          <InlineWorksheet assessmentId={numId} canEdit={canEdit || isInReview} assessmentNumber={ra.assessmentNumber} />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <RiskMatrix4x4 entries={entries} />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamTab assessmentId={numId} isQA={isQA} />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReviewReportsTab assessmentId={numId} isQA={isQA} />
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <LinksTab assessmentId={numId} isQA={isQA} />
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                SOPPQA016 v05 compliant FMEA report — title page, SOP scales, worksheet, ICH Q9 sections, classification.
              </p>
              <Button onClick={() => generatePdf(ra, entries)} className="gap-2 shrink-0">
                <Download className="h-4 w-4" /> Generate PDF
              </Button>
            </div>
            <ReportPreview ra={ra} entries={entries} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Classification Wizard */}
      {classifyOpen && (
        <ClassifyWizard
          assessmentId={numId}
          onClose={() => setClassifyOpen(false)}
          onDone={() => { setClassifyOpen(false); queryClient.invalidateQueries(qcKey); }}
        />
      )}

      {/* Re-assess Confirm */}
      <AlertDialog open={reAssessConfirm} onOpenChange={setReAssessConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Re-Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new version (v{(raExt.riskVersion ?? 1) + 1}) of this risk assessment, copying all FMEA entries. The current version will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setReAssessConfirm(false); reAssessMut.mutate({ id: numId }); }} className="gap-2">
              {reAssessMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Create Re-assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Assessment</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Reason for rejection</Label>
            <Textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Describe what needs to be corrected..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button onClick={() => rejectMut.mutate({ id: numId, data: { reason: rejectReason } })} disabled={!rejectReason.trim() || rejectMut.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {rejectMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close Assessment</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Closing comment (optional)</Label>
            <Textarea rows={3} value={closeComment} onChange={e => setCloseComment(e.target.value)} placeholder="e.g. All actions completed, risk accepted." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)}>Cancel</Button>
            <Button onClick={() => closeMut.mutate({ id: numId })} disabled={closeMut.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {closeMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Close Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
