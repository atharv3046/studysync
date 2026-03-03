import React, { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Tilt from 'react-parallax-tilt'
import HowItWorks from '../components/HowItWorks'
import Stats from '../components/Stats'
import { Bookmark, BarChart2, Play, FolderOpen, ArrowRight, Clock, PlayCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ParticleBackground from '../components/ParticleBackground'

/* ── Why StudySync features ── */
const WHY_FEATURES = [
  {
    icon: Bookmark,
    title: 'Save Playlists',
    desc: 'Instantly save any YouTube playlist with a single click. Build your learning library effortlessly.',
    gradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
    iconColor: '#c084fc',
    underline: '#7c3aed',
  },
  {
    icon: BarChart2,
    title: 'Track Progress',
    desc: "Monitor your learning journey video by video. See exactly how much you've completed.",
    gradient: 'linear-gradient(135deg, #831843, #ec4899)',
    iconColor: '#f9a8d4',
    underline: '#ec4899',
  },
  {
    icon: Play,
    title: 'Resume Learning',
    desc: 'Pick up exactly where you left off. Never lose your place in any course or tutorial series.',
    gradient: 'linear-gradient(135deg, #be185d, #f97316)',
    iconColor: '#fdba74',
    underline: '#f97316',
  },
  {
    icon: FolderOpen,
    title: 'Stay Organized',
    desc: 'Keep all your learning materials in one place. Create custom categories and collections.',
    gradient: 'linear-gradient(135deg, #713f12, #eab308)',
    iconColor: '#fde68a',
    underline: '#eab308',
  },
]

/* ── Demo cards for Dashboard Preview section ── */
const DEMO_CARDS = [
  {
    title: 'Complete React Mastery',
    channel: 'Tech with Tim',
    videos: 48,
    hours: '24h 30m',
    progress: 65,
    badge: 'Web Development',
    thumb: 'https://picsum.photos/seed/reactcode/640/360',
    gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    overlayGrad: 'linear-gradient(180deg, rgba(109,40,217,0.5) 0%, rgba(124,58,237,0.75) 100%)',
    progressGrad: 'linear-gradient(90deg, #7c3aed, #a855f7)',
    progressColor: '#a855f7',
    badgeBg: 'rgba(20, 10, 40, 0.85)',
  },
  {
    title: 'Python for Data Science',
    channel: 'DataCamp',
    videos: 32,
    hours: '18h 45m',
    progress: 42,
    badge: 'Data Science',
    thumb: 'https://picsum.photos/seed/pythondata/640/360',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    overlayGrad: 'linear-gradient(180deg, rgba(219,39,119,0.45) 0%, rgba(236,72,153,0.7) 100%)',
    progressGrad: 'linear-gradient(90deg, #db2777, #ec4899)',
    progressColor: '#ec4899',
    badgeBg: 'rgba(40, 10, 25, 0.85)',
  },
]

/* ── Animated scroll indicator ── */
const ScrollIndicator = () => (
  <motion.div
    className="hv2-scroll-wrap"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.1, duration: 0.6 }}
  >
    <motion.div
      className="hv2-scroll-mouse"
      animate={{ y: [0, 6, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="hv2-scroll-dot"
        animate={{ y: [0, 7, 0], opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
      />
    </motion.div>
  </motion.div>
)

const Home = () => {
  const { user } = useAuth()
  const [userPlaylists, setUserPlaylists] = useState([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserPlaylists()
    }
  }, [user])

  const fetchUserPlaylists = async () => {
    setLoadingPlaylists(true)
    try {
      const { data: playlistsData } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .limit(4)
        .order('created_at', { ascending: false })

      if (playlistsData && playlistsData.length > 0) {
        // Fetch progress for each playlist to calculate %
        const enhancedPlaylists = await Promise.all(playlistsData.map(async (p) => {
          // Fetch videos to get total count and first video for thumb
          const { data: videos } = await supabase
            .from('videos')
            .select('id, youtube_video_id')
            .eq('playlist_id', p.id)
            .order('position', { ascending: true })

          const vIds = videos?.map(v => v.id) || []
          const firstVideoId = videos && videos.length > 0 ? videos[0].youtube_video_id : null

          const { data: prog } = await supabase
            .from('progress')
            .select('is_completed')
            .eq('user_id', user.id)
            .in('video_id', vIds)

          const completed = prog?.filter(pr => pr.is_completed).length || 0
          const total = vIds.length
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0

          return {
            ...p,
            progress: percent,
            totalVideos: total,
            // Match demo card structure with reliable thumb
            thumb: firstVideoId
              ? `https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`
              : `https://picsum.photos/seed/${p.id}/640/360`,
            badge: 'Courses',
            hours: `${Math.floor((total * 15) / 60)}h ${(total * 15) % 60}m`
          }
        }))
        setUserPlaylists(enhancedPlaylists)
      } else {
        setUserPlaylists([])
      }
    } catch (err) {
      console.error('Error fetching home playlists:', err)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const displayCards = (user && userPlaylists.length > 0) ? userPlaylists : DEMO_CARDS

  return (
    <div className="hv2-page">

      {/* ══════════════════════ SECTION 1 · HERO ══════════════════════ */}
      <section className="hv2-hero">
        <div className="hv2-hero-bg" />
        <ParticleBackground />

        <div className="hv2-hero-content">
          {/* Badge */}
          <motion.div
            className="hv2-badge"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <span className="hv2-badge-star">✦</span>
            The Future of YouTube Learning
          </motion.div>

          {/* Main heading */}
          <motion.h1
            className="hv2-hero-heading"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
          >
            <span className="hv2-ht-purple">Master Learning</span>
            <br />
            <span className="hv2-ht-white">with YouTube </span>
            <span className="hv2-ht-yellow">Playlists</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="hv2-hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Transform scattered YouTube videos into structured learning paths.<br />
            Track progress, resume seamlessly, and achieve your goals faster.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="hv2-hero-btns"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 }}
          >
            {user ? (
              <motion.div whileHover={{ y: -5, x: 5 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <Link to="/dashboard" className="hv2-btn-primary">
                  Go to Dashboard <ArrowRight size={15} />
                </Link>
              </motion.div>
            ) : (
              <>
                <motion.div whileHover={{ y: -5, x: -5 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                  <Link to="/signup" className="hv2-btn-primary">
                    Get Started Free <ArrowRight size={15} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -5, x: 5 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                  <Link to="/login" className="hv2-btn-outline">
                    Sign In
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mini stats row */}
          <motion.div
            className="hv2-hero-ministats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
          >
            {[
              { num: '10K+', label: 'Playlists Tracked' },
              { num: '50K+', label: 'Hours Learned' },
              { num: '95%', label: 'Completion Rate' },
            ].map((s, i) => (
              <React.Fragment key={i}>
                <div className="hv2-ministat">
                  <span className="hv2-ministat-num">{s.num}</span>
                  <span className="hv2-ministat-label">{s.label}</span>
                </div>
                {i < 2 && <span className="hv2-ministat-sep">·</span>}
              </React.Fragment>
            ))}
          </motion.div>

          {/* Scroll indicator */}
          <ScrollIndicator />
        </div>
      </section>

      {/* ══════════════════════ SECTION 2 · WHY STUDYSYNC ══════════════════════ */}
      <section className="hv2-why">
        <div className="hv2-container">
          <motion.div
            className="hv2-sec-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="hv2-sec-title hv2-purple-text">Why StudySync?</h2>
            <p className="hv2-sec-sub">
              Transform the way you learn with powerful features designed for serious learners
            </p>
          </motion.div>

          <div className="hv2-why-grid">
            {WHY_FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                className="hv2-why-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="hv2-why-icon" style={{ background: feat.gradient }}>
                  <feat.icon size={20} color={feat.iconColor} strokeWidth={1.8} />
                </div>
                <h3 className="hv2-why-title">{feat.title}</h3>
                <p className="hv2-why-desc">{feat.desc}</p>
                <div className="hv2-why-line" style={{ background: feat.underline }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ SECTION 3 · DASHBOARD PREVIEW ══════════════════════ */}
      <section className="hv2-dash-preview">
        <div className="hv2-container">
          <motion.div
            className="hv2-sec-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="hv2-dash-heading">
              <span className="hv2-purple-text">
                {user && userPlaylists.length > 0 ? 'Your Learning' : 'Your Learning'}
              </span>
              <span className="hv2-yellow-text"> Dashboard</span>
            </h2>
            <p className="hv2-sec-sub">
              {user && userPlaylists.length > 0
                ? "Pick up where you left off with your personalized courses"
                : "Beautiful, organized playlists with real-time progress tracking"}
            </p>
          </motion.div>

          <div className="hv2-demo-grid" style={{ gridTemplateColumns: displayCards.length === 1 ? '1fr' : 'repeat(2, 1fr)' }}>
            {displayCards.map((card, i) => (
              <Tilt
                key={card.id || i}
                tiltMaxAngleX={12}
                tiltMaxAngleY={12}
                perspective={1000}
                scale={1.02}
                transitionSpeedMs={1500}
                gyroscope={true}
                className="hv2-tilt-card"
              >
                <Link to={card.id ? `/playlist/${card.id}` : '#'}>
                  <motion.div
                    className="hv2-demo-card"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65, delay: i * 0.15 }}
                  >
                    {/* Thumbnail */}
                    <div className="hv2-demo-thumb">
                      <img
                        src={card.thumb}
                        alt={card.title}
                        className="hv2-demo-img"
                        onError={e => { e.currentTarget.src = 'https://i.ytimg.com/vi/default/hqdefault.jpg' }}
                      />
                      <div className="hv2-demo-overlay" style={{ background: card.overlayGrad || 'rgba(0,0,0,0.4)' }} />
                      <span className="hv2-demo-badge" style={{ background: card.badgeBg || '#7c3aed' }}>
                        {card.badge}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="hv2-demo-body">
                      <h3 className="hv2-demo-title">{card.title}</h3>
                      <p className="hv2-demo-channel">{card.channel_title || card.channel}</p>
                      <div className="hv2-demo-meta">
                        <span className="hv2-demo-meta-item"><PlayCircle size={13} /> {card.totalVideos || card.videos} videos</span>
                        <span className="hv2-demo-meta-item"><Clock size={13} /> {card.hours}</span>
                      </div>

                      {/* Progress */}
                      <div className="hv2-demo-prog-wrap">
                        <div className="hv2-demo-prog-header">
                          <span>Progress</span>
                          <span style={{ color: card.progressColor || '#a78bfa', fontWeight: 800 }}>{card.progress}%</span>
                        </div>
                        <div className="hv2-demo-prog-track">
                          <motion.div
                            className="hv2-demo-prog-fill"
                            style={{ background: card.progressGrad || 'linear-gradient(90deg, #7c3aed, #ec4899)' }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${card.progress}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: i * 0.2 + 0.4, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* Gradient CTA */}
                      <div className="hv2-demo-btn" style={{ background: card.gradient || 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                        <Play size={14} fill="white" strokeWidth={0} />
                        Continue Learning
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </Tilt>
            ))}
          </div>

          {/* View All link */}
          {user && (
            <motion.div
              className="hv2-view-all"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              style={{ textAlign: 'center', marginTop: '3rem' }}
            >
              <Link to="/dashboard" className="hv2-btn-outline" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
                View All Your Playlists <ArrowRight size={14} style={{ marginLeft: '0.5rem' }} />
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="hv2-footer">
        <p>© 2025 StudySync. Built for modern learners.</p>
      </footer>

    </div>
  )
}

export default Home
