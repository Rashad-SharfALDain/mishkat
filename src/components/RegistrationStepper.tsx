import React, { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { useApp } from '../context/AppContext';
import { submitApplication, createDocumentUploadSession, uploadIdentityDocument } from '../services/api';
import { ApplicantDocument } from '../types';
import {
  User,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertCircle,
  Copy,
  Printer,
  ShieldCheck,
  UploadCloud,
  FileCheck,
  FileText,
} from 'lucide-react';

interface FormData {
  // Step 1: Student Legal Four-Part Name
  legal_first_name: string;
  legal_second_name: string;
  legal_third_name: string;
  legal_fourth_name: string;
  student_name: string;
  date_of_birth: string;
  gender: string;
  grade: string;
  school: string;
  city: string;
  phone: string;
  email: string;

  // Step 2: Guardian
  guardian_name: string;
  guardian_relationship: string;
  guardian_phone: string;
  guardian_email: string;

  // Step 3: Educational
  academic_level: string;
  motivation: string;
  skills: string;
  leadership_experience: string;

  // Step 4: Tracks
  interested_tracks: string[];
}

const initialForm: FormData = {
  legal_first_name: '',
  legal_second_name: '',
  legal_third_name: '',
  legal_fourth_name: '',
  student_name: '',
  date_of_birth: '',
  gender: 'ذكر',
  grade: 'الصف الأول الثانوي',
  school: '',
  city: 'الرياض',
  phone: '',
  email: '',

  guardian_name: '',
  guardian_relationship: 'أب',
  guardian_phone: '',
  guardian_email: '',

  academic_level: 'ممتاز',
  motivation: '',
  skills: '',
  leadership_experience: '',

  interested_tracks: ['العلوم الشرعية', 'بناء الشخصية', 'القيادة'],
};

export const RegistrationStepper: React.FC = () => {
  const { settings, showToast } = useApp();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    applicant_id?: string;
    application_number: string;
    student_name: string;
    message: string;
  } | null>(null);

  // Identity Document Upload State (Step 6)
  const [uploadSessionToken, setUploadSessionToken] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('national_id');
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<ApplicantDocument[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const availableTracks = [
    { id: 'sharia', name: 'العلوم الشرعية', desc: 'تأصيل شرعي واعي وفهم لمقاصد الشريعة والقرآن' },
    { id: 'knowledge', name: 'العلوم والمعارف', desc: 'تفكير نقدي، ثقافة عامة، تقنية ومهارات بحث' },
    { id: 'character', name: 'بناء الشخصية', desc: 'انضباط، ثقة بالنفس، إدارة وقت وذكاء اجتماعي' },
    { id: 'leadership', name: 'القيادة وصناعة الأثر', desc: 'مبادرات ميدانية، إدارة فرق عمل وتأثير مجتمعي' },
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(null);
  };

  const toggleTrack = (trackName: string) => {
    setFormData((prev) => {
      const exists = prev.interested_tracks.includes(trackName);
      if (exists) {
        if (prev.interested_tracks.length === 1) return prev; // At least one
        return {
          ...prev,
          interested_tracks: prev.interested_tracks.filter((t) => t !== trackName),
        };
      } else {
        return {
          ...prev,
          interested_tracks: [...prev.interested_tracks, trackName],
        };
      }
    });
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.legal_first_name.trim() || formData.legal_first_name.trim().length < 2) {
        setErrorMsg('يرجى إدخال الاسم الأول للطالب (حرفين على الأقل).');
        return false;
      }
      if (!formData.legal_second_name.trim() || formData.legal_second_name.trim().length < 2) {
        setErrorMsg('يرجى إدخال اسم الأب (حرفين على الأقل).');
        return false;
      }
      if (!formData.legal_third_name.trim() || formData.legal_third_name.trim().length < 2) {
        setErrorMsg('يرجى إدخال اسم الجد (حرفين على الأقل).');
        return false;
      }
      if (!formData.legal_fourth_name.trim() || formData.legal_fourth_name.trim().length < 2) {
        setErrorMsg('يرجى إدخال اسم العائلة (حرفين على الأقل).');
        return false;
      }
      if (!formData.date_of_birth) {
        setErrorMsg('يرجى إدخال تاريخ ميلاد الطالب.');
        return false;
      }
      if (!formData.school.trim()) {
        setErrorMsg('يرجى كتابة اسم المدرسة الحالية.');
        return false;
      }
      if (!formData.city.trim()) {
        setErrorMsg('يرجى كتابة اسم المدينة.');
        return false;
      }
      if (!formData.phone.trim() || formData.phone.length < 8) {
        setErrorMsg('يرجى كتابة رقم هاتف صحيح للطالب.');
        return false;
      }
    }

    if (step === 2) {
      if (!formData.guardian_name.trim() || formData.guardian_name.trim().split(' ').length < 2) {
        setErrorMsg('يرجى كتابة اسم ولي الأمر ثلاثياً على الأقل.');
        return false;
      }
      if (!formData.guardian_phone.trim() || formData.guardian_phone.length < 8) {
        setErrorMsg('يرجى كتابة رقم هاتف ولي الأمر للتواصل الرسمي.');
        return false;
      }
    }

    if (step === 3) {
      if (!formData.motivation.trim() || formData.motivation.trim().length < 15) {
        setErrorMsg('يرجى توضيح سبب الرغبة في الالتحاق بالبرنامج (١٥ حرفاً على الأقل).');
        return false;
      }
    }

    if (step === 4) {
      if (formData.interested_tracks.length === 0) {
        setErrorMsg('يرجى تحديد مسار واحد على الأقل من المسارات المفضلة.');
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: document.getElementById('register')?.offsetTop || 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const fullLegalName = `${formData.legal_first_name.trim()} ${formData.legal_second_name.trim()} ${formData.legal_third_name.trim()} ${formData.legal_fourth_name.trim()}`;
      const payload = {
        ...formData,
        student_name: fullLegalName,
      };
      const res = await submitApplication(payload);
      setSubmissionResult({
        applicant_id: res.applicant_id,
        application_number: res.application_number,
        student_name: fullLegalName,
        message: res.message,
      });
      setCurrentStep(6);
      showToast('تم إرسال طلبك بنجاح!', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء معالجة الطلب، يرجى إعادة المحاولة.');
      showToast(err.message || 'فشل إرسال الطلب', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAppNumber = () => {
    if (submissionResult?.application_number) {
      navigator.clipboard.writeText(submissionResult.application_number);
      showToast('تم نسخ الرقم المرجعي بنجاح', 'success');
    }
  };

  const handleUploadDocument = async () => {
    if (!submissionResult?.applicant_id) {
      setUploadError('معرف طلب التقديم غير متوفر، يرجى إعادة المحاولة.');
      return;
    }
    if (!selectedDocFile) {
      setUploadError('يرجى اختيار ملف الوثيقة أولاً (PDF أو صورة).');
      return;
    }
    setUploadingDoc(true);
    setUploadError(null);

    try {
      let token = uploadSessionToken;
      if (!token) {
        const session = await createDocumentUploadSession(submissionResult.applicant_id);
        token = session.upload_token;
        setUploadSessionToken(token);
      }

      if (!token) {
        throw new Error('فشل الحصول على رمز جلسة الرفع.');
      }

      const doc = await uploadIdentityDocument(
        submissionResult.applicant_id,
        token,
        selectedDocType,
        selectedDocFile
      );

      setUploadedDocs((prev) => [...prev, doc]);
      setSelectedDocFile(null);
      showToast('تم رفع وثيقة إثبات الهوية بنجاح!', 'success');
    } catch (err: any) {
      setUploadError(err.message || 'فشل رفع الوثيقة، يرجى التحقق من الملف.');
      showToast(err.message || 'فشل رفع الوثيقة', 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const stepsLabels = [
    { num: 1, label: 'بيانات الطالب', icon: User },
    { num: 2, label: 'بيانات ولي الأمر', icon: Users },
    { num: 3, label: 'الخلفية والدافعية', icon: GraduationCap },
    { num: 4, label: 'تفضيلات المسارات', icon: Sparkles },
    { num: 5, label: 'المراجعة والتأكيد', icon: CheckCircle2 },
  ];

  const isRegistrationClosed = settings?.registration_status === 'closed';

  return (
    <section id="register" className="section" style={{ backgroundColor: '#ffffff' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <SectionHeading
          badge="الالتحاق بالمؤسسة"
          title="التسجيل في البرنامج"
          description="يسرنا استقبال طلبات الطلاب الراغبين في الانضمام. يرجى ملء النموذج الإلكتروني التالي بدقة."
        />

        {isRegistrationClosed ? (
          <div
            className="card"
            style={{
              padding: 40,
              textAlign: 'center',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '2px dashed var(--color-border-medium)',
            }}
          >
            <AlertCircle size={48} color="var(--color-gold)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary-dark)', marginBottom: 8 }}>
              التسجيل مغلق حاليًا
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: 500, margin: '0 auto' }}>
              انتهت فترة استقبال طلبات الدفعة الحالية. يرجى متابعة منصاتنا الرسمية أو التواصل معنا لمعرفة مواعيد فتح باب التسجيل القادم.
            </p>
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: '36px 40px',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            {/* Stepper Header (Steps 1 to 5) */}
            {currentStep < 6 && (
              <div className="stepper-header">
                {stepsLabels.map((s) => {
                  const isActive = currentStep === s.num;
                  const isCompleted = currentStep > s.num;
                  return (
                    <div
                      key={s.num}
                      className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                      <div className="step-circle">
                        {isCompleted ? <CheckCircle2 size={20} /> : s.num}
                      </div>
                      <span className="step-label">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 18px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#b91c1c',
                  marginBottom: 24,
                  fontSize: '0.94rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: Student Information */}
            {currentStep === 1 && (
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 20 }}>
                  الخطوة الأولى: البيانات الشخصية والأكاديمية للطالب
                </h3>

                {/* Legal Four-Part Name Notice Box */}
                <div
                  style={{
                    backgroundColor: 'rgba(30, 58, 138, 0.05)',
                    border: '1px solid rgba(30, 58, 138, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: 'var(--color-primary-dark)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>📋</span>
                  <div>
                    <strong>قاعدة توثيق الاسم:</strong> يرجى إدخال الاسم الرباعي مطابقاً تماماً لوثيقة إثبات الاسم أو شهادة الصف التاسع.
                  </div>
                </div>

                {/* Four-Part Legal Name Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="legal_first_name">
                      الاسم الأول <span className="required">*</span>
                    </label>
                    <input
                      id="legal_first_name"
                      type="text"
                      className="form-control"
                      placeholder="مثال: صالح"
                      value={formData.legal_first_name}
                      onChange={(e) => handleInputChange('legal_first_name', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="legal_second_name">
                      اسم الأب <span className="required">*</span>
                    </label>
                    <input
                      id="legal_second_name"
                      type="text"
                      className="form-control"
                      placeholder="مثال: خالد"
                      value={formData.legal_second_name}
                      onChange={(e) => handleInputChange('legal_second_name', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="legal_third_name">
                      اسم الجد <span className="required">*</span>
                    </label>
                    <input
                      id="legal_third_name"
                      type="text"
                      className="form-control"
                      placeholder="مثال: محمد"
                      value={formData.legal_third_name}
                      onChange={(e) => handleInputChange('legal_third_name', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="legal_fourth_name">
                      اسم العائلة <span className="required">*</span>
                    </label>
                    <input
                      id="legal_fourth_name"
                      type="text"
                      className="form-control"
                      placeholder="مثال: العتيبي"
                      value={formData.legal_fourth_name}
                      onChange={(e) => handleInputChange('legal_fourth_name', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>

                  <div className="form-group">
                    <label className="form-label">
                      تاريخ الميلاد <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      الجنس <span className="required">*</span>
                    </label>
                    <select
                      className="form-control"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      الصف الدراسي الحالي <span className="required">*</span>
                    </label>
                    <select
                      className="form-control"
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                    >
                      <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                      <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                      <option value="مرحلة أخرى متقدمة">مرحلة أخرى متقدمة</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      اسم المدرسة الحالية <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="المدرسة الثانوية التي يدرس بها الطالب"
                      value={formData.school}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      المدينة / المنطقة <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="مثال: الرياض"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      رقم هاتف الطالب (واتساب) <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="05XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      البريد الإلكتروني للطالب <span style={{ color: 'var(--color-text-light)' }}>(اختياري)</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="student@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Guardian Information */}
            {currentStep === 2 && (
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 20 }}>
                  الخطوة الثانية: بيانات ولي الأمر
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">
                      اسم ولي الأمر بالكامل <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="الاسم الثلاثي أو الرباعي"
                      value={formData.guardian_name}
                      onChange={(e) => handleInputChange('guardian_name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      صلة القرابة <span className="required">*</span>
                    </label>
                    <select
                      className="form-control"
                      value={formData.guardian_relationship}
                      onChange={(e) => handleInputChange('guardian_relationship', e.target.value)}
                    >
                      <option value="أب">أب</option>
                      <option value="أم">أم</option>
                      <option value="أخ">أخ</option>
                      <option value="ولي أمر شرعي">ولي أمر شرعي</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      رقم هاتف ولي الأمر <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="05XXXXXXXX"
                      value={formData.guardian_phone}
                      onChange={(e) => handleInputChange('guardian_phone', e.target.value)}
                      dir="ltr"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      البريد الإلكتروني لولي الأمر <span style={{ color: 'var(--color-text-light)' }}>(اختياري)</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="guardian@example.com"
                      value={formData.guardian_email}
                      onChange={(e) => handleInputChange('guardian_email', e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-light)',
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <ShieldCheck size={24} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                    خصوصية البيانات: تُعامل جميع بيانات الطالب وولي أمره بسرية تامة ومصونة، ولا يتم مشاركتها مطلقاً مع أي جهة خارج إطار لجان القبول والفرز بالمؤسسة.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: Educational Information & Motivation */}
            {currentStep === 3 && (
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 20 }}>
                  الخطوة الثالثة: المعلومات التعليمية والدافعية
                </h3>

                <div className="form-group">
                  <label className="form-label">
                    المستوى الأكاديمي العام للطالب <span className="required">*</span>
                  </label>
                  <select
                    className="form-control"
                    value={formData.academic_level}
                    onChange={(e) => handleInputChange('academic_level', e.target.value)}
                  >
                    <option value="ممتاز (٩٥٪ فأعلى)">ممتاز (٩٥٪ فأعلى)</option>
                    <option value="جيد جدًا (٨٥٪ إلى ٩٤٪)">جيد جدًا (٨٥٪ إلى ٩٤٪)</option>
                    <option value="جيد (٧٥٪ إلى ٨٤٪)">جيد (٧٥٪ إلى ٨٤٪)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    سبب الرغبة في الالتحاق بدار مِشكاة؟ <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="حدثنا بإيجاز عن دوافعك وطموحاتك وما تأمل تحقيقه من خلال انضمامك للبرنامج..."
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    المهارات أو الهوايات أو المواهب التي يتميز بها الطالب{' '}
                    <span style={{ color: 'var(--color-text-light)' }}>(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="مثال: الخطابة، البرمجة، الكتابة، التصميم، حفظ أجزاء من القرآن، تنظيم الفعاليات"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    هل شارك الطالب سابقاً في أنشطة تطوعية أو قيادية أو أندية مدرسية؟{' '}
                    <span style={{ color: 'var(--color-text-light)' }}>(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="اذكر أبرز المشاركات إن وجدت"
                    value={formData.leadership_experience}
                    onChange={(e) => handleInputChange('leadership_experience', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Program Track Preferences */}
            {currentStep === 4 && (
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 12 }}>
                  الخطوة الرابعة: تحديد المسارات والاهتمامات
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.96rem', marginBottom: 24 }}>
                  يتضمن البرنامج تدريباً شاملاً في جميع المسارات، وتساعدنا اختياراتك على توجيه الأنشطة الإثرائية وفق اهتمامات الطالب وميوله:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  {availableTracks.map((tr) => {
                    const isSelected = formData.interested_tracks.includes(tr.name);
                    return (
                      <div
                        key={tr.id}
                        onClick={() => toggleTrack(tr.name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: 18,
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-light)'}`,
                          backgroundColor: isSelected ? 'var(--color-primary-subtle)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
                            backgroundColor: isSelected ? 'var(--color-primary)' : '#ffffff',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isSelected && <CheckCircle2 size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                            {tr.name}
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                            {tr.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Review & Confirmation */}
            {currentStep === 5 && (
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginBottom: 12 }}>
                  الخطوة الخامسة: مراجعة البيانات قبل الإرسال
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.94rem', marginBottom: 24 }}>
                  يرجى التأكد من صحة البيانات المدخلة قبل تأكيد إرسال الطلب:
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 24,
                    border: '1px solid var(--color-border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                  }}
                >
                  <div style={{ borderBottom: '1px solid var(--color-border-medium)', paddingBottom: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-gold-dark)', fontSize: '0.92rem', marginBottom: 6 }}>
                      بيانات الطالب:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: '0.94rem' }}>
                      <div><strong>الاسم القانوني الرباعي:</strong> {formData.legal_first_name} {formData.legal_second_name} {formData.legal_third_name} {formData.legal_fourth_name}</div>
                      <div><strong>تاريخ الميلاد:</strong> {formData.date_of_birth}</div>
                      <div><strong>الجنس:</strong> {formData.gender}</div>
                      <div><strong>الصف:</strong> {formData.grade}</div>
                      <div><strong>المدرسة:</strong> {formData.school}</div>
                      <div><strong>المدينة:</strong> {formData.city}</div>
                      <div><strong>رقم الهاتف:</strong> {formData.phone}</div>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px solid var(--color-border-medium)', paddingBottom: 12 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-gold-dark)', fontSize: '0.92rem', marginBottom: 6 }}>
                      بيانات ولي الأمر:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: '0.94rem' }}>
                      <div><strong>الاسم:</strong> {formData.guardian_name}</div>
                      <div><strong>صلة القرابة:</strong> {formData.guardian_relationship}</div>
                      <div><strong>رقم الهاتف:</strong> {formData.guardian_phone}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-gold-dark)', fontSize: '0.92rem', marginBottom: 6 }}>
                      المسارات والدافعية:
                    </div>
                    <div style={{ fontSize: '0.94rem', marginBottom: 8 }}>
                      <strong>المسارات المفضلة:</strong> {formData.interested_tracks.join('، ')}
                    </div>
                    <div style={{ fontSize: '0.94rem', color: 'var(--color-text-muted)' }}>
                      <strong>سبب الالتحاق:</strong> {formData.motivation}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-gold-subtle)',
                    border: '1px solid var(--color-gold-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    marginTop: 20,
                    fontSize: '0.9rem',
                    color: 'var(--color-gold-dark)',
                    lineHeight: 1.6,
                  }}
                >
                  بالنقر على "تأكيد وإرسال الطلب"، أقر بصحة البيانات المقدمة، وموافقة ولي الأمر على التسجيل في برنامج دار مِشكاة التربوي.
                </div>
              </div>
            )}

            {/* STEP 6: Submission Result & Application Reference Number */}
            {currentStep === 6 && submissionResult && (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-subtle)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto',
                  }}
                >
                  <CheckCircle2 size={48} />
                </div>

                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-primary-dark)', marginBottom: 8 }}>
                  تم استلام طلب التسجيل بنجاح
                </h3>

                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: 550, margin: '0 auto 28px auto' }}>
                  أهلاً بك يا <strong>{submissionResult.student_name}</strong>. تم تسجيل طلبك في قوائم الانتظار والمراجعة لدى لجنة القبول.
                </p>

                {/* Application Number Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '2px dashed var(--color-gold)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px 30px',
                    maxWidth: 500,
                    margin: '0 auto 30px auto',
                  }}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-gold-dark)', marginBottom: 6 }}>
                    الرقم المرجعي الرسمي لطلبك:
                  </div>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      color: 'var(--color-primary-dark)',
                      fontFamily: 'monospace',
                      letterSpacing: '2px',
                    }}
                    dir="ltr"
                  >
                    {submissionResult.application_number}
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button
                      onClick={handleCopyAppNumber}
                      className="btn btn-outline-gold btn-sm"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Copy size={14} />
                      <span>نسخ الرقم</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Printer size={14} />
                      <span>طباعة الإشعار</span>
                    </button>
                  </div>
                </div>

                {/* Identity Document Upload Card (Step 6) */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 24,
                    maxWidth: 620,
                    margin: '0 auto 28px auto',
                    textAlign: 'right',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <ShieldCheck size={22} color="var(--color-primary)" />
                    <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      رفع وثيقة إثبات الهوية والاسم القانوني
                    </h4>
                  </div>

                  {/* Mandatory Instruction Notice */}
                  <div
                    style={{
                      backgroundColor: 'rgba(30, 58, 138, 0.05)',
                      border: '1px solid rgba(30, 58, 138, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      marginBottom: 18,
                      fontSize: '0.9rem',
                      color: 'var(--color-primary-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span>⚠️</span>
                    <span><strong>إلزامية التوثيق:</strong> يجب رفع نسخة واضحة من وثيقة إثبات الاسم (الهوية الوطنية، جواز السفر، أو شهادة الصف التاسع).</span>
                  </div>

                  {uploadedDocs.length < 3 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label className="form-label" style={{ fontWeight: 700 }}>نوع الوثيقة:</label>
                        <select
                          className="form-control"
                          value={selectedDocType}
                          onChange={(e) => setSelectedDocType(e.target.value)}
                        >
                          <option value="national_id">بطاقة الهوية الوطنية</option>
                          <option value="family_card">سجل الأسرة (كرت العائلة)</option>
                          <option value="passport">جواز السفر</option>
                          <option value="ninth_grade_cert">شهادة الصف التاسع</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontWeight: 700 }}>اختيار الملف (PDF, JPG, PNG — أقصى حد ٥ ميجابايت):</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="form-control"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedDocFile(e.target.files[0]);
                              setUploadError(null);
                            }
                          }}
                        />
                      </div>

                      {uploadError && (
                        <div style={{ color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>
                          {uploadError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleUploadDocument}
                        disabled={uploadingDoc || !selectedDocFile}
                        className="btn btn-primary"
                        style={{ fontWeight: 700, gap: 8, justifyContent: 'center', marginTop: 4 }}
                      >
                        <UploadCloud size={18} />
                        <span>{uploadingDoc ? 'جاري رفع وتأمين الوثيقة...' : 'رفع الوثيقة'}</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: '#15803d', fontWeight: 700, fontSize: '0.9rem' }}>
                      تم استيفاء الحد الأقصى المسموح به من الوثائق المرفوعة (٣ وثائق).
                    </div>
                  )}

                  {/* List of uploaded documents */}
                  {uploadedDocs.length > 0 && (
                    <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border-light)', paddingTop: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-primary-dark)', marginBottom: 10 }}>
                        الوثائق التي تم رفعها بنجاح:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {uploadedDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: 'var(--color-bg-subtle)',
                              border: '1px solid var(--color-border-light)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.86rem',
                              flexWrap: 'wrap',
                              gap: 8,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileCheck size={18} color="#15803d" />
                              <div>
                                <strong>{doc.original_filename}</strong>
                                <span style={{ color: 'var(--color-text-light)', marginRight: 8 }}>
                                  ({(doc.file_size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.78rem' }}>
                                تم الرفع بنجاح
                              </span>
                              <span style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#a16207', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.78rem' }}>
                                قيد التدقيق الإداري
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                    maxWidth: 600,
                    margin: '0 auto 24px auto',
                    textAlign: 'right',
                    fontSize: '0.92rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.7,
                  }}
                >
                  <strong style={{ color: 'var(--color-primary-dark)' }}>ما الخطوة القادمة؟</strong>
                  <ul style={{ paddingRight: 20, marginTop: 8 }}>
                    <li>ستتم مراجعة الطلب من قِبل المشرفين التربويين خلال ٣ إلى ٥ أيام عمل.</li>
                    <li>سيتم إرسال رسالة نصية أو واتساب إلى رقم ولي الأمر لتحديد موعد المقابلة الشخصية.</li>
                    <li>المساهمة المالية الرمزية (إن وجدت) تتم بعد اجتياز القبول، وتتوفر إعفاءات كاملة عبر صندوق المنح.</li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setFormData(initialForm);
                    setSubmissionResult(null);
                    setCurrentStep(1);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  تسجيل طالب آخر
                </button>
              </div>
            )}

            {/* Stepper Footer Buttons (Next, Back, Submit) */}
            {currentStep < 6 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 35,
                  paddingTop: 24,
                  borderTop: '1px solid var(--color-border-light)',
                }}
              >
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn btn-outline"
                    disabled={submitting}
                  >
                    <ArrowRight size={16} />
                    <span>السابق</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 5 ? (
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    <span>التالي</span>
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn btn-gold btn-lg"
                    disabled={submitting}
                    style={{ fontWeight: 800 }}
                  >
                    {submitting ? (
                      <span>جاري إرسال الطلب...</span>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>تأكيد وإرسال طلب التسجيل</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
