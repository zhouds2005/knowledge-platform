import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── 设置环境变量（必须在模块导入前）──
process.env.NEXTCLOUD_URL = "https://nextcloud.example.com";
process.env.NEXTCLOUD_USER = "testuser";
process.env.NEXTCLOUD_PASS = "testpass";

// ── Mock fetch ──
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── 导入模块（env 已就绪）──
import {
  listFiles,
  downloadFile,
  uploadFile,
  createFolder,
  ensureFolder,
} from "../lib/nextcloud";

// ============================================================================
// listFiles
// ============================================================================

describe("nextcloud: listFiles", () => {
  it("用 PROPFIND 方法请求并解析文件列表", async () => {
    const xmlResponse = `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/remote.php/dav/files/testuser/Documents</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>Documents</d:displayname>
        <d:getcontentlength>0</d:getcontentlength>
        <d:getlastmodified>Mon, 01 Jan 2024 00:00:00 GMT</d:getlastmodified>
        <d:resourcetype><d:collection/></d:resourcetype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  <d:response>
    <d:href>/remote.php/dav/files/testuser/report.docx</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>report.docx</d:displayname>
        <d:getcontentlength>102400</d:getcontentlength>
        <d:getlastmodified>Tue, 02 Jan 2024 12:00:00 GMT</d:getlastmodified>
        <d:resourcetype/>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: () => Promise.resolve(xmlResponse),
    });

    const files = await listFiles("/Documents");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    // fetch 的 options 参数包含 method: "PROPFIND"
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PROPFIND");
    // 文件名解析正确
    expect(files.length).toBeGreaterThanOrEqual(1);
    const names = files.map((f) => f.name);
    expect(names).toContain("report.docx");
  });

  it("返回空数组当目录为空", async () => {
    const xmlResponse = `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
</d:multistatus>`;

    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: () => Promise.resolve(xmlResponse),
    });

    const files = await listFiles("/empty");

    expect(files).toEqual([]);
  });

  it("正确解析文件属性（size, lastModified, isDir）", async () => {
    const xmlResponse = `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/remote.php/dav/files/testuser/data.csv</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>data.csv</d:displayname>
        <d:getcontentlength>2048</d:getcontentlength>
        <d:getlastmodified>Wed, 03 Jan 2024 08:00:00 GMT</d:getlastmodified>
        <d:resourcetype/>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: () => Promise.resolve(xmlResponse),
    });

    const files = await listFiles("/");

    expect(files.length).toBe(1);
    expect(files[0]).toEqual({
      name: "data.csv",
      isDir: false,
      size: 2048,
      lastModified: "Wed, 03 Jan 2024 08:00:00 GMT",
    });
  });

  it("正确识别目录类型", async () => {
    const xmlResponse = `<?xml version="1.0"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>/remote.php/dav/files/testuser/folder</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>folder</d:displayname>
        <d:getcontentlength>0</d:getcontentlength>
        <d:getlastmodified>Thu, 04 Jan 2024 00:00:00 GMT</d:getlastmodified>
        <d:resourcetype><d:collection/></d:resourcetype>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    mockFetch.mockResolvedValue({
      ok: true,
      status: 207,
      text: () => Promise.resolve(xmlResponse),
    });

    const files = await listFiles("/");

    expect(files.length).toBe(1);
    expect(files[0].isDir).toBe(true);
  });
});

// ============================================================================
// downloadFile
// ============================================================================

describe("nextcloud: downloadFile", () => {
  it("用 GET 方法下载文件", async () => {
    const mockResponse = { ok: true };
    mockFetch.mockResolvedValue(mockResponse);

    const result = await downloadFile("/data.csv");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("GET");
    expect(result).toBe(mockResponse);
  });
});

// ============================================================================
// uploadFile
// ============================================================================

describe("nextcloud: uploadFile", () => {
  it("用 PUT 方法上传文件", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const content = Buffer.from([1, 2, 3]);
    const result = await uploadFile("/dir/", "test.txt", content);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PUT");
    expect(result).toBe(true);
  });

  it("上传失败时返回 false", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const content = Buffer.from([1, 2, 3]);
    const result = await uploadFile("/dir/", "test.txt", content);

    expect(result).toBe(false);
  });
});

// ============================================================================
// createFolder
// ============================================================================

describe("nextcloud: createFolder", () => {
  it("用 MKCOL 方法创建目录", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const result = await createFolder("/", "newFolder");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("MKCOL");
    expect(result).toBe(true);
  });

  it("目录已存在时 (405) 返回 true", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 405 });

    const result = await createFolder("/", "existing");

    expect(result).toBe(true);
  });

  it("其他错误时返回 false", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await createFolder("/", "fail");

    expect(result).toBe(false);
  });

  it("403 禁止访问时返回 false", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });

    const result = await createFolder("/", "forbidden");

    expect(result).toBe(false);
  });
});

// ============================================================================
// ensureFolder
// ============================================================================

describe("nextcloud: ensureFolder", () => {
  it("逐层创建中间目录", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const result = await ensureFolder("/a/b/c");

    // 应创建 /a, /a/b, /a/b/c 三层
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result).toBe(true);
  });

  it("单层路径只创建一次", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const result = await ensureFolder("/single");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it("中间层失败时立即停止并返回 false", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await ensureFolder("/a/b/c");

    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("空路径直接返回 true", async () => {
    const result = await ensureFolder("/");

    expect(result).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
