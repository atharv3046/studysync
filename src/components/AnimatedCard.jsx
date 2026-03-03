import React, { useState, useEffect } from 'react'
import Tilt from 'react-parallax-tilt'
import { motion } from 'framer-motion'

const AnimatedCard = ({ title, description, icon: Icon, color }) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Tilt
      perspective={1000}
      glareEnable={!isMobile}
      glareMaxOpacity={0.45}
      scale={isMobile ? 1 : 1.05}
      tiltEnable={!isMobile}
      gyroscope={true}
      className="card-tilt"
    >
      <motion.div
        whileHover={{ boxShadow: `0 0 30px ${color}44` }}
        className="feature-card glass"
      >
        <div className="card-icon" style={{ backgroundColor: `${color}22`, color: color }}>
          <Icon size={32} />
        </div>
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>

        <div className="card-glow" style={{ background: color }}></div>
      </motion.div>

    </Tilt>
  )
}

export default AnimatedCard
