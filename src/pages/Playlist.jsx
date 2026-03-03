import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, Play, CheckCircle2, Circle, Trophy, Calendar, CheckCircle, BarChart2, Edit3, StickyNote, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Playlist = () => {
    const { id } = useParams()
    const { user } = useAuth()
    const [playlist, setPlaylist] = useState(null)
    const [videos, setVideos] = useState([])
    const [progress, setProgress] = useState({})
    const [loading, setLoading] = useState(true)
    const [currentVideo, setCurrentVideo] = useState(null)
    const [noteText, setNoteText] = useState('')
    const [allNotes, setAllNotes] = useState({}) // videoId: content
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [toast, setToast] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (id && user) {
            fetchPlaylistData()
        }
    }, [id, user])

    const fetchPlaylistData = async () => {
        setLoading(true)
        try {
            // Fetch Playlist Details
            const { data: pData, error: pError } = await supabase
                .from('playlists')
                .select('*')
                .eq('id', id)
                .single()

            if (pError) throw pError
            setPlaylist(pData)

            // Fetch Videos
            const { data: vData, error: vError } = await supabase
                .from('videos')
                .select('*')
                .eq('playlist_id', id)
                .order('position', { ascending: true })

            if (vError) throw vError
            setVideos(vData)

            // Fetch Progress
            const { data: prData, error: prError } = await supabase
                .from('progress')
                .select('*')
                .eq('user_id', user.id)
                .in('video_id', vData.map(v => v.id))

            if (prError) throw prError
            const progressMap = {}
            let lastWatchedVideoId = null
            let latestTime = 0

            prData.forEach(p => {
                progressMap[p.video_id] = p.is_completed
                const watchTime = new Date(p.last_watched_at).getTime()
                if (watchTime > latestTime) {
                    latestTime = watchTime
                    lastWatchedVideoId = p.video_id
                }
            })

            setProgress(progressMap)

            // Fetch All Notes for this playlist (to show icons)
            const { data: nData } = await supabase
                .from('notes')
                .select('video_id, content')
                .eq('user_id', user.id)
                .in('video_id', vData.map(v => v.id))

            const notesMap = {}
            if (nData) {
                nData.forEach(n => {
                    notesMap[n.video_id] = n.content
                })
            }
            setAllNotes(notesMap)

            // Resume from first incomplete video, or last watched, or first item
            const firstIncomplete = vData.find(v => !progressMap[v.id])

            if (firstIncomplete) {
                setCurrentVideo(firstIncomplete)
                setNoteText(notesMap[firstIncomplete.id] || '')
            } else if (lastWatchedVideoId) {
                const lastVideo = vData.find(v => v.id === lastWatchedVideoId)
                if (lastVideo) {
                    setCurrentVideo(lastVideo)
                    setNoteText(notesMap[lastVideo.id] || '')
                }
            } else if (vData.length > 0) {
                setCurrentVideo(vData[0])
                setNoteText(notesMap[vData[0].id] || '')
            }

        } catch (err) {
            console.error(err)
            navigate('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    // Effect for switching video notes
    useEffect(() => {
        if (currentVideo) {
            setNoteText(allNotes[currentVideo.id] || '')
            setLastSaved(null)
        }
    }, [currentVideo?.id])

    // Auto-save logic (Debounce)
    useEffect(() => {
        if (!currentVideo || !user) return

        // Don't save if content is same as already in state
        if (noteText === (allNotes[currentVideo.id] || '')) return

        const timer = setTimeout(() => {
            saveNote()
        }, 2000)

        return () => clearTimeout(timer)
    }, [noteText])

    const saveNote = async () => {
        if (!currentVideo || !user) return
        setIsSaving(true)

        const { error } = await supabase
            .from('notes')
            .upsert({
                user_id: user.id,
                video_id: currentVideo.id,
                content: noteText,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, video_id' })

        setIsSaving(false)
        if (!error) {
            setLastSaved(new Date())
            setAllNotes(prev => ({ ...prev, [currentVideo.id]: noteText }))
            showToast("Note saved!")
        } else {
            console.error('Save error:', error)
        }
    }

    const showToast = (msg) => {
        setToast(msg)
        setTimeout(() => setToast(null), 3000)
    }

    const updateStreak = async () => {
        if (!user) return
        const today = new Date().toISOString().split('T')[0]

        // Fetch current streak info
        const { data: streak } = await supabase
            .from('streaks')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!streak) {
            // First time - create entry
            await supabase.from('streaks').insert({
                user_id: user.id,
                current_streak: 1,
                longest_streak: 1,
                last_studied_date: today
            })
            return
        }

        const last = streak.last_studied_date
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        let newStreak = streak.current_streak

        if (last === today) return // already counted today

        if (last === yesterdayStr) {
            newStreak += 1 // continued streak from yesterday
        } else {
            newStreak = 1 // streak broken, reset to 1
        }

        await supabase.from('streaks').update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_studied_date: today,
            updated_at: new Date().toISOString()
        }).eq('user_id', user.id)
    }

    const toggleComplete = async (videoId) => {
        const isCompleted = !progress[videoId]

        // Optimistic UI Update
        setProgress({ ...progress, [videoId]: isCompleted })

        const { error } = await supabase
            .from('progress')
            .upsert({
                user_id: user.id,
                video_id: videoId,
                is_completed: isCompleted,
                last_watched_at: new Date().toISOString()
            }, { onConflict: 'user_id, video_id' })

        if (error) {
            // Revert on error
            setProgress({ ...progress, [videoId]: !isCompleted })
            console.error('Failed to sync progress:', error)
        } else if (isCompleted) {
            // Only update streak when marking as COMPLETED
            updateStreak()
        }
    }

    const completedCount = Object.values(progress).filter(Boolean).length
    const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0

    if (loading) return <div className="loading">Loading Playlist...</div>

    const StudyPlanner = () => {
        const [hoursPerDay, setHoursPerDay] = useState(2)
        const [planResult, setPlanResult] = useState(null)
        const [isOpen, setIsOpen] = useState(true)

        const calculatePlan = () => {
            const avgVideoMinutes = 10
            const remainingVideos = videos.length - completedCount

            if (remainingVideos <= 0) {
                setPlanResult({ type: 'completed' })
                return
            }

            const hpd = parseFloat(hoursPerDay)
            if (!hpd || hpd <= 0) {
                setPlanResult({ type: 'error', message: 'Please enter valid hours' })
                return
            }

            const totalMinutesLeft = remainingVideos * avgVideoMinutes
            const minutesPerDay = hpd * 60
            const daysNeeded = Math.ceil(totalMinutesLeft / minutesPerDay)

            const completionDate = new Date()
            completionDate.setDate(completionDate.getDate() + daysNeeded)
            const formattedDate = completionDate.toLocaleDateString('en-US', {
                day: 'numeric', month: 'long', year: 'numeric'
            })

            setPlanResult({
                type: 'success',
                days: daysNeeded,
                date: formattedDate
            })
        }

        return (
            <div className={`study-planner-card glass ${!isOpen ? 'collapsed' : ''}`}>
                <div
                    className="planner-header"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Calendar size={18} className="planner-icon" />
                        <h3>Study Planner</h3>
                    </div>
                    {isOpen ? <ChevronLeft style={{ transform: 'rotate(-90deg)' }} size={18} /> : <ChevronLeft style={{ transform: 'rotate(90deg)' }} size={18} />}
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="planner-divider" />

                            <div className="planner-input-group">
                                <label>Hours per day:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={hoursPerDay}
                                    onChange={(e) => setHoursPerDay(e.target.value)}
                                    className="planner-input"
                                />
                            </div>

                            <button onClick={calculatePlan} className="btn-calculate">
                                Calculate Plan
                            </button>

                            {planResult && (
                                <motion.div
                                    className="planner-result"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {planResult.type === 'completed' && (
                                        <p className="success-msg">🎉 You've already completed this playlist!</p>
                                    )}
                                    {planResult.type === 'error' && (
                                        <p className="error-msg">{planResult.message}</p>
                                    )}
                                    {planResult.type === 'success' && (
                                        <div className="result-details">
                                            <div className="result-item">
                                                <CheckCircle size={16} />
                                                <span>
                                                    {planResult.days === 1
                                                        ? "You can finish this today! 🚀"
                                                        : `You will complete this playlist in ${planResult.days} days.`}
                                                </span>
                                            </div>
                                            <div className="result-item">
                                                <Calendar size={16} />
                                                <span>Estimated completion: <strong>{planResult.date}</strong></span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    const VideoNotes = () => {
        const charLimit = 500

        return (
            <div className="study-planner-card glass" style={{ marginTop: '1.5rem' }}>
                <div className="planner-header">
                    <Edit3 size={18} className="planner-icon" />
                    <h3>My Notes</h3>
                </div>
                <div className="planner-divider" />

                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <textarea
                        className="planner-input"
                        style={{
                            width: '100%',
                            height: '140px',
                            textAlign: 'left',
                            padding: '1rem',
                            resize: 'none',
                            fontSize: '0.9rem',
                            lineHeight: '1.5'
                        }}
                        placeholder="Write your study notes for this video..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value.slice(0, charLimit))}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '12px',
                        fontSize: '0.7rem',
                        color: noteText.length >= charLimit ? '#f87171' : 'rgba(255,255,255,0.4)'
                    }}>
                        {noteText.length} / {charLimit}
                    </div>
                </div>

                <button
                    onClick={saveNote}
                    className="btn-calculate"
                    disabled={isSaving}
                    style={{ background: isSaving ? 'rgba(124, 58, 237, 0.5)' : undefined }}
                >
                    {isSaving ? 'Saving...' : 'Save Note'}
                </button>

                {lastSaved && (
                    <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <Clock size={12} />
                        Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="playlist-page">
            <div className="container">
                <Link to="/dashboard" className="back-link-v2">
                    <ChevronLeft size={18} /> Back to Library
                </Link>

                {/* UPGRADE 1: Thumbnail Header */}
                <header className="playlist-hero">
                    <div className="hero-thumb-wrap">
                        <img
                            src={`https://img.youtube.com/vi/${videos[0]?.youtube_video_id}/maxresdefault.jpg`}
                            alt=""
                            className="hero-thumb-img"
                            onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${videos[0]?.youtube_video_id}/hqdefault.jpg` }}
                        />
                        <div className="hero-overlay" />
                    </div>

                    <div className="hero-content-over">
                        <div className="hero-info">
                            <span className="hero-badge">Playlist</span>
                            <h1 className="hero-title">{playlist?.title}</h1>
                            <p className="hero-channel">{playlist?.channel_title || 'YouTube Channel'}</p>
                            <div className="hero-stats">
                                <span>{videos.length} videos</span>
                                <span className="stat-dot">·</span>
                                <span>{completedCount} completed ({progressPercent}%)</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="playlist-layout">
                    <div className="video-player-section">
                        {currentVideo ? (
                            <div className="player-wrapper glass">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${currentVideo.youtube_video_id}?autoplay=0`}
                                    title={currentVideo.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                                <div className="current-video-info">
                                    <div className="current-header-row">
                                        <h2>{currentVideo.title}</h2>
                                        <button
                                            onClick={() => toggleComplete(currentVideo.id)}
                                            className={`btn-complete-v2 ${progress[currentVideo.id] ? 'completed' : ''}`}
                                        >
                                            {progress[currentVideo.id] ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                            {progress[currentVideo.id] ? 'Completed' : 'Mark as Complete'}
                                        </button>
                                    </div>

                                    {/* UPGRADE 2: Progress bar below title */}
                                    <div className="playlist-progress-section">
                                        <div className="prog-text">
                                            <span>Progress</span>
                                            <span>{completedCount} / {videos.length}</span>
                                        </div>
                                        <div className="prog-bar-track">
                                            <div className="prog-bar-fill" style={{ width: `${progressPercent}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="no-video glass">Select a video to start learning</div>
                        )}
                    </div>

                    <aside className="video-sidebar-v2 glass">
                        <h3>Playlist Content</h3>

                        {/* Playlist Mini Stats */}
                        <div className="playlist-mini-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                            <div className="dash-stat-card" style={{ padding: '0.85rem', minHeight: 'auto', gap: '0.4rem' }}>
                                <div className="dash-stat-icon-box" style={{ background: 'rgba(249, 115, 22, 0.15)', width: '32px', height: '32px', borderRadius: '8px' }}>
                                    <Play size={14} color="#f97316" fill="#f97316" />
                                </div>
                                <div className="dash-stat-info">
                                    <div className="dash-stat-value" style={{ color: '#f97316', fontSize: '1.25rem', fontWeight: 800 }}>{completedCount}</div>
                                    <div className="dash-stat-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Videos Done</div>
                                </div>
                                <div className="dash-stat-line" style={{ backgroundColor: '#f97316', width: '20px', height: '2px' }} />
                            </div>

                            <div className="dash-stat-card" style={{ padding: '0.85rem', minHeight: 'auto', gap: '0.4rem' }}>
                                <div className="dash-stat-icon-box" style={{ background: 'rgba(234, 179, 8, 0.15)', width: '32px', height: '32px', borderRadius: '8px' }}>
                                    <BarChart2 size={14} color="#eab308" />
                                </div>
                                <div className="dash-stat-info">
                                    <div className="dash-stat-value" style={{ color: '#eab308', fontSize: '1.25rem', fontWeight: 800 }}>{progressPercent}%</div>
                                    <div className="dash-stat-label" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Success Rate</div>
                                </div>
                                <div className="dash-stat-line" style={{ backgroundColor: '#eab308', width: '20px', height: '2px' }} />
                            </div>
                        </div>

                        <div className="video-list-v2">
                            {videos.map((video, index) => (
                                <div
                                    key={video.id}
                                    className={`video-item-v2 ${currentVideo?.id === video.id ? 'active' : ''}`}
                                    onClick={() => setCurrentVideo(video)}
                                >
                                    <div className="video-main">
                                        <div className="video-status-v2">
                                            {currentVideo?.id === video.id && <Play size={14} fill="currentColor" className="icon-playing-v2" />}
                                            <span className="video-number-v2">{index + 1}</span>
                                        </div>
                                        <div className="video-info-v2">
                                            <span className={`video-title-v2 ${progress[video.id] ? 'completed' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {video.title}
                                                {allNotes[video.id] && <span title="Has notes" style={{ fontSize: '0.8rem' }}>📝</span>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Circular Toggle Checkbox */}
                                    <button
                                        className={`video-check ${progress[video.id] ? 'checked' : ''}`}
                                        style={{ minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleComplete(video.id);
                                        }}
                                    >
                                        {progress[video.id] ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Study Planner Widget */}
                        <StudyPlanner />

                        {/* Video Notes Widget */}
                        <VideoNotes />
                    </aside>
                </div>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{
                            position: 'fixed',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#7c3aed',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '100px',
                            fontWeight: 600,
                            boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)',
                            zIndex: 2000
                        }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
            <style jsx="true">{`
                @media (max-width: 768px) {
                    .playlist-layout {
                        flex-direction: column !important;
                    }
                    .video-main-section {
                        width: 100% !important;
                    }
                    .video-sidebar-v2 {
                        width: 100% !important;
                        margin-top: 1.5rem;
                    }
                    .dash-stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 0.75rem !important;
                    }
                    .video-item-v2 {
                        padding: 1rem 0.75rem !important;
                    }
                    .video-title-v2 {
                        font-size: 0.9rem !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default Playlist
