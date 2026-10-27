/**
 * MISHKAT — DUPLICATE DETECTION SERVICE (PHASE 2.4-E4)
 * Strict Human Review Governance — No Automatic Deletion, No Automatic Merge
 */

import { query, queryOne } from '../db/database';
import { normalizeArabicText } from '../utils/arabicName';

export type DuplicateClassification = 'no_duplicate_detected' | 'possible_duplicate' | 'probable_duplicate';

export interface CandidateRecord {
  id: string;
  type: 'applicant' | 'student';
  applicant_id?: string | null;
  student_id?: string | null;
  application_number?: string | null;
  student_number?: string | null;
  legal_full_name: string;
  normalized_legal_name?: string | null;
  name_verification_status?: string | null;
  document_status?: string | null;
  document_number?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  guardian_phone?: string | null;
  created_at?: string | null;
}

export interface ComparisonResult {
  hasMatch: boolean;
  classification: DuplicateClassification;
  matchReasons: string[];
  supportingSignals: {
    nameMatch: boolean;
    dobMatch: boolean;
    guardianPhoneMatch: boolean;
    studentPhoneMatch: boolean;
    documentNumberMatch: boolean;
    studentLinkMatch: boolean;
  };
}

export interface DuplicatePair {
  pair_key: string;
  classification: DuplicateClassification;
  match_reasons: string[];
  supporting_signals: ComparisonResult['supportingSignals'];
  candidate_a: CandidateRecord;
  candidate_b: CandidateRecord;
  latest_decision: {
    decision: 'NOT_DUPLICATE' | 'POSSIBLE_DUPLICATE' | 'CONFIRMED_DUPLICATE';
    reason: string;
    reviewer_id: string;
    reviewer_name: string;
    reviewed_at: string;
  } | null;
}

/**
 * Standardize phone number by removing country code, spaces, dashes
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  if (cleaned.startsWith('+966')) cleaned = '0' + cleaned.substring(4);
  if (cleaned.startsWith('00966')) cleaned = '0' + cleaned.substring(5);
  if (cleaned.startsWith('966')) cleaned = '0' + cleaned.substring(3);
  return cleaned;
}

/**
 * Pure comparison function between two candidate records.
 * Rules:
 * - Different names -> no_duplicate_detected
 * - Normalized name match only -> possible_duplicate
 * - Normalized name match + supporting identifier -> probable_duplicate
 * - Never declares same_person = true
 */
