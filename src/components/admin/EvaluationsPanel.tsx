import React, { useState, useEffect } from 'react';
import {
  fetchEvaluationPeriods,
  createEvaluationPeriod,
  fetchEvaluationDimensions,
  fetchStudentEvaluationsAdmin,
  saveStudentEvaluation,
  publishPeriodEvaluations,
} from '../../services/api';
import {
  EvaluationPeriod,
  EvaluationDimension,
  StudentEvaluation,
  EvaluationSummary,
  QualitativeRating,
  EvaluationStatus,
} from '../../types';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Flag,
  Globe,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Search,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const EvaluationsPanel: React.FC = () => {
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [dimensions, setDimensions] = useState<EvaluationDimension[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Student Evaluation State
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [evalSummary, setEvalSummary] = useState<EvaluationSummary | null>(null);
  const [selectedStudentData, setSelectedStudentData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDimensionId, setSavingDimensionId] = useState<string | null>(null);

  // Edit states for each dimension: { [dimId]: { score: number, rating: string, notes: string, status: string } }
  const [editFormData, setEditFormData] = useState<Record<string, {
    score: string;
    rating: string;
    notes: string;
    status: EvaluationStatus;
  }>>({});

  // Modals
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [newAcademicYear, setNewAcademicYear] = useState('2026-2027');
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEndDate, setNewEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [creatingPeriod, setCreatingPeriod] = useState(false);

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load initial periods, dimensions, and enrolled students
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [periodsData, dimsData, studentsRes] = await Promise.all([
        fetchEvaluationPeriods(),
        fetchEvaluationDimensions(),
        fetch('/api/admin/students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('mishkat_admin_token')}` },
        }).then((res) => res.json()),
      ]);

      setPeriods(periodsData);
      if (periodsData.length > 0 && !selectedPeriodId) {
        setSelectedPeriodId(periodsData[0].id);
      }

      setDimensions(dimsData);

      const stuList = studentsRes.students || [];
      setStudents(stuList);
      if (stuList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stuList[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'تعذر تحميل بيانات التقييمات', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load student evaluations when selectedStudentId or selectedPeriodId changes
  const loadStudentEvaluations = async () => {
    if (!selectedStudentId || !selectedPeriodId) return;
    try {
      const data = await fetchStudentEvaluationsAdmin(selectedStudentId, selectedPeriodId);
      setEvaluations(data.evaluations || []);
      setEvalSummary(data.summary || null);
      setSelectedStudentData(data.student || null);

      // Initialize form data map for each dimension
      const formState: Record<string, { score: string; rating: string; notes: string; status: EvaluationStatus }> = {};
      dimensions.forEach((dim) => {
        const existing = (data.evaluations || []).find((e: any) => e.dimension_id === dim.id);
        formState[dim.id] = {
          score: existing && existing.numerical_score !== null ? String(existing.numerical_score) : '',
          rating: existing?.qualitative_rating || deriveRating(existing?.numerical_score),
          notes: existing?.supervisor_notes || '',
          status: existing?.evaluation_status || 'draft',
        };
      });
      setEditFormData(formState);
    } catch (err: any) {
      console.error('Error fetching student evaluations:', err);
    }
  };

  useEffect(() => {
    if (selectedStudentId && selectedPeriodId && dimensions.length > 0) {
      loadStudentEvaluations();
    }
  }, [selectedStudentId, selectedPeriodId, dimensions]);

  // Derive descriptive qualitative rating from numerical score / 100
  const deriveRating = (score?: number | null): QualitativeRating => {
    if (score === undefined || score === null || isNaN(score)) return 'جيد';
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جدًا';
    if (score >= 65) return 'جيد';
    return 'يحتاج متابعة';
  };

  const handleScoreChange = (dimId: string, valStr: string) => {
    const num = Number(valStr);
    const updatedRating = valStr.trim() !== '' && !isNaN(num) ? deriveRating(num) : 'جيد';
    setEditFormData((prev) => ({
      ...prev,
      [dimId]: {
        ...prev[dimId],
        score: valStr,
        rating: updatedRating,
      },
    }));
  };

  const handleSaveEvaluationItem = async (dimId: string) => {
    const data = editFormData[dimId];
    if (!data || !selectedStudentId || !selectedPeriodId) return;

    const numScore = data.score.trim() === '' ? null : Number(data.score);
    if (numScore !== null && (isNaN(numScore) || numScore < 0 || numScore > 100)) {
      showToast('الدرجة يجب أن تكون رقمًا بين 0 و 100', 'error');
      return;
    }

    try {
      setSavingDimensionId(dimId);
      await saveStudentEvaluation(selectedStudentId, {
        period_id: selectedPeriodId,
        dimension_id: dimId,
        numerical_score: numScore,
        qualitative_rating: data.rating,
        supervisor_notes: data.notes,
        evaluation_status: data.status,
      });
      showToast('تم حفظ التقييم بنجاح', 'success');
      loadStudentEvaluations();
    } catch (err: any) {
      showToast(err.message || 'تعذر حفظ التقييم', 'error');
    } finally {
      setSavingDimensionId(null);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodName.trim() || !newAcademicYear.trim()) {
      showToast('يرجى إدخال اسم الفترة والعام الدراسي', 'error');
      return;
    }
    try {
      setCreatingPeriod(true);
      const newP = await createEvaluationPeriod({
        academic_year: newAcademicYear.trim(),
        period_name: newPeriodName.trim(),
        start_date: newStartDate,
        end_date: newEndDate,
      });
      showToast('تم إنشاء فترة التقييم الأكاديمية بنجاح', 'success');
      setIsNewPeriodModalOpen(false);
      setNewPeriodName('');
      const updatedPeriods = await fetchEvaluationPeriods();
      setPeriods(updatedPeriods);
      setSelectedPeriodId(newP.id);
    } catch (err: any) {
      showToast(err.message || 'تعذر إنشاء الفترة', 'error');
    } finally {
      setCreatingPeriod(false);
    }
  };

  const handlePublishPeriod = async () => {
    if (!selectedPeriodId) return;
    try {
      setPublishing(true);
      const res = await publishPeriodEvaluations(selectedPeriodId);
      showToast(res.message || 'تم اعتماد ونشر نتائج التقييمات بنجاح', 'success');
      setIsPublishModalOpen(false);
      loadStudentEvaluations();
    } catch (err: any) {
      showToast(err.message || 'تعذر نشر التقييمات', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDimensionIcon = (name: string) => {
    if (name.includes('الشرعية')) return <BookOpen size={20} color="var(--color-gold-dark)" />;
    if (name.includes('المعارف')) return <Compass size={20} color="var(--color-gold-dark)" />;
    if (name.includes('الشخصية')) return <ShieldCheck size={20} color="var(--color-gold-dark)" />;
    if (name.includes('القيادة')) return <Flag size={20} color="var(--color-gold-dark)" />;
    return <Award size={20} color="var(--color-gold-dark)" />;
  };

  const ratingBadgeColor: Record<string, { bg: string; text: string }> = {
    'ممتاز': { bg: 'rgba(22, 163, 74, 0.12)', text: '#16a34a' },
    'جيد جدًا': { bg: 'rgba(13, 148, 136, 0.12)', text: '#0d9488' },
    'جيد': { bg: 'rgba(217, 119, 6, 0.12)', text: '#d97706' },
    'يحتاج متابعة': { bg: 'rgba(220, 38, 38, 0.12)', text: '#dc2626' },
  };

  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#15803d' : '#b91c1c',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Top Banner: Period Management & Official Release */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          border: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-dark)',
              color: 'var(--color-gold-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
                نظام التقييم الهجين المعتمد
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                (درجات كمية من 100 + تقدير وصفي نوعي)
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
              لوحة التقييم التربوي وبناء المحاور الخمسة
            </h2>
          </div>
        </div>

        {/* Period Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
              الفترة:
            </span>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontWeight: 700,
                fontSize: '0.88rem',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-primary-dark)',
              }}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.period_name} ({p.academic_year})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsNewPeriodModalOpen(true)}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} />
            <span>فترة جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--color-gold-dark)',
              borderColor: 'var(--color-gold-dark)',
            }}
          >
            <Send size={14} />
            <span>اعتماد ونشر التقييمات رسميًا</span>
          </button>
        </div>
      </div>

      {/* The 5 Institutional Dimensions Overview Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {dimensions.map((dim) => (
          <div
            key={dim.id}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(198, 146, 20, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getDimensionIcon(dim.dimension_name)}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {dim.dimension_name}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                الوزن النسبي: <strong>{dim.weight}%</strong> | أقصى درجة: {dim.max_score}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Workspace: Student Selector + Evaluation Forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Left Side: Students List */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            height: 'fit-content',
            maxHeight: '850px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--color-gold-dark)" />
            <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--color-primary-dark)' }}>
              قائمة الطلاب المقيدين
            </span>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', top: 10, right: 12, color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              placeholder="بحث بالاسم أو الرقم الأكاديمي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 36px 8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Students Scrollable List */}
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '650px' }}>
            {filteredStudents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                لا يوجد طلاب مطابقين للبحث.
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = st.id === selectedStudentId;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentId(st.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'right',
                      border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border-light)',
                      backgroundColor: isSelected ? 'rgba(198, 146, 20, 0.08)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                      {st.student_name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      <span dir="ltr" style={{ fontFamily: 'monospace' }}>{st.student_number}</span>
                      <span>{st.educational_track || 'العلوم الشرعية'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Evaluation Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedStudentData ? (
            <>
              {/* Student Summary Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(10, 58, 42, 0.05) 0%, rgba(198, 146, 20, 0.08) 100%)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '24px',
                  border: '1.5px solid var(--color-gold)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-dark)', fontWeight: 700 }}>
                      الرقم الأكاديمي:
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800 }} dir="ltr">
                      {selectedStudentData.student_number}
                    </span>
                    <span className="badge badge-accepted" style={{ fontSize: '0.74rem' }}>
                      {selectedStudentData.educational_track || 'العلوم الشرعية'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: 0 }}>
                    {selectedStudentData.student_name}
                  </h3>
                </div>

                {/* Score & Rating Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                      المعدل التراكمي الموزون
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      {evalSummary?.overall_score !== null && evalSummary?.overall_score !== undefined
                        ? `${evalSummary.overall_score}%`
                        : '--'}
                    </div>
                  </div>

                  {evalSummary?.overall_rating && (
                    <div
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: ratingBadgeColor[evalSummary.overall_rating]?.bg || 'rgba(0,0,0,0.06)',
                        color: ratingBadgeColor[evalSummary.overall_rating]?.text || 'var(--color-primary-dark)',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    >
                      {evalSummary.overall_rating}
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Confidentiality Notice */}
              <div
                style={{
                  backgroundColor: 'rgba(198, 146, 20, 0.08)',
                  borderRight: '4px solid var(--color-gold)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.84rem',
                  color: 'var(--color-primary-dark)',
                }}
              >
                <Info size={18} color="var(--color-gold-dark)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>ضمان السرية الأكاديمية:</strong> التقييمات المحفوظة بصيغة "مسودة" تظل سرية ومحجوبة تمامًا عن الطالب وولي الأمر حتى يتم اعتمادها رسميًا ونشرها عبر الإدارة العامة.
                </span>
              </div>

              {/* 5 Evaluation Axes Editors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {dimensions.map((dim) => {
                  const formData = editFormData[dim.id] || { score: '', rating: 'جيد', notes: '', status: 'draft' };
                  const isSaving = savingDimensionId === dim.id;

                  return (
                    <div
                      key={dim.id}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 'var(--radius-xl)',
                        padding: '22px',
                        border: '1px solid var(--color-border)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                    >
                      {/* Dimension Title & Weight */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-light)', paddingBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'rgba(198, 146, 20, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {getDimensionIcon(dim.dimension_name)}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                              {dim.dimension_name}
                            </h4>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              الوزن المعتمد: {dim.weight}% من التقييم العام
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            className={`badge ${formData.status === 'published' ? 'badge-accepted' : 'badge-new'}`}
                            style={{ fontSize: '0.76rem' }}
                          >
                            {formData.status === 'published' ? 'معتمد ومنشور' : 'مسودة قيد الإعداد'}
                          </span>
                        </div>
                      </div>

                      {/* Score Input, Qualitative Rating & Status Selector */}
                      <div style={{ display: 'grid', gridTemplateColumns: '180px 200px 180px', gap: 14 }}>
                        <div>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            الدرجة من 100 *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0 - 100"
                            value={formData.score}
                            onChange={(e) => handleScoreChange(dim.id, e.target.value)}
                            className="form-input"
                            style={{ fontWeight: 800, fontSize: '1rem', textAlign: 'center' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            التقدير الوصفي النوعي
                          </label>
                          <select
                            value={formData.rating}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                [dim.id]: { ...prev[dim.id], rating: e.target.value },
                              }))
                            }
                            className="form-input"
                            style={{ fontWeight: 700 }}
                          >
                            <option value="ممتاز">ممتاز (90 - 100)</option>
                            <option value="جيد جدًا">جيد جدًا (80 - 89)</option>
                            <option value="جيد">جيد (65 - 79)</option>
                            <option value="يحتاج متابعة">يحتاج متابعة (أقل من 65)</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            حالة السجل
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                [dim.id]: { ...prev[dim.id], status: e.target.value as EvaluationStatus },
                              }))
                            }
                            className="form-input"
                            style={{ fontWeight: 600 }}
                          >
                            <option value="draft">مسودة (حفظ سري)</option>
                            <option value="submitted">مكتمل وجاهز للنشر</option>
                          </select>
                        </div>
                      </div>

                      {/* Educational & Guidance Notes */}
                      <div>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                          الملاحظات التربوية والتوجيهية المخصصة للطالب
                        </label>
                        <textarea
                          rows={2}
                          placeholder="اكتب التوجيهات النوعية لتطوير مهارات الطالب في هذا المحور..."
                          value={formData.notes}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              [dim.id]: { ...prev[dim.id], notes: e.target.value },
                            }))
                          }
                          className="form-input"
                          style={{ resize: 'vertical', fontSize: '0.85rem' }}
                        />
                      </div>

                      {/* Save Button for this dimension */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleSaveEvaluationItem(dim.id)}
                          disabled={isSaving}
                          className="btn btn-primary btn-sm"
                          style={{ minWidth: 130 }}
                        >
                          {isSaving ? 'جاري الحفظ...' : 'حفظ تقييم المحور'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                padding: '80px 20px',
                textAlign: 'center',
                border: '1px dashed var(--color-border-medium)',
              }}
            >
              <Users size={44} color="var(--color-gold)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                يرجى اختيار طالب لرصد تقييمه
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                اختر أي طالب من القائمة الجانبية لإدخال ومراجعة درجات المحاور الخمسة.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE EVALUATION PERIOD */}
      {isNewPeriodModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 500, borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={22} color="var(--color-gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  إنشاء فترة تقييم جديدة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPeriodModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  اسم الفترة التقييمية *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الفصل الدراسي الثاني 1448هـ"
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  العام الدراسي *
                </label>
                <input
                  type="text"
                  required
                  placeholder="2026-2027"
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    تاريخ البدء *
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    تاريخ الانتهاء *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsNewPeriodModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingPeriod}
                  className="btn btn-primary btn-sm"
                >
                  {creatingPeriod ? 'جاري الإنشاء...' : 'تأكيد إنشاء الفترة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH EVALUATIONS CONFIRMATION */}
      {isPublishModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: 520, borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={22} color="var(--color-gold-dark)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                  اعتماد ونشر تقييمات الفترة رسميًا
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(198, 146, 20, 0.1)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
                fontSize: '0.88rem',
                lineHeight: 1.6,
                color: 'var(--color-primary-dark)',
              }}
            >
              هل أنت متأكد من رغبتك في اعتماد ونشر تقييمات الفترة (
              <strong>{activePeriod?.period_name || 'الحالية'}</strong>)؟
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                • سيتم تحويل حالة جميع التقييمات المحفوظة إلى "منشور رسميًا".<br />
                • ستصبح التقييمات مرئية فورًا في بوابات الطلاب وأولياء الأمور المربوطين.<br />
                • سيتم إرسال إشعارات فورية داخل النظام لجميع الطلاب وأولياء الأمور.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="btn btn-outline btn-sm"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handlePublishPeriod}
                disabled={publishing}
                className="btn btn-primary btn-sm"
                style={{
                  backgroundColor: 'var(--color-gold-dark)',
                  borderColor: 'var(--color-gold-dark)',
                }}
              >
                {publishing ? 'جاري النشر والإشعار...' : 'نعم، اعتمد وانشر الآن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
