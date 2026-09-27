import { query, queryOne } from '../db/database';

/**
 * Normalizes Arabic text for duplicate and similarity detection:
 * - Removes tashkeel (diacritics) and tatweel (kashida)
 * - Unifies alef forms (أ, إ, آ, ٱ -> ا)
 * - Unifies taa marbuta (ة -> ه)
 * - Unifies alef maqsura (ى -> ي)
 * - Collapses repeated whitespace
 */
export function normalizeArabicText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Diacritics / Tashkeel
    .replace(/\u0640/g, '')                 // Tatweel / Kashida
    .replace(/[أإآٱ]/g, 'ا')                // Alef variants
    .replace(/ة/g, 'ه')                     // Taa marbuta to Haa
    .replace(/ى/g, 'ي')                     // Alef maqsura to Yaa
    .replace(/\s+/g, ' ')                   // Multiple spaces
    .trim()
    .toLowerCase();
}

export interface LegalNameValidationResult {
  valid: boolean;
  errors: string[];
  data?: {
    legal_first_name: string;
    legal_second_name: string;
    legal_third_name: string;
    legal_fourth_name: string;
    legal_full_name: string;
    normalized_legal_name: string;
  };
}

// Regex allowing Arabic letters, Latin letters, spaces, hyphens, and apostrophes (min 2, max 50 chars)
// Explicitly supports Unicode Arabic scripts (\u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF)
const NAME_PART_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FFa-zA-Z\s\-'.]{2,50}$/;

function validatePart(value: any, fieldLabelAr: string): { valid: boolean; trimmed: string; error?: string } {
  if (value === undefined || value === null || typeof value !== 'string') {
    return { valid: false, trimmed: '', error: `${fieldLabelAr} مطلوب` };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { valid: false, trimmed: '', error: `${fieldLabelAr} لا يمكن أن يكون فارغاً` };
  }
  if (trimmed.length < 2) {
    return { valid: false, trimmed, error: `يجب ألا يقل ${fieldLabelAr} عن حرفين` };
  }
  if (trimmed.length > 50) {
    return { valid: false, trimmed, error: `يجب ألا يتجاوز ${fieldLabelAr} ٥٠ حرفاً` };
  }
  // Reject purely numeric or symbol-only inputs
  if (!NAME_PART_REGEX.test(trimmed)) {
    return { valid: false, trimmed, error: `${fieldLabelAr} يحتوي على رموز غير صالحة، يرجى استخدام أحرف الاسم الصحيحة` };
  }
  return { valid: true, trimmed };
}

/**
 * Validates the four mandatory parts of the legal Arabic name:
 * 1. legal_first_name (الاسم الأول)
 * 2. legal_second_name (اسم الأب)
 * 3. legal_third_name (اسم الجد)
 * 4. legal_fourth_name (اسم العائلة / اللقب)
 */
export function validateFourPartLegalName(input: {
  legal_first_name?: any;
  legal_second_name?: any;
  legal_third_name?: any;
  legal_fourth_name?: any;
}): LegalNameValidationResult {
  const errors: string[] = [];

  const v1 = validatePart(input.legal_first_name, 'الاسم الأول');
  if (!v1.valid && v1.error) errors.push(v1.error);

  const v2 = validatePart(input.legal_second_name, 'اسم الأب');
  if (!v2.valid && v2.error) errors.push(v2.error);

  const v3 = validatePart(input.legal_third_name, 'اسم الجد');
  if (!v3.valid && v3.error) errors.push(v3.error);

  const v4 = validatePart(input.legal_fourth_name, 'اسم العائلة');
  if (!v4.valid && v4.error) errors.push(v4.error);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const legal_first_name = v1.trimmed;
  const legal_second_name = v2.trimmed;
  const legal_third_name = v3.trimmed;
  const legal_fourth_name = v4.trimmed;
  const legal_full_name = `${legal_first_name} ${legal_second_name} ${legal_third_name} ${legal_fourth_name}`;
  const normalized_legal_name = normalizeArabicText(legal_full_name);

  return {
    valid: true,
    errors: [],
    data: {
      legal_first_name,
      legal_second_name,
      legal_third_name,
      legal_fourth_name,
      legal_full_name,
      normalized_legal_name,
    },
  };
}

export interface DuplicateDetectionResult {
  hasMatch: boolean;
  matchLevel?: 'possible_duplicate' | 'probable_duplicate';
  matchedType?: 'applicant' | 'student';
  matchedId?: string;
  matchedIdentifier?: string;
  matchedName?: string;
}

/**
 * Searches for potential duplicates against existing applicants and students:
 * - Does NOT auto-reject
 * - Identifies 'probable_duplicate' if name and (DOB or phone) match
 * - Identifies 'possible_duplicate' if normalized name matches alone
 */
export async function detectPotentialDuplicate(
  normalizedName: string,
  dateOfBirth?: string,
  phone?: string,
  excludeApplicantId?: string
): Promise<DuplicateDetectionResult> {
  if (!normalizedName) return { hasMatch: false };

  // 1. Check applicants
  let appSql = `
    SELECT id, application_number, student_name, legal_full_name, normalized_legal_name, date_of_birth, phone
    FROM applicants
    WHERE normalized_legal_name = ?
  `;
  const appParams: any[] = [normalizedName];
  if (excludeApplicantId) {
    appSql += ' AND id != ?';
    appParams.push(excludeApplicantId);
  }
  const appMatch = await queryOne(appSql, appParams);
  if (appMatch) {
    const isProbable = (dateOfBirth && appMatch.date_of_birth === dateOfBirth) ||
                       (phone && appMatch.phone === phone);
    return {
      hasMatch: true,
      matchLevel: isProbable ? 'probable_duplicate' : 'possible_duplicate',
      matchedType: 'applicant',
      matchedId: appMatch.id,
      matchedIdentifier: appMatch.application_number,
      matchedName: appMatch.legal_full_name || appMatch.student_name,
    };
  }

  // 2. Check students
  const stuMatch = await queryOne(`
    SELECT s.id, s.student_number, s.legal_full_name, s.normalized_legal_name, a.date_of_birth, a.phone
    FROM students s
    LEFT JOIN applicants a ON a.id = s.applicant_id
    WHERE s.normalized_legal_name = ?
  `, [normalizedName]);
  if (stuMatch) {
    const isProbable = (dateOfBirth && stuMatch.date_of_birth === dateOfBirth) ||
                       (phone && stuMatch.phone === phone);
    return {
      hasMatch: true,
      matchLevel: isProbable ? 'probable_duplicate' : 'possible_duplicate',
      matchedType: 'student',
      matchedId: stuMatch.id,
      matchedIdentifier: stuMatch.student_number,
      matchedName: stuMatch.legal_full_name,
    };
  }

  return { hasMatch: false };
}
