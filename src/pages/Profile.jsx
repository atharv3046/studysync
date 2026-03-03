import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { Youtube, PlayCircle, Play, BarChart2, Calendar, Trophy, Bell, Settings, AlertCircle } from 'lucide-react'
import { checkStreakWarning, requestNotificationPermission } from '../services/notifications'

// Reuse styles from Dashboard stats
const ProfileStatCard = ({ label, value, color, underline, icon: Icon, delay, suffix = "" }) => (
    <motion.div
        className="dash-stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
    >
        <div className="dash-stat-icon-box" style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)` }}>
            <Icon size={20} color={color} />
        </div>
        <div className="dash-stat-info">
            <div className="dash-stat-value" style={{ color }}>
                {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </div>
            <div className="dash-stat-label">{label}</div>
        </div>
        <div className="dash-stat-line" style={{ backgroundColor: underline }} />
    </motion.div>
)

const Profile = () => {
    const { user } = useAuth()
    const [streakData, setStreakData] = useState(null)
    const [stats, setStats] = useState({
        playlists: 0,
        totalVideos: 0,
        completedVideos: 0,
        percent: 0
    })
    const [activity, setActivity] = useState([])
    const [loading, setLoading] = useState(true)

    // Notification Settings State
    const [remindersEnabled, setRemindersEnabled] = useState(localStorage.getItem('daily_reminder_enabled') !== 'false')
    const [streakWarningEnabled, setStreakWarningEnabled] = useState(localStorage.getItem('streak_warning_enabled') !== 'false')
    const [reminderHour, setReminderHour] = useState(localStorage.getItem('study_reminder_hour') || '20')
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission)
    const [showBanner, setShowBanner] = useState(Notification.permission === 'default')

    useEffect(() => {
        if (user) {
            fetchProfileData()
        }
    }, [user])

    const fetchProfileData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Streak
            const { data: sData } = await supabase
                .from('streaks')
                .select('*')
                .eq('user_id', user.id)
                .single()
            setStreakData(sData)

            // Trigger streak warning if enabled
            if (sData?.last_studied_date && streakWarningEnabled) {
                checkStreakWarning(sData.last_studied_date)
            }

            // 2. Fetch User Stats (logic from Dashboard)
            const { data: playlists } = await supabase
                .from('playlists')
                .select('id, total_videos')
                .eq('user_id', user.id)

            if (playlists) {
                const { data: progress } = await supabase
                    .from('progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_completed', true)

                const totalVideos = playlists.reduce((sum, p) => sum + (p.total_videos || 0), 0)
                const completedVideos = progress ? progress.length : 0
                const percent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0

                setStats({
                    playlists: playlists.length,
                    totalVideos,
                    completedVideos,
                    percent
                })

                // 3. Activity logic - get last 30 days of completion dates
                const today = new Date()
                const activityMap = {}

                // Track study days from progress table
                if (progress) {
                    progress.forEach(p => {
                        const dateStr = new Date(p.last_watched_at).toISOString().split('T')[0]
                        activityMap[dateStr] = true
                    })
                }

                const last30 = []
                for (let i = 29; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(today.getDate() - i)
                    const dStr = d.toISOString().split('T')[0]
                    last30.push({
                        date: dStr,
                        studied: activityMap[dStr] || false
                    })
                }
                setActivity(last30)
            }
        } catch (err) {
            console.error('Error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const getStreakMessage = (current) => {
        if (!current) return "Start your streak today! 🚀"
        if (current <= 3) return "Great start! Keep going! 💪"
        if (current <= 7) return "You're on fire! 🔥"
        if (current <= 14) return "Unstoppable! 🏆"
        return "Legendary learner! 👑"
    }

    const handleSaveNotificationSettings = () => {
        localStorage.setItem('daily_reminder_enabled', remindersEnabled)
        localStorage.setItem('streak_warning_enabled', streakWarningEnabled)
        localStorage.setItem('study_reminder_hour', reminderHour)
        alert('Notification settings saved! (Restart the app to apply recurring schedule changes)')
    }

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission()
        setPermissionStatus(Notification.permission)
        if (granted) setShowBanner(false)
    }

    if (loading) return <div className="loading" style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading profile...</div>

    return (
        <div className="profile-page" style={{ padding: '2rem 0', minHeight: '100vh', color: '#fff' }}>
            {/* Permission Banner */}
            {showBanner && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="container"
                    style={{ marginBottom: '2rem' }}
                >
                    <div style={{
                        background: 'linear-gradient(90deg, #7c3aed, #db2777)',
                        padding: '1rem 2rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Bell size={20} />
                            <span>Enable notifications to stay on track! 🔔</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleEnableNotifications}
                                style={{
                                    background: '#fff',
                                    color: '#7c3aed',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Enable
                            </button>
                            <button
                                onClick={() => setShowBanner(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '3rem' }}
                >
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Your Learning Profile</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>Tracking your journey to mastery.</p>
                </motion.div>

                {/* SECTION 1: Streak Card */}
                <motion.div
                    className="glass"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        padding: '3rem',
                        borderRadius: '24px',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(167, 139, 250, 0.05))',
                        border: '1px solid rgba(167, 139, 250, 0.2)',
                        marginBottom: '3rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔥</div>
                        <h2 style={{
                            fontSize: '3.5rem',
                            fontWeight: 900,
                            background: 'linear-gradient(to bottom, #fff, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem'
                        }}>
                            {streakData?.current_streak || 0} Day Streak
                        </h2>
                        <p style={{ fontSize: '1.25rem', color: '#a78bfa', fontWeight: 600, marginBottom: '2rem' }}>
                            {getStreakMessage(streakData?.current_streak)}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Longest Streak</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{streakData?.longest_streak || 0} days</div>
                            </div>
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Last Studied</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {streakData?.last_studied_date
                                        ? new Date(streakData.last_studied_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                        : 'Never'}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* SECTION 2: Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '3rem'
                }}>
                    <ProfileStatCard
                        label="Total Playlists"
                        value={stats.playlists}
                        color="#a78bfa"
                        underline="#7c3aed"
                        icon={Youtube}
                        delay={0.1}
                    />
                    <ProfileStatCard
                        label="Videos Tracked"
                        value={stats.totalVideos}
                        color="#ec4899"
                        underline="#db2777"
                        icon={PlayCircle}
                        delay={0.2}
                    />
                    <ProfileStatCard
                        label="Videos Completed"
                        value={stats.completedVideos}
                        color="#f97316"
                        underline="#f97316"
                        icon={Play}
                        delay={0.3}
                    />
                    <ProfileStatCard
                        label="Global Completion"
                        value={stats.percent}
                        suffix="%"
                        color="#eab308"
                        underline="#eab308"
                        icon={BarChart2}
                        delay={0.4}
                    />
                </div>

                {/* SECTION 3: Activity Calendar */}
                <motion.div
                    className="glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: '2rem',
                        borderRadius: '20px',
                        background: 'rgba(10, 10, 15, 0.4)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Trophy size={20} color="#a78bfa" />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>30-Day Activity</h3>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(20px, 1fr))',
                        gap: '8px',
                        maxWidth: '900px',
                        overflowX: 'auto',
                        paddingBottom: '0.5rem'
                    }} className="activity-scroll-area">
                        {activity.map((day, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + (idx * 0.01) }}
                                title={day.date}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    flexShrink: 0,
                                    borderRadius: '4px',
                                    background: day.studied
                                        ? 'linear-gradient(135deg, #7c3aed, #db2777)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    boxShadow: day.studied ? '0 0 10px rgba(124, 58, 237, 0.3)' : 'none'
                                }}
                            />
                        ))}
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                        <span>30 days ago</span>
                        <span>Today</span>
                    </div>
                </motion.div>

                {/* SECTION 4: Notification Settings */}
                <motion.div
                    className="glass"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        padding: '2rem',
                        borderRadius: '20px',
                        background: 'rgba(10, 10, 15, 0.4)',
                        marginTop: '3rem',
                        border: '1px solid rgba(167, 139, 250, 0.1)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <Bell size={20} color="#a78bfa" />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Notification Settings</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Daily Reminder Toggle */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Calendar size={18} color="rgba(255,255,255,0.5)" />
                                    <span>Daily study reminder</span>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={remindersEnabled}
                                        onChange={(e) => setRemindersEnabled(e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            {remindersEnabled && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '2.5rem' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Reminder Time:</span>
                                    <select
                                        value={reminderHour}
                                        onChange={(e) => setReminderHour(e.target.value)}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="18">6:00 PM</option>
                                        <option value="19">7:00 PM</option>
                                        <option value="20">8:00 PM</option>
                                        <option value="21">9:00 PM</option>
                                        <option value="22">10:00 PM</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Streak Warning Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <AlertCircle size={18} color="rgba(255,255,255,0.5)" />
                                <span>Streak risk warning</span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={streakWarningEnabled}
                                    onChange={(e) => setStreakWarningEnabled(e.target.checked)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveNotificationSettings}
                        style={{
                            marginTop: '2.5rem',
                            width: '100%',
                            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                            border: 'none',
                            padding: '1rem',
                            borderRadius: '12px',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <Settings size={18} />
                        Save Preferences
                    </button>

                    {permissionStatus === 'denied' && (
                        <p style={{ marginTop: '1.5rem', color: '#ff4d4d', fontSize: '0.85rem', textAlign: 'center' }}>
                            ⚠️ Notifications are blocked by your browser. Please enable them in your browser settings to receive alerts.
                        </p>
                    )}
                </motion.div>
            </div>
            <style jsx="true">{`
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 46px;
                    height: 24px;
                }
                .switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255,255,255,0.1);
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #7c3aed;
                }
                input:focus + .slider {
                    box-shadow: 0 0 1px #7c3aed;
                }
                input:checked + .slider:before {
                    transform: translateX(22px);
                }
                .slider.round {
                    borderRadius: 34px;
                }
                .slider.round:before {
                    borderRadius: 50%;
                }
                
                @media (max-width: 768px) {
                    .profile-page .container {
                        padding: 0 1.5rem;
                    }
                    .streak-card-h2 {
                        font-size: 2.2rem !important;
                    }
                    .activity-scroll-area {
                        display: flex !important;
                        flex-wrap: nowrap !important;
                    }
                    .dash-stat-card {
                        min-width: 0;
                    }
                }
            `}</style>
        </div>
    )
}

export default Profile
