import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
      </div>

      <div className="container hero-content">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="hero-text"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="premium-badge"
          >
            <Sparkles size={14} className="accent-icon" />
            <span>The Future of Learning is Here</span>
          </motion.div>

          <h1 className="hero-title">
            Master Learning with <br />
            <span className="purple-gradient">YouTube Playlists</span>
          </h1>

          <p className="hero-description">
            Experience a new way of learning. Organize, track, and master any subject with StudySync. The premium learning manager for the modern student.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn-glow">Get Started Free</Link>
            <Link to="/login" className="btn-outline">Sign In</Link>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
          className="dashboard-preview"
        >
          <div className="preview-glass glass">
            <div className="preview-header">
              <div className="dots"><span></span><span></span><span></span></div>
              <div className="address-bar">studysync.app/dashboard</div>
            </div>
            <div className="preview-content">
              <div className="preview-sidebar"></div>
              <div className="preview-main">
                <div className="preview-card"></div>
                <div className="preview-card"></div>
                <div className="preview-card"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  )
}

export default Hero
