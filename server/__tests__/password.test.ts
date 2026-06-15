import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../lib/password";

describe("hashPassword", () => {
  it("should produce salt:hash format", async () => {
    const r = await hashPassword("test");
    const parts = r.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveLength(32);
    expect(parts[1]).toHaveLength(128);
  });
  it("should produce different hashes for same password", async () => {
    const a = await hashPassword("p");
    const b = await hashPassword("p");
    expect(a).not.toBe(b);
  });
});

describe("verifyPassword", () => {
  it("should verify correct password", async () => {
    const h = await hashPassword("secret");
    expect(await verifyPassword("secret", h)).toBe(true);
  });
  it("should reject wrong password", async () => {
    const h = await hashPassword("secret");
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
  it("should reject malformed hash", async () => {
    expect(await verifyPassword("x", "badhash")).toBe(false);
  });
  it("should reject short key", async () => {
    expect(await verifyPassword("x", "a".repeat(32) + ":" + "b".repeat(64))).toBe(false);
  });
});
