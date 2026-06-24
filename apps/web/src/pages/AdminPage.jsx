import { GlassCard } from '../components/common/GlassCard';
import { ShieldAlert, Users, Layers, Cpu, FileSpreadsheet, Key } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

export function AdminPage() {
  return (
    <div className="space-y-8 pb-12 relative">
      {/* Ambient glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-gradient-to-r from-cyan-500 to-transparent" />
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-400 font-semibold font-space">Admin Panel</p>
        </div>
        <h1 className="text-4xl font-extrabold font-space text-white">System Governance Cockpit</h1>
        <p className="mt-2 text-sm text-white/40 max-w-lg">
          Monitor platform metrics, manage users, and configure enterprise governance controls.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { title: 'Users Accounted', value: '1', icon: Users, accent: 'cyan', iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
          { title: 'Total Projects', value: '3', icon: Layers, accent: 'purple', iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
          { title: 'Build Deliveries', value: '46', icon: Cpu, accent: 'amber', iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
          { title: 'System Logs', value: '188', icon: FileSpreadsheet, accent: 'white', iconBg: 'bg-white/5 border-white/10 text-white/50' }
        ].map((item, i) => (
          <motion.div key={item.title} variants={itemVariants}>
            <GlassCard className="border border-white/[0.06] bg-[#161B22] rounded-2xl hover:border-white/10 transition-all duration-500 relative overflow-hidden group">
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-px ${
                item.accent === 'cyan' ? 'bg-gradient-to-r from-cyan-500/60 via-cyan-500/20 to-transparent' :
                item.accent === 'purple' ? 'bg-gradient-to-r from-purple-500/60 via-purple-500/20 to-transparent' :
                item.accent === 'amber' ? 'bg-gradient-to-r from-amber-500/60 via-amber-500/20 to-transparent' :
                'bg-gradient-to-r from-white/20 via-white/5 to-transparent'
              }`} />
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 font-space">{item.title}</span>
                  <div className="mt-3 text-4xl font-black font-space text-white">{item.value}</div>
                </div>
                <span className={`p-2.5 rounded-xl border ${item.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={16} />
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Governance Controls Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard className="border border-white/[0.06] bg-[#161B22] rounded-2xl relative overflow-hidden">
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-transparent" />
          <div className="absolute top-0 right-0 w-56 h-56 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <ShieldAlert size={18} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-space text-white">Enterprise Governance Controls</h2>
                <p className="text-sm text-white/40 mt-0.5 font-sans">
                  Access global organization controls, SSL certificates, audits, and workspace roles.
                </p>
              </div>
            </div>
            
            <ul className="mt-6 grid gap-4 md:grid-cols-2 text-sm text-white/60 leading-relaxed">
              <li className="flex items-center gap-4 bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/15 transition-all duration-300 group/item">
                <span className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 group-hover/item:scale-110 transition-transform duration-300">
                  <Key size={16} />
                </span>
                <div>
                  <div className="text-white/80 font-semibold font-space text-sm">Authentication & SSO</div>
                  <div className="text-xs text-white/35 mt-0.5 font-sans">Workspace authentication and Single Sign-On configurations.</div>
                </div>
              </li>
              <li className="flex items-center gap-4 bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5 hover:border-cyan-500/15 transition-all duration-300 group/item">
                <span className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 group-hover/item:scale-110 transition-transform duration-300">
                  <Users size={16} />
                </span>
                <div>
                  <div className="text-white/80 font-semibold font-space text-sm">Team Collaboration & RBAC</div>
                  <div className="text-xs text-white/35 mt-0.5 font-sans">Team member collaboration and role-based access controls.</div>
                </div>
              </li>
            </ul>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
export default AdminPage;
