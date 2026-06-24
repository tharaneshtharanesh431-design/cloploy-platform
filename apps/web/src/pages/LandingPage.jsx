import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cloud, Github, ShieldCheck, Bot, Activity, ServerCrash, ArrowRight, Sparkles, CheckCircle2, QrCode } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';

const features = [
  { icon: Cloud, title: 'One-Click Cloud Delivery', text: 'Push your code or import a repo — Cloploy auto-generates build, deploy, and scaling workflows across any cloud.' },
  { icon: Github, title: 'GitHub-Native Pipelines', text: 'Seamless OAuth login, instant repo discovery, automatic webhooks, and fully isolated per-tenant deployment pipelines.' },
  { icon: ShieldCheck, title: 'Quality & Security Gates', text: 'SonarQube analysis, policy-driven rollbacks, secrets isolation, and complete auditable deployment trails built in.' },
  { icon: Bot, title: 'AI DevOps Copilot', text: 'Intelligent framework detection, deployment planning, root-cause analysis, cost optimization, and architecture review — powered by AI.' },
  { icon: Activity, title: 'Full-Stack Observability', text: 'Prometheus metrics, Grafana dashboards, ELK logging, live pod health, and infrastructure analytics — all in one pane.' },
  { icon: ServerCrash, title: 'Instant Rollback', text: 'Automated health probes with one-click rollback. Ship to production with confidence, recover in seconds.' }
];

