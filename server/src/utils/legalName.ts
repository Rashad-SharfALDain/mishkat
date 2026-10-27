/**
 * MISHKAT — UNIFIED LEGAL NAME REPORTING & RESOLUTION LAYER (PHASE 2.4-E5)
 * Server-Side Source of Truth for Student and Applicant Names
 * 
 * Strict Governance Rules:
 * - 'verified': legal_full_name is the official Verified Legal Name.
 * - 'pending' / 'correction_requested' / 'rejected': NEVER presented as verified.
 * - 'legacy_unverified': Original historical name is preserved for historical display,
 *    and explicitly marked as unverified. NEVER invent 4-part name or claim verification.
 */

export type NameVerificationStatus =
  | 'verified'
  | 'pending'
  | 'legacy_unverified'
  | 'rejected'
  | 'correction_requested';

export interface LegalNameResolutionInput {
  id?: string;
  student_number?: string | null;
  application_number?: string | null;
  student_name?: string | null;
  name?: string | null;
  legal_full_name?: string | null;
  legacy_student_name?: string | null;
  name_verification_status?: string | null;
  legal_first_name?: string | null;
  legal_second_name?: string | null;
  legal_third_name?: string | null;
  legal_fourth_name?: string | null;
  [key: string]: any;
}

export interface ResolvedLegalName {
  /** Safe display name for UI rendering */
  display_name: string;
  /** Official verified legal name. ONLY populated if status === 'verified' */
  verified_legal_name: string | null;
  /** The self-declared/submitted 4-part legal name (raw candidate, whether verified or not) */
  candidate_legal_name: string | null;
  /** The original historical record name */
  historical_name: string;
  /** Canonical verification status */
  name_verification_status: NameVerificationStatus;
  /** Boolean flag: true ONLY if verified by Strict Admin */
  is_verified_legal: boolean;
  /** Human-readable status label in Arabic */
  status_label_ar: string;
  /** Formal report string: e.g. "أحمد محمد علي التميمي" or "أحمد محمد (غير موثق)" */
  formal_report_name: string;
}

/**
 * Resolves a record's name attributes according to strict verification governance rules.
 */
export function resolveLegalName(record: LegalNameResolutionInput | null | undefined): ResolvedLegalName {
  if (!record) {
    return {
      display_name: '',
      verified_legal_name: null,
      candidate_legal_name: null,
      historical_name: '',
      name_verification_status: 'legacy_unverified',
      is_verified_legal: false,
      status_label_ar: 'غير معروف',
      formal_report_name: '',
    };
  }

  // 1. Determine canonical status (default to legacy_unverified if absent or unknown)
  const rawStatus = (record.name_verification_status || '').toLowerCase().trim();
  let status: NameVerificationStatus = 'legacy_unverified';
  if (rawStatus === 'verified') status = 'verified';
  else if (rawStatus === 'pending') status = 'pending';
  else if (rawStatus === 'rejected') status = 'rejected';
  else if (rawStatus === 'correction_requested') status = 'correction_requested';
  else status = 'legacy_unverified';

  // 2. Identify candidate legal full name and historical name
  const candidateLegal = record.legal_full_name ? record.legal_full_name.trim() : null;
  const historicalName = (record.legacy_student_name || record.student_name || record.name || candidateLegal || '').trim();

  // 3. Resolve by status
  if (status === 'verified') {
    const verifiedName = candidateLegal || historicalName;
    return {
      display_name: verifiedName,
      verified_legal_name: verifiedName,
      candidate_legal_name: candidateLegal,
      historical_name: historicalName,
      name_verification_status: 'verified',
      is_verified_legal: true,
      status_label_ar: 'معتمد وموثق رسميًا',
      formal_report_name: verifiedName,
    };
  }

  if (status === 'legacy_unverified') {
    const displayName = historicalName || candidateLegal || '';
    return {
      display_name: displayName,
      verified_legal_name: null, // STRICT: Never claim verified for legacy records
      candidate_legal_name: candidateLegal,
      historical_name: historicalName,
      name_verification_status: 'legacy_unverified',
      is_verified_legal: false,
      status_label_ar: 'سجل تاريخي (غير موثق)',
      formal_report_name: displayName ? `${displayName} (سجل تاريخي - غير موثق)` : 'غير موثق',
    };
  }

  if (status === 'pending') {
    const displayName = candidateLegal || historicalName;
    return {
      display_name: displayName,
      verified_legal_name: null, // STRICT: Never claim verified for pending
      candidate_legal_name: candidateLegal,
      historical_name: historicalName,
      name_verification_status: 'pending',
      is_verified_legal: false,
      status_label_ar: 'قيد التدقيق والتحقق',
      formal_report_name: displayName ? `${displayName} (قيد التدقيق)` : 'قيد التدقيق',
    };
  }

  if (status === 'rejected') {
    const displayName = candidateLegal || historicalName;
    return {
      display_name: displayName,
      verified_legal_name: null, // STRICT: Never claim verified for rejected
      candidate_legal_name: candidateLegal,
      historical_name: historicalName,
      name_verification_status: 'rejected',
      is_verified_legal: false,
      status_label_ar: 'مرفوض من الإدارة',
      formal_report_name: displayName ? `${displayName} (مرفوض)` : 'مرفوض',
    };
  }

  // correction_requested
  const displayName = candidateLegal || historicalName;
  return {
    display_name: displayName,
    verified_legal_name: null, // STRICT: Never claim verified for correction_requested
    candidate_legal_name: candidateLegal,
    historical_name: historicalName,
    name_verification_status: 'correction_requested',
    is_verified_legal: false,
    status_label_ar: 'مطلوب تصحيح الاسم/الوثيقة',
    formal_report_name: displayName ? `${displayName} (مطلوب تصحيح)` : 'مطلوب تصحيح',
  };
}

/**
 * Convenient single-string display helper respecting verification status.
 */
export function getDisplayLegalName(record: LegalNameResolutionInput | null | undefined): string {
  return resolveLegalName(record).display_name;
}

/**
 * Enriches a student or applicant API row with standardized legal name reporting metadata.
 * Backward compatible: keeps existing student_name and legal_full_name fields while adding
 * verified_legal_name, name_verification_status, is_verified_legal, status_label_ar.
 */
export function enrichWithLegalNameMetadata<T extends LegalNameResolutionInput>(item: T): T & {
  display_name: string;
  verified_legal_name: string | null;
  is_verified_legal: boolean;
  name_verification_status: NameVerificationStatus;
  name_status_label_ar: string;
  name_verification_label: string;
  formal_report_name: string;
} {
  const resolved = resolveLegalName(item);
  return {
    ...item,
    // Preserve backwards compatibility
    student_name: item.student_name || resolved.display_name,
    display_name: resolved.display_name,
    verified_legal_name: resolved.verified_legal_name,
    is_verified_legal: resolved.is_verified_legal,
    name_verification_status: resolved.name_verification_status,
    name_status_label_ar: resolved.status_label_ar,
    name_verification_label: resolved.status_label_ar,
    formal_report_name: resolved.formal_report_name,
  };
}
