import { describe, it, expect } from "vitest";
import { searchQuery } from "../lib/search";

describe("searchQuery", () => {
  it("produces a non-empty SQL object", () => {
    const sql = searchQuery("测试");
    expect(sql).toBeDefined();
    expect(sql.queryChunks).toBeDefined();
    expect(sql.queryChunks.length).toBeGreaterThan(0);
  });

  it("includes the search term in the generated SQL", () => {
    const sql = searchQuery("hello");
    const chunksStr = JSON.stringify(sql.queryChunks);
    expect(chunksStr).toContain("hello");
  });

  it("escapes percent signs to prevent LIKE wildcard injection", () => {
    const sql = searchQuery("100%");
    const chunksStr = JSON.stringify(sql.queryChunks);
    // LIKE 模式中，首尾 % 是通配符，中间的 % 应被转义为 \%
    // 结果应为 %100\\%% (前后 % 是 LIKE 通配，中间 \\% 是转义后的字面 %)
    expect(chunksStr).toContain("100\\\\%%");
  });

  it("escapes underscores to prevent LIKE single-char wildcard injection", () => {
    const sql = searchQuery("file_name");
    const chunksStr = JSON.stringify(sql.queryChunks);
    expect(chunksStr).toContain("\\\\_");
  });

  it("handles empty string gracefully", () => {
    const sql = searchQuery("");
    expect(sql).toBeDefined();
    const chunksStr = JSON.stringify(sql.queryChunks);
    // Should still produce valid SQL with empty pattern
    expect(chunksStr).toContain("%%");
  });

  it("handles whitespace-only input", () => {
    const sql = searchQuery("   ");
    expect(sql).toBeDefined();
  });

  it("handles Chinese characters", () => {
    const sql = searchQuery("知识管理");
    const chunksStr = JSON.stringify(sql.queryChunks);
    expect(chunksStr).toContain("知识管理");
  });

  it("handles special regex characters literally", () => {
    // 这些字符在 ILIKE 中都不是特殊字符，但应确保不被错误处理
    const sql = searchQuery("test.data (v2) [final]");
    expect(sql).toBeDefined();
    const chunksStr = JSON.stringify(sql.queryChunks);
    expect(chunksStr).toContain("test.data (v2) [final]");
  });

  it("searches across title, description, and tags", () => {
    const sql = searchQuery("keyword");
    const chunksStr = JSON.stringify(sql.queryChunks);
    expect(chunksStr).toContain("title");
    expect(chunksStr).toContain("description");
    expect(chunksStr).toContain("unnest(tags)");
  });

  it("produces consistent output for repeated calls", () => {
    const a = searchQuery("test");
    const b = searchQuery("test");
    expect(JSON.stringify(a.queryChunks)).toBe(JSON.stringify(b.queryChunks));
  });
});
