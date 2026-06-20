import { Router } from "express";
import multer from "multer";
import path from "path";
import os from "os";
import fs from "fs";
import { requireAuth } from "../middleware/auth";
import { listFiles, uploadFile } from "../lib/nextcloud";

const router = Router();
const upload = multer({ dest: path.join(os.tmpdir(), "kp-uploads") });

// GET /api/drive/list?path=/
router.get("/drive/list", requireAuth, async (req, res) => {
  try {
    const dirPath = (req.query.path as string) || "/";
    const files = await listFiles(dirPath);
    return res.json({ files });
  } catch (err: any) {
    return res.status(500).json({ error: "Nextcloud error: " + err.message });
  }
});

// POST /api/drive/upload — upload file to Nextcloud
router.post("/drive/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const dirPath = (req.body.path as string) || "/";
    const fileName = req.body.filename || req.file.originalname;
    const content = fs.readFileSync(req.file.path);

    const ok = await uploadFile(dirPath, fileName, content);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    if (!ok) return res.status(500).json({ error: "Upload to Nextcloud failed" });

    // Create a knowledge object for the uploaded file
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { knowledgeObjects, knowledgeSpaces } = await import("../db/schema");
    const db = drizzle(process.env.DATABASE_URL!);

    const [space] = await db
      .select({ departmentId: knowledgeSpaces.departmentId, id: knowledgeSpaces.id })
      .from(knowledgeSpaces)
      .limit(1);

    if (!space) {
      return res.status(400).json({ error: "请先创建知识空间后再上传文件" });
    }

    const [obj] = await db
      .insert(knowledgeObjects)
      .values({
        type: "drive_file",
        title: fileName,
        departmentId: space.departmentId,
        spaceId: space.id,
        ownerId: (req as import("../middleware/auth").AuthRequest).user!.id,
        sourceTable: "nextcloud_files",
        sourceId: "00000000-0000-0000-0000-000000000000",
      })
      .returning();

    return res.json({ ok: true, file: { name: fileName }, object: obj });
  } catch (err: any) {
    return res.status(500).json({ error: "Upload error: " + err.message });
  }
});

export default router;
