import { useState } from "react";

const NAVY = "#14213D";
const ACCENT = "#3B82F6";
const GREEN = "#16A34A";
const AMBER = "#D97706";
const RED = "#DC2626";
const PURPLE = "#7C3AED";
const SLATE = "#64748B";

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ background: color + "20", color, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function SectionHeader({ number, title, color = NAVY }: { number: string; title: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, marginTop: 40 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
        {number}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, margin: 0 }}>{title}</h2>
    </div>
  );
}

function StepBox({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: NAVY, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, color: SLATE, lineHeight: 1.6 }}>{text}</div>
      </div>
    </div>
  );
}

function RoleCard({ role, color, description, permissions }: { role: string; color: string; description: string; permissions: string[] }) {
  return (
    <div style={{ border: `2px solid ${color}30`, borderRadius: 12, padding: 18, background: color + "08" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 16 }}>👤</span>
        </div>
        <span style={{ fontWeight: 700, color, fontSize: 15 }}>{role}</span>
      </div>
      <p style={{ fontSize: 13, color: SLATE, marginBottom: 10, lineHeight: 1.5 }}>{description}</p>
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        {permissions.map((p, i) => (
          <li key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function FlowNode({ x, y, width = 140, height = 44, label, color = ACCENT, textColor = "#fff", shape = "rect", fontSize = 12 }: {
  x: number; y: number; width?: number; height?: number; label: string; color?: string; textColor?: string; shape?: "rect" | "diamond" | "rounded"; fontSize?: number;
}) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  if (shape === "diamond") {
    const w2 = width / 2; const h2 = height / 2;
    return (
      <g>
        <polygon points={`${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`} fill={color + "15"} stroke={color} strokeWidth={2} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={fontSize} fontWeight={600}>{label}</text>
      </g>
    );
  }
  const r = shape === "rounded" ? 22 : 8;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={r} fill={color} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={textColor} fontSize={fontSize} fontWeight={600}>{label}</text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, label = "", color = "#94A3B8", dashed = false }: {
  x1: number; y1: number; x2: number; y2: number; label?: string; color?: string; dashed?: boolean;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <defs>
        <marker id={`arr-${x1}-${y1}-${x2}-${y2}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={dashed ? 1.5 : 2}
        strokeDasharray={dashed ? "5,4" : undefined}
        markerEnd={`url(#arr-${x1}-${y1}-${x2}-${y2})`} />
      {label && <text x={mx + 4} y={my - 5} fontSize={10} fill={color} fontWeight={500}>{label}</text>}
    </g>
  );
}

function DeviationFlowchart() {
  return (
    <div style={{ overflowX: "auto", padding: "8px 0" }}>
      <svg width={820} height={640} style={{ fontFamily: "Inter, sans-serif" }}>
        <FlowNode x={340} y={10} width={140} height={40} label="DRAFT" color={SLATE} shape="rounded" />
        <Arrow x1={410} y1={50} x2={410} y2={85} />
        <FlowNode x={340} y={85} width={140} height={40} label="SUBMITTED" color={ACCENT} />
        <Arrow x1={410} y1={125} x2={410} y2={160} />

        <rect x={260} y={160} width={300} height={110} rx={10} fill="#F0FDF4" stroke={GREEN} strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={410} y={178} textAnchor="middle" fontSize={10} fill={GREEN} fontWeight={600}>Area Lead Review</text>
        <FlowNode x={300} y={188} width={100} height={36} label="AREA LEAD ✓" color={GREEN} fontSize={11} />
        <FlowNode x={420} y={188} width={130} height={36} label="AREA REJECTED" color={RED} fontSize={11} />
        <Arrow x1={400} y1={206} x2={420} y2={206} label="Reject" color={RED} />
        <Arrow x1={530} y1={206} x2={620} y2={206} color={RED} />
        <FlowNode x={620} y={188} width={110} height={36} label="Fix & Resubmit" color={RED} fontSize={11} />
        <Arrow x1={675} y1={188} x2={675} y2={103} color={RED} dashed />
        <Arrow x1={675} y1={103} x2={490} y2={103} color={RED} dashed />

        <Arrow x1={350} y1={224} x2={350} y2={282} label="Accept" color={GREEN} />
        <text x={355} y={258} fontSize={10} fill={GREEN}>Accept</text>
        <Arrow x1={350} y1={270} x2={350} y2={285} color={GREEN} />

        <rect x={260} y={285} width={300} height={110} rx={10} fill="#EFF6FF" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={410} y={302} textAnchor="middle" fontSize={10} fill={ACCENT} fontWeight={600}>QA Manager Review</text>
        <FlowNode x={300} y={312} width={100} height={36} label="QA ACCEPTED" color={ACCENT} fontSize={11} />
        <FlowNode x={420} y={312} width={130} height={36} label="QA REJECTED" color={RED} fontSize={11} />
        <Arrow x1={400} y1={330} x2={420} y2={330} label="Reject" color={RED} />
        <Arrow x1={550} y1={330} x2={640} y2={330} color={RED} />
        <FlowNode x={640} y={312} width={110} height={36} label="Fix & Resubmit" color={RED} fontSize={11} />
        <Arrow x1={695} y1={312} x2={695} y2={228} color={RED} dashed />
        <Arrow x1={695} y1={228} x2={510} y2={228} color={RED} dashed />

        <Arrow x1={350} y1={348} x2={350} y2={415} color={GREEN} />
        <FlowNode x={280} y={415} width={145} height={40} label="ROLES ASSIGNED" color={PURPLE} />
        <Arrow x1={352} y1={455} x2={352} y2={490} color={PURPLE} />

        <FlowNode x={230} y={490} width={170} height={36} label="INVESTIGATION SUBMITTED" color={AMBER} fontSize={11} />
        <Arrow x1={315} y1={526} x2={315} y2={558} color={AMBER} />
        <FlowNode x={225} y={558} width={180} height={36} label="ROOT CAUSE SUBMITTED" color={AMBER} fontSize={11} />
        <Arrow x1={315} y1={594} x2={315} y2={620} color={GREEN} />
        <FlowNode x={250} y={620} width={130} height={36} label="COMPLETED" color={GREEN} shape="rounded" />

        <text x={60} y={470} fontSize={11} fill={PURPLE} fontWeight={600}>QA assigns</text>
        <text x={60} y={484} fontSize={11} fill={PURPLE} fontWeight={600}>Investigation</text>
        <text x={60} y={498} fontSize={11} fill={PURPLE} fontWeight={600}>Leader</text>
        <Arrow x1={100} y1={435} x2={280} y2={435} color={PURPLE} dashed />
      </svg>
    </div>
  );
}

function CapaFlowchart() {
  return (
    <div style={{ overflowX: "auto", padding: "8px 0" }}>
      <svg width={720} height={520} style={{ fontFamily: "Inter, sans-serif" }}>
        <FlowNode x={290} y={10} width={140} height={40} label="DRAFT" color={SLATE} shape="rounded" />
        <Arrow x1={360} y1={50} x2={360} y2={85} />
        <FlowNode x={290} y={85} width={140} height={40} label="SUBMITTED" color={ACCENT} />
        <Arrow x1={360} y1={125} x2={360} y2={160} />

        <rect x={225} y={160} width={275} height={110} rx={10} fill="#EFF6FF" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={362} y={178} textAnchor="middle" fontSize={10} fill={ACCENT} fontWeight={600}>QA Plan Review</text>
        <FlowNode x={255} y={188} width={110} height={36} label="QA ACCEPTED" color={GREEN} fontSize={11} />
        <FlowNode x={385} y={188} width={105} height={36} label="QA REJECTED" color={RED} fontSize={11} />
        <Arrow x1={365} y1={206} x2={385} y2={206} color={RED} />
        <Arrow x1={490} y1={206} x2={570} y2={206} color={RED} />
        <FlowNode x={570} y={188} width={110} height={36} label="Fix & Resubmit" color={RED} fontSize={11} />
        <Arrow x1={625} y1={188} x2={625} y2={103} color={RED} dashed />
        <Arrow x1={625} y1={103} x2={440} y2={103} color={RED} dashed />

        <Arrow x1={310} y1={224} x2={310} y2={285} color={GREEN} />
        <FlowNode x={230} y={285} width={165} height={40} label="IMPLEMENTATION" color={AMBER} fontSize={12} />
        <Arrow x1={312} y1={325} x2={312} y2={360} color={AMBER} />

        <rect x={200} y={360} width={235} height={110} rx={10} fill="#FFFBEB" stroke={AMBER} strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={317} y={378} textAnchor="middle" fontSize={10} fill={AMBER} fontWeight={600}>QA Implementation Review</text>
        <FlowNode x={215} y={390} width={90} height={36} label="IMPL ACCEPTED" color={GREEN} fontSize={10} />
        <FlowNode x={325} y={390} width={100} height={36} label="IMPL REJECTED" color={RED} fontSize={10} />
        <Arrow x1={305} y1={408} x2={325} y2={408} color={RED} />
        <Arrow x1={425} y1={408} x2={500} y2={408} color={RED} />
        <FlowNode x={500} y={390} width={100} height={36} label="Fix & Retry" color={RED} fontSize={10} />
        <Arrow x1={550} y1={390} x2={550} y2={325} color={RED} dashed />
        <Arrow x1={550} y1={325} x2={400} y2={325} color={RED} dashed />

        <Arrow x1={260} y1={426} x2={260} y2={458} color={GREEN} />
        <FlowNode x={195} y={458} width={130} height={36} label="CLOSED" color={GREEN} shape="rounded" />

        <text x={50} y={310} fontSize={11} fill={AMBER} fontWeight={600}>Implementation</text>
        <text x={50} y={325} fontSize={11} fill={AMBER} fontWeight={600}>Leader reports</text>
        <text x={50} y={340} fontSize={11} fill={AMBER} fontWeight={600}>completion</text>
        <Arrow x1={100} y1={305} x2={230} y2={305} color={AMBER} dashed />
      </svg>
    </div>
  );
}

function ChangeControlFlowchart() {
  return (
    <div style={{ overflowX: "auto", padding: "8px 0" }}>
      <svg width={760} height={320} style={{ fontFamily: "Inter, sans-serif" }}>
        <FlowNode x={30} y={130} width={110} height={44} label="DRAFT" color={SLATE} shape="rounded" />
        <Arrow x1={140} y1={152} x2={175} y2={152} />
        <FlowNode x={175} y={130} width={110} height={44} label="HR REVIEW" color={NAVY} />
        <Arrow x1={285} y1={152} x2={320} y2={152} label="Approved" color={GREEN} />
        <FlowNode x={320} y={130} width={110} height={44} label="SC REVIEW" color={ACCENT} />
        <Arrow x1={430} y1={152} x2={465} y2={152} label="Approved" color={GREEN} />
        <FlowNode x={465} y={130} width={120} height={44} label="EXPERT REVIEW" color={PURPLE} />
        <Arrow x1={585} y1={152} x2={620} y2={152} label="Done" color={GREEN} />
        <FlowNode x={620} y={130} width={110} height={44} label="WORKS PLAN" color={AMBER} />

        <Arrow x1={230} y1={174} x2={230} y2={240} color={RED} />
        <text x={235} y={215} fontSize={10} fill={RED} fontWeight={500}>Reject</text>
        <FlowNode x={165} y={240} width={130} height={40} label="REJECTED" color={RED} />

        <Arrow x1={375} y1={174} x2={375} y2={240} color={RED} />
        <FlowNode x={310} y={240} width={130} height={40} label="REJECTED" color={RED} />

        <Arrow x1={525} y1={174} x2={525} y2={240} color={RED} />
        <FlowNode x={460} y={240} width={130} height={40} label="REJECTED" color={RED} />

        <Arrow x1={675} y1={174} x2={675} y2={240} color={GREEN} />
        <text x={680} y={215} fontSize={10} fill={GREEN} fontWeight={500}>PIR Complete</text>
        <FlowNode x={615} y={240} width={120} height={40} label="CLOSED" color={GREEN} shape="rounded" />

        <text x={80} y={20} fontSize={11} fill={SLATE} fontWeight={600}>Initiator submits</text>
        <Arrow x1={85} y1={108} x2={85} y2={130} color={SLATE} dashed />
        <text x={200} y={20} fontSize={11} fill={NAVY} fontWeight={600}>Manager approves</text>
        <text x={345} y={20} fontSize={11} fill={ACCENT} fontWeight={600}>QA / SC approves</text>
        <text x={480} y={20} fontSize={11} fill={PURPLE} fontWeight={600}>Experts review impact</text>
        <text x={625} y={20} fontSize={11} fill={AMBER} fontWeight={600}>Execute tasks</text>
      </svg>
    </div>
  );
}

function RiskFlowchart() {
  return (
    <div style={{ overflowX: "auto", padding: "8px 0" }}>
      <svg width={700} height={280} style={{ fontFamily: "Inter, sans-serif" }}>
        <FlowNode x={30} y={110} width={120} height={44} label="DRAFT" color={SLATE} shape="rounded" />
        <text x={90} y={100} textAnchor="middle" fontSize={10} fill={SLATE}>FMEA analysis</text>
        <Arrow x1={150} y1={132} x2={195} y2={132} label="Submit" color={ACCENT} />
        <FlowNode x={195} y={110} width={130} height={44} label="IN REVIEW" color={ACCENT} />
        <Arrow x1={325} y1={132} x2={375} y2={132} label="QA Approve" color={GREEN} />
        <FlowNode x={375} y={110} width={120} height={44} label="APPROVED" color={GREEN} />
        <Arrow x1={495} y1={132} x2={545} y2={132} label="Actions Done" color={GREEN} />
        <FlowNode x={545} y={110} width={120} height={44} label="CLOSED" color={NAVY} shape="rounded" />

        <Arrow x1={260} y1={154} x2={260} y2={210} color={RED} />
        <text x={265} y={186} fontSize={10} fill={RED} fontWeight={500}>Reject</text>
        <FlowNode x={195} y={210} width={130} height={40} label="Back to DRAFT" color={RED} />
        <Arrow x1={195} y1={230} x2={90} y2={230} color={RED} dashed />
        <Arrow x1={90} y1={230} x2={90} y2={154} color={RED} dashed />

        <text x={90} y={240} fontSize={0} />
        <text x={375} y={100} textAnchor="middle" fontSize={10} fill={GREEN}>Classification + RARR</text>
        <text x={605} y={100} textAnchor="middle" fontSize={10} fill={NAVY}>Residual risk accepted</text>

        <rect x={30} y={50} width={645} height={20} rx={4} fill="#F1F5F9" />
        <text x={100} y={63} fontSize={9} fill={SLATE}>S × P = RES | RES × D = RPN | RPN &gt; 8 = MAJOR risk requiring CAPA/CC action</text>
      </svg>
    </div>
  );
}

function InfoBox({ title, children, color = ACCENT }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: "14px 18px", background: color + "08", marginBottom: 16 }}>
      <div style={{ fontWeight: 600, color, marginBottom: 6, fontSize: 13 }}>{title}</div>
      <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function TableOfContents({ onNav }: { onNav: (id: string) => void }) {
  const sections = [
    { id: "login", label: "1. Getting Started — Login & Navigation" },
    { id: "roles", label: "2. User Roles & Permissions" },
    { id: "dashboard", label: "3. Dashboard" },
    { id: "deviations", label: "4. Deviation Management" },
    { id: "capa", label: "5. CAPA — Corrective & Preventive Actions" },
    { id: "changecontrol", label: "6. Change Control" },
    { id: "risk", label: "7. Risk Assessment (FMEA)" },
    { id: "users", label: "8. User Administration" },
  ];
  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "20px 24px", marginBottom: 36 }}>
      <div style={{ fontWeight: 700, color: NAVY, fontSize: 15, marginBottom: 12 }}>Contents</div>
      <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 2 }}>
        {sections.map(s => (
          <li key={s.id}>
            <button onClick={() => { document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: "none", border: "none", color: ACCENT, cursor: "pointer", fontSize: 14, textAlign: "left", padding: 0, textDecoration: "underline", textDecorationColor: "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.textDecorationColor = ACCENT)}
              onMouseLeave={e => (e.currentTarget.style.textDecorationColor = "transparent")}>
              {s.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return <span style={{ display: "inline-block", background: color + "20", color, border: `1px solid ${color}50`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6 }}>{label}</span>;
}

export default function App() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#fff", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: NAVY, color: "#fff", padding: "40px 0 36px", marginBottom: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, textTransform: "uppercase", marginBottom: 10 }}>CPT Pharma — Internal Document</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>Capalyst QMS</div>
          <div style={{ fontSize: 18, fontWeight: 300, opacity: 0.85, marginBottom: 20 }}>Working Instructions — User Guide</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Badge color="#60A5FA">Version 1.0</Badge>
            <Badge color="#60A5FA">June 2026</Badge>
            <Badge color="#34D399">Modules: Deviations · CAPA · Change Control · Risk Assessment</Badge>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px 80px" }}>
        <TableOfContents onNav={(id) => document.getElementById(id)?.scrollIntoView()} />

        {/* ── 1. Getting Started ── */}
        <div id="login">
          <SectionHeader number="1" title="Getting Started — Login & Navigation" color={NAVY} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 20 }}>
            Capalyst is a web-based Quality Management System. Access it through any modern browser. No installation is required.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <StepBox icon="🌐" title="Open the application" text="Navigate to the Capalyst URL provided by your IT administrator. The login screen appears immediately." />
            <StepBox icon="🔐" title="Sign in" text="Enter your registered email address and password, then click Sign in. Contact your QA Administrator if you need access." />
            <StepBox icon="🗺️" title="Navigate via the sidebar" text="The left sidebar contains all modules: Dashboard, Deviations, CAPA, Change Control, Risk Assessment, and Administration." />
            <StepBox icon="🔔" title="Check your notifications" text="The bell icon (top-right) shows actions assigned to you across all modules — check it regularly." />
          </div>
          <InfoBox title="Session behaviour" color={SLATE}>
            Your session is maintained while the browser tab is open. Closing the tab or extended inactivity will require you to sign in again. Always use the Logout option when using a shared workstation.
          </InfoBox>
        </div>

        {/* ── 2. Roles ── */}
        <div id="roles">
          <SectionHeader number="2" title="User Roles & Permissions" color={PURPLE} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 20 }}>
            Every user is assigned one or more roles that control what they can see and do in Capalyst. Role assignments are managed by the QA Administrator.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <RoleCard role="User" color={SLATE} description="Standard access for staff who report events and participate in investigations."
              permissions={["Create new deviations, CAPAs", "View records assigned to them", "Submit investigation and implementation reports", "Acknowledge risk assessment team membership"]} />
            <RoleCard role="QA" color={ACCENT} description="Quality Assurance reviewers who gate the workflow at critical approval points."
              permissions={["Review and approve/reject deviations, CAPAs, change controls", "Assign investigation and implementation leaders", "Classify risk assessments", "Create and manage review reports (RARR)", "Access all records site-wide"]} />
            <RoleCard role="Admin" color={NAVY} description="System administrators with full access to all features and configuration."
              permissions={["All QA permissions", "Create and manage user accounts", "Assign and change user roles", "Access audit trail", "Configure system settings"]} />
            <RoleCard role="Manager (HR/SC/Expert)" color={PURPLE} description="Functional managers who participate in Change Control approval chains."
              permissions={["Review and approve/reject change control requests as HR or SC", "Submit expert technical reviews", "View change controls assigned to their area"]} />
          </div>
          <InfoBox title="E-Signature requirement" color={ACCENT}>
            All critical workflow actions (approve, reject, accept, submit) require you to be logged in with your own credentials. This constitutes an electronic signature under the QMS policy. You cannot approve a record on behalf of another user.
          </InfoBox>
        </div>

        {/* ── 3. Dashboard ── */}
        <div id="dashboard">
          <SectionHeader number="3" title="Dashboard" color={GREEN} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 20 }}>
            The Dashboard is your home screen. It provides a real-time overview of the quality system status across all modules.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <StepBox icon="📊" title="KPI summary cards" text="The top row shows totals for: Open Deviations, Overdue Items, Open CAPAs, and Change Controls in Review. Click any card to navigate to the filtered list." />
            <StepBox icon="📈" title="Deviation trend chart" text="A bar/line chart shows the monthly trend of new deviations over the past 12 months, helping identify peaks and improvements." />
            <StepBox icon="🏭" title="Deviations by area" text="A breakdown of open deviations by manufacturing or quality area, useful for identifying hot spots." />
            <StepBox icon="🕐" title="Recent activity feed" text="A chronological list of the latest events across all modules — new records created, status changes, approvals." />
          </div>
          <InfoBox title="Dashboard tip" color={GREEN}>
            The dashboard refreshes automatically. The red 'Overdue' counter includes any deviations or CAPAs that have passed their due date without being closed. Take action on these first each day.
          </InfoBox>
        </div>

        {/* ── 4. Deviations ── */}
        <div id="deviations">
          <SectionHeader number="4" title="Deviation Management" color={AMBER} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 16 }}>
            A deviation is any unplanned departure from an approved procedure, specification, or standard. All deviations must be recorded, investigated, and closed within the defined timeframes.
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color: NAVY, marginBottom: 10 }}>Workflow States</div>
            <div>
              {[
                ["DRAFT", SLATE], ["SUBMITTED", ACCENT], ["AREA ACCEPTED", GREEN], ["QA ACCEPTED", ACCENT],
                ["ROLES ASSIGNED", PURPLE], ["INVESTIGATION SUBMITTED", AMBER], ["ROOT CAUSE SUBMITTED", AMBER],
                ["CAPA/ER SUBMITTED", AMBER], ["COMPLETED", GREEN],
              ].map(([s, c]) => <StatusChip key={s} label={s} color={c as string} />)}
              <StatusChip label="AREA REJECTED" color={RED} />
              <StatusChip label="QA REJECTED" color={RED} />
            </div>
          </div>

          <div style={{ fontWeight: 600, color: NAVY, marginBottom: 12 }}>Workflow Flowchart</div>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 24, background: "#FAFBFC", overflowX: "auto" }}>
            <DeviationFlowchart />
          </div>

          <div style={{ fontWeight: 600, color: NAVY, marginBottom: 12 }}>Step-by-step instructions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <StepBox icon="➕" title="1. Create a deviation" text='Click "Deviations" in the sidebar, then "+ New Deviation". Fill in all mandatory fields: Title, Type, Area, Date of Event, Description. Click Submit.' />
            <StepBox icon="📋" title="2. Area Lead review" text="The Area Lead receives a notification. They open the deviation, review the event details, then choose Accept or Reject. A rejection sends it back to the reporter with comments." />
            <StepBox icon="✅" title="3. QA Manager review" text="After Area Lead acceptance, the QA Manager reviews and either accepts (moves to investigation) or rejects (back to Area Lead) with documented reasons." />
            <StepBox icon="👥" title="4. Roles assignment" text="QA assigns the Investigation Leader. They will be notified and are responsible for completing the investigation tabs in the record." />
            <StepBox icon="🔍" title="5. Investigation & Root Cause" text='The Investigation Leader documents findings in the "Investigation" tab, then the "Root Cause" tab (using e.g. Fishbone, 5-Why method). Submit each section to advance the workflow.' />
            <StepBox icon="🔗" title="6. Link CAPA or Efficacy Review" text='In the "CAPA Link" tab, attach an existing CAPA or create a new one. An Efficacy Review (ER) may be added if required by the QA team.' />
            <StepBox icon="🏁" title="7. QA Acceptance & Completion" text='QA reviews all submitted sections in "QA Acceptance" and accepts or rejects. Once accepted, the deviation is marked Completed.' />
            <StepBox icon="📎" title="Attachments" text='Attach evidence (photos, lab reports, batch records) at any point via the "Attachments" tab. Accepted formats: PDF, JPG, PNG, DOCX.' />
          </div>
          <InfoBox title="Mandatory fields" color={AMBER}>
            Deviation Number is auto-generated (e.g. DEV-2026-001). Date of event, Area, Deviation Type, and Description are mandatory before submission. Incomplete records cannot advance through the workflow.
          </InfoBox>
        </div>

        {/* ── 5. CAPA ── */}
        <div id="capa">
          <SectionHeader number="5" title="CAPA — Corrective & Preventive Actions" color={ACCENT} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 16 }}>
            A CAPA is a structured plan to eliminate the root cause of a non-conformity (Corrective) or prevent a potential issue from occurring (Preventive). CAPAs can be initiated standalone or generated automatically from a Deviation.
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color: NAVY, marginBottom: 10 }}>Workflow States</div>
            <div>
              {[["DRAFT", SLATE], ["SUBMITTED", ACCENT], ["QA ACCEPTED", GREEN], ["IMPLEMENTATION", AMBER], ["IMPL ACCEPTED", GREEN], ["CLOSED", NAVY]].map(([s, c]) => <StatusChip key={s} label={s} color={c as string} />)}
              <StatusChip label="QA REJECTED" color={RED} /><StatusChip label="IMPL REJECTED" color={RED} />
            </div>
          </div>

          <div style={{ fontWeight: 600, color: NAVY, marginBottom: 12 }}>Workflow Flowchart</div>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 24, background: "#FAFBFC", overflowX: "auto" }}>
            <CapaFlowchart />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <StepBox icon="➕" title="1. Create a CAPA" text='Click "CAPA" in the sidebar, then "+ New CAPA". Enter Title, Source (Deviation link or Standalone), Root Cause Category, Action Plan, and Due Date.' />
            <StepBox icon="📋" title="2. QA Plan Review" text="QA Manager reviews the action plan for adequacy. If rejected, the originator must revise and resubmit. If accepted, the CAPA moves to implementation." />
            <StepBox icon="🛠️" title="3. Implementation" text="The assigned Implementation Leader carries out the documented actions. They record evidence of completion (e.g. SOP revised, training completed) in the Implementation tab." />
            <StepBox icon="✅" title="4. QA Implementation Review" text="QA verifies that the implementation evidence is sufficient. Rejected implementations require the leader to provide additional evidence and resubmit." />
            <StepBox icon="🔬" title="5. Efficacy Review (if required)" text='After closure, QA may schedule an Efficacy Review (ER) to confirm the CAPA was effective. Link the ER record from the "Efficacy" tab.' />
            <StepBox icon="🔗" title="Generate a Change Control" text='If the CAPA requires a systematic change (e.g. process revision), use "Generate CC" to automatically create a linked Change Control.' />
          </div>
          <InfoBox title="Overdue CAPAs" color={RED}>
            CAPAs with a Due Date in the past appear highlighted on the Dashboard and CAPA list. Contact the Implementation Leader and update the Due Date with documented justification if an extension is required.
          </InfoBox>
        </div>

        {/* ── 6. Change Control ── */}
        <div id="changecontrol">
          <SectionHeader number="6" title="Change Control" color={PURPLE} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 16 }}>
            Change Control manages any planned change to a process, procedure, system, equipment, or specification that could impact product quality, patient safety, or regulatory compliance. All changes must follow the three-tier approval chain before implementation.
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color: NAVY, marginBottom: 10 }}>Workflow States</div>
            <div>
              {[["DRAFT", SLATE], ["HR REVIEW", NAVY], ["SC REVIEW", ACCENT], ["EXPERT REVIEW", PURPLE], ["WORKS PLAN", AMBER], ["CLOSED", GREEN]].map(([s, c]) => <StatusChip key={s} label={s} color={c as string} />)}
              <StatusChip label="REJECTED" color={RED} />
            </div>
          </div>

          <div style={{ fontWeight: 600, color: NAVY, marginBottom: 12 }}>Workflow Flowchart</div>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 24, background: "#FAFBFC", overflowX: "auto" }}>
            <ChangeControlFlowchart />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <StepBox icon="➕" title="1. Create a change request" text='Click "Change Control" in the sidebar, then "+ New Change Control". Describe the current situation, proposed change, reason, risk classification, and planned implementation date.' />
            <StepBox icon="👔" title="2. HR Review (Hierarchic Responsible)" text="The departmental manager reviews the change for business and resource impact. They approve (advances) or reject (closes with documented reason)." />
            <StepBox icon="🔬" title="3. SC Review (Site Coordinator / QA)" text="The QA Site Coordinator reviews compliance and quality impact. They may approve (advances to Expert Review) or reject." />
            <StepBox icon="🧪" title="4. Expert Review" text='QA assigns one or more technical experts (Validation, Engineering, Regulatory) who each submit their impact assessment. When all experts have submitted, QA accepts or rejects the collective review.' />
            <StepBox icon="📋" title="5. Works Plan" text='Once expert reviews are accepted, QA creates a Works Plan — a list of specific implementation tasks. Each task is tracked to completion by the responsible person.' />
            <StepBox icon="✅" title="6. Post-Implementation Review & Close" text="After all works plan items are completed, QA performs the Post-Implementation Review (PIR) and closes the change control. A CC number (CC-YYYY-NNN) is generated automatically." />
          </div>
          <InfoBox title="Linked records" color={PURPLE}>
            A Change Control can be linked to the CAPA that triggered it. This cross-module link is created automatically when using "Generate CC" from within a CAPA record, or it can be added manually in the Links tab.
          </InfoBox>
        </div>

        {/* ── 7. Risk Assessment ── */}
        <div id="risk">
          <SectionHeader number="7" title="Risk Assessment (FMEA)" color={RED} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 16 }}>
            The Risk Assessment module implements Failure Mode and Effects Analysis (FMEA) per ICH Q9 and SOPPQA016 v05. It enables systematic identification, scoring, and mitigation of risks to product quality and patient safety.
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, color: NAVY, marginBottom: 10 }}>Workflow States</div>
            <div>
              {[["DRAFT", SLATE], ["IN REVIEW", ACCENT], ["APPROVED", GREEN], ["CLOSED", NAVY]].map(([s, c]) => <StatusChip key={s} label={s} color={c as string} />)}
            </div>
          </div>

          <div style={{ fontWeight: 600, color: NAVY, marginBottom: 12 }}>Workflow Flowchart</div>
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, marginBottom: 24, background: "#FAFBFC", overflowX: "auto" }}>
            <RiskFlowchart />
          </div>

          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: "#C2410C", marginBottom: 10, fontSize: 14 }}>SOP Scoring Scale (SOPPQA016 v05)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, color: NAVY, fontSize: 13, marginBottom: 6 }}>Severity (S)</div>
                {[["1", "No patient impact"], ["2", "Minor impact"], ["4", "Moderate impact"], ["8", "Severe / life-threatening"]].map(([v, d]) => (
                  <div key={v} style={{ fontSize: 12, color: SLATE, lineHeight: 1.8 }}><span style={{ fontWeight: 600, color: NAVY }}>{v}</span> — {d}</div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: NAVY, fontSize: 13, marginBottom: 6 }}>Probability (P)</div>
                {[["1", "Very unlikely"], ["2", "Unlikely"], ["4", "Likely"], ["8", "Very likely / frequent"]].map(([v, d]) => (
                  <div key={v} style={{ fontSize: 12, color: SLATE, lineHeight: 1.8 }}><span style={{ fontWeight: 600, color: NAVY }}>{v}</span> — {d}</div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: NAVY, fontSize: 13, marginBottom: 6 }}>Detectability (D)</div>
                {[["1", "Almost certain detection"], ["2", "High detectability"], ["3", "Moderate detectability"], ["4", "Low detectability"]].map(([v, d]) => (
                  <div key={v} style={{ fontSize: 12, color: SLATE, lineHeight: 1.8 }}><span style={{ fontWeight: 600, color: NAVY }}>{v}</span> — {d}</div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: "#FEF3C7", borderRadius: 8, fontSize: 13 }}>
              <strong>RES = S × P &nbsp;|&nbsp; RPN = RES × D &nbsp;|&nbsp; RPN &gt; 8 = MAJOR risk</strong> (requires CAPA or Change Control action)
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <StepBox icon="➕" title="1. Create a Risk Assessment" text='Click "Risk Assessment" in the sidebar, then "+ New Risk Assessment". Enter Title, Assessment Type, Scope, Product/Process, and ICH Q9 metadata.' />
            <StepBox icon="📝" title="2. FMEA Worksheet" text='Open the "FMEA Worksheet" tab. Add failure mode entries. For each entry, set S (Severity), P (Probability), and D (Detectability). RES and RPN are calculated automatically.' />
            <StepBox icon="🟥" title="3. Review the Risk Matrix" text='The "Risk Matrix" tab displays a 4×4 heat map. Each entry appears as a dot. Major risks (RPN > 8) are shown in the red zone and require action.' />
            <StepBox icon="🔗" title="4. Generate CAPA or CC from entries" text="For Major risk entries, click the CAPA or CC button on that row to automatically create a linked action record. The link is recorded in the Links tab." />
            <StepBox icon="👥" title="5. Team & Communication" text='Use the "Team" tab to register all RA team members. Each member acknowledges their participation. Log communications to stakeholders in the Communication Log.' />
            <StepBox icon="✅" title="6. Submit for Review" text="Once the FMEA is complete, click Submit. A QA Manager reviews the assessment and either approves or rejects it with documented reasons." />
            <StepBox icon="🏷️" title="7. Classify the Assessment" text='After approval, QA classifies the RA as Class I (Critical), Class II (Major), Class III (Minor), or Class IV (Negligible). This determines the next mandatory review date.' />
            <StepBox icon="📄" title="8. RARR — Review Reports" text='Periodic reviews are documented in "Review Reports" (RARR). Each review records the outcome (Maintain / Update Required / Withdraw / Escalate) and triggers the next review cycle.' />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <InfoBox title="Re-assessment" color={AMBER}>
              A Closed or Approved risk assessment can be re-assessed when new information is available. Use the "Re-assess" button to create a new version (v2, v3...) linked to the original. The original is preserved.
            </InfoBox>
            <InfoBox title="PDF Report" color={ACCENT}>
              Generate a fully formatted PDF report from the "Report" tab. The PDF includes the FMEA table, risk matrix summary, ICH Q9 sections, team register, classification, and RARR history.
            </InfoBox>
          </div>

          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "14px 18px", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, color: GREEN, marginBottom: 8, fontSize: 14 }}>Risk Classification — Review Frequencies</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#DCFCE7" }}>
                  {["Class", "Description", "Review Frequency"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: NAVY }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Class I — Critical", "High RPN, direct patient safety impact", "Every 6 months"],
                  ["Class II — Major", "Significant quality risk, indirect patient impact", "Every 12 months"],
                  ["Class III — Minor", "Low probability or manageable impact", "Every 24 months"],
                  ["Class IV — Negligible", "Negligible risk, no patient impact", "Event-driven (no fixed cycle)"],
                ].map(([cls, desc, freq], i) => (
                  <tr key={cls} style={{ background: i % 2 === 0 ? "#fff" : "#F0FDF4" }}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: NAVY }}>{cls}</td>
                    <td style={{ padding: "8px 12px", color: SLATE }}>{desc}</td>
                    <td style={{ padding: "8px 12px", color: GREEN, fontWeight: 600 }}>{freq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 8. User Admin ── */}
        <div id="users">
          <SectionHeader number="8" title="User Administration" color={SLATE} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 16 }}>
            User management is available to Admin role users only. Navigate to Administration in the sidebar.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <StepBox icon="➕" title="Add a user" text={"Click \"+ Add User\", enter the person's full name, email, and initial password. Select their role (User, QA, or Admin). They can log in immediately."} />
            <StepBox icon="✏️" title="Change a user's role" text={"Find the user in the table, click \"Change Role\". Select the new role and confirm. The change takes effect immediately."} />
            <StepBox icon="🗑️" title="Deactivate a user" text="To remove access, click the delete icon on the user row. This action is permanent — re-add them if access is needed again in the future." />
            <StepBox icon="🔍" title="Search users" text="Use the search bar at the top of the Users page to find a specific user by name or email. The list filters in real time." />
          </div>
          <InfoBox title="Role assignment best practice" color={SLATE}>
            Assign the minimum role necessary for the user's job function. Only QA professionals who perform formal approvals should hold the QA or Admin role. Review user accounts quarterly and remove access for departed personnel promptly.
          </InfoBox>
        </div>

        {/* ── Audit Trail ── */}
        <div>
          <SectionHeader number="+" title="Audit Trail" color={SLATE} />
          <p style={{ color: SLATE, lineHeight: 1.8, marginBottom: 16 }}>
            Every create, update, approve, and reject action in Capalyst is automatically recorded in the Audit Trail. Navigate to Administration → Audit Trail.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <StepBox icon="🔎" title="Search and filter" text="Filter audit entries by date range, user, module (Deviation, CAPA, etc.), or action type. Results are exportable." />
            <StepBox icon="📋" title="What is recorded" text="Each entry shows: timestamp, user, action, module and record number, and a before/after snapshot of changed fields." />
          </div>
          <InfoBox title="21 CFR Part 11 / Annex 11 alignment" color={NAVY}>
            The Capalyst audit trail is designed to support electronic records requirements. All entries are immutable — they cannot be edited or deleted by any user, including administrators.
          </InfoBox>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", color: SLATE, fontSize: 13 }}>
          <div><strong style={{ color: NAVY }}>Capalyst QMS</strong> — Working Instructions v1.0</div>
          <div>CPT Pharma · June 2026 · SOPPQA016 v05 / ICH Q9 / WHO TRS 981</div>
        </div>
      </div>
    </div>
  );
}
