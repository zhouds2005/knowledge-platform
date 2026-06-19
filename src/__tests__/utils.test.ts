import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("cn() utility", () => {
  it("merges strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "active", false && "hidden")).toBe("base active");
  });

  it("resolves Tailwind conflicts (tailwind-merge)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
