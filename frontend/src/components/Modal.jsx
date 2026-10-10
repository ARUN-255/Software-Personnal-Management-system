import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({
  title,
  children,
  onClose
}) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      previousFocus?.focus();
    };
  }, []);
  return <dialog ref={dialog} className="modal" aria-labelledby={titleId} onCancel={onClose} onClick={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <div className="modal-inner">
      <header>
        <h2 id={titleId}>
          {title}
        </h2>
        <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X />
        </button>
      </header>
      {children}
    </div>
  </dialog>;
}
