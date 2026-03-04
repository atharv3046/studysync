import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Target, RotateCcw, ChevronRight, Clock } from 'lucide-react'
import { generateQuestions } from '../utils/generateQuestions'
import { supabase } from '../services/supabase'

// --- Star Rating ---
const getStarRating = (percent) => {
    if (percent === 100) return { stars: 5, label: 'Perfect score! 🏆' }
    if (percent >= 80) return { stars: 4, label: 'Great job!' }
    if (percent >= 50) return { stars: 3, label: 'Good job!' }
    if (percent >= 40) return { stars: 2, label: 'Keep going!' }
    return { stars: 1, label: 'Keep practicing!' }
}

const Stars = ({ count }) => (
    <div className="quiz-stars">
        {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`quiz-star ${i <= count ? 'filled' : 'empty'}`}>⭐</span>
        ))}
    </div>
)

// --- Timer ---
const Timer = ({ seconds, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(seconds)

    useEffect(() => {
        setTimeLeft(seconds)
    }, [seconds])

    useEffect(() => {
        if (timeLeft <= 0) {
            onExpire()
            return
        }
        const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
        return () => clearTimeout(t)
    }, [timeLeft, onExpire])

    const pct = (timeLeft / seconds) * 100
    const urgentColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#8b5cf6'

    return (
        <div className="quiz-timer-wrap">
            <Clock size={14} color={urgentColor} />
            <div className="quiz-timer-bar-track">
                <div
                    className="quiz-timer-bar-fill"
                    style={{ width: `${pct}%`, background: urgentColor }}
                />
            </div>
            <span className="quiz-timer-text" style={{ color: urgentColor }}>{timeLeft}s</span>
        </div>
    )
}

// ========================
// MAIN COMPONENT
// ========================
const QuizMode = ({ videos, playlistTitle, userId, playlistId, onClose }) => {
    const [screen, setScreen] = useState('start') // 'start' | 'question' | 'results'
    const [questions, setQuestions] = useState([])
    const [currentQ, setCurrentQ] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [answered, setAnswered] = useState(false)
    const [score, setScore] = useState(0)
    const [direction, setDirection] = useState(1) // slide direction
    const [bestScore, setBestScore] = useState(null)
    const [timerKey, setTimerKey] = useState(0)

    // Fetch best previous score on mount
    useEffect(() => {
        if (!userId || !playlistId) return
        const fetch = async () => {
            const { data } = await supabase
                .from('quizzes')
                .select('score, total')
                .eq('user_id', userId)
                .eq('playlist_id', playlistId)
                .order('score', { ascending: false })
                .limit(1)
                .single()
            if (data) setBestScore(data)
        }
        fetch()
    }, [userId, playlistId])

    const startQuiz = () => {
        const qs = generateQuestions(videos)
        setQuestions(qs)
        setCurrentQ(0)
        setScore(0)
        setSelectedAnswer(null)
        setAnswered(false)
        setTimerKey((k) => k + 1)
        setScreen('question')
    }

    const handleSelect = (option) => {
        if (answered) return
        setSelectedAnswer(option)
        setAnswered(true)
        if (option === questions[currentQ].correct) {
            setScore((s) => s + 1)
        }
    }

    const handleTimerExpire = useCallback(() => {
        if (!answered) {
            setAnswered(true)
            setSelectedAnswer(null) // no selection = wrong
        }
    }, [answered])

    const handleNext = async () => {
        if (currentQ < questions.length - 1) {
            setDirection(1)
            setCurrentQ((q) => q + 1)
            setSelectedAnswer(null)
            setAnswered(false)
            setTimerKey((k) => k + 1)
        } else {
            // Save score
            if (userId && playlistId) {
                await supabase.from('quizzes').insert({
                    user_id: userId,
                    playlist_id: playlistId,
                    score,
                    total: questions.length,
                })
                // Refresh best score
                const { data } = await supabase
                    .from('quizzes')
                    .select('score, total')
                    .eq('user_id', userId)
                    .eq('playlist_id', playlistId)
                    .order('score', { ascending: false })
                    .limit(1)
                    .single()
                if (data) setBestScore(data)
            }
            setScreen('results')
        }
    }

    const getOptionClass = (option) => {
        if (!answered) return 'quiz-option'
        if (option === questions[currentQ].correct) return 'quiz-option correct'
        if (option === selectedAnswer) return 'quiz-option wrong'
        return 'quiz-option dim'
    }

    const q = questions[currentQ]
    const totalQ = questions.length
    const percent = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0
    const { stars, label } = getStarRating(percent)

    // Slide animation variants
    const slideVariants = {
        enter: (d) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        exit: (d) => ({ x: d > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.18 } }),
    }

    return (
        <div className="quiz-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
            <AnimatePresence mode="wait">

                {/* ---- START SCREEN ---- */}
                {screen === 'start' && (
                    <motion.div
                        key="start"
                        className="quiz-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <button className="quiz-close-btn" onClick={onClose}><X size={20} /></button>

                        <div className="quiz-start-icon">🎯</div>
                        <h2 className="quiz-start-title">Quiz Mode</h2>
                        <div className="quiz-start-divider" />
                        <p className="quiz-start-subtitle">
                            Test your knowledge of:<br />
                            <span className="quiz-playlist-name">"{playlistTitle}"</span>
                        </p>
                        <p className="quiz-start-meta">
                            {Math.min(10, videos.length)} questions • Multiple choice • 30s per question
                        </p>

                        {bestScore && (
                            <div className="quiz-best-score">
                                <Trophy size={14} />
                                Best score: <strong>{bestScore.score}/{bestScore.total}</strong>
                                &nbsp;({Math.round((bestScore.score / bestScore.total) * 100)}%)
                            </div>
                        )}

                        {videos.length < 4 && (
                            <p className="quiz-warning">⚠️ Add at least 4 videos to enable Quiz Mode.</p>
                        )}

                        <div className="quiz-start-actions">
                            <button
                                className="quiz-btn-primary"
                                onClick={startQuiz}
                                disabled={videos.length < 4}
                            >
                                Start Quiz
                            </button>
                            <button className="quiz-btn-secondary" onClick={onClose}>Cancel</button>
                        </div>
                    </motion.div>
                )}

                {/* ---- QUESTION SCREEN ---- */}
                {screen === 'question' && q && (
                    <motion.div
                        key="question-screen"
                        className="quiz-card quiz-card-question"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                    >
                        <button className="quiz-close-btn" onClick={onClose}><X size={20} /></button>

                        {/* Top progress bar */}
                        <div className="quiz-top-bar">
                            <span className="quiz-q-label">Question {currentQ + 1} of {totalQ}</span>
                            <div className="quiz-progress-track">
                                <motion.div
                                    className="quiz-progress-fill"
                                    animate={{ width: `${((currentQ + (answered ? 1 : 0)) / totalQ) * 100}%` }}
                                    transition={{ duration: 0.4 }}
                                />
                            </div>
                        </div>

                        {/* Timer */}
                        {!answered && (
                            <Timer key={timerKey} seconds={30} onExpire={handleTimerExpire} />
                        )}

                        {/* Question text with slide animation */}
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentQ}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                            >
                                <h3 className="quiz-question-text">{q.question}</h3>

                                <div className="quiz-options-grid">
                                    {q.options.map((option, i) => (
                                        <motion.button
                                            key={i}
                                            className={getOptionClass(option)}
                                            onClick={() => handleSelect(option)}
                                            whileHover={!answered ? { scale: 1.02 } : {}}
                                            whileTap={!answered ? { scale: 0.98 } : {}}
                                        >
                                            <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                                            <span className="quiz-option-text">{option}</span>
                                            {answered && option === q.correct && (
                                                <span className="quiz-correct-badge">✓</span>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>

                                {answered && selectedAnswer !== q.correct && (
                                    <motion.p
                                        className="quiz-wrong-msg"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {selectedAnswer === null
                                            ? "⏱️ Time's up! The correct answer is highlighted in green."
                                            : '❌ Wrong! The correct answer is highlighted in green.'}
                                    </motion.p>
                                )}
                                {answered && selectedAnswer === q.correct && (
                                    <motion.p
                                        className="quiz-correct-msg"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        ✅ Correct!
                                    </motion.p>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {answered && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <button className="quiz-btn-primary quiz-next-btn" onClick={handleNext}>
                                    {currentQ < totalQ - 1 ? (
                                        <><ChevronRight size={18} /> Next Question</>
                                    ) : (
                                        <><Trophy size={18} /> See Results</>
                                    )}
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* ---- RESULTS SCREEN ---- */}
                {screen === 'results' && (
                    <motion.div
                        key="results"
                        className="quiz-card quiz-card-results"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <button className="quiz-close-btn" onClick={onClose}><X size={20} /></button>

                        <motion.div
                            className="quiz-results-emoji"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
                        >
                            🎉
                        </motion.div>

                        <h2 className="quiz-results-title">Quiz Complete!</h2>

                        <motion.div
                            className="quiz-score-display"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="quiz-score-num">{score}</span>
                            <span className="quiz-score-sep">/</span>
                            <span className="quiz-score-total">{totalQ}</span>
                            <span className="quiz-score-pct">({percent}%)</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                        >
                            <Stars count={stars} />
                            <p className="quiz-star-label">{label}</p>
                        </motion.div>

                        {bestScore && (
                            <motion.div
                                className="quiz-best-score"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Trophy size={14} />
                                Best score: <strong>{bestScore.score}/{bestScore.total}</strong>
                                &nbsp;({Math.round((bestScore.score / bestScore.total) * 100)}%)
                            </motion.div>
                        )}

                        <motion.div
                            className="quiz-start-actions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button className="quiz-btn-primary" onClick={startQuiz}>
                                <RotateCcw size={16} /> Retry Quiz
                            </button>
                            <button className="quiz-btn-secondary" onClick={onClose}>
                                Back to Playlist
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default QuizMode
