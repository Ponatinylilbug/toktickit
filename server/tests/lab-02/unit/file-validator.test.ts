import { describe, it, expect } from "vitest";
import { validateAttachment } from "../../../src/utils/file-validator.js";

describe("validateAttachment (UNIT-02, BR-10, BR-11)", () => {
  it("accepts valid image/jpeg, image/png, image/webp, and application/pdf files under 5MB", () => {
    const validJpg = validateAttachment({
      originalname: "screenshot.jpg",
      mimetype: "image/jpeg",
      size: 1024 * 1024, // 1MB
    });
    expect(validJpg.valid).toBe(true);

    const validPng = validateAttachment({
      originalname: "diagram.png",
      mimetype: "image/png",
      size: 2 * 1024 * 1024, // 2MB
    });
    expect(validPng.valid).toBe(true);

    const validWebp = validateAttachment({
      originalname: "capture.webp",
      mimetype: "image/webp",
      size: 500 * 1024,
    });
    expect(validWebp.valid).toBe(true);

    const validPdf = validateAttachment({
      originalname: "error_log.pdf",
      mimetype: "application/pdf",
      size: 4.9 * 1024 * 1024,
    });
    expect(validPdf.valid).toBe(true);
  });

  it("rejects files exceeding 5MB (5,242,880 bytes) with clear error message", () => {
    const oversizedFile = validateAttachment({
      originalname: "huge.pdf",
      mimetype: "application/pdf",
      size: 5 * 1024 * 1024 + 1, // 5MB + 1 byte
    });
    expect(oversizedFile.valid).toBe(false);
    expect(oversizedFile.error).toMatch(/5MB/i);
  });

  it("rejects unsupported MIME types and dangerous extensions", () => {
    const exeFile = validateAttachment({
      originalname: "payload.exe",
      mimetype: "application/x-msdownload",
      size: 1024,
    });
    expect(exeFile.valid).toBe(false);
    expect(exeFile.error).toMatch(/format|type/i);

    const zipFile = validateAttachment({
      originalname: "archive.zip",
      mimetype: "application/zip",
      size: 2048,
    });
    expect(zipFile.valid).toBe(false);

    // Mismatched extension vs MIME type
    const spoofedFile = validateAttachment({
      originalname: "malicious.exe",
      mimetype: "image/png",
      size: 1024,
    });
    expect(spoofedFile.valid).toBe(false);
  });
});
