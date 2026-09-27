import path from 'path';

export const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB technical configurable limit
export const MAX_DOCUMENTS_PER_APPLICANT = 3;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.js', '.ts', '.vbs', '.ps1', '.php',
  '.phtml', '.pl', '.py', '.rb', '.cgi', '.html', '.htm', '.svg', '.xml',
  '.dll', '.scr', '.com', '.msi', '.apk', '.jar', '.bin'
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  detectedType?: 'pdf' | 'jpeg' | 'png';
  fileSize?: number;
}

/**
 * Sanitizes original filename to prevent path traversal, null-byte injection,
 * and dangerous character attacks while preserving Arabic/Unicode characters.
 */
export function sanitizeFilename(rawFilename: string): string {
  if (!rawFilename || typeof rawFilename !== 'string') return 'document';

  // 1. Remove null bytes and control chars
  let cleaned = rawFilename.replace(/[\x00-\x1F\x7F]/g, '');

  // 2. Strip directory paths (both forward and back slashes)
  cleaned = cleaned.replace(/^.*[\\\/]/, '');

  // 3. Remove traversal patterns like ".."
  cleaned = cleaned.replace(/\.\.+/g, '.');

  // 4. Trim whitespace
  cleaned = cleaned.trim();

  // 5. Fallback if empty or stripped completely
  if (!cleaned || cleaned === '.') {
    cleaned = 'document';
  }

  // 6. Max length 120 chars
  if (cleaned.length > 120) {
    const ext = path.extname(cleaned);
    const base = path.basename(cleaned, ext).slice(0, 110);
    cleaned = `${base}${ext}`;
  }

  return cleaned;
}

/**
 * Checks magic bytes against known document signatures
 */
export function detectMagicBytes(buffer: Buffer): 'pdf' | 'jpeg' | 'png' | 'executable' | 'unknown' {
  if (!buffer || buffer.length < 4) return 'unknown';

  // Check PE executable (MZ)
  if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
    return 'executable';
  }

  // Check ELF executable
  if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    return 'executable';
  }

  // Check Script shebang (#! / 0x23 0x21)
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return 'executable';
  }

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'pdf';
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpeg';
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return 'png';
  }

  return 'unknown';
}

/**
 * Strict Multi-Layer File Validator:
 * 1. Checks file presence & buffer length.
 * 2. Enforces maximum file size (5MB).
 * 3. Enforces extension whitelist & blocks dangerous extensions.
 * 4. Enforces MIME type whitelist.
 * 5. Inspects binary magic bytes and ensures exact match with declared MIME/ext.
 */
export function validateDocumentFile(
  buffer: Buffer,
  rawOriginalName: string,
  declaredMimeType: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'الملف المرفوع فارغ أو غير صالح.' };
  }

  const fileSize = buffer.length;
  if (fileSize > MAX_DOCUMENT_FILE_SIZE) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد الأقصى المسموح به (${(MAX_DOCUMENT_FILE_SIZE / (1024 * 1024)).toFixed(0)} ميجابايت).`,
      fileSize,
    };
  }

  const sanitizedFilename = sanitizeFilename(rawOriginalName);
  const ext = path.extname(sanitizedFilename).toLowerCase();

  // Block dangerous extensions explicitly
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'نوع الملف غير مسموح به لأسباب أمنية.' };
  }

  // Validate allowed extensions
  if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
    return { valid: false, error: 'امتداد الملف غير مدعوم. الصيغ المدعومة: PDF, JPG, PNG فقط.' };
  }

  // Validate declared MIME
  const normalizedMime = (declaredMimeType || '').toLowerCase().trim();
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime as any)) {
    return { valid: false, error: 'نوع وسائط الملف (MIME) غير مصرّح به.' };
  }

  // Inspect real binary magic bytes
  const detectedType = detectMagicBytes(buffer);

  if (detectedType === 'executable') {
    return { valid: false, error: 'تم رفض الملف: يحتوي على توقيع تنفيذي غير مسموح به نهائياً.' };
  }

  if (detectedType === 'unknown') {
    return { valid: false, error: 'توقيع الملف غير صالح أو لا يطابق الصيغ المعتمدة (PDF, JPG, PNG).' };
  }

  // Validate cross-consistency between detected magic bytes and declared extension/MIME
  if (detectedType === 'pdf') {
    if (ext !== '.pdf' || normalizedMime !== 'application/pdf') {
      return { valid: false, error: 'توقيع الملف لا يتطابق مع نوع الملف المعلن.' };
    }
  } else if (detectedType === 'jpeg') {
    if ((ext !== '.jpg' && ext !== '.jpeg') || (normalizedMime !== 'image/jpeg' && normalizedMime !== 'image/pjpeg')) {
      return { valid: false, error: 'توقيع الملف لا يتطابق مع نوع الملف المعلن.' };
    }
  } else if (detectedType === 'png') {
    if (ext !== '.png' || normalizedMime !== 'image/png') {
      return { valid: false, error: 'توقيع الملف لا يتطابق مع نوع الملف المعلن.' };
    }
  }

  return {
    valid: true,
    sanitizedFilename,
    detectedType,
    fileSize,
  };
}
