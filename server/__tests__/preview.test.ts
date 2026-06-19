import { describe, it, expect } from "vitest";
import { isOfficeFile } from "../lib/preview";

describe("preview: isOfficeFile", () => {
  it("detects Word documents", () => {
    expect(isOfficeFile("report.docx")).toBe(true);
    expect(isOfficeFile("report.doc")).toBe(true);
  });

  it("detects Excel spreadsheets", () => {
    expect(isOfficeFile("data.xlsx")).toBe(true);
    expect(isOfficeFile("data.xls")).toBe(true);
  });

  it("detects PowerPoint slides", () => {
    expect(isOfficeFile("slides.pptx")).toBe(true);
    expect(isOfficeFile("slides.ppt")).toBe(true);
  });

  it("detects OpenDocument formats", () => {
    expect(isOfficeFile("doc.odt")).toBe(true);
    expect(isOfficeFile("sheet.ods")).toBe(true);
    expect(isOfficeFile("slide.odp")).toBe(true);
  });

  it("rejects PDF", () => {
    expect(isOfficeFile("doc.pdf")).toBe(false);
  });

  it("rejects images", () => {
    expect(isOfficeFile("photo.png")).toBe(false);
    expect(isOfficeFile("photo.jpg")).toBe(false);
  });

  it("rejects plain text", () => {
    expect(isOfficeFile("readme.txt")).toBe(false);
    expect(isOfficeFile("readme.md")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isOfficeFile("REPORT.DOCX")).toBe(true);
    expect(isOfficeFile("Report.PDF")).toBe(false);
  });
});
