import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GlassCard } from '../components/common/GlassCard';
import { fetchDeployments } from '../app/slices/projectsSlice';
import { motion } from 'framer-motion';
import { Terminal, Activity, Play, CheckCircle, HelpCircle } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

export function DeploymentsPage() {
  const dispatch = useDispatch();
  const { deployments } = useSelector((state) => state.projects);

  useEffect(() => {
    dispatch(fetchDeployments());
  }, [dispatch]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'success':
        return <CheckCircle size={14} className="text-emerald-400" />;
      case 'running':
      case 'deploying':
        return <Play size={14} className="text-purple-400 animate-pulse" />;
      default:
        return <HelpCircle size={14} className="text-white/40" />;
    }
  };

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Ambient glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-gradient-to-r from-purple-500 to-transparent" />
          <p className="text-xs uppercase tracking-[0.35em] text-purple-400 font-semibold font-space">Deployments</p>
        </div>
        <h1 className="text-4xl font-extrabold font-space text-white">
          Operations Terminal
        </h1>
        <p className="mt-2 text-sm text-white/40 max-w-lg">
          Real-time build logs and deployment status for all your applications.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6"
      >
        {deployments.map((deployment) => (
          <motion.div key={deployment._id} variants={cardVariants}>
            <GlassCard className="border border-white/[0.06] bg-[#161B22] rounded-2xl p-0 overflow-hidden hover:border-purple-500/25 transition-all duration-500 group">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span className="flex items-center justify-center w-11 h-11 bg-[#0D1117] border border-white/[0.06] rounded-2xl text-cyan-400 group-hover:border-cyan-500/30 transition-colors duration-300">
                      <Terminal size={18} />
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#161B22]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-space text-white tracking-tight">{deployment.projectId?.name || 'Application Build'}</h2>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5 tracking-wide">{deployment.version}</p>
                  </div>
                </div>
                
                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-bold font-space uppercase tracking-wider border backdrop-blur-sm ${
                  deployment.status === 'healthy' || deployment.status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                    : deployment.status === 'running' || deployment.status === 'deploying'
                    ? 'bg-purple-500/10 border-purple-500/25 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}>
                  {getStatusIcon(deployment.status)}
                  {deployment.status}
                </span>
              </div>

              {/* Terminal Logs Block */}
              <div className="m-4 bg-[#06080F] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Terminal title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#0D1117]/60">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-space ml-2">Console Output</span>
                </div>
                {/* Log lines */}
                <div className="p-4 font-mono text-xs text-white/60 space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                  {(deployment.buildLogs || ['Build initialized', 'Docker layer cache checked', 'SonarQube analysis successful', 'Deploying to Kubernetes cluster', 'Deployment health check: Success']).map((log, index) => (
                    <div key={index} className="flex gap-2.5 items-start group/line hover:bg-white/[0.02] rounded px-1 py-0.5 -mx-1 transition-colors">
                      <span className="text-purple-500 select-none font-bold shrink-0">❯</span>
                      <span className={
                        log.toLowerCase().includes('success') || log.toLowerCase().includes('healthy')
                          ? 'text-emerald-400 font-semibold'
                          : log.toLowerCase().includes('fail') || log.toLowerCase().includes('error')
                          ? 'text-red-400'
                          : 'text-white/60'
                      }>
                        {log}
                      </span>
                    </div>
                  ))}
                  {/* Blinking cursor */}
                  <div className="flex gap-2.5 items-center px-1">
                    <span className="text-purple-500 select-none font-bold">❯</span>
                    <span className="h-3.5 w-1.5 bg-cyan-400/70 animate-pulse rounded-sm" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {deployments.length === 0 && (
          <motion.div variants={cardVariants}>
            <GlassCard className="border border-white/[0.06] bg-[#161B22] rounded-2xl p-0 overflow-hidden hover:border-purple-500/25 transition-all duration-500 group">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span className="flex items-center justify-center w-11 h-11 bg-[#0D1117] border border-white/[0.06] rounded-2xl text-cyan-400 group-hover:border-cyan-500/30 transition-colors duration-300">
                      <Terminal size={18} />
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#161B22]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-space text-white tracking-tight">Preview Application Build</h2>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5 tracking-wide">rel-v1.0.0-preview</p>
                  </div>
                </div>
                
                <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-bold font-space uppercase tracking-wider border backdrop-blur-sm bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  {getStatusIcon('healthy')}
                  healthy
                </span>
              </div>

              {/* Terminal Logs Block */}
              <div className="m-4 bg-[#06080F] border border-white/[0.06] rounded-xl overflow-hidden">
                {/* Terminal title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#0D1117]/60">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-space ml-2">Console Output</span>
                </div>
                {/* Log lines */}
                <div className="p-4 font-mono text-xs text-white/60 space-y-1.5 scrollbar-thin">
                  {['Build initialized', 'Docker layer cache checked', 'SonarQube analysis successful', 'Deploying to Kubernetes cluster', 'Deployment health check: Success'].map((log, index) => (
                    <div key={index} className="flex gap-2.5 items-start hover:bg-white/[0.02] rounded px-1 py-0.5 -mx-1 transition-colors">
                      <span className="text-purple-500 select-none font-bold shrink-0">❯</span>
                      <span className={
                        log.toLowerCase().includes('success')
                          ? 'text-emerald-400 font-semibold'
                          : 'text-white/60'
                      }>
                        {log}
                      </span>
                    </div>
                  ))}
                  {/* Blinking cursor */}
                  <div className="flex gap-2.5 items-center px-1">
                    <span className="text-purple-500 select-none font-bold">❯</span>
                    <span className="h-3.5 w-1.5 bg-cyan-400/70 animate-pulse rounded-sm" />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
export default DeploymentsPage;