export function compareCandidates(
  candidateA: CandidateRecord,
  candidateB: CandidateRecord
): ComparisonResult {
  const defaultSignals = {
    nameMatch: false,
    dobMatch: false,
    guardianPhoneMatch: false,
    studentPhoneMatch: false,
    documentNumberMatch: false,
    studentLinkMatch: false,
  };

  if (!candidateA || !candidateB || candidateA.id === candidateB.id) {
    return {
      hasMatch: false,
      classification: 'no_duplicate_detected',
      matchReasons: [],
      supportingSignals: defaultSignals,
    };
  }

  // 1. Normalized Legal Name Matching (Arabic Unicode normalizer)
  const normA = candidateA.normalized_legal_name || normalizeArabicText(candidateA.legal_full_name || '');
  const normB = candidateB.normalized_legal_name || normalizeArabicText(candidateB.legal_full_name || '');
  const nameMatch = normA.length > 0 && normB.length > 0 && normA === normB;

  if (!nameMatch) {
    return {
      hasMatch: false,
      classification: 'no_duplicate_detected',
      matchReasons: [],
      supportingSignals: defaultSignals,
    };
  }

  // 2. Supporting Identifiers
  const dobA = candidateA.date_of_birth ? candidateA.date_of_birth.trim() : '';
  const dobB = candidateB.date_of_birth ? candidateB.date_of_birth.trim() : '';
  const dobMatch = Boolean(dobA && dobB && dobA === dobB);

  const phoneA = normalizePhoneNumber(candidateA.phone);
  const phoneB = normalizePhoneNumber(candidateB.phone);
  const studentPhoneMatch = Boolean(phoneA && phoneB && phoneA === phoneB && phoneA.length >= 8);

  const gPhoneA = normalizePhoneNumber(candidateA.guardian_phone);
  const gPhoneB = normalizePhoneNumber(candidateB.guardian_phone);
  const guardianPhoneMatch = Boolean(gPhoneA && gPhoneB && gPhoneA === gPhoneB && gPhoneA.length >= 8);

  const docA = candidateA.document_number ? candidateA.document_number.trim() : '';
  const docB = candidateB.document_number ? candidateB.document_number.trim() : '';
  const documentNumberMatch = Boolean(docA && docB && docA === docB && docA.length >= 5);

  const studentLinkMatch = Boolean(
    (candidateA.applicant_id && candidateB.applicant_id && candidateA.applicant_id === candidateB.applicant_id) ||
    (candidateA.student_id && candidateB.student_id && candidateA.student_id === candidateB.student_id)
  );

  const supportingSignals = {
    nameMatch,
    dobMatch,
    guardianPhoneMatch,
    studentPhoneMatch,
    documentNumberMatch,
    studentLinkMatch,
  };

  const hasSupporting = dobMatch || guardianPhoneMatch || studentPhoneMatch || documentNumberMatch || studentLinkMatch;

  const matchReasons: string[] = ['تطابق الاسم الرباعي بعد التطبيع اللغوي العربي'];

  if (dobMatch) matchReasons.push('تطابق تاريخ الميلاد');
  if (guardianPhoneMatch) matchReasons.push('تطابق رقم هاتف ولي الأمر');
  if (studentPhoneMatch) matchReasons.push('تطابق رقم هاتف الطالب');
  if (documentNumberMatch) matchReasons.push('تطابق رقم وثيقة إثبات الهوية الرسمية');
  if (studentLinkMatch) matchReasons.push('ارتباط مباشر بين سجل الطالب والطلب');

  if (hasSupporting) {
    return {
      hasMatch: true,
      classification: 'probable_duplicate',
      matchReasons,
      supportingSignals,
    };
  }

  // Name match only
  matchReasons.push('تشابه في الاسم دون وجود معرفات إضافية متطابقة (تطابق أولي يحتاج لمراجعة)');
  return {
    hasMatch: true,
    classification: 'possible_duplicate',
    matchReasons,
    supportingSignals,
  };
}

/**
 * Fetch all candidate records across applicants and students with documents
 */
export async function getAllCandidates(applicantIdFilter?: string): Promise<CandidateRecord[]> {
  // 1. Fetch applicants
  let appSql = `
    SELECT 
      a.id,
      'applicant' as type,
      a.id as applicant_id,
      s.id as student_id,
      a.application_number,
      s.student_number,
      COALESCE(a.legal_full_name, a.student_name) as legal_full_name,
      a.normalized_legal_name,
      a.name_verification_status,
      a.date_of_birth,
      a.phone,
      a.guardian_phone,
      a.created_at,
      doc.verification_status as doc_verification_status,
      doc.document_number as doc_number
    FROM applicants a
    LEFT JOIN students s ON s.applicant_id = a.id
    LEFT JOIN (
      SELECT applicant_id, verification_status, document_number,
             ROW_NUMBER() OVER (PARTITION BY applicant_id ORDER BY created_at DESC) as rn
      FROM applicant_documents
      WHERE verification_status != 'rejected'
    ) doc ON doc.applicant_id = a.id AND doc.rn = 1
  `;
  const appRows = await query(appSql);

  // 2. Fetch students not already linked to an applicant row
  const stuSql = `
    SELECT 
      s.id,
      'student' as type,
      s.applicant_id,
      s.id as student_id,
      a.application_number,
      s.student_number,
      COALESCE(s.legal_full_name, u.name) as legal_full_name,
      s.normalized_legal_name,
      s.name_verification_status,
      a.date_of_birth,
      u.phone as phone,
      NULL as guardian_phone,
      s.created_at,
      doc.verification_status as doc_verification_status,
      doc.document_number as doc_number
    FROM students s
    LEFT JOIN users u ON u.id = s.user_id
    LEFT JOIN applicants a ON a.id = s.applicant_id
    LEFT JOIN (
      SELECT student_id, verification_status, document_number,
             ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at DESC) as rn
      FROM applicant_documents
      WHERE verification_status != 'rejected'
    ) doc ON doc.student_id = s.id AND doc.rn = 1
    WHERE s.applicant_id IS NULL OR s.applicant_id NOT IN (SELECT id FROM applicants)
  `;
  const stuRows = await query(stuSql);

  const allRows = [...(appRows || []), ...(stuRows || [])];

  return allRows.map((r: any) => ({
    id: r.id,
    type: r.type,
    applicant_id: r.applicant_id,
    student_id: r.student_id,
    application_number: r.application_number,
    student_number: r.student_number,
    legal_full_name: r.legal_full_name,
    normalized_legal_name: r.normalized_legal_name || normalizeArabicText(r.legal_full_name || ''),
    name_verification_status: r.name_verification_status || 'legacy_unverified',
    document_status: r.doc_verification_status || 'none',
    document_number: r.doc_number || null,
    date_of_birth: r.date_of_birth || null,
    phone: r.phone || null,
    guardian_phone: r.guardian_phone || null,
    created_at: r.created_at || null,
  }));
}

