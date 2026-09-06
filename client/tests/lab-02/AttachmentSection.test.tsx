import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import AttachmentSection from "../../src/components/AttachmentSection.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  department: "Engineering",
  isActive: true,
};

const mockActiveAttachments: api.Attachment[] = [
  {
    id: 501,
    ticketId: 101,
    fileName: "501_screenshot.png",
    originalName: "screenshot.png",
    fileSize: 1024 * 500, // 500 KB
    mimeType: "image/png",
    isRemoved: false,
    createdAt: new Date("2026-09-03T10:00:00Z").toISOString(),
  },
  {
    id: 502,
    ticketId: 101,
    fileName: "502_error_log.pdf",
    originalName: "error_log.pdf",
    fileSize: 1024 * 1024 * 1.5, // 1.5 MB
    mimeType: "application/pdf",
    isRemoved: false,
    createdAt: new Date("2026-09-03T10:05:00Z").toISOString(),
  },
];

describe("AttachmentSection Component (UI-06, AC-04, AC-05, BR-10..13)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchActiveRequesters").mockResolvedValue([mockRequester]);
  });

  it("renders active attachments list with formatted sizes and download buttons (AC-11)", () => {
    render(
      <RequesterProvider>
        <AttachmentSection ticketId={101} attachments={mockActiveAttachments} />
      </RequesterProvider>
    );

    expect(screen.getByText("screenshot.png")).toBeInTheDocument();
    expect(screen.getByText(/500\.0 KB/i)).toBeInTheDocument();
    expect(screen.getByText("error_log.pdf")).toBeInTheDocument();
    expect(screen.getByText(/1\.50 MB/i)).toBeInTheDocument();

    const downloadBtn1 = screen.getByTestId("download-button-501");
    expect(downloadBtn1).toBeInTheDocument();
    expect(downloadBtn1.getAttribute("href")).toContain("/api/attachments/501/download");
  });

  it("validates and rejects file exceeding 5MB (AC-04, BR-11)", async () => {
    render(
      <RequesterProvider>
        <AttachmentSection ticketId={101} attachments={[]} />
      </RequesterProvider>
    );

    const fileInput = screen.getByTestId("attachment-input");
    const oversizedFile = new File(["a".repeat(100)], "huge_video.mp4", { type: "video/mp4" });
    Object.defineProperty(oversizedFile, "size", { value: 6 * 1024 * 1024 }); // 6MB

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
    });

    expect(await screen.findByTestId("attachment-file-error")).toHaveTextContent(/exceeds 5MB limit/i);
    expect(screen.getByTestId("upload-attachment-button")).toBeDisabled();
  });

  it("validates and rejects unsupported file extension (AC-04, BR-10)", async () => {
    render(
      <RequesterProvider>
        <AttachmentSection ticketId={101} attachments={[]} />
      </RequesterProvider>
    );

    const fileInput = screen.getByTestId("attachment-input");
    const invalidFile = new File(["exe content"], "malicious.exe", { type: "application/x-msdownload" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    });

    expect(await screen.findByTestId("attachment-file-error")).toHaveTextContent(/invalid file format/i);
    expect(screen.getByTestId("upload-attachment-button")).toBeDisabled();
  });

  it("disables upload and file input when 5 active attachments exist (AC-05, BR-12)", () => {
    const fiveAttachments: api.Attachment[] = Array.from({ length: 5 }, (_, i) => ({
      id: 501 + i,
      ticketId: 101,
      fileName: `file_${i + 1}.png`,
      originalName: `file_${i + 1}.png`,
      fileSize: 10000,
      mimeType: "image/png",
      isRemoved: false,
      createdAt: new Date().toISOString(),
    }));

    render(
      <RequesterProvider>
        <AttachmentSection ticketId={101} attachments={fiveAttachments} />
      </RequesterProvider>
    );

    expect(screen.getByTestId("max-attachments-alert")).toBeInTheDocument();
    expect(screen.queryByTestId("attachment-input")).not.toBeInTheDocument();
  });
});
