import React from 'react';
import '../../styles/design-tokens.css';

type AioSectionProps = {
  tone?: 'white' | 'muted' | 'primary';
  children: React.ReactNode;
  className?: string;
  noSectionSpacing?: boolean;
};

const AioSection: React.FC<AioSectionProps> = ({
  tone = 'white',
  children,
  className = '',
  noSectionSpacing = false,
}) => {
  const getToneStyles = (tone: 'white' | 'muted' | 'primary') => {
    switch (tone) {
      case 'muted':
        return {
          backgroundColor: 'var(--aio-muted)',
          color: 'var(--text-primary)'
        };
      case 'primary':
        return {
          backgroundColor: 'var(--aio-primary)',
          color: 'var(--text-on-primary)'
        };
      case 'white':
      default:
        return {
          backgroundColor: 'var(--aio-surface)',
          color: 'var(--text-primary)'
        };
    }
  };

  const styles = getToneStyles(tone);

  return (
    <section
      style={styles}
      className={`${noSectionSpacing ? '' : 'section-y'} ${className}`.trim()}
    >
      {children}
    </section>
  );
};

export default AioSection;