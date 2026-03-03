import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Users, TrendingUp } from 'lucide-react'

const stats = [
  {
    icon: BookOpen,
    value: 9868,
    suffix: '+',
    label: 'Playlists Managed',
    color: '#a855f7',
    underlineColor: '#7c3aed',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    iconColor: '#c084fc',
  },
  {
    icon: Clock,
    value: 49341,
    suffix: '+',
    label: 'Hours of Learning Tracked',
    color: '#ec4899',
    underlineColor: '#be185d',
    gradient: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
    iconColor: '#f9a8d4',
  },
  {
    icon: Users,
    value: 24671,
    suffix: '+',
    label: 'Active Learners',
    color: '#f97316',
    underlineColor: '#ea580c',
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
    iconColor: '#fdba74',
  },
  {
    icon: TrendingUp,
    value: 94,
    suffix: '%',
    label: 'Completion Rate',
    color: '#facc15',
    underlineColor: '#eab308',
    gradient: 'linear-gradient(135deg, #713f12 0%, #facc15 100%)',
    iconColor: '#fde68a',
  },
]

function useCountUp(target, duration = 2000, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])
  return count
}

function StatCard({ stat, index }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.4 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const count = useCountUp(stat.value, 2200, visible)

  return (
    <motion.div
      ref={ref}
      className="stats-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
    >
      {/* Small icon box */}
      <div className="stats-card-icon" style={{ background: stat.gradient }}>
        <stat.icon size={16} color={stat.iconColor} strokeWidth={2} />
      </div>

      {/* Number */}
      <div className="stats-card-number" style={{ color: stat.color }}>
        {count.toLocaleString()}{stat.suffix}
      </div>

      {/* Label */}
      <div className="stats-card-label">{stat.label}</div>

      {/* Colored underline */}
      <div className="stats-card-underline" style={{ background: stat.underlineColor }} />
    </motion.div>
  )
}

const Stats = () => {
  return (
    <section className="stats-section-new">
      <div className="stats-inner">
        <motion.h2
          className="stats-heading"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Trusted by Learners{' '}
          <span className="stats-heading-gradient">Worldwide</span>
        </motion.h2>

        <div className="stats-cards-row">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>

        {/* University trust row */}
        <motion.div
          className="stats-universities"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <p className="stats-uni-label">Trusted by learners from</p>
          <div className="stats-uni-names">
            {['Stanford', 'MIT', 'Harvard', 'Berkeley', 'Oxford'].map((uni, i) => (
              <span key={i} className="stats-uni-name">{uni}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Stats
