import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { attachmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import { logAudit } from "./audit.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.get("/attachments", async (req, res): Promise<void> => {
  const module = req.query.module as string;
  const recordId = parseInt(String(req.query.recordId), 10);

  if (!module || isNaN(recordId)) {
    res.status(400).json({ error: "module and recordId are required" });
    return;
  }

  const rows = await db
    .select({
      id: attachmentsTable.id,
      module: attachmentsTable.module,
      recordId: attachmentsTable.recordId,
      fileName: attachmentsTable.fileName,
      fileSize: attachmentsTable.fileSize,
      mimeType: attachmentsTable.mimeType,
      uploadedBy: attachmentsTable.uploadedBy,
      uploadedAt: attachmentsTable.uploadedAt,
    })
    .from(attachmentsTable)
    .where(and(eq(attachmentsTable.module, module), eq(attachmentsTable.recordId, recordId)));

  res.json(rows.map((r) => ({ ...r, uploadedAt: r.uploadedAt.toISOString() })));
});

router.post("/attachments/upload", upload.single("file"), async (req, res): Promise<void> => {
  const { module, recordId } = req.body;
  const file = req.file;

  if (!module || !recordId || !file) {
    res.status(400).json({ error: "module, recordId, and file are required" });
    return;
  }

  const uploadedBy = (req.session as { userName?: string })?.userName ?? "System";
  const fileData = file.buffer.toString("base64");

  const [row] = await db.insert(attachmentsTable).values({
    module,
    recordId: parseInt(String(recordId), 10),
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    fileData,
    uploadedBy,
  }).returning({
    id: attachmentsTable.id,
    module: attachmentsTable.module,
    recordId: attachmentsTable.recordId,
    fileName: attachmentsTable.fileName,
    fileSize: attachmentsTable.fileSize,
    mimeType: attachmentsTable.mimeType,
    uploadedBy: attachmentsTable.uploadedBy,
    uploadedAt: attachmentsTable.uploadedAt,
  });

  logAudit({ req, action: "Attachment Uploaded", module: module as string, recordId: parseInt(String(recordId), 10), details: `File: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB) uploaded by ${uploadedBy}` }).catch(() => {});
  res.status(201).json({ ...row, uploadedAt: row.uploadedAt.toISOString() });
});

router.get("/attachments/:id/download", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db.select().from(attachmentsTable).where(eq(attachmentsTable.id, id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const buf = Buffer.from(row.fileData, "base64");
  res.setHeader("Content-Type", row.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${row.fileName}"`);
  res.setHeader("Content-Length", buf.length);
  res.send(buf);
});

router.delete("/attachments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db.select().from(attachmentsTable).where(eq(attachmentsTable.id, id));
  await db.delete(attachmentsTable).where(eq(attachmentsTable.id, id));
  if (row) {
    const deletedBy = (req.session as { userName?: string })?.userName ?? "System";
    logAudit({ req, action: "Attachment Deleted", module: row.module, recordId: row.recordId, details: `File: ${row.fileName} deleted by ${deletedBy}` }).catch(() => {});
  }
  res.json({ ok: true });
});

export default router;
