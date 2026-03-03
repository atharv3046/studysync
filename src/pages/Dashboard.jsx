import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Youtube, Trash2, Play, Clock, PlayCircle, BarChart2 } from 'lucide-react'
import { extractPlaylistId, fetchPlaylistDetails, fetchPlaylistItems } from '../services/youtube'
import Tilt from 'react-parallax-tilt'
import ParticleBackground from '../components/ParticleBackground'
import SkeletonCard from '../components/SkeletonCard'

// Gradient themes cycling through 4 options
const GRADIENT_THEMES = [
    {
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        border: 'rgba(124, 58, 237, 0.45)',
        glow: 'rgba(124, 58, 237, 0.25)',
        progressGrad: 'linear-gradient(90deg, #7c3aed, #a855f7)',
        badge: '#7c3aed',
        category: 'Web Development',
    },
    {
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        border: 'rgba(236, 72, 153, 0.45)',
        glow: 'rgba(236, 72, 153, 0.25)',
        progressGrad: 'linear-gradient(90deg, #db2777, #ec4899)',
        badge: '#db2777',
        category: 'Data Science',
    },
    {
        gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
        border: 'rgba(249, 115, 22, 0.45)',
        glow: 'rgba(249, 115, 22, 0.25)',
        progressGrad: 'linear-gradient(90deg, #f97316, #ec4899)',
        badge: '#f97316',
        category: 'Design',
    },
    {
        gradient: 'linear-gradient(135deg, #eab308 0%, #7c3aed 100%)',
        border: 'rgba(234, 179, 8, 0.45)',
        glow: 'rgba(234, 179, 8, 0.22)',
        progressGrad: 'linear-gradient(90deg, #eab308, #a855f7)',
        badge: '#eab308',
        category: 'AI & ML',
    },
]

// Count-up hook
function useCountUp(target, duration = 800, trigger = true) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (!trigger || !target) return
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
    }, [trigger, target, duration])
    return count
}

// YouTube thumbnail URL from playlist ID
function getYTThumbnail(youtubePlaylistId) {
    // Use the playlist thumbnail endpoint via the first video heuristic
    // Best quality: maxresdefault → hqdefault fallback via onerror
    return `https://i.ytimg.com/vi/${youtubePlaylistId}/hqdefault.jpg`
}

