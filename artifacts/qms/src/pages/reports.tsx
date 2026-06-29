import React, { useState, useMemo } from "react";
import { PageTransition } from "@/components/page-transition";
import {
  useListDeviations,
  getListDeviationsQueryKey,
  useListCapa,
  getListCapaQueryKey,
  useListChangeControl,
  getListChangeControlQueryKey,
  useListEfficacyReviews,
  getListEfficacyReviewsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileBarChart2, Loader2, Activity } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MODULES = ["All", "Deviations", "CAPA", "Change Control", "Efficacy Reviews"] as const;
type Module = typeof MODULES[number];

const STATUS_OPTIONS: Record<Module, string[]> = {
  "All": [],
  "Deviations": ["Draft", "Open", "In Progress", "Closed"],
  "CAPA": ["Draft", "Open", "In Progress", "Closed"],
  "Change Control": ["Draft", "HR Review", "SC Review", "Expert Review", "Works Plan", "Approved", "Closed", "Rejected"],
  "Efficacy Reviews": ["Pending", "Completed"],
};

interface ReportParams {
  module: Module;
  status: string;
  startDate: string;
  endDate: string;
}

export default function ReportsPage() {
  const [module, setModule] = useState<Module>("All");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeParams, setActiveParams] = useState<ReportParams | null>(null);

  const devsEnabled = !!activeParams && (activeParams.module === "All" || activeParams.module === "Deviations");
  const capaEnabled = !!activeParams && (activeParams.module === "All" || activeParams.module === "CAPA");
  const ccEnabled = !!activeParams && (activeParams.module === "All" || activeParams.module === "Change Control");
  const erEnabled = !!activeParams && (activeParams.module === "All" || activeParams.module === "Efficacy Reviews");

  const devsParams = { pageSize: 500, ...(activeParams?.status ? { flag: activeParams.status } : {}) };
  const capaParams = { pageSize: 500, ...(activeParams?.status ? { flag: activeParams.status } : {}) };
  const ccParams = { pageSize: 500, ...(activeParams?.status ? { flag: activeParams.status } : {}) };
  const erParams = { pageSize: 500, ...(activeParams?.status ? { flag: activeParams.status } : {}) };

  const { data: devsData, isLoading: devsLoading } = useListDeviations(
    devsParams,
    { query: { queryKey: getListDeviationsQueryKey(devsParams), enabled: devsEnabled } },
  );
  const { data: capaData, isLoading: capaLoading } = useListCapa(
    capaParams,
    { query: { queryKey: getListCapaQueryKey(capaParams), enabled: capaEnabled } },
  );
  const { data: ccData, isLoading: ccLoading } = useListChangeControl(
    ccParams,
    { query: { queryKey: getListChangeControlQueryKey(ccParams), enabled: ccEnabled } },
  );
  const { data: erData, isLoading: erLoading } = useListEfficacyReviews(
    erParams,
    { query: { queryKey: getListEfficacyReviewsQueryKey(erParams), enabled: erEnabled } },
  );

  const allDevs = devsData?.data ?? [];
  const allCapas = capaData?.data ?? [];
  const allCcs = ccData?.data ?? [];
  const allErs = erData?.data ?? [];

  const devs = useMemo(() => {
    let rows = allDevs;
    if (activeParams?.startDate) rows = rows.filter(d => d.eventDate >= activeParams.startDate);
    if (activeParams?.endDate) rows = rows.filter(d => d.eventDate <= activeParams.endDate);
    return rows;
  }, [allDevs, activeParams]);

  const capas = useMemo(() => {
    let rows = allCapas;
    if (activeParams?.startDate) rows = rows.filter(c => c.creationDate >= activeParams.startDate);
    if (activeParams?.endDate) rows = rows.filter(c => c.creationDate <= activeParams.endDate);
    return rows;
  }, [allCapas, activeParams]);

  const ccs = useMemo(() => {
    let rows = allCcs;
    if (activeParams?.startDate) rows = rows.filter(c => c.plannedImplementationDate >= activeParams.startDate);
    if (activeParams?.endDate) rows = rows.filter(c => c.plannedImplementationDate <= activeParams.endDate);
    return rows;
  }, [allCcs, activeParams]);

  const ers = useMemo(() => {
    let rows = allErs;
    if (activeParams?.startDate) rows = rows.filter(e => e.expectedDate >= activeParams.startDate);
    if (activeParams?.endDate) rows = rows.filter(e => e.expectedDate <= activeParams.endDate);
    return rows;
  }, [allErs, activeParams]);

  const isLoading = devsLoading || capaLoading || ccLoading || erLoading;
  const hasReport = !!activeParams && !isLoading;

  const generatedAt = activeParams ? format(new Date(), "PPp") : null;

  const handleGenerate = () => {
    setActiveParams({ module, status, startDate, endDate });
  };

  const generatePdf = () => {
    if (!activeParams) return;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const NAVY: [number, number, number] = [26, 41, 66];
    const LIGHT: [number, number, number] = [245, 247, 250];
    const MUTED: [number, number, number] = [120, 130, 145];

    const headStyles = { fillColor: NAVY, textColor: [255, 255, 255] as [number, number, number], fontStyle: "bold" as const, fontSize: 8 };
    const bodyStyles = { fontSize: 8, cellPadding: 2.5 };
    const margins = { left: 14, right: 14 };

    /* ─ Draw page header ─ */
    const drawHeader = () => {
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CAPALYST", 14, 11);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("CPT Quality Management System", 14, 17.5);
      doc.setTextColor(200, 210, 230);
      doc.text(`CONTROLLED DOCUMENT — FOR INTERNAL USE ONLY`, pageW - 14, 11, { align: "right" });
      const now = format(new Date(), "dd MMM yyyy, HH:mm");
      doc.text(`Generated: ${now}`, pageW - 14, 17.5, { align: "right" });
    };

    /* ─ Page 1 header + title block ─ */
    drawHeader();

    doc.setTextColor(30, 40, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const reportTitle = activeParams.module === "All" ? "Full QMS Report" : `${activeParams.module} Report`;
    doc.text(reportTitle, 14, 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const metaParts: string[] = [
      activeParams.status ? `Status: ${activeParams.status}` : "All Statuses",
      ...(activeParams.startDate ? [`From: ${activeParams.startDate}`] : []),
      ...(activeParams.endDate ? [`To: ${activeParams.endDate}`] : []),
    ];
    doc.text(metaParts.join("   •   "), 14, 41);

    let y = 50;

    /* ─ Summary boxes for "All" report ─ */
    if (activeParams.module === "All") {
      const summaries = [
        { label: "Deviations", count: devs.length },
        { label: "CAPAs", count: capas.length },
        { label: "Change Controls", count: ccs.length },
        { label: "Efficacy Reviews", count: ers.length },
      ];
      const boxW = (pageW - 28 - 6) / 4;
      summaries.forEach((s, i) => {
        const x = 14 + i * (boxW + 2);
        doc.setFillColor(...LIGHT);
        doc.roundedRect(x, y, boxW, 18, 2, 2, "F");
        doc.setTextColor(30, 40, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(String(s.count), x + boxW / 2, y + 10, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(s.label, x + boxW / 2, y + 15.5, { align: "center" });
      });
      y += 24;
    }

    /* ─ Section heading helper ─ */
    const drawSection = (title: string, count: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 40, 55);
      doc.text(`${title}  (${count} record${count !== 1 ? "s" : ""})`, 14, y);
      doc.setDrawColor(...NAVY);
      doc.setLineWidth(0.4);
      doc.line(14, y + 1.5, pageW - 14, y + 1.5);
      y += 6;
    };

    /* ─ Deviations ─ */
    if (devsEnabled) {
      drawSection("Deviations", devs.length);
      if (devs.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text("No deviations match the selected filters.", 14, y + 4);
        y += 12;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["Number", "Title", "Status", "Type", "Area Responsible", "Event Date", "Due Date", "Overdue"]],
          body: devs.map((d) => [
            d.deviationNumber ?? "—",
            d.title ?? "—",
            d.status ?? "—",
            d.deviationType ?? "—",
            d.areaResponsible ?? "—",
            d.eventDate ?? "—",
            d.dueDate ?? "—",
            d.isOverdue ? "YES" : "No",
          ]),
          headStyles,
          bodyStyles,
          alternateRowStyles: { fillColor: LIGHT },
          margin: margins,
          columnStyles: { 0: { cellWidth: 28 }, 7: { cellWidth: 16, halign: "center" } },
          didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }

    /* ─ CAPA ─ */
    if (capaEnabled) {
      if (y > pageH - 50) { doc.addPage(); drawHeader(); y = 30; }
      drawSection("CAPA", capas.length);
      if (capas.length === 0) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...MUTED);
        doc.text("No CAPAs match the selected filters.", 14, y + 4); y += 12;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["Number", "Title", "Type", "Status", "Linked Deviation", "Planned Date", "Overdue"]],
          body: capas.map((c) => [
            c.capaNumber ?? "—",
            c.title ?? "—",
            c.capaType ?? "—",
            c.status ?? "—",
            c.deviationNumber ?? "—",
            c.updatedPlannedDate ?? c.initialPlannedDate ?? "—",
            c.isOverdue ? "YES" : "No",
          ]),
          headStyles,
          bodyStyles,
          alternateRowStyles: { fillColor: LIGHT },
          margin: margins,
          columnStyles: { 0: { cellWidth: 28 }, 6: { cellWidth: 16, halign: "center" } },
          didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }

    /* ─ Change Control ─ */
    if (ccEnabled) {
      if (y > pageH - 50) { doc.addPage(); drawHeader(); y = 30; }
      drawSection("Change Control", ccs.length);
      if (ccs.length === 0) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...MUTED);
        doc.text("No change controls match the selected filters.", 14, y + 4); y += 12;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["Number", "Title", "Type", "Status", "Location", "Planned Date"]],
          body: ccs.map((c) => [
            c.changeControlNumber ?? "—",
            c.title ?? "—",
            c.changeType ?? "—",
            c.status ?? "—",
            c.location ?? "—",
            c.plannedImplementationDate ?? "—",
          ]),
          headStyles,
          bodyStyles,
          alternateRowStyles: { fillColor: LIGHT },
          margin: margins,
          columnStyles: { 0: { cellWidth: 32 } },
          didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }

    /* ─ Efficacy Reviews ─ */
    if (erEnabled) {
      if (y > pageH - 50) { doc.addPage(); drawHeader(); y = 30; }
      drawSection("Efficacy Reviews", ers.length);
      if (ers.length === 0) {
        doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(...MUTED);
        doc.text("No efficacy reviews match the selected filters.", 14, y + 4); y += 12;
      } else {
        autoTable(doc, {
          startY: y,
          head: [["CAPA", "Reviewer", "Status", "Expected Date", "Review Date", "Outcome / Review"]],
          body: ers.map((e) => [
            e.capaNumber ?? `CAPA-${e.capaId}`,
            e.reviewer ?? "—",
            e.status ?? "—",
            e.expectedDate ?? "—",
            e.reviewDate ?? "—",
            e.review ?? "—",
          ]),
          headStyles,
          bodyStyles,
          alternateRowStyles: { fillColor: LIGHT },
          margin: margins,
          columnStyles: { 0: { cellWidth: 28 }, 5: { cellWidth: 50 } },
          didDrawPage: (data) => { if (data.pageNumber > 1) drawHeader(); },
        });
      }
    }

    /* ─ Page numbers in footer ─ */
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.3);
      doc.line(14, pageH - 10, pageW - 14, pageH - 10);
      doc.text("Capalyst QMS  |  CPT", 14, pageH - 5.5);
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 5.5, { align: "right" });
    }

    const slug = activeParams.module.replace(/ /g, "_");
    const ts = format(new Date(), "yyyyMMdd_HHmm");
    doc.save(`QMS_Report_${slug}_${ts}.pdf`);
  };

  const statusLine = activeParams?.status ? `Status: ${activeParams.status}` : "All Statuses";
  const dateParts = [
    activeParams?.startDate && `From: ${activeParams.startDate}`,
    activeParams?.endDate && `To: ${activeParams.endDate}`,
  ].filter(Boolean).join("  •  ");

  return (
    <PageTransition className="p-6">
      {/* CONTROLS — hidden on print */}
      <div className="no-print mb-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate formatted, print-ready QMS reports for any module.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart2 className="h-4 w-4 text-muted-foreground" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1.5">
                <Label>Module</Label>
                <Select
                  value={module}
                  onValueChange={(v) => {
                    setModule(v as Module);
                    setStatus("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status || "_all"}
                  onValueChange={(v) => setStatus(v === "_all" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Statuses</SelectItem>
                    {STATUS_OPTIONS[module].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoading ? "Loading data…" : "Generate Report"}
              </Button>
              {hasReport && (
                <Button variant="outline" onClick={generatePdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Fetching records…</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!activeParams && (
        <div className="no-print flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <FileBarChart2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-medium text-muted-foreground">No report generated yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Configure the parameters above and click Generate Report.
            </p>
          </div>
        </div>
      )}

      {/* PRINT-READY REPORT — visible both on screen and in print */}
      {hasReport && activeParams && (
        <div className="report-area space-y-8 max-w-5xl">
          {/* Report header */}
          <div className="border-b-2 border-foreground/20 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="font-bold text-xl">CPT</span>
                  <span className="text-muted-foreground text-sm">Quality Management System</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {activeParams.module === "All" ? "Full QMS Report" : `${activeParams.module} Report`}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusLine}
                  {dateParts && <span>  •  {dateParts}</span>}
                </p>
              </div>
              <div className="text-right text-sm shrink-0">
                <p className="text-muted-foreground">Generated</p>
                <p className="font-medium">{generatedAt}</p>
              </div>
            </div>
          </div>

          {/* Summary boxes for "All" report */}
          {activeParams.module === "All" && (
            <div className="grid grid-cols-4 gap-4">
              <SummaryBox label="Deviations" count={devs.length} />
              <SummaryBox label="CAPAs" count={capas.length} />
              <SummaryBox label="Change Controls" count={ccs.length} />
              <SummaryBox label="Efficacy Reviews" count={ers.length} />
            </div>
          )}

          {/* Deviations section */}
          {devsEnabled && (
            <ReportSection title="Deviations" count={devs.length}>
              {devs.length === 0 ? (
                <EmptyRow message="No deviations match the selected filters." />
              ) : (
                <table className="report-table w-full text-sm">
                  <thead>
                    <tr>
                      <Th>Number</Th>
                      <Th>Title</Th>
                      <Th>Status</Th>
                      <Th>Type</Th>
                      <Th>Area</Th>
                      <Th>Event Date</Th>
                      <Th>Due Date</Th>
                      <Th>Overdue</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {devs.map((d, i) => (
                      <tr key={d.id} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                        <Td mono>{d.deviationNumber}</Td>
                        <Td>{d.title}</Td>
                        <Td>{d.status}</Td>
                        <Td>{d.deviationType}</Td>
                        <Td>{d.areaResponsible}</Td>
                        <Td>{d.eventDate}</Td>
                        <Td>{d.dueDate}</Td>
                        <Td>{d.isOverdue ? "⚠ Yes" : "No"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ReportSection>
          )}

          {/* CAPA section */}
          {capaEnabled && (
            <ReportSection title="CAPA" count={capas.length}>
              {capas.length === 0 ? (
                <EmptyRow message="No CAPAs match the selected filters." />
              ) : (
                <table className="report-table w-full text-sm">
                  <thead>
                    <tr>
                      <Th>Number</Th>
                      <Th>Title</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th>Linked Deviation</Th>
                      <Th>Planned Date</Th>
                      <Th>Overdue</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {capas.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                        <Td mono>{c.capaNumber}</Td>
                        <Td>{c.title}</Td>
                        <Td>{c.capaType}</Td>
                        <Td>{c.status}</Td>
                        <Td mono>{c.deviationNumber ?? "—"}</Td>
                        <Td>{c.updatedPlannedDate ?? c.initialPlannedDate}</Td>
                        <Td>{c.isOverdue ? "⚠ Yes" : "No"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ReportSection>
          )}

          {/* Change Control section */}
          {ccEnabled && (
            <ReportSection title="Change Control" count={ccs.length}>
              {ccs.length === 0 ? (
                <EmptyRow message="No change controls match the selected filters." />
              ) : (
                <table className="report-table w-full text-sm">
                  <thead>
                    <tr>
                      <Th>Number</Th>
                      <Th>Title</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th>Location</Th>
                      <Th>Planned Date</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ccs.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                        <Td mono>{c.changeControlNumber}</Td>
                        <Td>{c.title}</Td>
                        <Td>{c.changeType}</Td>
                        <Td>{c.status}</Td>
                        <Td>{c.location}</Td>
                        <Td>{c.plannedImplementationDate}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ReportSection>
          )}

          {/* Efficacy Reviews section */}
          {erEnabled && (
            <ReportSection title="Efficacy Reviews" count={ers.length}>
              {ers.length === 0 ? (
                <EmptyRow message="No efficacy reviews match the selected filters." />
              ) : (
                <table className="report-table w-full text-sm">
                  <thead>
                    <tr>
                      <Th>CAPA</Th>
                      <Th>Reviewer</Th>
                      <Th>Status</Th>
                      <Th>Expected Date</Th>
                      <Th>Review Date</Th>
                      <Th>Outcome</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ers.map((e, i) => (
                      <tr key={e.id} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                        <Td mono>{e.capaNumber ?? `CAPA-${e.capaId}`}</Td>
                        <Td>{e.reviewer}</Td>
                        <Td>{e.status}</Td>
                        <Td>{e.expectedDate}</Td>
                        <Td>{e.reviewDate ?? "—"}</Td>
                        <Td>{e.review ?? "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ReportSection>
          )}

          {/* Footer */}
          <div className="border-t pt-6 text-xs text-muted-foreground text-center space-y-1">
            <p className="font-medium">CONTROLLED DOCUMENT — FOR INTERNAL USE ONLY</p>
            <p>
              This is a computer-generated QMS report. Verify data accuracy before use in regulated activities.
            </p>
            <p>CPT Quality Management System  •  Generated: {generatedAt}</p>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function SummaryBox({ label, count }: { label: string; count: number }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <p className="text-3xl font-bold tracking-tight">{count}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ReportSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="print-section space-y-3">
      <h3 className="font-bold text-base flex items-center gap-3">
        {title}
        <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
          {count} record{count !== 1 ? "s" : ""}
        </span>
      </h3>
      <div className="border rounded-lg overflow-hidden">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/60 border-b whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      className={`px-3 py-2 border-b border-border/40 text-sm align-top ${mono ? "font-mono text-xs" : ""}`}
    >
      {children ?? "—"}
    </td>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="px-4 py-8 text-center text-sm text-muted-foreground">{message}</div>
  );
}
