import React, { useState, useEffect } from 'react';
import {
  fetchDuplicatePairs,
  submitDuplicateReview,
} from '../../services/api';
import {
  DuplicatePair,
  DuplicateReviewDecision,
  DuplicateClassification,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  GitCompare,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldAlert,
  Search,
  RefreshCw,
  FileCheck,
  User,
  Calendar,
  Phone,
  Filter,
  Check,
} from 'lucide-react';

export const DuplicateReviewPanel: React.FC = () => {
  const { addToast } = useApp();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [counts, setCounts] = useState<{ pending: number; reviewed: number; probable: number; possible: number }>({
    pending: 0,
    reviewed: 0,
    probable: 0,
    possible: 0,
  });

  // Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'probable_duplicate' | 'possible_duplicate'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Action Modal/State
  const [activeReviewPair, setActiveReviewPair] = useState<DuplicatePair | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DuplicateReviewDecision>('CONFIRMED_DUPLICATE');
  const [reviewReason, setReviewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDuplicates = async () => {
    setLoading(true);
    try {
      const res = await fetchDuplicatePairs({
        status: statusFilter === 'all' ? undefined : statusFilter,
        classification: classificationFilter === 'all' ? undefined : classificationFilter,
      });
      setPairs(res.pairs || []);
      setCounts(res.counts || { pending: 0, reviewed: 0, probable: 0, possible: 0 });
    } catch (err: any) {
      addToast(err.message || 'فشل جلب حالات التكرار المحتملة', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, [statusFilter, classificationFilter]);

  const handleOpenReview = (pair: DuplicatePair, defaultDec?: DuplicateReviewDecision) => {
    setActiveReviewPair(pair);
    setSelectedDecision(defaultDec || (pair.latest_decision ? pair.latest_decision.decision : 'CONFIRMED_DUPLICATE'));
    setReviewReason(pair.latest_decision ? pair.latest_decision.reason : '');
  };

  const handleCloseReview = () => {
    setActiveReviewPair(null);
    setReviewReason('');
    setSubmitting(false);
  };

  const handleSubmitDecision = async () => {
    if (!activeReviewPair) return;
    if (user?.role !== 'admin') {
      addToast('غير مصرح: اتخاذ قرارات مراجعة التكرار مقتصر على الإدارة العليا (Strict Admin)', 'error');
      return;
    }
    if (!reviewReason || reviewReason.trim().length === 0) {
      addToast('يرجى تدوين سبب ومبررات القرار الإداري في خانة الملاحظات (إلزامي)', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitDuplicateReview({
        candidate_a_id: activeReviewPair.candidate_a.id,
        candidate_b_id: activeReviewPair.candidate_b.id,
        candidate_a_type: activeReviewPair.candidate_a.type,
        candidate_b_type: activeReviewPair.candidate_b.type,
        decision: selectedDecision,
        reason: reviewReason.trim(),
        classification: activeReviewPair.classification,
      });

      addToast(res.message || 'تم حفظ قرار مراجعة التكرار بنجاح', 'success');
      handleCloseReview();
      loadDuplicates();
    } catch (err: any) {
      addToast(err.message || 'فشل تسجيل قرار المراجعة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side text search
  const filteredPairs = pairs.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.trim().toLowerCase();
    const nameA = (p.candidate_a.legal_full_name || '').toLowerCase();
    const nameB = (p.candidate_b.legal_full_name || '').toLowerCase();
    const numA = (p.candidate_a.application_number || p.candidate_a.student_number || '').toLowerCase();
    const numB = (p.candidate_b.application_number || p.candidate_b.student_number || '').toLowerCase();
    return nameA.includes(query) || nameB.includes(query) || numA.includes(query) || numB.includes(query);
  });

  const getDecisionBadge = (decision: DuplicateReviewDecision) => {
    switch (decision) {
      case 'CONFIRMED_DUPLICATE':
        return {
          label: 'تكرار مؤكد (نفس الشخص - قرار بشري)',
          bg: '#fee2e2',
          color: '#991b1b',
          border: '#fca5a5',
          icon: <CheckCircle2 size={14} />,
        };
      case 'POSSIBLE_DUPLICATE':
        return {
          label: 'تشابه محتمل (قيد المتابعة)',
          bg: '#fef3c7',
          color: '#92400e',
          border: '#fcd34d',
          icon: <AlertCircle size={14} />,
        };
      case 'NOT_DUPLICATE':
        return {
          label: 'سجلان مختلفان (ليس تكراراً)',
          bg: '#ecfdf5',
          color: '#065f46',
          border: '#a7f3d0',
          icon: <Check size={14} />,
        };
      default:
        return {
          label: 'غير محدد',
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          icon: <HelpCircle size={14} />,
        };
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Page Title & Safety Governance Notice */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 6 }}>
              مراجعة التكرارات والتشابهات المحتملة
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', margin: 0 }}>
              نظام رقابي لاكتشاف تشابه الأسماء والمعرفات الرسمية — يخضع لرقابة وإشراف الإدارة العليا حصراً.
            </p>
          </div>

          <button onClick={loadDuplicates} className="btn btn-outline btn-sm">
            <RefreshCw size={15} />
            <span>تحديث القائمة</span>
          </button>
        </div>

        {/* Safety Banner */}
        <div
          style={{
            marginTop: 16,
            padding: '14px 18px',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid #bfdbfe',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <ShieldAlert size={22} color="#1d4ed8" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.88rem', color: '#1e40af', lineHeight: 1.6 }}>
            <strong>مبدأ الحوكمة والسلامة البيانية:</strong> تشابه الأسماء ليس دليلاً كافياً على أن السجلين لنفس الشخص.
            لا يقوم النظام إطلاقاً بأي حذف أو دمج تلقائي للسجلات أو العلاقات أو المدفوعات.
            تصنيفات الخوارزمية استرشادية فقط (<span style={{ fontFamily: 'monospace' }}>تطابق محتمل</span>)،
            والقرار النهائي بشري توثيقي في سجل التدقيق المعتمد.
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>إجمالي الحالات المكتشفة</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: 4 }}>
            {counts.probable + counts.possible}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 2 }}>حالة تشابه بين السجلات</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid #fef3c7' }}>
          <div style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 600 }}>بانتظار المراجعة الإدارية</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: 4 }}>
            {counts.pending}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>تحتاج إلى قرار بشري</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid #dcfce7' }}>
          <div style={{ fontSize: '0.82rem', color: '#15803d', fontWeight: 600 }}>حالات تم البت فيها</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: 4 }}>
            {counts.reviewed}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>موثقة في سجل التدقيق</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
          <div style={{ fontSize: '0.82rem', color: '#c2410c', fontWeight: 600 }}>تطابق محتمل جداً (معرفات)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c2410c', marginTop: 4 }}>
            {counts.probable}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 2 }}>اسم + هاتف/ميلاد/وثيقة</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
          backgroundColor: '#ffffff',
          padding: 16,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-light)',
        }}
      >
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', alignSelf: 'center', marginLeft: 6 }}>
            الحالة:
          </span>
          {(['all', 'pending', 'reviewed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
                fontWeight: 600,
                backgroundColor: statusFilter === st ? 'var(--color-primary)' : '#f8fafc',
                color: statusFilter === st ? '#ffffff' : 'var(--color-text-muted)',
                border: `1px solid ${statusFilter === st ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
                cursor: 'pointer',
              }}
            >
              {st === 'all' ? 'جميع الحالات' : st === 'pending' ? 'بانتظار القرار' : 'تم البت فيها'}
            </button>
          ))}
        </div>

        {/* Classification Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', alignSelf: 'center', marginLeft: 6 }}>
            نوع التطابق:
          </span>
          {(['all', 'probable_duplicate', 'possible_duplicate'] as const).map((cl) => (
            <button
              key={cl}
              onClick={() => setClassificationFilter(cl)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
                fontWeight: 600,
                backgroundColor: classificationFilter === cl ? 'var(--color-gold-dark)' : '#f8fafc',
                color: classificationFilter === cl ? '#ffffff' : 'var(--color-text-muted)',
                border: `1px solid ${classificationFilter === cl ? 'var(--color-gold-dark)' : 'var(--color-border-medium)'}`,
                cursor: 'pointer',
              }}
            >
              {cl === 'all' ? 'الكل' : cl === 'probable_duplicate' ? 'محتمل جداً (معرفات)' : 'تشابه اسم فقط'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            className="form-control"
            placeholder="بحث بالاسم أو الرقم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingRight: 36, fontSize: '0.88rem' }}
          />
          <Search size={16} color="var(--color-text-light)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      {/* Main Pairs List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
          جاري فحص وتحليل سجلات الطلاب والمتقدمين لاكتشاف حالات التطابق...
        </div>
      ) : filteredPairs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <CheckCircle2 size={44} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)', marginBottom: 6 }}>
            لا توجد حالات تكرار مطابقة للتصفية الحالية
          </h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', maxWidth: 450, margin: '0 auto' }}>
            لم يتم العثور على أي تشابهات في الأسماء أو المعرفات الرسمية بناءً على محددات البحث المختارة.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredPairs.map((pair, idx) => {
            const isProbable = pair.classification === 'probable_duplicate';
            const decisionMeta = pair.latest_decision ? getDecisionBadge(pair.latest_decision.decision) : null;

            return (
              <div
                key={pair.pair_key}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: isProbable ? '1.5px solid #fed7aa' : '1px solid var(--color-border-light)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                {/* Pair Header Banner */}
                <div
                  style={{
                    padding: '12px 20px',
                    backgroundColor: isProbable ? '#fff7ed' : '#f8fafc',
                    borderBottom: '1px solid var(--color-border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        backgroundColor: isProbable ? '#ffedd5' : '#e2e8f0',
                        color: isProbable ? '#c2410c' : '#475569',
                        border: `1px solid ${isProbable ? '#fdba74' : '#cbd5e1'}`,
                      }}
                    >
                      {isProbable ? '⚠️ تطابق محتمل جداً (معرفات متعددة)' : '🔍 تشابه اسم محتمل (يحتاج مراجعة)'}
                    </span>

                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      حالة رقم #{idx + 1}
                    </span>
                  </div>

                  {/* Decision Status Badge or Action Button */}
                  <div>
                    {decisionMeta ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            backgroundColor: decisionMeta.bg,
                            color: decisionMeta.color,
                            border: `1px solid ${decisionMeta.border}`,
                          }}
                        >
                          {decisionMeta.icon}
                          {decisionMeta.label}
                        </span>

                        <button
                          onClick={() => handleOpenReview(pair)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                        >
                          تعديل القرار
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenReview(pair)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '5px 14px', fontSize: '0.84rem' }}
                      >
                        <GitCompare size={14} />
                        <span>اتخاذ قرار المراجعة</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Match Reasons List */}
                <div style={{ padding: '12px 20px', backgroundColor: '#fafaf9', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    إشارات وتفاصيل التطابق المكتشفة:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {pair.match_reasons.map((reason, rIdx) => (
                      <span
                        key={rIdx}
                        style={{
                          fontSize: '0.78rem',
                          padding: '2px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--color-border-medium)',
                          color: 'var(--color-primary-dark)',
                        }}
                      >
                        • {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Side-by-side Candidate Comparison */}
                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: 20,
                    }}
                  >
                    {/* Candidate A Card */}
                    <CandidateBox candidate={pair.candidate_a} title="السجل الأول (أ)" />

                    {/* Candidate B Card */}
                    <CandidateBox candidate={pair.candidate_b} title="السجل الثاني (ب)" />
                  </div>

                  {/* Previous Decision Details Box if reviewed */}
                  {pair.latest_decision && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 14,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--color-border-light)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ color: 'var(--color-primary-dark)' }}>
                          قرار التدقيق البشري المعتمد:
                        </strong>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
                          بواسطة: {pair.latest_decision.reviewer_name} | {new Date(pair.latest_decision.reviewed_at).toLocaleString('ar-SA')}
                        </span>
                      </div>
                      <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        «{pair.latest_decision.reason}»
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Decision Modal */}
      {activeReviewPair && (
        <div className="modal-backdrop">
          <div
            className="modal-content"
            style={{
              maxWidth: 620,
              padding: 26,
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GitCompare size={22} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-primary-dark)' }}>
                  تسجيل قرار مراجعة التكرار (Human Review)
                </h3>
              </div>
              <button
                onClick={handleCloseReview}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Candidate Summary */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--color-border-light)',
                marginBottom: 18,
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span><strong>السجل (أ):</strong> {activeReviewPair.candidate_a.legal_full_name}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                  {activeReviewPair.candidate_a.application_number || activeReviewPair.candidate_a.student_number}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>السجل (ب):</strong> {activeReviewPair.candidate_b.legal_full_name}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                  {activeReviewPair.candidate_b.application_number || activeReviewPair.candidate_b.student_number}
                </span>
              </div>
            </div>

            {/* Decision Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: 8 }}>
                اختر القرار الإداري المعتمد:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    value: 'CONFIRMED_DUPLICATE' as DuplicateReviewDecision,
                    title: 'تكرار مؤكد (نفس الشخص - CONFIRMED_DUPLICATE)',
                    desc: 'تم التأكد بشرياً من أن السجلين لنفس الشخص. يتم حفظ القرار دون أي حذف أو دمج تلقائي.',
                    color: '#dc2626',
                  },
                  {
                    value: 'POSSIBLE_DUPLICATE' as DuplicateReviewDecision,
                    title: 'تشابه محتمل قيد المتابعة (POSSIBLE_DUPLICATE)',
                    desc: 'يوجد تشابه قوي في البيانات يلزم متابعته مع المتقدم أو ولي الأمر لاستيضاح الهوية.',
                    color: '#d97706',
                  },
                  {
                    value: 'NOT_DUPLICATE' as DuplicateReviewDecision,
                    title: 'سجلان مختلفان (ليسا نفس الشخص - NOT_DUPLICATE)',
                    desc: 'تم التثبت من اختلاف الهوية (تشابه أسماء فقط) ولكل طالب شخصية ووثيقة مستقلة.',
                    color: '#16a34a',
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${selectedDecision === opt.value ? opt.color : 'var(--color-border-medium)'}`,
                      backgroundColor: selectedDecision === opt.value ? '#ffffff' : '#f8fafc',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="review_decision"
                      value={opt.value}
                      checked={selectedDecision === opt.value}
                      onChange={() => setSelectedDecision(opt.value)}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: opt.color }}>
                        {opt.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Mandatory Reason Field */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
                أسباب ومبررات القرار الإداري <span style={{ color: '#dc2626' }}>* (إلزامي للرقابة)</span>:
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="اكتب توضيحاً دقيقاً لسبب اتخاذ هذا القرار للتوثيق في سجل التدقيق المعتمد..."
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                style={{ fontSize: '0.88rem' }}
              />
            </div>

            {/* Invariant Reminder */}
            <div
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 20,
              }}
            >
              🔒 <strong>تأكيد الأمان:</strong> هذا الإجراء غير تخريبي (Non-destructive). لن يؤدي إلى حذف أي حساب أو دمج سجلات أو تحويل أي علاقات أسرية.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={handleCloseReview}
                className="btn btn-outline btn-sm"
                disabled={submitting}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitDecision}
                className="btn btn-primary btn-sm"
                disabled={submitting || !reviewReason.trim()}
              >
                {submitting ? 'جاري الحفظ...' : 'اعتماد وحفظ القرار في سجل التدقيق'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface CandidateBoxProps {
  candidate: any;
  title: string;
}

const CandidateBox: React.FC<CandidateBoxProps> = ({ candidate, title }) => {
  const isStudent = candidate.type === 'student';

  const getVerificationBadge = (st?: string | null) => {
    switch (st) {
      case 'verified':
        return { label: 'معتمد رسمياً', color: '#16a34a', bg: '#dcfce7' };
      case 'pending':
        return { label: 'قيد التدقيق', color: '#d97706', bg: '#fef3c7' };
      case 'rejected':
        return { label: 'مرفوض', color: '#dc2626', bg: '#fee2e2' };
      default:
        return { label: 'غير موثق (تاريخي)', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const vBadge = getVerificationBadge(candidate.name_verification_status);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#fafaf9',
        border: '1px solid var(--color-border-light)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
          {title}
        </span>
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isStudent ? '#ede9fe' : '#e0f2fe',
            color: isStudent ? '#6d28d9' : '#0369a1',
          }}
        >
          {isStudent ? 'طالب مقيد' : 'طلب تقديم'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>الاسم الكامل: </span>
          <strong style={{ color: 'var(--color-primary-dark)' }}>{candidate.legal_full_name}</strong>
        </div>

        <div>
          <span style={{ color: 'var(--color-text-muted)' }}>الاسم المطبع: </span>
          <span style={{ fontFamily: 'monospace', color: '#475569' }}>
            {candidate.normalized_legal_name || '—'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>الرقم التعريفي: </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {candidate.application_number || candidate.student_number || candidate.id.substring(0, 8)}
            </span>
          </div>
          <div>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: vBadge.bg,
                color: vBadge.color,
                fontWeight: 700,
              }}
            >
              {vBadge.label}
            </span>
          </div>
        </div>

        {candidate.date_of_birth && (
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>تاريخ الميلاد: </span>
            <span dir="ltr" style={{ fontFamily: 'monospace' }}>{candidate.date_of_birth}</span>
          </div>
        )}

        {candidate.phone && (
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>هاتف الطالب: </span>
            <span dir="ltr" style={{ fontFamily: 'monospace' }}>{candidate.phone}</span>
          </div>
        )}

        {candidate.guardian_phone && (
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>هاتف ولي الأمر: </span>
            <span dir="ltr" style={{ fontFamily: 'monospace' }}>{candidate.guardian_phone}</span>
          </div>
        )}

        {candidate.document_number && (
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>رقم وثيقة الإثبات: </span>
            <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{candidate.document_number}</span>
          </div>
        )}
      </div>
    </div>
  );
};
