import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/common/GlassCard';
import { fetchProjects, runDeployment } from '../app/slices/projectsSlice';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, HardDrive, Cpu, Terminal, RefreshCw, Layers, Trash2, ExternalLink, Eye } from 'lucide-react';
import { api } from '../api/client';

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

export function ProjectsPage() {
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleDelete = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project? This will delete all its resources and manifests.")) {
      try {
        await api.delete(`/projects/${projectId}`);
        dispatch(fetchProjects());
      } catch (err) {
        alert("Failed to delete project: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const activeSub = user?.subscription?.status === 'active';
  const limitExceeded = projects.length >= 3 && !activeSub;
  const githubConnected = !!(user?.githubCredentials?.username || user?.githubUsername);

  return (
    <div className="space-y-8 pb-12">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-purple-400 font-space mb-3">
            <Layers size={12} /> Projects
          </span>
          <h1 className="text-4xl font-extrabold font-space text-white leading-tight">
            Your Deployable Apps
          </h1>
          <p className="mt-1.5 text-sm text-white/40 max-w-md">
            Manage, monitor and redeploy your containerised applications from one dashboard.
          </p>
        </div>
        <Link
          to="/projects/import"
          className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(168,85,247,0.25)] hover:shadow-[0_0_32px_rgba(168,85,247,0.4)] transition-all duration-300"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Import Project
        </Link>
      </div>

      {/* ── GitHub Not Connected Alert ─────────────────────── */}
      {!githubConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-[#161B22] border border-red-500/20 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/25 text-red-400">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="font-bold text-white font-space text-[15px]">Action Required</h3>
                <p className="text-xs text-white/50 mt-0.5 max-w-xl leading-relaxed">
                  GitHub account connection is required to deploy applications. Connect your account to get started.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard?connect=github"
              className="rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 px-5 py-2.5 text-xs font-bold text-red-300 transition-all duration-200"
            >
              Connect GitHub
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Limit Exceeded Alert ───────────────────────────── */}
      {limitExceeded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl bg-[#161B22] border border-amber-500/20 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="font-bold text-white font-space text-[15px]">Project Slot Limit Reached</h3>
                <p className="text-xs text-white/50 mt-0.5 max-w-xl leading-relaxed">
                  You've used 3 of 3 free project slots. Upgrade to Pro for unlimited projects and infinite pipelines.
                </p>
              </div>
            </div>
            <Link
              to="/billing"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.2)] hover:shadow-[0_0_24px_rgba(168,85,247,0.35)] transition-all duration-300"
            >
              Upgrade Subscription
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Projects Grid ──────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5"
      >
        {projects.map((project) => {
          const deployUrl = project.deploymentUrl || `https://${project.slug}.cloploy.app`;
          const displayUrl = project.customDomain || deployUrl;
          const liveUrl = project.customDomain 
            ? `http://${project.customDomain}` 
            : (() => {
                const { hostname, port, protocol } = window.location;
                const portStr = port ? `:${port}` : '';
                if (hostname === 'localhost' || hostname === '127.0.0.1') {
                  return `${protocol}//${project.slug}.localhost${portStr}`;
                }
                const parts = hostname.split('.');
                if (hostname.endsWith('.amazonaws.com')) {
                  if (parts.length > 5) return `${protocol}//${project.slug}.${parts.slice(1).join('.')}${portStr}`;
                  return `${protocol}//${project.slug}.${hostname}${portStr}`;
                }
                if (parts.length >= 3 && (parts[0] === 'www' || parts[0] === 'app')) {
                  return `${protocol}//${project.slug}.${parts.slice(1).join('.')}${portStr}`;
                }
                return `${protocol}//${project.slug}.${hostname}${portStr}`;
              })();

          return (
            <motion.div key={project._id} variants={cardVariants}>
              <GlassCard className="relative overflow-hidden border border-white/[0.06] hover:border-purple-500/30 bg-[#161B22] transition-all duration-300 group">
                {/* Ambient glow */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-500/[0.04] rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/[0.08] transition-all duration-500" />

                <div className="relative flex flex-wrap items-center justify-between gap-6">

                  {/* Left: Project meta */}
                  <div className="space-y-3.5 min-w-0 flex-1">
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white/50 group-hover:text-purple-400 group-hover:border-purple-500/25 group-hover:bg-purple-500/10 transition-all duration-300">
                        <Layers size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-xl font-bold font-space text-white truncate group-hover:text-purple-300 transition-colors duration-300">
                            {project.name}
                          </h2>
                          <Link
                            to={`/projects/${project._id}`}
                            className="text-white/30 hover:text-purple-400 transition-colors"
                            title="View details"
                          >
                            <Eye size={15} />
                          </Link>
                        </div>
                        <span className="inline-flex mt-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 font-space">
                          {project.framework || 'Auto-detected'}
                        </span>
                      </div>
                    </div>

                    {/* Attributes row */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/40 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Cpu size={13} className="text-white/25" /> <span>{project.runtime || 'Container Node'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HardDrive size={13} className="text-white/25" /> <span>{project.sourceType === 'upload' ? 'Local Upload' : 'GitHub Repo'}</span>
                      </div>
                      {project.status === 'deployed' && (
                        <div className="flex items-center gap-1.5">
                          <ExternalLink size={13} className="text-cyan-400" />
                          <a href={liveUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline font-mono truncate max-w-[220px]">
                            {displayUrl}
                          </a>
                        </div>
                      )}
                      <div className="text-[10px] text-white/25">
                        Updated {new Date(project.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex items-center gap-5 flex-wrap">
                    {/* Status pill */}
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest font-semibold text-white/25 font-space">Status</div>
                      <span className={`inline-block mt-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold font-space uppercase tracking-wide border ${
                        project.status === 'deployed'
                          ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                          : project.status === 'failed'
                            ? 'bg-red-500/10 border-red-500/25 text-red-400'
                            : 'bg-white/[0.04] border-white/[0.08] text-white/40'
                      }`}>
                        {project.status || 'ready'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Link
                        to={`/projects/${project._id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] px-4 py-2.5 text-xs font-bold text-white/80 transition-all duration-200"
                      >
                        Details
                      </Link>

                      {project.status === 'deployed' && (
                        <a
                          href={liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/20 px-4 py-2.5 text-xs font-bold text-cyan-400 transition-all duration-200"
                        >
                          <ExternalLink size={12} /> Open Site
                        </a>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => dispatch(runDeployment(project._id))}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 border border-purple-500/30 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300"
                      >
                        <RefreshCw size={12} /> Redeploy
                      </motion.button>

                      <button
                        onClick={() => handleDelete(project._id)}
                        className="inline-flex items-center justify-center rounded-xl bg-red-500/[0.08] border border-red-500/20 hover:bg-red-500/[0.15] px-3 py-2.5 text-red-400 transition-all duration-200"
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </GlassCard>
            </motion.div>
          );
        })}

        {/* ── Empty State ─────────────────────────────────── */}
        {projects.length === 0 && (
          <motion.div
            variants={cardVariants}
            className="flex flex-col items-center justify-center py-20 border border-dashed border-white/[0.08] rounded-2xl bg-[#161B22]/50"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-5">
              <Layers size={28} className="text-purple-400/60" />
            </div>
            <h3 className="text-lg font-bold font-space text-white/70">No projects yet</h3>
            <p className="text-xs text-white/35 mt-2 max-w-xs text-center leading-relaxed">
              You haven't imported any projects. Tap "Import Project" to analyze a folder or repository and get started.
            </p>
            <Link
              to="/projects/import"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_28px_rgba(168,85,247,0.35)] transition-all duration-300"
            >
              <Plus size={14} /> Import Your First Project
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
