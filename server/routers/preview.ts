import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { convertOfficeToPdf } from "../lib/preview";
import path from "path";
import fs from "fs";
import os from "os";

const router = Router();

// 允许访问的文件目录白名单
const ALLOWED_DIRS = [
  path.resolve("/tmp/knowledge-previews"),
  path.resolve(os.tmpdir(), "kp-uploads"),
] as const;

/** 校验路径安全：必须落在白名单目录内，防止路径遍历攻击 */
function isPathAllowed(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return ALLOWED_DIRS.some(dir => resolved === dir || resolved.startsWith(dir + path.sep));
}

// GET /api/preview/raw?path=... — 直接返回文件（PDF/图片/文本）
router.get("/preview/raw", requireAuth, async (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: "Missing path" });

  // 安全检查：确保路径在预期范围内
  if (!isPathAllowed(filePath)) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
  };

  res.setHeader("Content-Type", mimeTypes[ext] ?? "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
});

// GET /api/preview/office?path=... — Office 转 PDF
router.get("/preview/office", requireAuth, async (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: "Missing path" });

  if (!isPathAllowed(filePath)) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const pdfPath = await convertOfficeToPdf(filePath);
    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(pdfPath).pipe(res);
  } catch (err) {
    console.error("Preview conversion error:", err);
    res.status(500).json({ error: "文件转换失败" });
  }
});

export default router;
