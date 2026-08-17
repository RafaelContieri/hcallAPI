import React, { useEffect, useId, useRef } from 'react'
import './FeedbackModal.css'

const FEEDBACK_TYPES = {
    error: {
        title: 'Ocorreu um erro',
        icon: '/imgs/feedback/error.svg'
    },
    success: {
        title: 'Sucesso !',
        icon: '/imgs/feedback/success.svg'
    },
    warning: {
        title: 'Atenção',
        icon: '/imgs/feedback/warning.svg'
    }
}

const FeedbackModal = ({
    isOpen,
    type = 'warning',
    title,
    message,
    actionLabel = 'Ok',
    onClose
}) => {
    const dialogRef = useRef(null)
    const actionRef = useRef(null)
    const titleId = useId()
    const messageId = useId()
    const config = FEEDBACK_TYPES[type] ?? FEEDBACK_TYPES.warning

    useEffect(() => {
        if (!isOpen) return undefined

        const previousFocus = document.activeElement
        const previousOverflow = document.body.style.overflow
        const focusTimer = window.requestAnimationFrame(() => actionRef.current?.focus())

        document.body.style.overflow = 'hidden'

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose?.()
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
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            className="feedback-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose?.()
            }}
        >
            <section
                ref={dialogRef}
                className="feedback-dialog"
                data-feedback-type={type}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={message ? messageId : undefined}
            >
                <button
                    type="button"
                    className="feedback-close"
                    onClick={onClose}
                    aria-label="Fechar mensagem"
                >
                    <img src="/imgs/feedback/close.svg" alt="" aria-hidden="true" />
                </button>

                <div className={`feedback-icon feedback-icon-${type}`} aria-hidden="true">
                    <img src={config.icon} alt="" />
                </div>

                <div className="feedback-copy">
                    <h2 id={titleId}>{title || config.title}</h2>
                    {message && <p id={messageId}>{message}</p>}
                </div>

                <button
                    ref={actionRef}
                    type="button"
                    className="feedback-action"
                    onClick={onClose}
                >
                    {actionLabel}
                </button>
            </section>
        </div>
    )
}

export default FeedbackModal
