export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5,242,880 bytes (5MB)

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"] as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAttachment(file: {
  originalname: string;
  mimetype: string;
  size: number;
}): FileValidationResult {
  // Check size limit (BR-11)
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: "File size exceeds the maximum limit of 5MB.",
    };
  }

  // Check MIME type (BR-10)
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    return {
      valid: false,
      error: "Invalid file format. Only JPG, PNG, WEBP, and PDF files are allowed.",
    };
  }

  // Check file extension to prevent spoofing
  const lowerName = file.originalname.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: "Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .pdf files are permitted.",
    };
  }

  return { valid: true };
}
