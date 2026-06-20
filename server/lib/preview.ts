import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);
const CACHE_DIR = "/tmp/knowledge-previews";

/** 懒初始化缓存目录，避免 import 时执行同步 I/O */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Office 文档转 PDF（调用 LibreOffice headless）
export async function convertOfficeToPdf(filePath: string): Promise<string> {
  ensureCacheDir();
  const cacheKey = Buffer.from(filePath).toString("base64").slice(0, 32);
  const outputDir = path.join(CACHE_DIR, cacheKey);
  const baseName = path.basename(filePath, path.extname(filePath));
  const pdfPath = path.join(outputDir, baseName + ".pdf");

  // 缓存命中
  if (fs.existsSync(pdfPath)) return pdfPath;

  fs.mkdirSync(outputDir, { recursive: true });
  await execAsync(
    `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${filePath}"`,
    { timeout: 30000 }
  );
  return pdfPath;
}

// 判断文件是否可预览的 Office 格式
export function isOfficeFile(fileName: string): boolean {
  return /\.(docx?|xlsx?|pptx?|od[tsp])$/i.test(fileName);
}
