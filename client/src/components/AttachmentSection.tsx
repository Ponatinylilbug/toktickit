import React, { useState, useRef } from "react";
import { useRequester } from "../context/RequesterContext.js";
import {
  Attachment,
  uploadAttachment,
  softRemoveAttachment,
  getAttachmentDownloadUrl,
} from "../api.js";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export interface AttachmentSectionProps {
  ticketId: number;
  attachments?: Attachment[];
  onAttachmentUploaded?: (attachment: Attachment) => void;
  onAttachmentRemoved?: (attachmentId: number, updated: Attachment) => void;
  readOnly?: boolean;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AttachmentSection({
  ticketId,
  attachments = [],
  onAttachmentUploaded,
  onAttachmentRemoved,
  readOnly = false,
}: AttachmentSectionProps) {
  const { currentRequester } = useRequester();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeAttachmentsList, setActiveAttachmentsList] = useState<Attachment[]>(attachments);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Soft remove modal state
  const [removingAttachment, setRemovingAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalReasonError, setRemovalReasonError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [removeApiError, setRemoveApiError] = useState<string | null>(null);

  // Sync if prop updates
  React.useEffect(() => {
    setActiveAttachmentsList(attachments);
  }, [attachments]);

  const activeAttachments = activeAttachmentsList.filter((a) => !a.isRemoved);
  const removedAttachments = activeAttachmentsList.filter((a) => a.isRemoved);
  const isMaxReached = activeAttachments.length >= 5;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setUploadError(null);

    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Check max limit (BR-12)
    if (isMaxReached) {
      setFileError("Maximum 5 active attachments limit reached for this ticket.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Check size (BR-11)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size exceeds 5MB limit. Please choose a smaller file.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Check extension & type (BR-10)
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type);

    if (!hasValidExt && !hasValidMime) {
      setFileError("Invalid file format. Only JPG, PNG, WEBP, and PDF files are permitted.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentRequester) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const newAtt = await uploadAttachment(ticketId, selectedFile, currentRequester.id);
      const updatedList = [...activeAttachmentsList, newAtt];
      setActiveAttachmentsList(updatedList);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onAttachmentUploaded) onAttachmentUploaded(newAtt);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenRemoveModal = (attachment: Attachment) => {
    setRemovingAttachment(attachment);
    setRemovalReason("");
    setRemovalReasonError(null);
    setRemoveApiError(null);
  };

  const handleConfirmRemove = async () => {
    if (!removingAttachment || !currentRequester) return;

    const trimmed = removalReason.trim();
    if (!trimmed || trimmed.length < 3) {
      setRemovalReasonError("Removal reason is required (minimum 3 characters).");
      return;
    }

    setIsRemoving(true);
    setRemoveApiError(null);
    try {
      const updated = await softRemoveAttachment(removingAttachment.id, trimmed, currentRequester.id);
      const updatedList = activeAttachmentsList.map((a) =>
        a.id === removingAttachment.id ? updated : a
      );
      setActiveAttachmentsList(updatedList);
      if (onAttachmentRemoved) onAttachmentRemoved(removingAttachment.id, updated);
      setRemovingAttachment(null);
    } catch (err: any) {
      setRemoveApiError(err.message || "Failed to remove attachment");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="attachment-section my-3" data-testid="attachment-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 fw-bold mb-0 text-uppercase" style={{ color: "var(--color-primary-green)" }}>
          Attachments ({activeAttachments.length}/5 Active)
        </h3>
      </div>

      {/* Active Attachments List */}
      {activeAttachments.length > 0 ? (
        <div className="list-group mb-3" data-testid="active-attachments-list">
          {activeAttachments.map((att) => (
            <div
              key={att.id}
              className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 border"
              data-testid={`attachment-item-${att.id}`}
            >
              <div className="d-flex align-items-center gap-2 text-truncate me-2">
                <span className="fs-5">📎</span>
                <div>
                  <div className="fw-semibold text-truncate" style={{ maxWidth: 320 }} title={att.originalName}>
                    {att.originalName}
                  </div>
                  <div className="small text-muted">
                    {formatFileSize(att.fileSize)} • Uploaded {new Date(att.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <a
                  href={getAttachmentDownloadUrl(att.id, currentRequester?.id)}
                  download={att.originalName}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-success"
                  data-testid={`download-button-${att.id}`}
                >
                  Download
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleOpenRemoveModal(att)}
                    data-testid={`remove-button-${att.id}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted small mb-3 fst-italic" data-testid="no-active-attachments">
          No active attachments uploaded.
        </p>
      )}

      {/* Soft-Removed Attachments List */}
      {removedAttachments.length > 0 && (
        <div className="mb-3" data-testid="removed-attachments-section">
          <span className="small fw-semibold text-muted text-uppercase d-block mb-2">
            Soft-Removed Attachments ({removedAttachments.length})
          </span>
          <div className="list-group">
            {removedAttachments.map((att) => (
              <div
                key={att.id}
                className="list-group-item py-2 px-3 bg-light border text-muted"
                data-testid={`removed-attachment-${att.id}`}
              >
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <span className="badge bg-secondary me-2">Removed</span>
                    <strong className="text-decoration-line-through">{att.originalName}</strong>
                    <span className="small ms-2">({formatFileSize(att.fileSize)})</span>
                    {att.removalReason && (
                      <div className="small text-danger mt-1">
                        Reason: <em>"{att.removalReason}"</em>
                      </div>
                    )}
                    {att.removedAt && (
                      <div className="small text-muted">
                        Removed on {new Date(att.removedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary disabled"
                    disabled
                    title="Download is disabled for removed files"
                    data-testid={`disabled-download-${att.id}`}
                  >
                    Unavailable
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Form */}
      {!readOnly && (
        <div className="p-3 rounded border" style={{ backgroundColor: "var(--color-pale-green)" }}>
          <label htmlFor="attachment-file-input" className="form-label small fw-bold mb-1" style={{ color: "var(--color-primary-green)" }}>
            Upload Supporting File (JPG, PNG, WEBP, PDF up to 5MB)
          </label>

          {isMaxReached ? (
            <div className="alert alert-warning py-2 small mb-0" data-testid="max-attachments-alert">
              Maximum active attachment limit (5 files) reached for this ticket. Remove an attachment to upload a new one.
            </div>
          ) : (
            <div>
              <div className="input-group">
                <input
                  ref={fileInputRef}
                  id="attachment-file-input"
                  type="file"
                  className="form-control form-control-sm"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading || isMaxReached}
                  data-testid="attachment-input"
                />
                <button
                  type="button"
                  className="btn btn-sm zen-btn-primary"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || isMaxReached}
                  data-testid="upload-attachment-button"
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>

              {fileError && (
                <div className="small text-danger mt-1 fw-semibold" data-testid="attachment-file-error">
                  {fileError}
                </div>
              )}
              {uploadError && (
                <div className="small text-danger mt-1" data-testid="attachment-upload-error">
                  {uploadError}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Soft Remove Confirmation Modal */}
      {removingAttachment && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="soft-remove-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h5 className="modal-title h6 fw-bold text-danger">Confirm Attachment Removal</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRemovingAttachment(null)}
                  disabled={isRemoving}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                <p className="small mb-3">
                  Are you sure you want to soft-remove <strong>{removingAttachment.originalName}</strong>?
                  The audit metadata will remain in the ticket history, but file download will be disabled.
                </p>

                <div className="mb-3">
                  <label htmlFor="removal-reason-input" className="form-label small fw-semibold">
                    Reason for Removal <span style={{ color: "var(--color-error)" }}>*</span>
                  </label>
                  <input
                    id="removal-reason-input"
                    type="text"
                    className={`form-control form-control-sm ${removalReasonError ? "is-invalid" : ""}`}
                    placeholder="e.g. Uploaded incorrect log screenshot"
                    value={removalReason}
                    onChange={(e) => {
                      setRemovalReason(e.target.value);
                      if (removalReasonError) setRemovalReasonError(null);
                    }}
                    data-testid="removal-reason-input"
                    autoFocus
                  />
                  {removalReasonError && (
                    <div className="invalid-feedback d-block" data-testid="removal-reason-error">
                      {removalReasonError}
                    </div>
                  )}
                </div>

                {removeApiError && (
                  <div className="alert alert-danger small py-2 mb-0" data-testid="remove-api-error">
                    {removeApiError}
                  </div>
                )}
              </div>

              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setRemovingAttachment(null)}
                  disabled={isRemoving}
                  data-testid="cancel-remove-button"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleConfirmRemove}
                  disabled={isRemoving || !removalReason.trim()}
                  data-testid="confirm-remove-button"
                >
                  {isRemoving ? "Removing..." : "Confirm Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
