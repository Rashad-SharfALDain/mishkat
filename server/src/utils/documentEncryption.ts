import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits
const KEY_LENGTH_BYTES = 32; // 256 bits

/**
 * Checks whether DOCUMENT_ENCRYPTION_KEY is properly configured in environment
 */
export function isEncryptionConfigured(): boolean {
  const keyHex = (process.env.DOCUMENT_ENCRYPTION_KEY || '').trim();
  if (!keyHex || keyHex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    return false;
  }
  return true;
}

/**
 * Retrieves encryption key buffer safely without leaking to logs
 */
export function getEncryptionKey(overrideKeyHex?: string): Buffer | null {
  const keyHex = (overrideKeyHex || process.env.DOCUMENT_ENCRYPTION_KEY || '').trim();
  if (!keyHex || keyHex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    return null;
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== KEY_LENGTH_BYTES) {
    return null;
  }
  return key;
}

export interface EncryptedDocumentResult {
  encryptedBuffer: Buffer;
  ivHex: string;
  authTagHex: string;
  keyVersion: number;
}

/**
 * Encrypts document buffer using AES-256-GCM authenticated symmetric encryption
 */
export function encryptDocument(buffer: Buffer, overrideKeyHex?: string): EncryptedDocumentResult {
  const key = getEncryptionKey(overrideKeyHex);
  if (!key) {
    throw new Error('مفتاح تشفير الوثائق DOCUMENT_ENCRYPTION_KEY غير مهيأ في بيئة الخادم. يرجى تهيئة المفتاح السري بأمان.');
  }

  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer: encrypted,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    keyVersion: 1,
  };
}

/**
 * Decrypts document buffer using AES-256-GCM and verifies authenticity
 */
export function decryptDocument(
  encryptedBuffer: Buffer,
  ivHex: string,
  authTagHex: string,
  overrideKeyHex?: string
): Buffer {
  const key = getEncryptionKey(overrideKeyHex);
  if (!key) {
    throw new Error('مفتاح فك تشفير الوثائق DOCUMENT_ENCRYPTION_KEY غير متوفر.');
  }

  if (!ivHex || !authTagHex) {
    throw new Error('معاملات التحقق من التشفير (IV / Auth Tag) مفقودة.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted;
  } catch (err: any) {
    throw new Error('فشل فك تشفير الوثيقة: وسام المصادقة غير صالح أو محتوى الملف تالف.');
  }
}
