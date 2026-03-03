const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export const fetchPlaylistDetails = async (playlistId) => {
    if (!API_KEY) {
        throw new Error('YouTube API Key missing')
    }

    const response = await fetch(`${BASE_URL}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${API_KEY}`)
    const data = await response.json()

    if (data.items && data.items.length > 0) {
        return data.items[0]
    }
    throw new Error('Playlist not found')
}

export const fetchPlaylistItems = async (playlistId) => {
    if (!API_KEY) {
        throw new Error('YouTube API Key missing')
    }

    let allItems = []
    let nextPageToken = ''

    do {
        const response = await fetch(`${BASE_URL}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${nextPageToken}`)
        const data = await response.json()

        if (data.items) {
            allItems = [...allItems, ...data.items]
        }
        nextPageToken = data.nextPageToken
    } while (nextPageToken)

    return allItems
}

export const extractPlaylistId = (url) => {
    const regExp = /[&?]list=([^#&?]+)/
    const match = url.match(regExp)
    return match ? match[1] : null
}
