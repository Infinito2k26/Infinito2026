"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./modal.module.css";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

const Modal = ({ open, onClose, title, children }: ModalProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    if (!mounted || !open) return null;

    const modalRoot = document.getElementById("modal-root");
    if (!modalRoot) return null;

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className={styles.backdrop} onMouseDown={handleBackdropClick}>
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                {title && (
                    <div className={styles.header}>
                        <span className={styles.title}>{title}</span>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className={styles.body}>{children}</div>
            </div>
        </div>,
        modalRoot
    );
};

export default Modal;