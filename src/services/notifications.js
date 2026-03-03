// Request notification permission from the user
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn("This browser does not support desktop notifications.");
        return false;
    }

    if (Notification.permission === 'granted') return true;

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Show a simple notification
export const showNotification = (title, body, icon = '/vite.svg') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
        new Notification(title, {
            body,
            icon,
            badge: '/vite.svg', // Android/Chrome-specific
            silent: false
        });
    } catch (err) {
        console.error("Error showing notification:", err);
    }
}

// Schedule a daily reminder (tab-based)
export const scheduleDailyReminder = (hour = 20) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const reminder = new Date();
    reminder.setHours(hour, 0, 0, 0);

    // If target time already passed today, schedule for tomorrow
    if (reminder <= now) {
        reminder.setDate(reminder.getDate() + 1);
    }

    const delay = reminder - now;
    console.log(`Notification scheduled in ${Math.round(delay / 1000 / 60)} minutes (at ${reminder.toLocaleTimeString()})`);

    // Use a single timeout to trigger the notification
    setTimeout(() => {
        showNotification(
            '📚 Time to Study!',
            "Don't forget your daily learning session on StudySync!"
        );
        // Reschedule for the next day
        scheduleDailyReminder(hour);
    }, delay);
}

// Check if streak is at risk (last study was yesterday and it's getting late)
export const checkStreakWarning = (lastStudiedDate) => {
    if (!lastStudiedDate || Notification.permission !== 'granted') return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // If last studied was yesterday and it's after 8 PM today, warn the user
    const currentHour = new Date().getHours();

    if (lastStudiedDate === yesterdayStr && currentHour >= 20) {
        showNotification(
            '🔥 Streak at Risk!',
            "You haven't studied today! Open StudySync to keep your streak alive!"
        );
    }
}
