import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Activity, Bot, ShieldCheck, CreditCard, LogOut, Plus, Globe, Settings } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../app/slices/authSlice';
import { motion } from 'framer-motion';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects/import', label: 'New Project', icon: Plus },
  { to: '/projects', label: 'My Projects', icon: FolderKanban },
  { to: '/deployments', label: 'Deployments', icon: Activity },
  { to: '/assistant', label: 'AI Copilot', icon: Bot },
  { to: '/domains', label: 'Domains', icon: Globe },
  { to: '/settings/security', label: 'Settings', icon: Settings },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
];

function SidebarItem({ item, isActive }) {
  const Icon = item.icon;

  return (
    <Link to={item.to} className="relative block">
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'text-white'
            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
        }`}
      >
        {/* Active background pill with layoutId animation */}
        {isActive && (
          <motion.div
            layoutId="activeSideNav"
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/20"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        {/* Icon */}
        <span className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-purple-500/20 text-cyan-400'
            : 'text-white/40 group-hover:text-white/60'
        }`}>
          <Icon className="w-[18px] h-[18px]" />
        </span>

        {/* Label */}
        <span className="relative z-10 truncate">{item.label}</span>

        {/* Active edge indicator */}
        {isActive && (
          <motion.div
            layoutId="activeSideEdge"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-purple-400 to-cyan-400"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  const planLabel = user?.plan === 'pro_monthly'
    ? 'Pro Monthly'
    : user?.plan === 'pro_weekly'
      ? 'Pro Weekly'
      : 'Free';

  const planColor = user?.plan && user.plan !== 'free'
    ? 'from-purple-500 to-cyan-400'
    : 'from-white/30 to-white/10';

  return (
    <aside className="relative flex flex-col h-screen w-64 overflow-hidden border-r border-white/[0.06]"
      style={{ backgroundColor: 'rgba(22, 27, 34, 0.85)', backdropFilter: 'blur(24px)' }}
    >
      {/* ── Floating glow blobs ── */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-48 h-48 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-28 -right-16 w-40 h-40 rounded-full bg-cyan-500/8 blur-3xl" />

      {/* ── Workspace header ── */}
      <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-white/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          {/* Avatar */}
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/20 text-purple-300 font-bold font-space text-sm uppercase select-none">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r ${planColor}`} />
              <span className="text-[11px] font-medium text-white/40">{planLabel}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
          }}
        >
          {items.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <motion.div
                key={item.to}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <SidebarItem item={item} isActive={isActive} />
              </motion.div>
            );
          })}
        </motion.div>
      </nav>

      {/* ── Logout ── */}
      <div className="flex-shrink-0 px-3 pb-2">
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 transition-colors duration-200 hover:text-red-400 hover:bg-red-500/[0.08] group"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg text-white/30 group-hover:text-red-400 transition-colors duration-200">
            <LogOut className="w-[18px] h-[18px]" />
          </span>
          <span>Logout</span>
        </motion.button>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.06]">
        <div className="text-center space-y-0.5">
          <p className="text-[10px] font-medium text-white/20 tracking-widest uppercase font-space">
            Cloploy v1.0
          </p>
          <p className="text-[10px] text-white/15">
            © {new Date().getFullYear()} All rights reserved
          </p>
          <p className="text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-purple-400/60 to-cyan-400/60 font-medium">
            Claimed by Tharaneesh
          </p>
        </div>
      </div>
    </aside>
  );
}
