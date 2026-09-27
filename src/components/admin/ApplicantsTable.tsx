import React, { useState, useEffect } from 'react';
import { Applicant, ApplicantStatus } from '../../types';
import { fetchAdminApplicants } from '../../services/api';
import { ApplicantDetailModal } from './ApplicantDetailModal';
import { Search, Filter, Download, Eye, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ApplicantsTable: React.FC = () => {
  const { showToast } = useApp();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('الكل');
  const [search, setSearch] = useState<string>('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminApplicants(statusFilter, search);
      setApplicants(data);
    } catch (err: any) {
      showToast(err.message || 'فشل جلب قائمة المتقدمين', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplicants();
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

  const exportCSV = () => {
    if (applicants.length === 0) {
      showToast('لا توجد بيانات للتصدير', 'info');
      return;
    }
    const headers = ['رقم الطلب', 'اسم الطالب', 'تاريخ الميلاد', 'الصف', 'المدرسة', 'المدينة', 'الهاتف', 'ولي الأمر', 'هاتف ولي الأمر', 'الحالة', 'تاريخ التقديم'];
    const rows = applicants.map((a) => [
      a.application_number,
      a.student_name,
      a.date_of_birth,
      a.grade,
      a.school,
      a.city,
      a.phone,
      a.guardian_name,
      a.guardian_phone,
      a.status,
      new Date(a.created_at).toLocaleDateString('ar-SA'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `طلبات_التسجيل_مِشكاة_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف CSV بنجاح', 'success');
  };

  const statuses = ['الكل', 'جديد', 'قيد المراجعة', 'مقبول', 'مرفوض', 'مكتمل'];

  return (
    <div>
      {/* Top Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flex: '1 1 300px', maxWidth: 450 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-control"
              placeholder="ابحث بالاسم، أو رقم الطلب، أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: 40 }}
            />
            <Search size={18} color="var(--color-text-light)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            بحث
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={loadApplicants} className="btn btn-outline btn-sm" title="تحديث القائمة">
            <RefreshCw size={15} />
            <span>تحديث</span>
          </button>
          <button onClick={exportCSV} className="btn btn-outline-gold btn-sm">
            <Download size={15} />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.86rem',
              fontWeight: 600,
              backgroundColor: statusFilter === st ? 'var(--color-primary)' : '#ffffff',
              color: statusFilter === st ? '#ffffff' : 'var(--color-text-muted)',
              border: `1.5px solid ${statusFilter === st ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
              transition: 'all var(--transition-fast)',
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 50, color: 'var(--color-text-muted)' }}>
          جاري تحميل بيانات المتقدمين...
        </div>
      ) : applicants.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 50,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <AlertCircle size={40} color="var(--color-text-light)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', marginBottom: 4 }}>
            لم يتم العثور على طلبات تسجيل
          </h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            لا توجد طلبات تطابق معايير التصفية الحالية.
          </p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>اسم الطالب</th>
                <th>الصف والمدرسة</th>
                <th>المدينة</th>
                <th>رقم الهاتف</th>
                <th>تاريخ التقديم</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }} dir="ltr">
                    {app.application_number}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {app.student_name}
                  </td>
                  <td>
                    <div>{app.grade}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{app.school}</div>
                  </td>
                  <td>{app.city}</td>
                  <td dir="ltr" style={{ fontFamily: 'monospace' }}>
                    {app.phone}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {new Date(app.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedApplicant(app)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                    >
                      <Eye size={14} />
                      <span>تفاصيل</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Applicant Detail Modal */}
      <ApplicantDetailModal
        applicant={selectedApplicant}
        onClose={() => setSelectedApplicant(null)}
        onUpdated={loadApplicants}
      />
    </div>
  );
};
