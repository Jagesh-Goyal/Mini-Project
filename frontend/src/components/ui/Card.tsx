import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <section className={`card ${className}`}>
      {title && <h3 className="card-title mb-4">{title}</h3>}
      {children}
    </section>
  );
}
