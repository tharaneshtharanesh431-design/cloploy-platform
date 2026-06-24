import { Link } from 'react-router-dom';
import { Rocket, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const navLinks = [
  { to: '/#features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/#contact', label: 'Contact' },
];

function NavLink({ to, label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + delay * 0.08, duration: 0.4 }}
      className="relative group"
    >
      <Link
        to={to}
        className="relative px-3 py-2 text-sm font-medium text-white/60 transition-colors duration-300 group-hover:text-white"
      >
        {label}
        {/* Animated underline */}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300 group-hover:w-3/4" />
      </Link>
    </motion.div>
  );
}

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ backgroundColor: 'rgba(6, 8, 15, 0.70)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: [0, -12, 12, -6, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20"
            >
              <Rocket className="w-5 h-5 text-purple-400" />
              {/* Purple glow */}
              <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
            <span className="text-lg font-bold font-space tracking-wide bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent select-none">
              CLOPLOY
            </span>
          </Link>

          {/* ── Center nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link, i) => (
              <NavLink key={link.label} to={link.to} label={link.label} delay={i} />
            ))}
          </div>

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-3">
            {/* Login – ghost */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white/70 rounded-xl border border-white/[0.08] hover:border-white/20 hover:text-white hover:bg-white/[0.04] transition-all duration-300"
              >
                Login
              </Link>
            </motion.div>

            {/* Start Free – gradient CTA with shimmer */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_28px_-4px_rgba(168,85,247,0.45)]"
              >
                {/* Gradient background */}
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl" />

                {/* Shimmer overlay */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <span className="relative flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Start Free
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
