import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Playlist from './pages/Playlist'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import CustomCursor from './components/CustomCursor'
import LoadingScreen from './components/LoadingScreen'
import PageTransition from './components/PageTransition'
import { AnimatePresence } from 'framer-motion'
import { requestNotificationPermission, scheduleDailyReminder } from './services/notifications'

import { AuthProvider } from './context/AuthContext'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (!isLoading) {
      const initNotifications = async () => {
        const granted = await requestNotificationPermission()
        if (granted) {
          // Default to 8PM reminder
          const savedHour = localStorage.getItem('study_reminder_hour') || "20"
          const remindersEnabled = localStorage.getItem('daily_reminder_enabled') !== "false"
          if (remindersEnabled) {
            scheduleDailyReminder(parseInt(savedHour))
          }
        }
      }
      initNotifications()
    }
  }, [isLoading])

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loader" onFinish={() => setIsLoading(false)} />}
      </AnimatePresence>

      {!isLoading && (
        <div className="gradient-bg">
          <CustomCursor />
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
              <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Dashboard />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/playlist/:id"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Playlist />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <PageTransition>
                      <Profile />
                    </PageTransition>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
      )}
    </AuthProvider>
  )
}

export default App
