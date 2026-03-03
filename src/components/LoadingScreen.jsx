import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Generate stable random particles once (not on every render)
const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1.5,
  opacity: Math.random() * 0.25 + 0.05,
  delay: Math.random() * 3,
  duration: Math.random() * 4 + 3,
}))

const LoadingScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Animate progress from 0 → 100 over ~2.2s
    const totalDuration = 2200
    const interval = 16
    const steps = totalDuration / interval
    let current = 0

    const timer = setInterval(() => {
      current += 1
      const pct = Math.min(Math.round((current / steps) * 100), 100)
      setProgress(pct)

      if (pct >= 100) {
        clearInterval(timer)
        // Brief pause at 100% before fading out
        setTimeout(() => setDone(true), 350)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [])

  // Once done, the framer-motion exit runs, then onFinish fires
  useEffect(() => {
    if (done) {
      // onFinish called after exit animation (~600ms)
      const t = setTimeout(onFinish, 600)
      return () => clearTimeout(t)
    }
  }, [done, onFinish])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="ls-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
        >
          {/* Radial purple glow background */}
          <div className="ls-glow" />

          {/* Particle dots */}
          {PARTICLES.map(p => (
            <motion.div
              key={p.id}
              className="ls-particle"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
              }}
              animate={{ y: [0, -12, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Center content */}
          <div className="ls-content">
            {/* Logo icon */}
            <motion.div
              className="ls-icon"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            >
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                <circle cx="21" cy="21" r="21" fill="url(#iconGrad)" />
                <polygon points="17,13 31,21 17,29" fill="white" />
                <defs>
                  <linearGradient id="iconGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* "StudySync" title */}
            <motion.h1
              className="ls-title"
              initial={{ scale: 0.85, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              StudySync
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="ls-subtitle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              YouTube Learning, Organized
            </motion.p>

            {/* Progress bar */}
            <motion.div
              className="ls-bar-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              <div className="ls-bar-track">
                <motion.div
                  className="ls-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="ls-bar-pct">{progress}%</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LoadingScreen
