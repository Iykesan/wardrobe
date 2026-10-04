"use client";

import { useEffect, useId, useRef } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Dialog"}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        )).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="fixed m-auto max-h-[calc(100vh-3rem)] w-[calc(100%-3rem)] max-w-2xl overflow-y-auto rounded-[var(--radius-card)] border border-border bg-canvas p-6 text-ink shadow-[var(--shadow-soft)] backdrop:bg-black/20 backdrop:backdrop-blur-sm"
    >
      {title && (
        <h2 id={titleId} className="mb-4 text-lg font-semibold text-ink">{title}</h2>
      )}
      {children}
    </dialog>
  );
}
