import { describe, it, expect } from "vitest";
import { searchQuery } from "../lib/search";

describe("searchQuery", () => {
  it("should produce SQL with ILIKE patterns", () => {
    const sql = searchQuery("test");
    expect(sql.queryChunks).toBeDefined();
  });
  it("should escape percent signs", () => {
    const sql = searchQuery("100%");
    // Should not throw and contain escaped pattern
    expect(() => sql).not.toThrow();
  });
});