// Individual playlist card component
function PlaylistCard({ playlist, theme, index, onDelete }) {
    const [hovered, setHovered] = useState(false)
    const [progressData, setProgressData] = useState({ completed: 0, total: playlist.total_videos || 0 })
    const { user } = useAuth()

    const progressPercent =
        progressData.total > 0
            ? Math.round((progressData.completed / progressData.total) * 100)
            : 0

    const animatedCompleted = useCountUp(progressData.completed, 600, true)
    const animatedTotal = useCountUp(progressData.total, 600, true)
    const animatedPercent = useCountUp(progressPercent, 700, true)

    useEffect(() => {
        const fetchProgress = async () => {
            if (!user || !playlist.id) return
            // Fetch videos for this playlist
            const { data: videos } = await supabase
                .from('videos')
                .select('id')
                .eq('playlist_id', playlist.id)

            if (!videos || videos.length === 0) return

            const { data: prog } = await supabase
                .from('progress')
                .select('is_completed')
                .eq('user_id', user.id)
                .in('video_id', videos.map(v => v.id))

            const completedCount = (prog || []).filter(p => p.is_completed).length
            setProgressData({ completed: completedCount, total: videos.length })
        }
        fetchProgress()
    }, [playlist.id, user])

    // Thumbnail: use YouTube playlist cover via playlist ID stored in DB
    const thumbnailUrl = playlist.thumbnail ||
        `https://i.ytimg.com/vi/${playlist.youtube_playlist_id}/hqdefault.jpg`

    // Estimate duration from total_videos (rough: avg 15 min/video)
    const totalHours = Math.floor((progressData.total * 15) / 60)
    const totalMins = (progressData.total * 15) % 60

    return (
        <Tilt
            tiltMaxAngleX={12}
            tiltMaxAngleY={12}
            perspective={1000}
            scale={1.02}
            transitionSpeedMs={1500}
            gyroscope={true}
            className="pc2-tilt-wrapper"
        >
            <motion.div
                className="pc2-card"
                style={{
                    '--card-border': hovered ? theme.border : 'rgba(255,255,255,0.07)',
                    '--card-glow': theme.glow,
                }}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
            >
                {/* ── Top: Thumbnail ── */}
                <div className="pc2-thumb-wrap">
                    <img
                        src={thumbnailUrl}
                        alt={playlist.title}
                        className="pc2-thumb-img"
                        onError={e => { e.currentTarget.src = 'https://i.ytimg.com/vi/default/hqdefault.jpg' }}
                    />

                    {/* Dark overlay always */}
                    <div className="pc2-thumb-overlay" />

                    {/* Category badge */}
                    <span
                        className="pc2-badge"
                        style={{ background: theme.badge }}
                    >
                        {theme.category}
                    </span>

                    {/* Play button — visible on hover */}
                    <AnimatePresence>
                        {hovered && (
                            <motion.div
                                className="pc2-play-btn"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Play size={28} fill="white" color="white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Bottom: Info ── */}
                <div className="pc2-body">
                    {/* Title */}
                    <h3 className="pc2-title">{playlist.title}</h3>

                    {/* Channel placeholder (we store channel if available, else use playlist source) */}
                    <p className="pc2-channel">
                        {playlist.channel_title || 'YouTube Channel'}
                    </p>

                    {/* Stats row */}
                    <div className="pc2-stats-row">
                        <span className="pc2-stat">
                            <PlayCircle size={13} />
                            {animatedTotal} videos
                        </span>
                        <span className="pc2-stat">
                            <Clock size={13} />
                            {totalHours > 0 ? `${totalHours}h ` : ''}{totalMins}m
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="pc2-progress-section">
                        <div className="pc2-progress-header">
                            <span>Progress</span>
                            <span
                                className="pc2-progress-pct"
                                style={{ color: progressPercent >= 80 ? '#22c55e' : progressPercent >= 40 ? '#facc15' : theme.badge }}
                            >
                                {animatedPercent}%
                            </span>
                        </div>
                        <div className="pc2-progress-bar">
                            <motion.div
                                className="pc2-progress-fill"
                                style={{ background: theme.progressGrad }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.1 + 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Action row */}
                    <div className="pc2-actions">
                        <Link
                            to={`/playlist/${playlist.id}`}
                            className="pc2-cta-btn"
                            style={{ background: theme.gradient }}
                        >
                            <Play size={15} fill="white" />
                            Continue Learning
                        </Link>
                        <button
                            onClick={() => onDelete(playlist.id)}
                            className="pc2-delete-btn"
                            title="Delete playlist"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </Tilt>
    )
}

// Dashboard Statistics Bar Component
const DashboardStats = ({ stats }) => {
    const statItems = [
        { label: 'Total Playlists', value: stats.playlists, color: '#a78bfa', underline: '#7c3aed', icon: Youtube },
        { label: 'Total Videos', value: stats.totalVideos, color: '#ec4899', underline: '#db2777', icon: PlayCircle },
        { label: 'Videos Completed', value: stats.completedVideos, color: '#f97316', underline: '#f97316', icon: Play },
        { label: 'Overall Completion', value: stats.percent, suffix: '%', color: '#eab308', underline: '#eab308', icon: BarChart2 }
    ]

    return (
        <motion.div
            className="dash-stats-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {statItems.map((item, i) => (
                <motion.div
                    key={i}
                    className="dash-stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                >
                    <div className="dash-stat-icon-box" style={{ background: `linear-gradient(135deg, ${item.color}33, ${item.color}11)` }}>
                        <item.icon size={20} color={item.color} />
                    </div>
                    <div className="dash-stat-info">
                        <div className="dash-stat-value" style={{ color: item.color }}>
                            <AnimatedValue value={item.value} suffix={item.suffix} />
                        </div>
                        <div className="dash-stat-label">{item.label}</div>
                    </div>
                    <div className="dash-stat-line" style={{ backgroundColor: item.underline }} />
                </motion.div>
            ))}
        </motion.div>
    )
}

const AnimatedValue = ({ value, suffix = "" }) => {
    const animatedVal = useCountUp(value, 1000, true)
    return <>{animatedVal}{suffix}</>
}

