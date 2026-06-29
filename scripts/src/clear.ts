import { db } from "@workspace/db";
import { deviationsTable, capaTable, changeControlTable, auditLogsTable, attachmentsTable, efficacyReviewsTable } from "@workspace/db";

async function clear() {
  console.log("Clearing all module data (users preserved)...");
  await db.delete(efficacyReviewsTable);
  await db.delete(attachmentsTable);
  await db.delete(auditLogsTable);
  await db.delete(capaTable);
  await db.delete(deviationsTable);
  await db.delete(changeControlTable);
  console.log("Done. Log in with existing credentials to start fresh.");
  process.exit(0);
}

clear().catch(e => { console.error(e); process.exit(1); });
