import React, { useCallback, useMemo, useRef, useState } from 'react'
import FeedbackContext from './feedback-context'
import ConfirmationModal from './ConfirmationModal'
import FeedbackModal from './FeedbackModal'

const normalizeOptions = (options) => (
    typeof options === 'string' ? { message: options } : options ?? {}
)

const FeedbackProvider = ({ children }) => {
    const [feedback, setFeedback] = useState(null)
    const [confirmation, setConfirmation] = useState(null)
    const feedbackRef = useRef(null)
    const confirmationResolverRef = useRef(null)

    const showFeedback = useCallback((options) => {
        const nextFeedback = normalizeOptions(options)
        feedbackRef.current = nextFeedback
        setFeedback(nextFeedback)
    }, [])

    const closeFeedback = useCallback(() => {
        const onClose = feedbackRef.current?.onClose
        feedbackRef.current = null
        setFeedback(null)
        onClose?.()
    }, [])

    const showError = useCallback((options) => {
        showFeedback({ ...normalizeOptions(options), type: 'error' })
    }, [showFeedback])

    const showSuccess = useCallback((options) => {
        showFeedback({ ...normalizeOptions(options), type: 'success' })
    }, [showFeedback])

    const showWarning = useCallback((options) => {
        showFeedback({ ...normalizeOptions(options), type: 'warning' })
    }, [showFeedback])

    const showConfirmation = useCallback((options = {}) => new Promise((resolve) => {
        confirmationResolverRef.current?.(false)
        confirmationResolverRef.current = resolve
        setConfirmation(normalizeOptions(options))
    }), [])

    const resolveConfirmation = useCallback((confirmed) => {
        const resolve = confirmationResolverRef.current
        confirmationResolverRef.current = null
        setConfirmation(null)
        resolve?.(confirmed)
    }, [])

    const value = useMemo(() => ({
        showFeedback,
        showError,
        showSuccess,
        showWarning,
        showConfirmation,
        closeFeedback
    }), [closeFeedback, showConfirmation, showError, showFeedback, showSuccess, showWarning])

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            <FeedbackModal
                isOpen={Boolean(feedback)}
                type={feedback?.type}
                title={feedback?.title}
                message={feedback?.message}
                actionLabel={feedback?.actionLabel}
                onClose={closeFeedback}
            />
            <ConfirmationModal
                isOpen={Boolean(confirmation)}
                title={confirmation?.title}
                confirmLabel={confirmation?.confirmLabel}
                cancelLabel={confirmation?.cancelLabel}
                onConfirm={() => resolveConfirmation(true)}
                onCancel={() => resolveConfirmation(false)}
            />
        </FeedbackContext.Provider>
    )
}

export default FeedbackProvider
