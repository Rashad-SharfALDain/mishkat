import React, { useState, useEffect } from 'react';
import { Applicant, ApplicantStatus, ApplicantDocument, DuplicatePair } from '../../types';
import {
  updateApplicantStatus,
  createStudentFromApplicant,
  fetchApplicantDetail,
  verifyApplicantLegalName,
  fetchAdminApplicantDocuments,
  downloadAdminDocument,
  fetchApplicantDuplicates,
} from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Check,
  Save,
  User,
  Phone,
  MapPin,
  School,
  Calendar,
  BookOpen,
  Printer,
  GraduationCap,
  Sparkles,
  KeyRound,
  Copy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileCheck,
  Download,
  Lock,
  FileText,
  GitCompare,
} from 'lucide-react';

interface ApplicantDetailModalProps {
  applicant: Applicant | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({
  applicant,
  onClose,
  onUpdated,
}) => {
  const { addToast } = useApp();
  const { user } = useAuth();
  if (!applicant) return null;

  const [status, setStatus] = useState<ApplicantStatus>(applicant.status);
  const [internalNotes, setInternalNotes] = useState<string>(applicant.internal_notes || '');
  const [saving, setSaving] = useState(false);

  // Legal Name Verification State
  const [currentVerificationStatus, setCurrentVerificationStatus] = useState<string>(
    applicant.name_verification_status || 'pending'
  );
  const [verifyingName, setVerifyingName] = useState(false);
  const [verificationDecision, setVerificationDecision] = useState<'verify' | 'reject' | 'correction_requested'>('verify');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verifiedFromType, setVerifiedFromType] = useState('national_id');

