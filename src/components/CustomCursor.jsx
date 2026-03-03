import React, { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

const CustomCursor = () => {
    const [isHovering, setIsHovering] = useState(false)
    const [isClicked, setIsClicked] = useState(false)

    const outerSpringConfig = { stiffness: 150, damping: 15 }
    const innerSpringConfig = { stiffness: 500, damping: 30 }

    const outerX = useSpring(0, outerSpringConfig)
    const outerY = useSpring(0, outerSpringConfig)
    const innerX = useSpring(0, innerSpringConfig)
    const innerY = useSpring(0, innerSpringConfig)

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e
            outerX.set(clientX - 20)
            outerY.set(clientY - 20)
            innerX.set(clientX - 4)
            innerY.set(clientY - 4)
        }

        const handleMouseOver = (e) => {
            if (e.target.closest('button, a, .playlist-card, .card-tilt, input')) {
                setIsHovering(true)
            } else {
                setIsHovering(false)
            }
        }

        const handleMouseDown = () => setIsClicked(true)
        const handleMouseUp = () => setIsClicked(false)

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseover', handleMouseOver)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseover', handleMouseOver)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [outerX, outerY, innerX, innerY])

    return (
        <>
            <motion.div
                className="cursor-outer"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: isHovering ? 60 : 40,
                    height: isHovering ? 60 : 40,
                    borderRadius: '50%',
                    border: '2px solid var(--primary)',
                    backgroundColor: isHovering ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    translateX: outerX,
                    translateY: outerY,
                    scale: isClicked ? 0.8 : 1,
                    transition: { type: 'spring', stiffness: 300, damping: 20 }
                }}
            />
            <motion.div
                className="cursor-inner"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    pointerEvents: 'none',
                    zIndex: 10000,
                    translateX: innerX,
                    translateY: innerY,
                    scale: isClicked ? 0.5 : 1
                }}
            />
        </>
    )
}

export default CustomCursor

