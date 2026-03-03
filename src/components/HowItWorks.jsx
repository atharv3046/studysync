import React, { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Youtube, Search, CheckCircle, Rocket } from 'lucide-react'

const steps = [
    {
        number: '01',
        title: 'Paste Playlist URL',
        desc: 'Grab any YouTube playlist link and paste it into StudySync. We instantly fetch all videos and organize them for you.',
        icon: Youtube,
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        iconColor: '#c084fc',
    },
    {
        number: '02',
        title: 'Organize Pathways',
        desc: 'Group playlists into logical learning paths tailored to your goals. Create structured curricula from any YouTube content.',
        icon: Search,
        gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
        iconColor: '#f9a8d4',
    },
    {
        number: '03',
        title: 'Track & Complete',
        desc: 'Monitor your progress video-by-video with persistent tracking. Mark lessons done and watch your mastery grow.',
        icon: CheckCircle,
        gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 60%, #be185d 100%)',
        iconColor: '#d8b4fe',
    },
    {
        number: '04',
        title: 'Resume Anytime',
        desc: 'Pick up exactly where you left off on any device. Your progress is synced instantly across all platforms.',
        icon: Rocket,
        gradient: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)',
        iconColor: '#fcd34d',
    },
]

const HowItWorks = () => {
    const sectionRef = useRef(null)
    const lineRef = useRef(null)
    const dotRef = useRef(null)
    const [lineHeight, setLineHeight] = useState(0)

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start 0.8', 'end 0.2'],
    })

    const dotY = useTransform(scrollYProgress, [0, 1], [0, lineHeight])

    useEffect(() => {
        const updateHeight = () => {
            if (lineRef.current) {
                setLineHeight(lineRef.current.offsetHeight)
            }
        }
        updateHeight()
        window.addEventListener('resize', updateHeight)
        return () => window.removeEventListener('resize', updateHeight)
    }, [])

    return (
        <section className="hiw-section" ref={sectionRef}>
            {/* Section heading */}
            <div className="hiw-header">
                <motion.h2
                    className="hiw-title"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    How It Works
                </motion.h2>
                <motion.p
                    className="hiw-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                >
                    A seamless workflow designed for focused learners.
                </motion.p>
            </div>

            {/* Steps with central vertical line */}
            <div className="hiw-steps-wrapper">
                {/* Vertical line */}
                <div className="hiw-line-track" ref={lineRef}>
                    <div className="hiw-line" />
                    <motion.div className="hiw-dot" style={{ y: dotY }} />
                </div>

                {/* Step rows */}
                {steps.map((step, index) => {
                    const isEven = index % 2 === 1
                    return (
                        <motion.div
                            key={index}
                            className={`hiw-step-row ${isEven ? 'hiw-step-row--reverse' : ''}`}
                            initial={{ opacity: 0, x: isEven ? 60 : -60 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                        >
                            {/* Text side */}
                            <div className="hiw-step-text">
                                <span className="hiw-step-num">{step.number}</span>
                                <h3 className="hiw-step-title">{step.title}</h3>
                                <p className="hiw-step-desc">{step.desc}</p>
                            </div>

                            {/* Center node */}
                            <div className="hiw-center-node">
                                <div className="hiw-node-circle" />
                            </div>

                            {/* Icon side */}
                            <div className="hiw-step-icon-side">
                                <div
                                    className="hiw-icon-box"
                                    style={{ background: step.gradient }}
                                >
                                    <step.icon size={32} color={step.iconColor} strokeWidth={1.5} />
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </section>
    )
}

export default HowItWorks