  // Student Account Creation State
  const [existingStudent, setExistingStudent] = useState<any | null>(null);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [createdStudentResult, setCreatedStudentResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExecuteVerificationDecision = async (decisionOverride?: 'verify' | 'reject' | 'correction_requested') => {
    if (user?.role !== 'admin') {
      addToast('غير مصرح: اتخاذ قرار التحقق مقتصر على الإدارة العليا (Strict Admin)', 'error');
      return;
    }

    const targetDecision = decisionOverride || verificationDecision;

    if ((targetDecision === 'reject' || targetDecision === 'correction_requested') && (!verificationNotes || verificationNotes.trim().length === 0)) {
      addToast(targetDecision === 'reject' ? 'يرجى تدوين سبب الرفض في خانة الملاحظات' : 'يرجى كتابة المطلوب تصحيحه في خانة الملاحظات', 'error');
      return;
    }

    setVerifyingName(true);
    try {
      const res = await verifyApplicantLegalName(
        applicant.id,
        targetDecision,
        verificationNotes,
        verifiedFromType
      );
      setCurrentVerificationStatus(res.name_verification_status as any);
      addToast(res.message, 'success');
      // Refresh documents
      const updatedDocs = await fetchAdminApplicantDocuments(applicant.id);
      setDocuments(updatedDocs);
      onUpdated();
    } catch (err: any) {
      addToast(err.message || 'تعذر تنفيذ قرار التحقق', 'error');
    } finally {
      setVerifyingName(false);
    }
  };

  // Applicant Documents State
  const [documents, setDocuments] = useState<ApplicantDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  // Duplicate Detection State (Strict Admin only)
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicatePair[]>([]);

  useEffect(() => {
    fetchApplicantDetail(applicant.id).then((data) => {
      if (data.existing_student) {
        setExistingStudent(data.existing_student);
      }
    });

    setLoadingDocs(true);
    fetchAdminApplicantDocuments(applicant.id)
      .then((docs) => setDocuments(docs))
      .catch((err) => console.error('Failed to load documents:', err))
      .finally(() => setLoadingDocs(false));

    if (user?.role === 'admin') {
      fetchApplicantDuplicates(applicant.id)
        .then((res) => {
          if (res && res.pairs) setDuplicatePairs(res.pairs);
        })
        .catch((err) => console.error('Failed to load applicant duplicates:', err));
    }
  }, [applicant.id]);

  const handleDownloadDoc = async (doc: ApplicantDocument) => {
    if (user?.role !== 'admin') {
      addToast('تنزيل الوثائق الأصلية مقتصر على الإدارة العليا (Strict Admin)', 'error');
      return;
    }
    setDownloadingDocId(doc.id);
    try {
      await downloadAdminDocument(doc.id, doc.original_filename);
      addToast('تم بدء تنزيل الوثيقة بنجاح', 'success');
    } catch (err: any) {
      addToast(err.message || 'تعذر تنزيل الوثيقة', 'error');
    } finally {
      setDownloadingDocId(null);
    }
  };

  const statuses: ApplicantStatus[] = ['جديد', 'قيد المراجعة', 'مقبول', 'مرفوض', 'مكتمل'];

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateApplicantStatus(applicant.id, status, internalNotes);
      addToast('تم حفظ التعديلات والملاحظات بنجاح', 'success');
      onUpdated();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'فشل تحديث بيانات الطلب', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStudent = async () => {
    setCreatingStudent(true);
    try {
      const res = await createStudentFromApplicant(applicant.id);
      setCreatedStudentResult(res);
      setExistingStudent(res.student);
      setStatus('مكتمل');
      addToast('تم إنشاء حساب الطالب وإصدار الرقم الأكاديمي بنجاح!', 'success');
      onUpdated();
    } catch (err: any) {
      addToast(err.message || 'تعذر إنشاء حساب الطالب', 'error');
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStudentResult) return;
    const text = `بيانات الدخول لبوابة الطالب:\nالرقم الأكاديمي: ${createdStudentResult.credentials.identifier}\nالبريد الإلكتروني: ${createdStudentResult.credentials.email}\nكلمة المرور المؤقتة: ${createdStudentResult.credentials.temporary_password}\nرابط الدخول: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusBadge = (st: ApplicantStatus) => {
    switch (st) {
      case 'جديد': return 'badge-new';
      case 'قيد المراجعة': return 'badge-review';
      case 'مقبول': return 'badge-accepted';
      case 'مرفوض': return 'badge-rejected';
      case 'مكتمل': return 'badge-completed';
      default: return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`badge ${getStatusBadge(status)}`} style={{ fontSize: '0.88rem' }}>
              {status}
            </span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {applicant.student_name}
              </h3>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-text-light)', fontFamily: 'monospace' }} dir="ltr">
                {applicant.application_number}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => window.print()}
              className="btn btn-outline btn-sm"
              title="طباعة الملف"
              style={{ padding: '6px 12px' }}
            >
              <Printer size={16} />
              <span>طباعة</span>
            </button>
            <button onClick={onClose} style={{ color: 'var(--color-text-light)', padding: 4 }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Status and Action bar */}
          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--color-primary-dark)' }}>
                تعديل حالة الطلب:
              </label>
              <select
                className="form-control"
                style={{ width: 'auto', padding: '6px 14px', fontWeight: 700 }}
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicantStatus)}
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-light)' }}>
              تاريخ التقديم: {new Date(applicant.created_at).toLocaleDateString('ar-SA')}
            </div>
          </div>

          {/* Student Account Creation Workflow Callout */}
          {existingStudent ? (
            <div
              style={{
                backgroundColor: 'var(--status-accepted-bg)',
                border: '1px solid #86efac',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={22} color="var(--status-accepted)" />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--status-accepted)', fontSize: '0.95rem' }}>
                    تم إنشاء واعتماد حساب الطالب في المنظومة التعليمية
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    الرقم الأكاديمي: <strong dir="ltr">{existingStudent.student_number}</strong> • الحالة: {existingStudent.academic_status}
                  </div>
                </div>
              </div>
            </div>
          ) : (status === 'مقبول' || applicant.status === 'مقبول') ? (
            <div
              style={{
                backgroundColor: 'var(--color-gold-subtle)',
                border: '1px solid var(--color-gold-border)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div style={{ maxWidth: 440 }}>
                <div style={{ fontWeight: 800, color: 'var(--color-gold-dark)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1rem' }}>
                  <Sparkles size={18} />
                  <span>المتقدم مؤهل لإنشاء حساب طالب</span>
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  حالة الطلب "مقبول". يمكنك الآن إنشاء حساب الطالب وتوليد الرقم الأكاديمي وكلمة المرور المؤقتة.
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateStudent}
                disabled={creatingStudent}
                className="btn btn-gold btn-sm"
                style={{ fontWeight: 800, padding: '10px 18px', gap: 8 }}
              >
                <GraduationCap size={18} />
                <span>{creatingStudent ? 'جاري الإنشاء...' : 'إنشاء حساب طالب'}</span>
              </button>
            </div>
          ) : null}

          {/* Credentials Display Modal / Alert if just created */}
          {createdStudentResult && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid var(--color-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                marginBottom: 20,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary-dark)', fontWeight: 800, marginBottom: 10 }}>
                <CheckCircle2 size={18} color="var(--status-accepted)" />
                <span>بيانات دخول الطالب الجديدة (تسليم آمن):</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, backgroundColor: 'var(--color-bg-subtle)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>الرقم الأكاديمي:</span>
                  <div style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }} dir="ltr">
                    {createdStudentResult.credentials.identifier}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>البريد الإلكتروني:</span>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    {createdStudentResult.credentials.email}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>كلمة المرور المؤقتة:</span>
                  <div style={{ fontWeight: 800, color: 'var(--color-gold-dark)', fontSize: '0.95rem' }}>
                    {createdStudentResult.credentials.temporary_password}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  يُلزم الطالب بتغيير كلمة المرور فور أول تسجيل دخول.
                </span>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="btn btn-outline-gold btn-sm"
                  style={{ gap: 6, fontWeight: 700 }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ البيانات'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Duplicate Detection Alert Card (Strict Admin Only) */}
          {user?.role === 'admin' && duplicatePairs.length > 0 && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GitCompare size={20} color="#b45309" />
                  <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#92400e', margin: 0 }}>
                    تنبيه تدقيق: تم اكتشاف {duplicatePairs.length} حالة تشابه/تكرار محتمل لهذا المتقدم
                  </h4>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fcd34d',
                  }}
                >
                  مراجعة بشرية مطلوبة
                </span>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#78350f', margin: '0 0 10px 0' }}>
                تشابه الأسماء أو أرقام الهواتف لا يعني حتمية تطابق الهوية. يُرجى مراجعة الحالات في قسم «مراجعة التكرارات» للبت الإداري دون أي حذف أو دمج تلقائي.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {duplicatePairs.slice(0, 3).map((p) => {
                  const other = p.candidate_a.id === applicant.id ? p.candidate_b : p.candidate_a;
                  return (
                    <div
                      key={p.pair_key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #fef3c7',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <strong>السجل المشابه:</strong> {other.legal_full_name} ({other.application_number || other.student_number || 'طلب'})
                        <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: 2 }}>
                          إشارات التطابق: {p.match_reasons.join(' | ')}
                        </div>
                      </div>
                      <div>
                        {p.latest_decision ? (
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803d' }}>
                            تم البت: {p.latest_decision.decision}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#d97706' }}>
                            بانتظار القرار
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legal Four-Part Name Governance Section */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color="var(--color-primary)" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                  حوكمة الاسم القانوني الرباعي
                </h4>
              </div>

              {/* Verification Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {currentVerificationStatus === 'verified' ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      color: '#15803d',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>معتمد وموثق رسمياً</span>
                  </span>
                ) : currentVerificationStatus === 'rejected' ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#b91c1c',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>مرفوض من الإدارة</span>
                  </span>
                ) : currentVerificationStatus === 'correction_requested' ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(249, 115, 22, 0.15)',
                      color: '#c2410c',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>مطلوب تصحيح البيانات / الوثيقة</span>
                  </span>
                ) : currentVerificationStatus === 'legacy_unverified' ? (
                  <span
                    style={{
                      backgroundColor: 'rgba(100, 116, 139, 0.12)',
                      color: '#475569',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    سجل تاريخي — بانتظار استكمال التوثيق
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: 'rgba(234, 179, 8, 0.15)',
                      color: '#a16207',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    قيد التدقيق والمطابقة (Pending)
                  </span>
                )}
              </div>
            </div>

            {/* Four-part name breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'block' }}>الاسم الأول</span>
                <strong style={{ fontSize: '0.94rem', color: 'var(--color-text-main)' }}>
                  {applicant.legal_first_name || '—'}
                </strong>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'block' }}>اسم الأب</span>
                <strong style={{ fontSize: '0.94rem', color: 'var(--color-text-main)' }}>
                  {applicant.legal_second_name || '—'}
                </strong>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'block' }}>اسم الجد</span>
                <strong style={{ fontSize: '0.94rem', color: 'var(--color-text-main)' }}>
                  {applicant.legal_third_name || '—'}
                </strong>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', display: 'block' }}>اسم العائلة</span>
                <strong style={{ fontSize: '0.94rem', color: 'var(--color-text-main)' }}>
                  {applicant.legal_fourth_name || '—'}
                </strong>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong>الاسم القانوني:</strong>{' '}
                {applicant.is_verified_legal
                  ? `${applicant.verified_legal_name || applicant.legal_full_name} (موثق رسمياً)`
                  : applicant.legal_full_name
                  ? `${applicant.legal_full_name} (${applicant.name_verification_label || 'قيد المراجعة والتوثيق'})`
                  : `${applicant.student_name} (اسم تاريخي غير موثق)`}
              </div>

              {/* Strict Admin Verification Action */}
              {user?.role === 'admin' && currentVerificationStatus !== 'verified' && applicant.legal_first_name && (
                <button
                  type="button"
                  onClick={() => handleExecuteVerificationDecision('verify')}
                  disabled={verifyingName}
                  className="btn btn-outline btn-sm"
                  style={{ gap: 6, fontWeight: 700, borderColor: '#16a34a', color: '#16a34a' }}
                >
                  <FileCheck size={16} />
                  <span>{verifyingName ? 'جاري الاعتماد...' : 'اعتماد سريع (Strict Admin)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Secure Identity Documents Section */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="var(--color-primary)" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                  وثائق الهوية الرسمية المرفوعة
                </h4>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-light)' }}>
                {documents.length} / 3 وثائق
              </span>
            </div>

            {loadingDocs ? (
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-light)', padding: 12 }}>جاري تحميل الوثائق...</div>
            ) : documents.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px dashed var(--color-border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} color="var(--color-gold-dark)" />
                <span>لم يتم رفع أي وثيقة إثبات هوية حتى الآن لهذا المتقدم.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {documents.map((doc) => {
                  const typeLabel =
                    doc.document_type === 'national_id' ? 'بطاقة الهوية الوطنية' :
                    doc.document_type === 'family_card' ? 'سجل الأسرة' :
                    doc.document_type === 'passport' ? 'جواز السفر' :
                    doc.document_type === 'ninth_grade_cert' ? 'شهادة الصف التاسع' : doc.document_type;

                  return (
                    <div
                      key={doc.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={24} color="var(--color-primary)" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-main)' }}>
                            {typeLabel} — <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>{doc.original_filename}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-light)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span>الحجم: {(doc.file_size / 1024).toFixed(1)} KB</span>
                            <span>التاريخ: {new Date(doc.created_at).toLocaleDateString('ar-SA')}</span>
                            {doc.file_hash && (
                              <span title={`SHA-256 Hash: ${doc.file_hash}`} style={{ fontFamily: 'monospace' }}>
                                Hash: {doc.file_hash.substring(0, 12)}...
                              </span>
                            )}
                            {doc.is_encrypted ? (
                              <span style={{ color: '#15803d', fontWeight: 600 }}>🔒 مشفر بـ AES-256-GCM</span>
                            ) : (
                              <span style={{ color: '#854d0e' }}>ملف غير مشفر</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor:
                              doc.verification_status === 'verified' ? 'rgba(34, 197, 94, 0.15)' :
                              doc.verification_status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color:
                              doc.verification_status === 'verified' ? '#15803d' :
                              doc.verification_status === 'rejected' ? '#b91c1c' : '#a16207',
                          }}
                        >
                          {doc.verification_status === 'verified' ? 'معتمد' :
                           doc.verification_status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>

                        {user?.role === 'admin' ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            disabled={downloadingDocId === doc.id}
                            className="btn btn-outline btn-sm"
                            style={{ gap: 6, fontSize: '0.8rem', padding: '5px 10px' }}
                          >
                            <Download size={14} />
                            <span>{downloadingDocId === doc.id ? 'جاري التحميل...' : 'تنزيل (Admin)'}</span>
                          </button>
                        ) : (
                          <span
                            title="تنزيل الوثيقة الأصلية مقتصر على الإدارة العليا"
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--color-text-light)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              cursor: 'not-allowed',
                            }}
                          >
                            <Lock size={12} />
                            <span>محمي</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Phase 2.4-E3: Human Verification Decision Section (Strict Admin Only) */}
          {user?.role === 'admin' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--color-primary-light, #bae6fd)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                marginBottom: 24,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={20} color="var(--color-primary)" />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                    قرار التحقق البشري من الاسم والوثيقة (Strict Admin)
                  </h4>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', padding: '3px 8px', borderRadius: 4 }}>
                  تدقيق يدوي إلزامي
                </span>
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                يقوم المسؤول بمراجعة الاسم الرباعي المدخل ومقارنته بالوثائق الرسمية المرفوعة أعلاه بصرياً ويدوياً، ثم اتخاذ القرار الإداري المعتمد.
              </p>

              {/* Decision Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setVerificationDecision('verify')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: verificationDecision === 'verify' ? '2px solid #16a34a' : '1px solid var(--color-border-medium)',
                    backgroundColor: verificationDecision === 'verify' ? 'rgba(34, 197, 94, 0.1)' : '#ffffff',
                    color: verificationDecision === 'verify' ? '#15803d' : 'var(--color-text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>اعتماد وتوثيق (Verify)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationDecision('correction_requested')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: verificationDecision === 'correction_requested' ? '2px solid #ea580c' : '1px solid var(--color-border-medium)',
                    backgroundColor: verificationDecision === 'correction_requested' ? 'rgba(249, 115, 22, 0.1)' : '#ffffff',
                    color: verificationDecision === 'correction_requested' ? '#c2410c' : 'var(--color-text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <AlertCircle size={16} color="#ea580c" />
                  <span>طلب تصحيح (Correction)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVerificationDecision('reject')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: verificationDecision === 'reject' ? '2px solid #dc2626' : '1px solid var(--color-border-medium)',
                    backgroundColor: verificationDecision === 'reject' ? 'rgba(239, 68, 68, 0.1)' : '#ffffff',
                    color: verificationDecision === 'reject' ? '#b91c1c' : 'var(--color-text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={16} color="#dc2626" />
                  <span>رفض التوثيق (Reject)</span>
                </button>
              </div>

              {/* Notes Input */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 6 }}>
                  {verificationDecision === 'verify' ? 'ملاحظات الاعتماد والتدقيق (اختياري):' :
                   verificationDecision === 'correction_requested' ? 'الملاحظات والمطلوب تصحيحه بدقة من المتقدم (إلزامي):' :
                   'سبب الرفض والملاحظات الإدارية (إلزامي):'}
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={
                    verificationDecision === 'verify' ? 'تمت مطابقة الاسم الرباعي مع الوثيقة الرسمية والتأكد من الصحة...' :
                    verificationDecision === 'correction_requested' ? 'يرجى إعادة رفع صورة واضحة لبطاقة الهوية نظراً لعدم وضوح الاسم...' :
                    'الاسم المدخل لا يطابق بيانات الوثيقة المرفقة...'
                  }
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border-medium)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Execute Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleExecuteVerificationDecision()}
                  disabled={verifyingName}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontWeight: 700,
                    padding: '8px 16px',
                    backgroundColor:
                      verificationDecision === 'verify' ? '#16a34a' :
                      verificationDecision === 'correction_requested' ? '#ea580c' : '#dc2626',
                    borderColor:
                      verificationDecision === 'verify' ? '#16a34a' :
                      verificationDecision === 'correction_requested' ? '#ea580c' : '#dc2626',
                  }}
                >
                  <FileCheck size={16} />
                  <span>
                    {verifyingName ? 'جاري تنفيذ القرار...' :
                     verificationDecision === 'verify' ? 'اعتماد الاسم والوثيقة' :
                     verificationDecision === 'correction_requested' ? 'إرسال طلب التصحيح' : 'تسجيل رفض التوثيق'}
                  </span>
                </button>
              </div>

              {/* Previous notes if present */}
              {applicant.name_verification_notes && (
                <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  <strong>آخر ملاحظة مسجلة:</strong> {applicant.name_verification_notes}
                  {applicant.name_verified_at && (
                    <span style={{ marginRight: 10, color: 'var(--color-text-light)' }}>
                      (بتاريخ: {new Date(applicant.name_verified_at).toLocaleString('ar-SA')})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Student Info Details */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 12, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 6 }}>
              البيانات الشخصية والأكاديمية للطالب
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: '0.92rem' }}>
              <div><strong>تاريخ الميلاد:</strong> {applicant.date_of_birth}</div>
              <div><strong>الجنس:</strong> {applicant.gender}</div>
              <div><strong>الصف الدراسي:</strong> {applicant.grade}</div>
              <div><strong>المدرسة:</strong> {applicant.school}</div>
              <div><strong>المدينة:</strong> {applicant.city}</div>
              <div><strong>الهاتف:</strong> <span dir="ltr">{applicant.phone}</span></div>
              {applicant.email && <div><strong>البريد:</strong> {applicant.email}</div>}
              <div><strong>المستوى الأكاديمي:</strong> {applicant.academic_level}</div>
            </div>
          </div>

          {/* Guardian Info Details */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 12, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 6 }}>
              بيانات ولي الأمر
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: '0.92rem' }}>
              <div><strong>الاسم:</strong> {applicant.guardian_name}</div>
              <div><strong>صلة القرابة:</strong> {applicant.guardian_relationship}</div>
              <div><strong>رقم الجوال:</strong> <span dir="ltr">{applicant.guardian_phone}</span></div>
              {applicant.guardian_email && <div><strong>البريد:</strong> {applicant.guardian_email}</div>}
            </div>
          </div>

          {/* Motivation, Skills & Preferences */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 12, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 6 }}>
              الدافعية والمسارات والمهارات
            </h4>
            <div style={{ fontSize: '0.92rem', marginBottom: 10 }}>
              <strong>المسارات المهتم بها:</strong>{' '}
              {Array.isArray(applicant.interested_tracks)
                ? applicant.interested_tracks.join('، ')
                : applicant.interested_tracks}
            </div>
            <div style={{ fontSize: '0.92rem', marginBottom: 10 }}>
              <strong>سبب الرغبة في الالتحاق:</strong>
              <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: 12, borderRadius: 'var(--radius-sm)', marginTop: 4, lineHeight: 1.6 }}>
                {applicant.motivation}
              </div>
            </div>
            {applicant.skills && (
              <div style={{ fontSize: '0.92rem', marginBottom: 10 }}>
                <strong>المهارات والمواهب:</strong> {applicant.skills}
              </div>
            )}
            {applicant.leadership_experience && (
              <div style={{ fontSize: '0.92rem', marginBottom: 10 }}>
                <strong>المشاركات القيادية/التطوعية السابقة:</strong> {applicant.leadership_experience}
              </div>
            )}
          </div>

          {/* Internal Notes Editor */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 800, color: 'var(--color-gold-dark)' }}>
              الملاحظات والتقييم الداخلي للجنة القبول:
            </label>
            <textarea
              className="form-control"
              placeholder="سجل هنا ملخص المقابلة الشخصية، انطباع المشرفين، التوصيات الداخلية..."
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            <Save size={16} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
