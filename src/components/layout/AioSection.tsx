import React from 'react';
import '../../styles/design-tokens.css';

interface AioSectionProps {
  tone?: 'white' | 'muted' | 'primary';
  children: React.ReactNode;
  className?: string;
}

const AioSection: React.FC<AioSectionProps> = ({ 
  tone = 'white', 
  children, 
  className = '' 
}) => {
  const getToneStyles = () => {
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

  return (
    <section 
      style={getToneStyles()}
      className={className}
    >
      {children}
    </section>
  );
};

export default AioSection;