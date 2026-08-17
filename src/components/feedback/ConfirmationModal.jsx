import React, { useEffect, useId, useRef } from 'react'
import './ConfirmationModal.css'

const ConfirmationModal = ({
    isOpen,
    title = 'Tem certeza que deseja realizar essa ação?',
    confirmLabel = 'Sim',
    cancelLabel = 'Não',
    onConfirm,
    onCancel
}) => {
    const dialogRef = useRef(null)
    const confirmRef = useRef(null)
    const titleId = useId()

    useEffect(() => {
        if (!isOpen) return undefined

        const previousFocus = document.activeElement
        const previousOverflow = document.body.style.overflow
        const focusTimer = window.requestAnimationFrame(() => confirmRef.current?.focus())

        document.body.style.overflow = 'hidden'

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onCancel?.()
                return
            }

            if (event.key !== 'Tab') return

            const focusableElements = dialogRef.current?.querySelectorAll('button:not(:disabled)')
            if (!focusableElements?.length) return

            const firstElement = focusableElements[0]
            const lastElement = focusableElements[focusableElements.length - 1]

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault()
                lastElement.focus()
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault()
                firstElement.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)

        return () => {
            window.cancelAnimationFrame(focusTimer)
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousOverflow
            previousFocus?.focus?.()
        }
    }, [isOpen, onCancel])

    if (!isOpen) return null

    return (
        <div
            className="confirmation-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onCancel?.()
            }}
        >
            <section
                ref={dialogRef}
                className="confirmation-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <button
                    type="button"
                    className="confirmation-close"
                    onClick={onCancel}
                    aria-label="Cancelar e fechar"
                >
                    <img src="/imgs/feedback/close.svg" alt="" aria-hidden="true" />
                </button>

                <div className="confirmation-icon" aria-hidden="true">
                    <img src="/imgs/feedback/warning.svg" alt="" />
                </div>

                <h2 id={titleId}>{title}</h2>

                <div className="confirmation-actions">
                    <button
                        ref={confirmRef}
                        type="button"
                        className="confirmation-button confirmation-button-yes"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        type="button"
                        className="confirmation-button confirmation-button-no"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                </div>
            </section>
        </div>
    )
}

export default ConfirmationModal
