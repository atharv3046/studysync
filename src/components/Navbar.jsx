import React from 'react'
import { Link } from 'react-router-dom'
import { Play, LogOut, Layout, User, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  const navLinks = (
    <>
      {user ? (
        <>
          <Link to="/dashboard" className="nav-link flex-center" onClick={closeMenu}>
            <Layout size={18} /> Dashboard
          </Link>
          <Link to="/profile" className="nav-link flex-center" onClick={closeMenu}>
            <User size={18} /> Profile
          </Link>
          <button onClick={() => { logout(); closeMenu(); }} className="nav-link flex-center">
            <LogOut size={18} /> Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="nav-link" onClick={closeMenu}>Login</Link>
          <Link to="/signup" className="btn-primary" onClick={closeMenu}>Get Started</Link>
        </>
      )}
    </>
  )

  return (
    <nav className="navbar glass">
      <div className="container nav-content">
        <Link to="/" className="logo" onClick={closeMenu}>
          <div className="logo-icon">
            <Play fill="currentColor" size={20} />
          </div>
          <span className="logo-text">STUDYSYNC</span>
        </Link>

        {/* Desktop Menu */}
        <div className="nav-links desktop-only">
          {navLinks}
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="mobile-nav-dropdown glass"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container mobile-nav-links">
              {navLinks}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx="true">{`
                .desktop-only {
                    display: flex;
                }
                .mobile-menu-toggle {
                    display: none;
                    color: white;
                }
                .mobile-nav-dropdown {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    width: 100%;
                    z-index: 1000;
                    padding: 1.5rem 0;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .mobile-nav-links {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                @media (max-width: 768px) {
                    .desktop-only {
                        display: none;
                    }
                    .mobile-menu-toggle {
                        display: block;
                    }
                    .mobile-nav-dropdown {
                        display: block;
                    }
                }
            `}</style>
    </nav>
  )
}

export default Navbar
