import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { GlassCard } from '../components/common/GlassCard';
import { Globe, Link as LinkIcon, CheckCircle2, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DomainsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDomains = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects.filter(p => p.customDomain || p.deploymentUrl));
    } catch (err) {
      console.error('Failed to load domains', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  return (
    <div className="space-y-8 pb-12 relative">
      {/* Ambient glow effects */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-gradient-to-r from-cyan-500 to-transparent" />
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-400 font-semibold font-space">Domains</p>
        </div>
        <h1 className="text-4xl font-extrabold font-space text-white">Custom Domain Settings</h1>
        <p className="mt-2 text-sm text-white/40 max-w-lg">
          Manage DNS routing, SSL certificates, and custom domain configurations for your projects.
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex items-center gap-3 text-white/40 text-sm">
            <RefreshCw size={20} className="animate-spin text-cyan-400" />
            <span className="font-sans">Loading domain configurations...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {projects.map((project) => {
            const hasCustom = !!project.customDomain;
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
              <GlassCard key={project._id} className="border border-white/[0.06] bg-[#161B22] rounded-2xl hover:border-cyan-500/20 transition-all duration-500 group">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  
                  {/* Left: Domain info */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <span className="flex items-center justify-center w-12 h-12 bg-[#0D1117] border border-white/[0.06] rounded-2xl text-cyan-400 group-hover:border-cyan-500/25 transition-colors duration-300">
                        <Globe size={20} />
                      </span>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#161B22]" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold font-space text-white tracking-tight">{displayUrl}</h2>
                      <div className="text-[11px] text-white/35 flex items-center gap-1.5 font-sans">
                        <LinkIcon size={11} className="text-white/25" />
                        <span>Project:</span>
                        <Link to={`/projects/${project._id}`} className="text-purple-400 hover:text-purple-300 hover:underline font-semibold transition-colors">
                          {project.name}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Verification Status Badges */}
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-[0.15em] font-semibold text-white/25 font-space mb-1.5">DNS</div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase font-space tracking-wide">
                        <CheckCircle2 size={10} />
                        Verified
                      </span>
                    </div>

                    <div className="h-8 w-px bg-white/[0.06]" />

                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-[0.15em] font-semibold text-white/25 font-space mb-1.5">SSL</div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full uppercase font-space tracking-wide">
                        <ShieldCheck size={10} />
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/projects/${project._id}`}
                      className="rounded-xl bg-[#0D1117] border border-white/[0.06] hover:bg-[#1C2128] hover:border-white/10 px-5 py-3 text-xs font-semibold text-white/80 transition-all duration-300 font-space"
                    >
                      Configure
                    </Link>
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/30 px-5 py-3 text-xs font-bold text-cyan-400 transition-all duration-300 font-space"
                    >
                      Visit →
                    </a>
                  </div>

                </div>
              </GlassCard>
            );
          })}

          {projects.length === 0 && (
            <div className="text-center py-20 border border-dashed border-white/[0.06] rounded-2xl bg-[#0D1117]/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 to-purple-500/3 pointer-events-none" />
              <div className="relative">
                <div className="mx-auto p-5 bg-[#161B22] border border-white/[0.06] rounded-2xl w-max mb-5">
                  <Globe size={32} className="text-white/15" />
                </div>
                <h3 className="text-lg font-bold font-space text-white/60">No configured domains</h3>
                <p className="text-sm text-white/30 mt-2 max-w-sm mx-auto font-sans leading-relaxed">
                  No custom domains have been added yet. Go to your My Projects details to configure custom domain routing.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default DomainsPage;
