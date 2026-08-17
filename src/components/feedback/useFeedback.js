import { useContext } from 'react'
import FeedbackContext from './feedback-context'

const useFeedback = () => {
    const feedback = useContext(FeedbackContext)

    if (!feedback) {
        throw new Error('useFeedback deve ser usado dentro de FeedbackProvider.')
    }

    return feedback
}

export default useFeedback
