/**
 * Generates up to 10 quiz questions from a list of playlist video objects.
 * Each video should have: { id, title, position }
 */
export const generateQuestions = (videos) => {
    if (!videos || videos.length < 4) return []

    const shuffled = [...videos].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(10, videos.length))

    const questions = selected.map((video) => {
        const videoIndex = videos.findIndex((v) => v.id === video.id)
        const correctPosition = video.position + 1

        const wrongVideos = videos
            .filter((v) => v.id !== video.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)

        // Generate wrong positions — ensure unique, valid, non-negative
        const wrongPositions = [
            correctPosition + 1,
            correctPosition + 2,
            correctPosition + 3,
            Math.max(1, correctPosition - 1),
            Math.max(1, correctPosition - 2),
        ]
            .filter((p) => p > 0 && p !== correctPosition)
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .slice(0, 3)

        const types = ['identify', 'position', 'order']
        const type = types[Math.floor(Math.random() * types.length)]

        if (type === 'identify') {
            return {
                type: 'identify',
                question: `Which of these is a real video in this playlist?`,
                correct: video.title,
                options: [video.title, ...wrongVideos.map((v) => v.title)].sort(() => Math.random() - 0.5),
            }
        }

        if (type === 'position') {
            if (wrongPositions.length < 3) {
                // Fallback to identify if not enough wrong positions
                return {
                    type: 'identify',
                    question: `Which of these is a real video in this playlist?`,
                    correct: video.title,
                    options: [video.title, ...wrongVideos.map((v) => v.title)].sort(() => Math.random() - 0.5),
                }
            }
            return {
                type: 'position',
                question: `What position is "${video.title.substring(0, 45)}${video.title.length > 45 ? '...' : ''}" in the playlist?`,
                correct: `#${correctPosition}`,
                options: [correctPosition, ...wrongPositions.slice(0, 3)]
                    .map((p) => `#${p}`)
                    .sort(() => Math.random() - 0.5),
            }
        }

        if (type === 'order') {
            const nextVideo = videos[videoIndex + 1]
            if (!nextVideo) {
                // Fallback to identify
                return {
                    type: 'identify',
                    question: `Which of these is a real video in this playlist?`,
                    correct: video.title,
                    options: [video.title, ...wrongVideos.map((v) => v.title)].sort(() => Math.random() - 0.5),
                }
            }
            return {
                type: 'order',
                question: `Which video comes AFTER "${video.title.substring(0, 45)}${video.title.length > 45 ? '...' : ''}"?`,
                correct: nextVideo.title,
                options: [nextVideo.title, ...wrongVideos.map((v) => v.title)].sort(() => Math.random() - 0.5),
            }
        }

        return null
    })

    return questions.filter(Boolean).slice(0, 10)
}
