import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

export default function Modal({ open, title, children, onClose, className = '' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-dialog ${className}`}>
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <h2 className="modal-header">{title}</h2>
        {children}
      </div>
    </div>
  );
}
