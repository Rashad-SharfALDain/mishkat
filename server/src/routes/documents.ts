import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { query, run, queryOne } from '../db/database';
import { requireAdmin, requireStrictAdmin, requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { recordAudit } from '../utils/auditLogger';
import { validateDocumentFile, MAX_DOCUMENTS_PER_APPLICANT } from '../utils/fileValidation';
import { isEncryptionConfigured, encryptDocument, decryptDocument, getEncryptionKey } from '../utils/documentEncryption';

const router = Router();

const SECURE_DOCUMENTS_DIR = path.join(process.cwd(), 'data', 'secure_documents');
if (!fs.existsSync(SECURE_DOCUMENTS_DIR)) {
  fs.mkdirSync(SECURE_DOCUMENTS_DIR, { recursive: true });
}

// Multer memory storage (files kept in RAM for validation before persisting)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

// Middleware to safely handle Multer errors (e.g. file size exceeded)
function handleMulterUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'حجم الملف يتجاوز الحد الأقصى المسموح به (٥ ميجابايت).' });
        return;
      }
      res.status(400).json({ error: err.message || 'حدث خطأ أثناء استقبال الملف.' });
      return;
    }
    next();
  });
}

// ========================================================
// 1. POST /api/documents/upload-session
// Generates a single-use cryptographically secure upload session
// ========================================================
router.post('/upload-session', rateLimiter(30, 15 * 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicant_id } = req.body;

    if (!applicant_id || typeof applicant_id !== 'string') {
      res.status(400).json({ error: 'معرف المتقدم مطلوب.' });
      return;
    }

    // Verify applicant exists
    const applicant = await queryOne('SELECT id, student_name, application_number FROM applicants WHERE id = ?', [applicant_id]);
    if (!applicant) {
      res.status(404).json({ error: 'طلب التقديم غير موجود.' });
      return;
    }

    // Generate 32-byte cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 60-minute expiration
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await run(`
      INSERT INTO document_upload_sessions (
        applicant_id, token_hash, client_ip, expires_at, max_uploads, uploads_completed, is_used, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP)
    `, [applicant_id, tokenHash, req.ip || null, expiresAt, MAX_DOCUMENTS_PER_APPLICANT]);

    // Audit log (never log raw token)
    await recordAudit(
      null,
      'DOCUMENT_UPLOAD_SESSION_CREATED',
      'applicant_documents',
      applicant_id,
      {
        applicant_id,
        application_number: applicant.application_number,
        expires_at: expiresAt,
        max_uploads: MAX_DOCUMENTS_PER_APPLICANT,
      },
      req.ip
    );

    res.status(201).json({
      success: true,
      upload_token: rawToken,
      applicant_id,
      expires_at: expiresAt,
      max_uploads: MAX_DOCUMENTS_PER_APPLICANT,
      message: 'تم إنشاء جلسة رفع آمنة صالحة لمدة ٦٠ دقيقة.',
    });
  } catch (error) {
    console.error('Error creating upload session:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء جلسة رفع الوثائق.' });
  }
});

