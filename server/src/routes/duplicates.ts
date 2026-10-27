/**
 * MISHKAT — DUPLICATE REVIEW ROUTES (PHASE 2.4-E4)
 * Strict Admin Controlled Review — Zero Automatic Merge, Zero Automatic Deletion
 */

import { Router, Response } from 'express';
import { requireStrictAdmin, AuthRequest } from '../middleware/auth';
import { findDuplicatePairs, compareCandidates, getAllCandidates } from '../services/duplicateDetection';
import { recordAudit } from '../utils/auditLogger';
import { queryOne, query } from '../db/database';

const router = Router();

// Apply requireStrictAdmin to all duplicate review routes
router.use(requireStrictAdmin);

/**
 * GET /api/admin/duplicates
 * List all duplicate candidate pairs with detection signals and latest review decisions.
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applicantId = req.query.applicant_id as string | undefined;
    const classification = req.query.classification as ('possible_duplicate' | 'probable_duplicate') | undefined;
    const status = req.query.status as ('all' | 'pending' | 'reviewed') | undefined;

    const pairs = await findDuplicatePairs({
      applicantId,
      classification,
      reviewedFilter: status,
    });

    const pendingCount = pairs.filter((p) => !p.latest_decision).length;
    const reviewedCount = pairs.filter((p) => !!p.latest_decision).length;
    const probableCount = pairs.filter((p) => p.classification === 'probable_duplicate').length;
    const possibleCount = pairs.filter((p) => p.classification === 'possible_duplicate').length;

    res.json({
      success: true,
      total_pairs: pairs.length,
      counts: {
        pending: pendingCount,
        reviewed: reviewedCount,
        probable: probableCount,
        possible: possibleCount,
      },
      pairs,
    });
  } catch (error) {
    console.error('Error fetching duplicate candidate pairs:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء استرجاع حالات التكرار المحتملة' });
  }
});

/**
 * GET /api/admin/duplicates/candidates/:id
 * Get duplicate candidates specifically related to a given applicant or student.
 */
router.get('/candidates/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const pairs = await findDuplicatePairs({ applicantId: id });
    res.json({
      success: true,
      total_pairs: pairs.length,
      pairs,
    });
  } catch (error) {
    console.error('Error fetching duplicates for candidate:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء استرجاع حالات التكرار للمرشح المحدد' });
  }
});

/**
 * POST /api/admin/duplicates/review
 * Record a human review decision for a duplicate pair.
 * Strictly non-destructive: NO deletes, NO merges, NO relinking.
 */
router.post('/review', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      candidate_a_id,
      candidate_b_id,
      candidate_a_type,
      candidate_b_type,
      decision,
      reason,
      classification,
      notes,
    } = req.body;

    // 1. Validate Candidate IDs
    if (!candidate_a_id || !candidate_b_id || typeof candidate_a_id !== 'string' || typeof candidate_b_id !== 'string') {
      res.status(400).json({ error: 'يجب تحديد معرف المرشح الأول ومعرف المرشح الثاني بدقة' });
      return;
    }

    if (candidate_a_id === candidate_b_id) {
      res.status(400).json({ error: 'لا يمكن مقارنة السجل بنفسه' });
      return;
    }

    // 2. Validate Review Decision Enum
    const validDecisions = ['NOT_DUPLICATE', 'POSSIBLE_DUPLICATE', 'CONFIRMED_DUPLICATE'];
    if (!decision || !validDecisions.includes(decision)) {
      res.status(400).json({
        error: 'قرار المراجعة غير صالح. الخيارات المتاحة: NOT_DUPLICATE (ليسا نفس الشخص)، POSSIBLE_DUPLICATE (تشابه محتمل قيد المتابعة)، CONFIRMED_DUPLICATE (تكرار مؤكد)',
      });
      return;
    }

    // 3. Validate Mandatory Reason
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({
        error: 'يرجى تدوين سبب ومبررات القرار الإداري في خانة الملاحظات (إلزامي)',
      });
      return;
    }

    // 4. Verify candidates exist in database (safe read-only check)
    const checkCandidate = async (id: string, type?: string) => {
      if (type === 'student') {
        return await queryOne('SELECT id, legal_full_name FROM students WHERE id = ?', [id]);
      } else {
        const app = await queryOne('SELECT id, legal_full_name, student_name FROM applicants WHERE id = ?', [id]);
        if (app) return app;
        return await queryOne('SELECT id, legal_full_name FROM students WHERE id = ?', [id]);
      }
    };

    const cA = await checkCandidate(candidate_a_id, candidate_a_type);
    const cB = await checkCandidate(candidate_b_id, candidate_b_type);

    if (!cA || !cB) {
      res.status(404).json({ error: 'تعذر العثور على أحد السجلات المحددة للمراجعة' });
      return;
    }

    // 5. Canonical pair key to prevent duplicate reversed entries
    const pairKey = [candidate_a_id, candidate_b_id].sort().join(':');

    // 6. Security Invariant: Absolutely ZERO destructive operations.
    // We strictly record the human decision in audit_logs, preserving all candidate IDs, records, and relationships.
    const auditPayload = {
      pair_key: pairKey,
      candidate_a_id,
      candidate_b_id,
      candidate_a_name: cA.legal_full_name || cA.student_name,
      candidate_b_name: cB.legal_full_name || cB.student_name,
      candidate_a_type: candidate_a_type || 'applicant',
      candidate_b_type: candidate_b_type || 'applicant',
      classification: classification || 'possible_duplicate',
      decision,
      reason: reason.trim(),
      notes: notes && typeof notes === 'string' ? notes.trim() : null,
      reviewed_by_id: req.user?.id,
      reviewed_by_name: req.user?.name,
      reviewed_by_email: req.user?.email,
      reviewed_at: new Date().toISOString(),
    };

    await recordAudit(
      req.user?.id,
      'DUPLICATE_REVIEW_DECISION',
      'duplicate_pair',
      pairKey,
      auditPayload,
      req.ip
    );

    res.json({
      success: true,
      message: 'تم تسجيل قرار مراجعة التكرار وحفظه في سجل التدقيق بنجاح',
      pair_key: pairKey,
      decision,
      reason: reason.trim(),
      reviewed_by: req.user?.name || req.user?.id,
      reviewed_at: auditPayload.reviewed_at,
    });
  } catch (error) {
    console.error('Error recording duplicate review decision:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ قرار المراجعة' });
  }
});

export default router;
