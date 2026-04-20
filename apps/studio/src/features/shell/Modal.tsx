"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { CloseIcon } from "./icons";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon style={{ width: 12, height: 12 }} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
