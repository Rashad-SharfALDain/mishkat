import React, { useState, useEffect } from 'react';
import { SectionHeading } from './SectionHeading';
import { FAQItem } from '../types';
import { fetchFAQs } from '../services/api';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1', 'faq-4']);

  useEffect(() => {
    fetchFAQs()
      .then((data) => {
        setFaqs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load FAQs:', err);
        setLoading(false);
      });
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = ['الكل', ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'الكل' || faq.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <section id="faq" className="section section-subtle">
      <div className="container" style={{ maxWidth: 860 }}>
        <SectionHeading
          badge="إجابات وافية"
          title="الأسئلة الشائعة"
          description="جمعنا لكم أكثر الاستفسارات تكراراً حول آلية التسجيل، الرسوم، شروط القبول، وطبيعة البرامج المقدمة."
        />

        {/* Search & Category Filter */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type="text"
              className="form-control"
              placeholder="ابحث في الأسئلة الشائعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingRight: 44,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
            <Search
              size={18}
              color="var(--color-text-light)"
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          {/* Categories Pill Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : '#ffffff',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--color-text-muted)',
                  border: `1px solid ${selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border-medium)'}`,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
            جاري تحميل الأسئلة الشائعة...
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
            }}
          >
            <HelpCircle size={36} color="var(--color-text-light)" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              لم يتم العثور على نتائج تطابق بحثك
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              يمكنك مراسلتنا مباشرة عبر صفحة "تواصل معنا" وسيسعدنا الإجابة عن استفسارك.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isOpen ? 'var(--color-gold)' : 'var(--color-border-light)'}`,
                    overflow: 'hidden',
                    boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    style={{
                      width: '100%',
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      textAlign: 'right',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: isOpen ? 'var(--color-primary-dark)' : 'var(--color-text-main)',
                      }}
                    >
                      {faq.question}
                    </span>
                    <div
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--transition-fast)',
                        color: isOpen ? 'var(--color-gold)' : 'var(--color-text-light)',
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 22px 20px 22px',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.96rem',
                        lineHeight: 1.8,
                        borderTop: '1px solid var(--color-bg-subtle)',
                        paddingTop: 14,
                        animation: 'fadeIn 0.2s ease-out',
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
