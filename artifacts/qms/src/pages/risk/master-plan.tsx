import React from "react";
import { Link } from "wouter";
import { useGetRiskMasterPlan } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertTriangle, Calendar, ShieldCheck } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const CLASS_COLORS: Record<string, string> = {
  "Class I":   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Class II":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Class III": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Class IV":  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "In Review": "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Closed: "bg-blue-100 text-blue-700",
};

const CLASS_REVIEW: Record<string, string> = {
  "Class I":   "2 years",
  "Class II":  "3 years",
  "Class III": "4 years",
  "Class IV":  "Event-driven",
};

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RiskMasterPlanPage() {
  const { data, isLoading } = useGetRiskMasterPlan();
  const entries = data?.data ?? [];

  const approved = entries.filter(e => e.status === "Approved");
  const overdue = approved.filter(e => {
    const d = daysUntil(e.nextReviewDate);
    return d !== null && d < 0;
  });
  const dueSoon = approved.filter(e => {
    const d = daysUntil(e.nextReviewDate);
    return d !== null && d >= 0 && d <= 90;
  });
  const classified = entries.filter(e => e.riskClass);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/risk">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Risk Management Master Plan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">SOPPQA016 v05 · All risk assessments portfolio view</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500">Total Assessments</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{entries.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm text-slate-500">Classified</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{classified.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${overdue.length > 0 ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
          <p className="text-sm text-slate-500">Overdue Review</p>
          <p className={`text-2xl font-bold mt-1 ${overdue.length > 0 ? "text-red-600" : "text-slate-900 dark:text-slate-100"}`}>{overdue.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${dueSoon.length > 0 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
          <p className="text-sm text-slate-500">Due Within 90 Days</p>
          <p className={`text-2xl font-bold mt-1 ${dueSoon.length > 0 ? "text-amber-600" : "text-slate-900 dark:text-slate-100"}`}>{dueSoon.length}</p>
        </div>
      </div>

      {/* Classification legend */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Classification Legend (SOPPQA016 v05 §5.5.4)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(CLASS_REVIEW).map(([cls, period]) => (
            <div key={cls} className="flex items-center gap-2">
              <Badge className={`text-xs border-0 ${CLASS_COLORS[cls]}`}>{cls}</Badge>
              <span className="text-xs text-slate-500">{period}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Master Plan Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">No risk assessments yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="font-semibold">Assessment #</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Area</TableHead>
                <TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Version</TableHead>
                <TableHead className="font-semibold">Approval Date</TableHead>
                <TableHead className="font-semibold">Next Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => {
                const days = daysUntil(entry.nextReviewDate);
                const isOverdue = days !== null && days < 0 && entry.status === "Approved";
                const isDueSoon = days !== null && days >= 0 && days <= 90 && entry.status === "Approved";
                return (
                  <TableRow key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell>
                      <Link href={`/risk/${entry.id}`} className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {entry.assessmentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/risk/${entry.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400">
                        {entry.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {entry.raArea ?? <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {entry.riskClass ? (
                        <Badge className={`text-xs border-0 ${CLASS_COLORS[entry.riskClass] ?? "bg-slate-100 text-slate-600"}`}>
                          {entry.riskClass}
                        </Badge>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-0 ${STATUS_COLORS[entry.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-center text-slate-600 dark:text-slate-400">
                      v{entry.riskVersion}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {entry.approvalDate ?? <span className="text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {entry.nextReviewDate ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                          {isDueSoon && !isOverdue && <Calendar className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                          <span className={isOverdue ? "text-red-600 font-medium" : isDueSoon ? "text-amber-600 font-medium" : "text-slate-600 dark:text-slate-400"}>
                            {entry.nextReviewDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">{entry.riskClass === "Class IV" ? "Event-driven" : "—"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