const Dashboard = () => {
    const { user } = useAuth()
    const [playlists, setPlaylists] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [stats, setStats] = useState({ playlists: 0, totalVideos: 0, completedVideos: 0, percent: 0 })
    const [playlistUrl, setPlaylistUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (user) fetchUserPlaylists()
    }, [user])

    const fetchUserPlaylists = async () => {
        const { data: playlists, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (!error && playlists) {
            // Enhanced Fetching: Get first video for each to build reliable thumbnail
            const enhancedPlaylists = await Promise.all(
                playlists.map(async (p) => {
                    const { data: firstVideo } = await supabase
                        .from('videos')
                        .select('youtube_video_id')
                        .eq('playlist_id', p.id)
                        .order('position', { ascending: true })
                        .limit(1)
                        .single()

                    return {
                        ...p,
                        thumbnail: firstVideo
                            ? `https://i.ytimg.com/vi/${firstVideo.youtube_video_id}/hqdefault.jpg`
                            : `https://picsum.photos/seed/${p.id}/640/360`
                    }
                })
            )

            setPlaylists(enhancedPlaylists)

            // Calculate aggregate stats
            const totalPlaylists = enhancedPlaylists.length
            const totalVideos = enhancedPlaylists.reduce((acc, p) => acc + (p.total_videos || 0), 0)

            // Get completed count from all videos
            const { count: completedCount } = await supabase
                .from('progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_completed', true)

            setStats({
                playlists: totalPlaylists,
                totalVideos,
                completedVideos: completedCount || 0,
                percent: totalVideos > 0 ? Math.round(((completedCount || 0) / totalVideos) * 100) : 0
            })
        }
    }

    const handleImport = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const playlistId = extractPlaylistId(playlistUrl)
            if (!playlistId) throw new Error('Invalid YouTube Playlist URL')

            // Duplicate Prevention: Check if already exists for this user
            const { data: existing } = await supabase
                .from('playlists')
                .select('id')
                .eq('user_id', user.id)
                .eq('youtube_playlist_id', playlistId)
                .single()

            if (existing) throw new Error('This playlist is already in your library.')

            const details = await fetchPlaylistDetails(playlistId)
            const items = await fetchPlaylistItems(playlistId)

            const { data: newPlaylist, error: pError } = await supabase
                .from('playlists')
                .insert([{
                    user_id: user.id,
                    youtube_playlist_id: playlistId,
                    title: details.snippet.title,
                    channel_title: details.snippet.channelTitle,
                    thumbnail: details.snippet.thumbnails?.maxres?.url ||
                        details.snippet.thumbnails?.high?.url ||
                        details.snippet.thumbnails?.medium?.url || null,
                    total_videos: details.contentDetails.itemCount,
                }])
                .select()
                .single()

            if (pError) throw pError

            const videoEntries = items.map((item, index) => ({
                playlist_id: newPlaylist.id,
                youtube_video_id: item.contentDetails.videoId,
                title: item.snippet.title,
                position: index,
            }))

            const { error: vError } = await supabase
                .from('videos')
                .insert(videoEntries)

            if (vError) throw vError

            await fetchUserPlaylists()
            setShowModal(false)
            setPlaylistUrl('')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const deletePlaylist = async (id) => {
        if (!confirm('Are you sure you want to delete this playlist?')) return
        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', id)
        if (!error) fetchUserPlaylists()
    }

    return (
        <div className="dashboard container">
            <ParticleBackground />
            {/* Header */}
            <header className="dash-header">
                <div>
                    <h1>
                        Welcome,{' '}
                        <span className="highlight">{user?.email?.split('@')[0]}</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        You have {playlists.length} active playlist{playlists.length !== 1 ? 's' : ''}.
                    </p>
                </div>
            </header>

            <DashboardStats stats={stats} />

            {/* Action Bar */}
            <div className="pc2-action-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>My Playlists</h2>
                <motion.button
                    onClick={() => setShowModal(true)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem' }}
                    whileHover={{ scale: 1.05, x: 5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <Plus size={20} /> Import Playlist
                </motion.button>
            </div>

            {/* Cards grid */}
            <div className="pc2-grid">
                {loading ? (
                    [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
                ) : (
                    playlists.map((playlist, index) => (
                        <PlaylistCard
                            key={playlist.id}
                            playlist={playlist}
                            theme={GRADIENT_THEMES[index % GRADIENT_THEMES.length]}
                            index={index}
                            onDelete={deletePlaylist}
                        />
                    ))
                )}

                {playlists.length === 0 && (
                    <motion.div
                        className="empty-state glass"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Youtube size={48} className="empty-icon" />
                        <p>No playlists imported yet. Start your journey!</p>
                        <button onClick={() => setShowModal(true)} className="btn-primary">
                            Import Now
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Import Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        onClick={() => setShowModal(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-content glass"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.25 }}
                        >
                            <h2>Import Playlist</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Paste the YouTube playlist URL below</p>
                            <form onSubmit={handleImport}>
                                {error && <div className="error-message">{error}</div>}
                                <input
                                    type="text"
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                    value={playlistUrl}
                                    onChange={e => setPlaylistUrl(e.target.value)}
                                    required
                                />
                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Importing...' : 'Import'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx="true">{`
                @media (max-width: 768px) {
                    .dash-header {
                        text-align: center;
                        margin-bottom: 2rem;
                    }
                    .pc2-action-bar {
                        flex-direction: column;
                        gap: 1.5rem;
                        text-align: center;
                    }
                    .btn-primary {
                        width: 100%;
                        justify-content: center;
                    }
                    .modal-content {
                        width: 95%;
                        padding: 1.5rem;
                        margin: 0 1rem;
                    }
                    .modal-actions {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    .modal-actions button {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    )
}

export default Dashboard
