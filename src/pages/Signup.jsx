import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Mail, Lock, User } from 'lucide-react'
import { motion } from 'framer-motion'

const Signup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signupError } = await signup(email, password)
      if (signupError) throw signupError
      alert('Check your email for confirmation!')
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page container">
      <div className="auth-card glass">
        <div className="auth-icon">
          <UserPlus size={32} />
        </div>
        <h1>Create Account</h1>
        <p>Start managing your playlists today</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <motion.button
            type="submit"
            className="btn-primary auth-btn"
            disabled={loading}
            whileHover={{ scale: 1.02, x: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </motion.button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
      <style jsx="true">{`
        @media (max-width: 768px) {
          .auth-page {
            padding: 1rem;
          }
          .auth-card {
            width: 100% !important;
            padding: 2rem 1.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Signup
