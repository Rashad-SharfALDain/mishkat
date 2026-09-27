import React from 'react';

interface SectionHeadingProps {
  badge?: string;
  title: string;
  description?: string;
  dark?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  title,
  description,
  dark = false,
}) => {
  return (
    <div className={`section-header ${dark ? 'section-dark' : ''}`}>
      {badge && <span className="section-badge">{badge}</span>}
      <div className="decorative-motif">
        <span className="line" />
        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>✦</span>
        <span className="line reversed" />
      </div>
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-desc">{description}</p>}
    </div>
  );
};
