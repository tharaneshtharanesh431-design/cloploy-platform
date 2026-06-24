import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GlassCard } from '../components/common/GlassCard';
import { LineChartCard } from '../components/charts/LineChartCard';
import { fetchDeployments, fetchProjects } from '../app/slices/projectsSlice';
import { onboardUser } from '../app/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cloud, AlertCircle, Award, ArrowUpRight, Plus, Terminal, Github, Server, ChevronRight, Check } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const costData = [
  { name: 'Jan', value: 460 }, { name: 'Feb', value: 520 }, { name: 'Mar', value: 490 }, { name: 'Apr', value: 610 }, { name: 'May', value: 570 }, { name: 'Jun', value: 640 }
];

export function DashboardPage() {
  const dispatch = useDispatch();
  const { projects, deployments } = useSelector((state) => state.projects);
  const user = useSelector((state) => state.auth.user);

  const [searchParams, setSearchParams] = useSearchParams();
  const connectParam = searchParams.get('connect');

  // Onboarding local states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1); // 1: Github, 2: Success
  const [hasGithub, setHasGithub] = useState(null); // null, true, false
  const [onboardForm, setOnboardForm] = useState({
    githubUsername: '',
    githubAccessToken: ''
  });
  const [onboardLoading, setOnboardLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchDeployments());
  }, [dispatch]);

  // Trigger onboarding modal if user is logged in and not onboarded, or if connect query is github
  useEffect(() => {
    if (user && (user.onboarded === false || connectParam === 'github')) {
      setShowOnboarding(true);
      if (connectParam === 'github') {
        setOnboardStep(1);
        setHasGithub(true);
      }
    } else {
      setShowOnboarding(false);
    }
  }, [user, connectParam]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (searchParams.has('connect')) {
      searchParams.delete('connect');
      setSearchParams(searchParams);
    }
  };

  const githubConnected = !!(user?.githubCredentials?.username || user?.githubUsername);
  const activeSub = user?.subscription?.status === 'active';
  const planName = user?.subscription?.plan;
  const projectCount = projects.length;
  const projectLimit = 3;
  const usagePercentage = Math.min((projectCount / projectLimit) * 100, 100);

  const deploymentData = [
    { name: 'Mon', value: Math.max(2, Math.floor(deployments.length * 0.1)) },
    { name: 'Tue', value: Math.max(3, Math.floor(deployments.length * 0.15)) },
    { name: 'Wed', value: Math.max(4, Math.floor(deployments.length * 0.2)) },
    { name: 'Thu', value: Math.max(2, Math.floor(deployments.length * 0.1)) },
    { name: 'Fri', value: Math.max(5, Math.floor(deployments.length * 0.25)) },
    { name: 'Sat', value: Math.max(1, Math.floor(deployments.length * 0.05)) },
    { name: 'Sun', value: Math.max(3, Math.floor(deployments.length * 0.15)) }
  ];

  const handleOnboardSubmit = async () => {
    setOnboardLoading(true);
    try {
      await dispatch(onboardUser({
        githubUsername: onboardForm.githubUsername,
        githubAccessToken: onboardForm.githubAccessToken
      })).unwrap();
      setOnboardStep(2);
    } catch (err) {
      alert(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setOnboardLoading(false);
    }
  };

  /* ── radius & circumference for SVG quota ring ── */
  const RING_R = 38;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <div className="space-y-8 relative pb-12">
      {/* ── ambient glow blobs ── */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-[420px] w-[420px] rounded-full bg-purple/[0.06] blur-[140px]" />
      <div className="pointer-events-none absolute top-60 -left-32 h-80 w-80 rounded-full bg-cyan/[0.04] blur-[120px]" />

      {/* ══════════════════════  HEADER  ══════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple/20 to-purple/5 border border-purple/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-purple-light font-space">
            <Server size={10} /> Dashboard
          </span>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-extrabold font-space text-white tracking-tight">
              Command Center
            </h1>

            {/* GitHub connection badge */}
            {githubConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/10 border border-cyan/25 px-3 py-1 text-xs font-bold text-cyan font-space shadow-cyan/20">
                <Github size={12} /> Connected: {user?.githubCredentials?.username || user?.githubUsername}
              </span>
            ) : (
              <button
                onClick={() => {
                  setSearchParams({ connect: 'github' });
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-error/10 border border-error/30 px-3 py-1 text-xs font-bold text-error font-space hover:bg-error/20 transition-all duration-200 animate-pulse"
              >
                <AlertCircle size={12} /> Connect GitHub
              </button>
            )}
          </div>
        </div>

        {/* Import button */}
        <Link
          to="/projects/import"
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple to-cyan px-6 py-3 text-sm font-bold text-white shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-[1.03]"
        >
          <Plus size={16} className="transition-transform group-hover:rotate-90 duration-300" />
          Import Project
        </Link>
      </div>

      {/* ══════════════════════  SUBSCRIPTION BANNER  ══════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="border border-white/[0.06] relative overflow-hidden bg-gradient-to-br from-card via-surface to-dark">
          {/* decorative accent stripe top */}
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-purple via-cyan to-purple opacity-60" />

          {/* subtle glow */}
          <div className="pointer-events-none absolute -top-10 right-10 h-40 w-40 rounded-full bg-purple/[0.08] blur-[80px]" />

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1.2fr] items-center">
            {/* Left: Subscription info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] font-space">
                <Award size={14} className="text-purple" />
                <span>Subscription Plan</span>
              </div>
              <h2 className="text-2xl font-black font-space text-white">
                {activeSub ? `${planName === 'weekly' ? 'Weekly' : 'Monthly'} Pro` : 'Free Starter'}
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                {activeSub
                  ? `Professional subscription active. Renews ${new Date(user.subscription.expiresAt).toLocaleDateString()}`
                  : 'Free tier — limited to 3 deployable projects.'}
              </p>
              {!activeSub && (
                <Link to="/billing" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-light hover:text-purple transition-colors pt-1 group">
                  Upgrade to Pro <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}
            </div>

            {/* Middle divider */}
            <div className="hidden md:block w-[1px] h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            {/* Right: Quota ring */}
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 flex-shrink-0 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <defs>
                    <linearGradient id="quota-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>
                  {/* track */}
                  <circle cx="48" cy="48" r={RING_R} stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
                  {/* progress */}
                  <motion.circle
                    cx="48" cy="48" r={RING_R}
                    stroke={activeSub ? 'url(#quota-grad)' : (usagePercentage >= 100 ? '#EF4444' : 'url(#quota-grad)')}
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    initial={{ strokeDashoffset: RING_C }}
                    animate={{ strokeDashoffset: activeSub ? 0 : RING_C - (RING_C * usagePercentage) / 100 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                {/* centre text */}
                <div className="text-center z-10">
                  <div className="text-xl font-black font-space text-white leading-none">
                    {activeSub ? '∞' : projectCount}
                  </div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider font-bold mt-0.5">
                    {activeSub ? 'Unlimited' : `of ${projectLimit}`}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-bold font-space text-white">Project Quota</h3>
                <p className="text-xs text-white/45 leading-relaxed">
                  {activeSub
                    ? 'Deploy unlimited projects across your pipelines.'
                    : `${projectCount} of ${projectLimit} free deployment slots used.`}
                </p>
                {projectCount >= projectLimit && !activeSub && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-error mt-1">
                    <AlertCircle size={10} />
                    <span>Limit reached — upgrade to continue.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ══════════════════════  METRICS ROW  ══════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Projects', value: projectCount, desc: 'Registered applications', icon: <Cloud size={16} className="text-purple" /> },
          { label: 'Total Builds', value: deployments.length || 0, desc: 'Success rate 98 %', icon: <Terminal size={16} className="text-cyan" /> },
          { label: 'Observability', value: 'Healthy', desc: 'Prometheus monitoring', icon: <ShieldCheck size={16} className="text-success" /> },
          { label: 'Infra Uptime', value: '99.9%', desc: 'Kubernetes cluster', icon: <Server size={16} className="text-gold" /> }
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 + 0.15 }}
          >
            <GlassCard className="border border-white/[0.06] hover:border-purple/30 transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 font-space">{metric.label}</div>
                <div className="h-8 w-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:border-purple/20 transition-colors">
                  {metric.icon}
                </div>
              </div>
              <div className="mt-3 text-3xl font-extrabold font-space text-white">{metric.value}</div>
              <div className="mt-1 text-[11px] text-white/30 font-medium">{metric.desc}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* ══════════════════════  ANALYTICS CHARTS  ══════════════════════ */}
      <div className="grid gap-6 xl:grid-cols-2">
        <LineChartCard title="Deployment Operations" data={deploymentData} stroke="#A855F7" />
        <LineChartCard title="Billing Cost (INR)" data={costData} stroke="#22D3EE" />
      </div>

      {/* ══════════════════════  ACTIVITY PANELS  ══════════════════════ */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* ─── Recent Projects ─── */}
        <GlassCard className="border border-white/[0.06]">
          <div className="mb-5 flex justify-between items-center">
            <h2 className="text-base font-bold font-space text-white">Recent Projects</h2>
            <Link to="/projects" className="text-[11px] font-bold text-purple-light hover:text-purple transition-colors flex items-center gap-1">
              View All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 3).map((project) => (
              <div
                key={project._id}
                className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.06] hover:border-purple/15 transition-all duration-200"
              >
                <div>
                  <div className="font-bold font-space text-sm text-white">{project.name}</div>
                  <div className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider font-space">
                    {project.framework || 'Auto-detected'} • {project.sourceType}
                  </div>
                </div>
                <span className="rounded-full bg-purple/10 border border-purple/20 px-3 py-1 text-[10px] font-bold text-purple-light font-space uppercase tracking-wider">
                  {project.status || 'ready'}
                </span>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-8 text-xs text-white/30">
                No projects yet. Import one to get started.
              </div>
            )}
          </div>
        </GlassCard>

        {/* ─── Recent Builds ─── */}
        <GlassCard className="border border-white/[0.06]">
          <div className="mb-5 flex justify-between items-center">
            <h2 className="text-base font-bold font-space text-white">Recent Builds</h2>
            <Link to="/deployments" className="text-[11px] font-bold text-purple-light hover:text-purple transition-colors flex items-center gap-1">
              View Logs <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {deployments.slice(0, 3).map((item) => (
              <div
                key={item._id}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2 hover:bg-white/[0.06] hover:border-cyan/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold font-space text-white">{item.projectId?.name || 'Project Build'}</span>
                  <span className="rounded-full bg-cyan/10 border border-cyan/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan font-space uppercase tracking-wider">
                    {item.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-white/35">
                  <span className="font-space">{item.version}</span>
                  <span className="flex items-center gap-1 text-white/30"><Terminal size={10} /> console log</span>
                </div>
              </div>
            ))}
            {deployments.length === 0 && (
              <div className="text-center py-8 text-xs text-white/30">
                No deployment logs generated yet.
              </div>
            )}
          </div>
        </GlassCard>

        {/* ─── Observability & Health ─── */}
        <GlassCard className="border border-white/[0.06]">
          <div className="mb-5 flex justify-between items-center">
            <h2 className="text-base font-bold font-space text-white">Observability & Health</h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
          </div>

          <div className="space-y-4 font-space text-xs">
            {/* K8s */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-white/45">K8s Cluster Status</span>
              <span className="text-success font-bold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                ONLINE
              </span>
            </div>

            {/* Latency */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="text-white/45">API Latency</span>
              <span className="text-white font-bold">12 ms</span>
            </div>

            {/* CPU bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-white/45">Cluster CPU Load</span>
                <span className="text-white">41 %</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple to-cyan"
                  initial={{ width: 0 }}
                  animate={{ width: '41%' }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Memory bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-white/45">Memory Allocation</span>
                <span className="text-white">64 %</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan to-purple"
                  initial={{ width: 0 }}
                  animate={{ width: '64%' }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* SonarQube */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 pt-1">
              <span className="text-white/45">SonarQube Engine</span>
              <span className="text-cyan font-bold">ACTIVE (v10.2)</span>
            </div>

            {/* Jenkins */}
            <div className="flex items-center justify-between">
              <span className="text-white/45">Jenkins Pipelines</span>
              <span className="text-cyan font-bold">IDLE</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ══════════════════════  ONBOARDING MODAL  ══════════════════════ */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/85 p-6 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-card/95 backdrop-blur-xl p-8 shadow-glow-lg relative overflow-hidden text-left"
            >
              {/* top gradient line */}
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-purple via-cyan to-purple" />

              {user?.onboarded && (
                <button
                  onClick={handleCloseOnboarding}
                  className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors z-10"
                  type="button"
                >
                  <Plus className="rotate-45" size={18} />
                </button>
              )}

              {/* progress steps */}
              <div className="flex items-center gap-3 mb-8">
                <span className={`flex items-center gap-1.5 text-[11px] font-bold font-space uppercase tracking-wider ${onboardStep >= 1 ? 'text-purple-light' : 'text-white/25'}`}>
                  <span className={`h-6 w-6 rounded-full text-[10px] flex items-center justify-center font-bold border ${onboardStep >= 1 ? 'bg-purple/15 border-purple/30 text-purple-light' : 'bg-white/5 border-white/10 text-white/30'}`}>1</span>
                  Connect GitHub
                </span>
                <ChevronRight size={14} className="text-white/20" />
                <span className={`flex items-center gap-1.5 text-[11px] font-bold font-space uppercase tracking-wider ${onboardStep === 2 ? 'text-purple-light' : 'text-white/25'}`}>
                  <span className={`h-6 w-6 rounded-full text-[10px] flex items-center justify-center font-bold border ${onboardStep === 2 ? 'bg-purple/15 border-purple/30 text-purple-light' : 'bg-white/5 border-white/10 text-white/30'}`}>2</span>
                  Finish Setup
                </span>
              </div>

              <AnimatePresence mode="wait">
                {onboardStep === 1 && (
                  /* ── STEP 1: GITHUB ── */
                  <motion.div
                    key="step-github"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-3 bg-purple/10 border border-purple/20 rounded-xl text-purple shadow-glow">
                        <Github size={24} />
                      </span>
                      <div>
                        <h2 className="text-xl font-bold font-space text-white">GitHub Connection</h2>
                        <p className="text-xs text-white/40 mt-0.5">Link your source code repository</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-white/80">Do you have a GitHub account?</h3>

                      {hasGithub === null ? (
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setHasGithub(true)}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.04] py-4 font-bold text-sm text-white hover:bg-purple/10 hover:border-purple/25 transition-all duration-300 text-center"
                          >
                            Yes, I have one
                          </button>
                          <button
                            type="button"
                            onClick={() => setHasGithub(false)}
                            className="rounded-xl border border-white/[0.08] bg-white/[0.04] py-4 font-bold text-sm text-white/50 hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300 text-center"
                          >
                            No, I don't
                          </button>
                        </div>
                      ) : hasGithub === false ? (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-error/20 bg-error/5 p-5 flex items-start gap-3">
                            <AlertCircle className="text-error mt-0.5 flex-shrink-0" size={18} />
                            <p className="text-xs text-white/70 leading-relaxed font-space">
                              A GitHub account is required to deploy applications on Cloploy. Please create one and return here to connect.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setHasGithub(null)}
                            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-white/50 py-3.5 hover:bg-white/[0.06] transition-colors"
                          >
                            Go Back
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-white/35 font-space">GitHub Username</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. tharaneesh"
                              className="w-full rounded-xl border border-white/[0.08] bg-dark/80 px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:border-purple/50 focus:ring-1 focus:ring-purple/20 outline-none transition-all duration-300"
                              value={onboardForm.githubUsername}
                              onChange={(e) => setOnboardForm({ ...onboardForm, githubUsername: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-white/35 font-space">Personal Access Token</label>
                            <input
                              type="password"
                              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                              className="w-full rounded-xl border border-white/[0.08] bg-dark/80 px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:border-purple/50 focus:ring-1 focus:ring-purple/20 outline-none transition-all duration-300"
                              value={onboardForm.githubAccessToken}
                              onChange={(e) => setOnboardForm({ ...onboardForm, githubAccessToken: e.target.value })}
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setHasGithub(null)}
                              className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-white/50 py-3.5 hover:bg-white/[0.06] transition-colors"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={handleOnboardSubmit}
                              disabled={onboardLoading || !onboardForm.githubUsername}
                              className="flex-1 rounded-xl bg-gradient-to-r from-purple to-cyan text-xs font-bold text-white py-3.5 shadow-glow hover:shadow-glow-lg flex justify-center items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                            >
                              {onboardLoading && <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                              Complete Setup
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {onboardStep === 2 && (
                  /* ── STEP 2: SUCCESS ── */
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8 space-y-6"
                  >
                    <div className="mx-auto h-20 w-20 bg-gradient-to-br from-purple/15 to-cyan/15 border border-purple/25 rounded-full flex items-center justify-center text-purple shadow-glow">
                      <Check size={34} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black font-space text-white">Setup Complete!</h2>
                      <p className="text-sm text-white/45 max-w-sm mx-auto leading-relaxed">
                        GitHub credentials saved successfully. You're ready to deploy on Cloploy.
                      </p>
                    </div>

                    <button
                      onClick={handleCloseOnboarding}
                      className="w-full rounded-xl bg-gradient-to-r from-purple to-cyan py-4 font-bold text-white shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    >
                      Enter Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default DashboardPage;