// ========================================================
// 2. POST /api/documents/upload
// Secure document upload with token validation, magic bytes check, and AES-256-GCM encryption
// ========================================================
router.post('/upload', rateLimiter(40, 15 * 60 * 1000), handleMulterUpload, async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = (req.headers['x-upload-token'] as string) || req.body.upload_token;
    const applicantId = req.body.applicant_id;
    const documentType = req.body.document_type || 'national_id';
    const documentNumber = req.body.document_number ? String(req.body.document_number).trim() : null;

    if (!rawToken) {
      res.status(401).json({ error: 'رمز جلسة الرفع مفقود (x-upload-token مطلوب).' });
      return;
    }

    if (!applicantId) {
      res.status(400).json({ error: 'معرف المتقدم مطلوب.' });
      return;
    }

    if (!req.file || !req.file.buffer) {
      res.status(400).json({ error: 'يرجى اختيار ملف الوثيقة لرفعه.' });
      return;
    }

    // 1. Verify upload session
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await queryOne(`
      SELECT * FROM document_upload_sessions WHERE token_hash = ?
    `, [tokenHash]);

    if (!session) {
      res.status(401).json({ error: 'جلسة الرفع غير صالحة أو الرمز غير صحيح.' });
      return;
    }

    // Enforce applicant binding
    if (session.applicant_id !== applicantId) {
      res.status(403).json({ error: 'جلسة الرفع غير مصرح بها لهذا المتقدم (غير مطابقة).' });
      return;
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      res.status(401).json({ error: 'انتهت صلاحية جلسة الرفع، يرجى إنشاء جلسة جديدة.' });
      return;
    }

    // Check single-use / limit
    if (session.is_used === 1 || session.uploads_completed >= session.max_uploads) {
      res.status(401).json({ error: 'تم استنفاد هذه الجلسة مسبقاً.' });
      return;
    }

    // 2. Check maximum documents per applicant
    const countRow = await queryOne('SELECT COUNT(*) as cnt FROM applicant_documents WHERE applicant_id = ?', [applicantId]);
    if (countRow && countRow.cnt >= MAX_DOCUMENTS_PER_APPLICANT) {
      res.status(400).json({ error: `تم الوصول للحد الأقصى المسموح به من الوثائق (${MAX_DOCUMENTS_PER_APPLICANT} وثائق) لهذا المتقدم.` });
      return;
    }

    // 3. Strict File Validation (size, extension, MIME, magic bytes)
    const validation = validateDocumentFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    if (!validation.valid || !validation.sanitizedFilename) {
      res.status(400).json({ error: validation.error || 'الملف المرفوع غير صالح.' });
      return;
    }

    // 4. SHA-256 Hash of unencrypted original content
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // 5. Storage key & path
    const storageKey = crypto.randomUUID();
    const diskPath = path.join(SECURE_DOCUMENTS_DIR, `${storageKey}.dat`);

    // 6. AES-256-GCM Encryption
    let isEncrypted = 0;
    let ivHex: string | null = null;
    let authTagHex: string | null = null;
    let keyVersion = 0;
    let bufferToWrite: Buffer = req.file.buffer;

    // Optional test-key header for isolated automated testing without modifying .env
    const testOverrideKey = req.headers['x-encryption-override-key'] as string;
    const hasKey = isEncryptionConfigured() || !!getEncryptionKey(testOverrideKey);

    if (hasKey) {
      const encrypted = encryptDocument(req.file.buffer, testOverrideKey);
      bufferToWrite = encrypted.encryptedBuffer;
      ivHex = encrypted.ivHex;
      authTagHex = encrypted.authTagHex;
      keyVersion = encrypted.keyVersion;
      isEncrypted = 1;
    } else {
      // Unencrypted fallback when key is not configured in environment
      isEncrypted = 0;
    }

    // Write file to isolated disk storage
    fs.writeFileSync(diskPath, bufferToWrite);

    // 7. Insert record into applicant_documents
    const insertResult = await run(`
      INSERT INTO applicant_documents (
        applicant_id, student_id, document_type, document_number,
        storage_key, file_path, original_filename, file_size,
        mime_type, file_hash, is_encrypted, iv_hex,
        auth_tag_hex, key_version, upload_status, verification_status,
        created_at, updated_at
      ) VALUES (
        ?, NULL, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'uploaded', 'pending',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `, [
      applicantId,
      documentType,
      documentNumber,
      storageKey,
      diskPath,
      validation.sanitizedFilename,
      req.file.size,
      req.file.mimetype,
      fileHash,
      isEncrypted,
      ivHex,
      authTagHex,
      keyVersion,
    ]);

    let docId = insertResult.lastInsertRowid;
    if (!docId) {
      const insertedDoc = await queryOne<{ id: number }>('SELECT id FROM applicant_documents WHERE storage_key = ?', [storageKey]);
      docId = insertedDoc?.id || 0;
    }

    // 8. Update upload session
    const nextUploads = session.uploads_completed + 1;
    const isNowUsed = nextUploads >= session.max_uploads ? 1 : 0;
    await run(`
      UPDATE document_upload_sessions 
      SET uploads_completed = ?, is_used = ?, used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nextUploads, isNowUsed, session.id]);

    // 9. Audit trail
    await recordAudit(
      null,
      'DOCUMENT_UPLOADED',
      'applicant_documents',
      String(docId),
      {
        applicant_id: applicantId,
        document_id: docId,
        document_type: documentType,
        original_filename: validation.sanitizedFilename,
        file_size: req.file.size,
        file_hash: fileHash,
        is_encrypted: isEncrypted === 1,
      },
      req.ip
    );

    res.status(201).json({
      success: true,
      document: {
        id: docId,
        applicant_id: applicantId,
        document_type: documentType,
        original_filename: validation.sanitizedFilename,
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        upload_status: 'uploaded',
        verification_status: 'pending',
        is_encrypted: isEncrypted === 1,
        created_at: new Date().toISOString(),
      },
      session: {
        uploads_completed: nextUploads,
        max_uploads: session.max_uploads,
        is_used: isNowUsed === 1,
      },
      message: 'تم رفع وثيقة إثبات الهوية بنجاح، وهي قيد المراجعة والتدقيق الإداري.',
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء معالجة رفع الوثيقة.' });
  }
});

// ========================================================
// 3. GET /api/documents/applicant/:applicantId/status
// Gets public/applicant document status list with IDOR protection
// ========================================================
router.get('/applicant/:applicantId/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicantId } = req.params;
    const rawToken = (req.headers['x-upload-token'] as string) || (req.query.token as string);

    // IDOR Protection: Require either valid upload session token for this applicant OR authenticated user
    let authorized = false;

    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const session = await queryOne('SELECT id, applicant_id FROM document_upload_sessions WHERE token_hash = ?', [tokenHash]);
      if (session && session.applicant_id === applicantId) {
        authorized = true;
      }
    }

    if (!authorized) {
      // Check auth header if provided
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const jwt = require('jsonwebtoken');
          const { CONFIG } = require('../config');
          const decoded = jwt.verify(authHeader.split(' ')[1], CONFIG.JWT_SECRET) as any;
          if (decoded.role === 'admin' || decoded.role === 'supervisor') {
            authorized = true;
          } else if (decoded.role === 'parent' || decoded.role === 'student') {
            // Check if user is linked to this applicant
            const linked = await queryOne('SELECT id FROM students WHERE applicant_id = ? AND user_id = ?', [applicantId, decoded.id]);
            if (linked) authorized = true;
          }
        } catch {
          // ignore jwt error
        }
      }
    }

    if (!authorized) {
      res.status(403).json({ error: 'غير مصرح: لا يمكنك الاطلاع على وثائق هذا المتقدم بدون جلسة صالحة أو تسجيل دخول.' });
      return;
    }

    // Return sanitized document metadata (no storage_key, no file_path, no keys)
    const docs = await query(`
      SELECT id, applicant_id, document_type, original_filename, file_size, mime_type,
             upload_status, verification_status, rejection_reason, created_at
      FROM applicant_documents
      WHERE applicant_id = ?
      ORDER BY created_at DESC
    `, [applicantId]);

    res.json({
      success: true,
      applicant_id: applicantId,
      documents: docs,
      count: docs.length,
    });
  } catch (error) {
    console.error('Error fetching document status:', error);
    res.status(500).json({ error: 'تعذر جلب حالة الوثائق.' });
  }
});

// ========================================================
// 4. GET /api/admin/applicants/:id/documents
// Admin/Supervisor endpoint to view document metadata for an applicant
// ========================================================
router.get('/admin/applicants/:id/documents', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const docs = await query(`
      SELECT d.id, d.applicant_id, d.document_type, d.document_number,
             d.original_filename, d.file_size, d.mime_type, d.is_encrypted,
             d.file_hash, d.upload_status, d.verification_status, d.rejection_reason,
             d.created_at, d.verified_at, u.name as verified_by_name
      FROM applicant_documents d
      LEFT JOIN users u ON u.id = d.verified_by
      WHERE d.applicant_id = ?
      ORDER BY d.created_at DESC
    `, [id]);

    res.json({ success: true, documents: docs });
  } catch (error) {
    console.error('Error listing applicant documents:', error);
    res.status(500).json({ error: 'تعذر جلب قائمة وثائق المتقدم.' });
  }
});

// ========================================================
// 5. GET /api/admin/documents/:id/download & /view
// Strict Admin ONLY: Download/View original document (with AES-256-GCM decryption)
// Blocks supervisor, parent, student with HTTP 403
// ========================================================
async function handleAdminDocumentRetrieval(req: AuthRequest, res: Response, isInline: boolean): Promise<void> {
  try {
    const { id } = req.params;

    const doc = await queryOne('SELECT * FROM applicant_documents WHERE id = ?', [id]);
    if (!doc) {
      res.status(404).json({ error: 'الوثيقة المطلوبة غير موجودة.' });
      return;
    }

    if (!fs.existsSync(doc.file_path)) {
      res.status(404).json({ error: 'ملف الوثيقة غير موجود على خادم التخزين الآمن.' });
      return;
    }

    const rawFileBuffer = fs.readFileSync(doc.file_path);
    let outputBuffer: Buffer = rawFileBuffer;

    if (doc.is_encrypted === 1) {
      const testOverrideKey = req.headers['x-encryption-override-key'] as string;
      try {
        outputBuffer = decryptDocument(rawFileBuffer, doc.iv_hex, doc.auth_tag_hex, testOverrideKey);
      } catch (err: any) {
        res.status(500).json({ error: err.message || 'تعذر فك تشفير الوثيقة.' });
        return;
      }
    }

    // Audit log
    await recordAudit(
      req.user?.id,
      isInline ? 'DOCUMENT_VIEWED' : 'DOCUMENT_DOWNLOADED',
      'applicant_documents',
      String(id),
      {
        document_id: id,
        applicant_id: doc.applicant_id,
        original_filename: doc.original_filename,
        is_encrypted: doc.is_encrypted === 1,
      },
      req.ip
    );

    // Set secure headers
    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");

    const dispositionType = isInline ? 'inline' : 'attachment';
    const encodedFilename = encodeURIComponent(doc.original_filename || 'document');
    res.setHeader('Content-Disposition', `${dispositionType}; filename*=UTF-8''${encodedFilename}`);

    res.send(outputBuffer);
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ error: 'تعذر تنزيل الوثيقة.' });
  }
}

router.get('/admin/documents/:id/download', requireStrictAdmin, async (req: AuthRequest, res: Response) => {
  await handleAdminDocumentRetrieval(req, res, false);
});

router.get('/admin/documents/:id/view', requireStrictAdmin, async (req: AuthRequest, res: Response) => {
  await handleAdminDocumentRetrieval(req, res, true);
});

export default router;
