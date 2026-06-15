/**
 * Nextcloud WebDAV client.
 */

const BASE = process.env.NEXTCLOUD_URL?.replace(/\/$/, "") ?? "";
const USER = process.env.NEXTCLOUD_USER ?? "";
const PASS = process.env.NEXTCLOUD_PASS ?? "";

function authHeader(): string {
  return "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");
}

async function request(method: string, path: string, body?: BodyInit): Promise<Response> {
  const url = `${BASE}/remote.php/dav/files/${USER}${path}`;
  return fetch(url, { method, headers: { Authorization: authHeader(), ...(body ? {} : { "Content-Type": "application/xml" }) }, body });
}

export async function listFiles(dirPath = "/"): Promise<{ name: string; isDir: boolean; size: number; lastModified: string }[]> {
  const body = `<?xml version="1.0" encoding="UTF-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/><d:getcontentlength/><d:getlastmodified/><d:resourcetype/></d:prop></d:propfind>`;
  const res = await request("PROPFIND", dirPath, body);
  const text = await res.text();
  const items: { name: string; isDir: boolean; size: number; lastModified: string }[] = [];
  const responses = text.match(/<d:response>([\s\S]*?)<\/d:response>/g) ?? [];
  for (const resp of responses) {
    const href = resp.match(/<d:href>([^<]+)<\/d:href>/)?.[1] ?? "";
    const name = decodeURIComponent(href.split("/").filter(Boolean).pop() ?? "");
    if (!name || name === dirPath.split("/").filter(Boolean).pop()) continue;
    const isDir = /<d:collection\/>/.test(resp);
    const size = parseInt(resp.match(/<d:getcontentlength>([^<]+)<\/d:getcontentlength>/)?.[1] ?? "0");
    const lastModified = resp.match(/<d:getlastmodified>([^<]+)<\/d:getlastmodified>/)?.[1] ?? "";
    items.push({ name, isDir, size, lastModified });
  }
  return items;
}

export async function downloadFile(filePath: string): Promise<Response> {
  return request("GET", filePath);
}

export async function uploadFile(dirPath: string, fileName: string, content: Buffer): Promise<boolean> {
  const res = await request("PUT", `${dirPath}${fileName}`, content as unknown as BodyInit);
  return res.ok;
}

/** Create a folder via WebDAV MKCOL. Returns true on success. */
export async function createFolder(dirPath: string, folderName: string): Promise<boolean> {
  const res = await request("MKCOL", `${dirPath}${folderName}`);
  // 405 Method Not Allowed = folder already exists, treat as success
  return res.ok || res.status === 405;
}
/** Ensure a full folder path exists, creating intermediate folders as needed. */
export async function ensureFolder(fullPath: string): Promise<boolean> {
  const parts = fullPath.replace(/^\//, "").split("/").filter(Boolean);
  let current = "/";
  for (const part of parts) {
    const ok = await createFolder(current, part);
    if (!ok) return false;
    current += part + "/";
  }
  return true;
}