/**
 * Fetch latest duplicate review decisions from audit_logs
 */
export async function getLatestReviewDecisions(): Promise<Map<string, any>> {
  const decisionMap = new Map<string, any>();
  const logs = await query(`
    SELECT 
      al.id, al.user_id, al.entity_id, al.metadata, al.created_at,
      u.name as reviewer_name
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    WHERE al.action = 'DUPLICATE_REVIEW_DECISION'
    ORDER BY al.created_at DESC
  `);

  if (!logs) return decisionMap;

  for (const log of logs) {
    const pairKey = log.entity_id;
    if (pairKey && !decisionMap.has(pairKey)) {
      let meta: any = {};
      try {
        meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
      } catch (e) {
        meta = {};
      }
      decisionMap.set(pairKey, {
        decision: meta.decision,
        reason: meta.reason || '',
        reviewer_id: log.user_id,
        reviewer_name: log.reviewer_name || 'مدير النظام',
        reviewed_at: log.created_at,
      });
    }
  }

  return decisionMap;
}

/**
 * Find all duplicate candidate pairs
 */
export async function findDuplicatePairs(options?: {
  applicantId?: string;
  classification?: 'possible_duplicate' | 'probable_duplicate';
  reviewedFilter?: 'all' | 'pending' | 'reviewed';
}): Promise<DuplicatePair[]> {
  const candidates = await getAllCandidates();
  const latestDecisions = await getLatestReviewDecisions();

  // Index candidates by normalized name to avoid O(N^2)
  const normMap = new Map<string, CandidateRecord[]>();
  for (const c of candidates) {
    const norm = c.normalized_legal_name || normalizeArabicText(c.legal_full_name || '');
    if (!norm) continue;
    if (!normMap.has(norm)) {
      normMap.set(norm, []);
    }
    normMap.get(norm)!.push(c);
  }

  const pairs: DuplicatePair[] = [];
  const visitedPairs = new Set<string>();

  for (const [_norm, group] of normMap.entries()) {
    if (group.length < 2) continue;

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const cA = group[i];
        const cB = group[j];

        const pairKey = [cA.id, cB.id].sort().join(':');
        if (visitedPairs.has(pairKey)) continue;
        visitedPairs.add(pairKey);

        const comparison = compareCandidates(cA, cB);
        if (!comparison.hasMatch) continue;

        const latestDecision = latestDecisions.get(pairKey) || null;

        // Apply filters if provided
        if (options?.applicantId) {
          if (cA.applicant_id !== options.applicantId && cB.applicant_id !== options.applicantId &&
              cA.id !== options.applicantId && cB.id !== options.applicantId) {
            continue;
          }
        }

        if (options?.classification && comparison.classification !== options.classification) {
          continue;
        }

        if (options?.reviewedFilter === 'pending' && latestDecision !== null) {
          continue;
        }
        if (options?.reviewedFilter === 'reviewed' && latestDecision === null) {
          continue;
        }

        pairs.push({
          pair_key: pairKey,
          classification: comparison.classification,
          match_reasons: comparison.matchReasons,
          supporting_signals: comparison.supportingSignals,
          candidate_a: cA,
          candidate_b: cB,
          latest_decision: latestDecision,
        });
      }
    }
  }

  // Sort pairs: probable duplicates first, then pending review first, then by date
  pairs.sort((a, b) => {
    if (a.classification !== b.classification) {
      return a.classification === 'probable_duplicate' ? -1 : 1;
    }
    if ((a.latest_decision === null) !== (b.latest_decision === null)) {
      return a.latest_decision === null ? -1 : 1;
    }
    return 0;
  });

  return pairs;
}