const pricing = [
  {
    name: 'Starter (Free)',
    price: '₹0',
    period: 'forever',
    bullets: ['First 3 projects', 'GitHub integration', 'AI framework analysis', 'Shared build runners'],
    popular: false
  },
  {
    name: 'Weekly Pro',
    price: '₹120',
    period: 'week',
    bullets: ['Unlimited projects', 'Isolated namespaces', 'Advanced observability', 'Slack & Discord alerts', 'Dedicated build nodes'],
    popular: true
  },
  {
    name: 'Monthly Pro',
    price: '₹400',
    period: 'month',
    bullets: ['Unlimited projects', 'Premium EKS clusters', 'Multi-region delivery', 'SSO & team collaboration', '24/7 Priority support'],
    popular: false
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
};

export function LandingPage() {
  return (
    <div className="relative overflow-hidden min-h-screen font-sans" style={{ backgroundColor: '#06080F', color: 'white' }}>

      {/* ── Animated Background Orbs ── */}
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', filter: 'blur(100px)' }}
      />
      <motion.div
        animate={{ x: [0, -30, 25, 0], y: [0, 40, -15, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[10%] right-[-12%] w-[50%] h-[50%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)', filter: 'blur(120px)' }}
      />
      <motion.div
        animate={{ x: [0, 20, -15, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', filter: 'blur(100px)' }}
      />

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-12 relative z-10">

        {/* ═══════════════════════════════════════════
            HERO SECTION
        ═══════════════════════════════════════════ */}
        <section className="grid items-center gap-16 py-20 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            {/* Pill badge */}
            <motion.p
              whileHover={{ scale: 1.05 }}
              className="mb-6 inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest cursor-default"
              style={{
                border: '1px solid rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.08)',
                color: '#A855F7',
                boxShadow: '0 0 20px rgba(168,85,247,0.08)'
              }}
            >
              <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
              Upload · Build · Deploy · Scale
            </motion.p>

            {/* Heading */}
            <h1 className="max-w-3xl text-5xl font-black leading-[1.08] md:text-7xl font-space">
              Deploy Like{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)' }}
              >
                Royalty
              </span>
              .
            </h1>
            <p className="mt-2 max-w-3xl text-4xl font-black leading-tight md:text-5xl font-space" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Scale Without Limits.
            </p>

            {/* Subtitle */}
            <p className="mt-7 max-w-2xl text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Cloploy is the AI-powered cloud delivery engine that orchestrates Docker, SonarQube, Jenkins, Terraform, Kubernetes, monitoring, logging, and rollback — fully automated.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-5">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 rounded-xl px-9 py-4 font-bold text-white text-sm shadow-xl transition-all duration-300"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)',
                    boxShadow: '0 8px 30px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.1)'
                  }}
                >
                  Launch Platform <ArrowRight size={18} />
                </Link>
              </motion.div>
              <motion.a
                whileHover={{ scale: 1.04, borderColor: 'rgba(168,85,247,0.5)' }}
                whileTap={{ scale: 0.97 }}
                href="#pricing"
                className="rounded-xl px-9 py-4 font-bold text-sm transition-all duration-300"
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.8)',
                  background: 'rgba(255,255,255,0.03)'
                }}
              >
                View Plans
              </motion.a>
            </div>
          </motion.div>

          {/* Hero Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.25 }}
          >
            <div
              className="relative overflow-hidden rounded-2xl p-8"
              style={{
                background: 'rgba(22,27,34,0.8)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(168,85,247,0.15)',
                boxShadow: '0 0 60px rgba(168,85,247,0.06), 0 25px 50px rgba(0,0,0,0.4)'
              }}
            >
              {/* Inner radial glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at top right, rgba(34,211,238,0.06) 0%, transparent 50%), radial-gradient(circle at bottom left, rgba(168,85,247,0.06) 0%, transparent 50%)'
                }}
              />

              <div className="relative space-y-5">
                {/* Status bar */}
                <div
                  className="flex items-center justify-between rounded-xl p-4"
                  style={{ background: 'rgba(13,17,23,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: '#10B981' }} />
                    <span className="h-2 w-2 rounded-full absolute" style={{ backgroundColor: '#10B981' }} />
                    <span className="text-sm font-bold text-white ml-1">AI Deployment Planner</span>
                  </div>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg"
                    style={{
                      color: '#10B981',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.2)'
                    }}
                  >
                    Ready
                  </span>
                </div>

                {/* Stat cards */}
                <div className="grid gap-4 md:grid-cols-2">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="rounded-xl p-5 text-center transition-all duration-300"
                    style={{
                      background: 'rgba(13,17,23,0.8)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      SonarQube Gate
                    </div>
                    <div className="mt-2 text-4xl font-black font-space" style={{ color: '#22D3EE' }}>92%</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="rounded-xl p-5 text-center transition-all duration-300"
                    style={{
                      background: 'rgba(13,17,23,0.8)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Build Time
                    </div>
                    <div className="mt-2 text-4xl font-black font-space" style={{ color: '#A855F7' }}>6m</div>
                  </motion.div>
                </div>

                {/* Generated manifests */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(6,8,15,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Generated Manifests
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    {['GitHub Hook', 'Dockerfile', 'Sonar Scanner', 'Docker ECR', 'K8s Pods', 'Terraform EKS', 'Prometheus'].map((step, i) => (
                      <motion.span
                        key={step}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.08, duration: 0.3 }}
                        whileHover={{ background: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' }}
                        className="rounded-full px-3.5 py-1.5 cursor-default transition-all duration-200"
                        style={{
                          color: 'rgba(255,255,255,0.7)',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        {step}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════
            FEATURES SECTION
        ═══════════════════════════════════════════ */}
        <section id="features" className="py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="mb-14 max-w-2xl"
          >
            <p
              className="text-xs font-bold uppercase tracking-[0.3em]"
              style={{ color: '#A855F7' }}
            >
              Capabilities
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl font-space text-white">
              Command Your Infrastructure
            </h2>
            <p className="mt-4 text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Everything you need to go from commit to production — automated, observable, and secure.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {features.map(({ icon: Icon, title, text }) => (
              <motion.div key={title} variants={itemVariants} whileHover={{ y: -6 }} className="group">
                <div
                  className="h-full rounded-2xl p-8 transition-all duration-300"
                  style={{
                    background: '#161B22',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(168,85,247,0.08), 0 20px 40px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    className="mb-6 inline-flex rounded-xl p-3.5 transition-all duration-300"
                    style={{
                      background: 'rgba(168,85,247,0.1)',
                      border: '1px solid rgba(168,85,247,0.15)',
                      color: '#A855F7'
                    }}
                  >
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {text}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════
            PRICING SECTION
        ═══════════════════════════════════════════ */}
        <section id="pricing" className="py-24 relative">
          {/* Background glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[400px] w-[600px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: '#A855F7' }}>
              Pricing & Plans
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl font-space text-white">
              Transparent Pricing, No Surprises
            </h2>
            <p className="mt-5 max-w-lg mx-auto text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Start completely free. Scale with simple UPI billing — no credit cards, no hidden fees, no lock-in.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="flex"
              >
                <div
                  className="flex flex-col justify-between w-full rounded-2xl p-8 md:p-9 relative overflow-hidden h-full flex-1 transition-all duration-300"
                  style={{
                    background: plan.popular
                      ? 'linear-gradient(180deg, rgba(168,85,247,0.06) 0%, rgba(22,27,34,1) 40%)'
                      : '#161B22',
                    border: plan.popular
                      ? '1px solid rgba(168,85,247,0.4)'
                      : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: plan.popular
                      ? '0 0 60px rgba(168,85,247,0.1), 0 25px 50px rgba(0,0,0,0.3)'
                      : '0 10px 30px rgba(0,0,0,0.2)'
                  }}
                >
                  {plan.popular && (
                    <div
                      className="absolute top-5 right-5 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full"
                      style={{
                        background: 'rgba(168,85,247,0.15)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        color: '#A855F7'
                      }}
                    >
                      RECOMMENDED
                    </div>
                  )}

                  <div>
                    <h3
                      className="text-xl font-black"
                      style={{ color: plan.popular ? '#A855F7' : 'white' }}
                    >
                      {plan.name}
                    </h3>
                    <div className="mt-6 flex items-baseline gap-1.5">
                      <span className="text-5xl font-black text-white font-space">{plan.price}</span>
                      <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        /{plan.period}
                      </span>
                    </div>

                    <ul className="mt-8 space-y-3.5">
                      {plan.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-sm">
                          <CheckCircle2
                            size={17}
                            strokeWidth={2.5}
                            className="flex-shrink-0 mt-0.5"
                            style={{ color: plan.popular ? '#A855F7' : '#10B981' }}
                          />
                          <span style={{ color: 'rgba(255,255,255,0.75)' }}>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {plan.price === '₹0' ? (
                      <Link
                        to="/register"
                        className="block w-full text-center rounded-xl py-3.5 text-sm font-bold transition-all duration-300"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.8)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        }}
                      >
                        Get Started Free
                      </Link>
                    ) : (
                      <Link
                        to="/register"
                        className="block w-full text-center rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-300"
                        style={{
                          backgroundImage: plan.popular
                            ? 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)'
                            : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                          boxShadow: plan.popular
                            ? '0 8px 25px rgba(168,85,247,0.3)'
                            : '0 5px 15px rgba(168,85,247,0.2)'
                        }}
                      >
                        Upgrade Now
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── UPI Payment Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-20 max-w-3xl mx-auto"
          >
            <div
              className="relative overflow-hidden rounded-2xl p-8 md:p-10"
              style={{
                background: '#0D1117',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
              }}
            >
              {/* Decorative glows */}
              <div
                className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
              />
              <div
                className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', filter: 'blur(60px)' }}
              />

              <div className="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center relative z-10">
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="p-3 rounded-xl"
                      style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}
                    >
                      <QrCode size={22} strokeWidth={2.5} style={{ color: '#A855F7' }} />
                    </span>
                    <h4 className="text-2xl font-black text-white font-space">Direct UPI Payment</h4>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Upgrade instantly using any UPI app — Google Pay, PhonePe, or Paytm. Scan the QR or copy the UPI ID below.
                  </p>
                  <div
                    className="rounded-xl p-5 space-y-2"
                    style={{
                      background: 'rgba(6,8,15,0.8)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      UPI ID Address
                    </div>
                    <div className="text-sm font-mono font-bold select-all flex items-center justify-between" style={{ color: '#22D3EE' }}>
                      <span>tharaneshtharanesh431@okhdfcbank</span>
                      <span className="text-[10px] uppercase tracking-widest font-sans" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        click to copy
                      </span>
                    </div>
                  </div>
                  <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    After payment, enter your Transaction ID/Reference in the "Billing" cockpit on your dashboard to activate your subscription instantly.
                  </p>
                </div>

                <div
                  className="flex flex-col items-center justify-center rounded-2xl p-6"
                  style={{ background: 'white' }}
                >
                  <img
                    src="/upi_qr.png"
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 object-contain rounded-xl"
                    style={{ border: '3px solid #E5E7EB' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="mt-4 text-center">
                    <span className="text-xs font-black tracking-widest uppercase" style={{ color: '#A855F7' }}>
                      Scan with any App
                    </span>
                    <p className="text-[11px] font-bold mt-1" style={{ color: '#6B7280' }}>
                      Tharaneesh - GPay
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════
            BOTTOM INFO CARDS
        ═══════════════════════════════════════════ */}
        <section className="grid gap-6 py-20 lg:grid-cols-3">
          {[
            ['Testimonials', '"Cloploy transformed our release engineering into a push-button workflow. SonarQube gates, EKS configs, and ECR builds — all flawless." — Staff DevOps Lead'],
            ['FAQ', 'Q: Does it support drag-drop folder uploads? A: Yes! With real-time AI framework analysis and manifest generation. Q: How many free projects? A: Deploy your first 3 projects completely free.'],
            ['Contact Support', 'Reach our core engineering team at support@cloploy.app — or contact Tharaneesh directly for billing and payment queries.']
          ].map(([title, text], i) => (
            <motion.div
              key={title}
              id={title.toLowerCase().replace(/ /g, '-')}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <GlassCard className="h-full p-8" style={{ background: '#161B22', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-xl font-black text-white font-space">{title}</h3>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {text}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </section>

        {/* ═══════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════ */}
        <footer className="mt-12 pt-10 text-center space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm font-black tracking-wider text-white font-space">
            CLOPLOY{' '}
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>{' '}
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Automated Platform Delivery</span>
          </p>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2026 Cloploy. All rights reserved.
          </p>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.25em]"
            style={{ color: '#A855F7' }}
          >
            Claimed by Tharaneesh
          </p>
        </footer>

      </div>
    </div>
  );
}
