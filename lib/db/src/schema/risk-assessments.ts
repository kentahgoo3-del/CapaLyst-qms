import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskAssessmentsTable = pgTable("risk_assessments", {
  id: serial("id").primaryKey(),
  assessmentNumber: text("assessment_number").notNull(),
  title: text("title").notNull(),
  assessmentType: text("assessment_type").notNull(),
  documentNumber: text("document_number"),
  revision: text("revision"),
  scope: text("scope"),
  productProcess: text("product_process"),
  regulatoryContext: text("regulatory_context"),
  riskAcceptanceCriteria: text("risk_acceptance_criteria"),
  status: text("status").notNull().default("Draft"),
  workflowStatus: text("workflow_status"),
  initiatedBy: text("initiated_by").notNull(),
  compiledByDesignation: text("compiled_by_designation"),
  approvedBy: text("approved_by"),
  approvalDate: date("approval_date", { mode: "string" }),
  reviewDate: date("review_date", { mode: "string" }),
  approver1Area: text("approver1_area"),
  approver1Name: text("approver1_name"),
  approver1Designation: text("approver1_designation"),
  approver2Area: text("approver2_area"),
  approver2Name: text("approver2_name"),
  approver2Designation: text("approver2_designation"),
  riskIdentification: text("risk_identification"),
  riskEvaluation: text("risk_evaluation"),
  actionPlans: text("action_plans"),
  riskCommunication: text("risk_communication"),
  conclusion: text("conclusion"),
  closeComment: text("close_comment"),
  qaRejectReason: text("qa_reject_reason"),
  // SOP-aligned & ICH Q9 fields
  riskClass: text("risk_class"),
  nextReviewDate: date("next_review_date", { mode: "string" }),
  decisionTreeData: text("decision_tree_data"),
  sopReference: text("sop_reference"),
  raArea: text("ra_area"),
  methodology: text("methodology"),
  riskAnalysis: text("risk_analysis"),
  riskControl: text("risk_control"),
  riskMonitoring: text("risk_monitoring"),
  riskVersion: integer("risk_version").notNull().default(1),
  parentAssessmentId: integer("parent_assessment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type RiskAssessment = typeof riskAssessmentsTable.$inferSelect;
