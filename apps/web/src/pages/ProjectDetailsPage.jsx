import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { GlassCard } from '../components/common/GlassCard';
import { motion } from 'framer-motion';
import {
  Layers, Cpu, HardDrive, Terminal, Globe, Key, Clock, ExternalLink, RefreshCw, Trash2, ArrowLeft, Plus, Play, Lock, CheckCircle2, ShieldAlert
} from 'lucide-react';

export function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [activeTab, setActiveTab] = useState('info'); // info, logs, envs
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [envKey, setEnvKey] = useState('');
  const [envValue, setEnvValue] = useState('');
  const [redeploying, setRedeploying] = useState(false);
  const [domainMessage, setDomainMessage] = useState('');
  const [domainStatus, setDomainStatus] = useState('idle'); // idle, loading, success
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  const fetchProjectData = async () => {
    try {
      const pRes = await api.get(`/projects/${projectId}`);
      setProject(pRes.data.project);
      setCustomDomainInput(pRes.data.project.customDomain || '');
      
      const dRes = await api.get('/deployments');
      const filtered = dRes.data.deployments.filter(d => d.projectId?._id === projectId || d.projectId === projectId);
      setDeployments(filtered);
      if (filtered.length > 0 && !selectedDeployment) {
        setSelectedDeployment(filtered[0]);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleRedeploy = async () => {
    setRedeploying(true);
    try {
      await api.post(`/deployments/${projectId}/run`);
      alert('Redeployment triggered successfully!');
      fetchProjectData();
    } catch (err) {
      alert('Redeployment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRedeploying(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action is irreversible.')) {
      try {
        await api.delete(`/projects/${projectId}`);
        navigate('/projects');
      } catch (err) {
        alert('Failed to delete project');
      }
    }
  };

  const handleSaveDomain = async (e) => {
    e.preventDefault();
    setDomainStatus('loading');
    setDomainMessage('Verifying DNS CNAME mapping and activating SSL certificate...');
    
    setTimeout(async () => {
      try {
        const { data } = await api.put(`/projects/${projectId}/domain`, {
          customDomain: customDomainInput
        });
        setProject(data.project);
        setDomainStatus('success');
        setDomainMessage(data.message);
      } catch (err) {
        setDomainStatus('error');
        setDomainMessage(err.response?.data?.message || 'Failed to update custom domain.');
      }
    }, 2000);
  };

  const handleAddEnv = async (e) => {
    e.preventDefault();
    if (!envKey.trim() || !envValue.trim()) return;

    try {
      const updatedEnvs = [...(project.environmentVariables || []), { key: envKey, value: envValue }];
      const { data: updateRes } = await api.put(`/projects/${projectId}`, {
        ...project,
        environmentVariables: updatedEnvs
      });
      setProject(updateRes.project);
      setEnvKey('');
      setEnvValue('');
    } catch (err) {
      alert('Failed to add environment variable: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveEnv = async (key) => {
    try {
      const updatedEnvs = (project.environmentVariables || []).filter(e => e.key !== key);
      const { data: updateRes } = await api.put(`/projects/${projectId}`, {
        ...project,
        environmentVariables: updatedEnvs
      });
      setProject(updateRes.project);
    } catch (err) {
      alert('Failed to remove environment variable');
    }
  };

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-white/40 font-space text-sm">
          <RefreshCw size={20} className="animate-spin text-purple-400" />
          Loading project details…
        </div>
      </div>
    );
  }

  const deployUrl = project.deploymentUrl || `https://${project.slug}.cloploy.app`;
  const liveUrl = project.customDomain ? `http://${project.customDomain}` : `http://${project.slug}.localhost:3120`;

  return (
    <div className="space-y-7 pb-14 relative">
      {/* Ambient glow */}
      <div className="absolute -top-16 right-0 w-72 h-72 bg-purple-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* ── Back Button + Project Title ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Link
            to="/projects"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-400 font-space">
              {project.framework || 'Application'}
            </span>
            <h1 className="text-3xl font-extrabold font-space text-white mt-1">{project.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/20 px-4 py-2.5 text-xs font-bold text-cyan-400 transition-all duration-200"
          >
            <ExternalLink size={13} /> Open Site
          </a>

          <button
            onClick={handleRedeploy}
            disabled={redeploying}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 border border-purple-500/30 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_14px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw size={13} className={redeploying ? 'animate-spin' : ''} /> Redeploy
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center justify-center rounded-xl bg-red-500/[0.08] border border-red-500/20 hover:bg-red-500/[0.15] px-3 py-2.5 text-red-400 transition-all duration-200"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────── */}
      <div className="flex gap-1 bg-[#0D1117] rounded-xl p-1 border border-white/[0.04] w-fit">
        {[
          { id: 'info', label: 'Info & Domains', icon: Globe },
          { id: 'logs', label: 'History & Logs', icon: Terminal },
          { id: 'envs', label: 'Environment Variables', icon: Key }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold font-space transition-all duration-200 outline-none ${
                active
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                  : 'text-white/40 hover:text-white/70 border border-transparent'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: Info & Domains
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'info' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 md:grid-cols-[1.5fr_1fr]"
        >
          <div className="space-y-6">
            {/* Meta Info Grid */}
            <GlassCard className="border border-white/[0.06] bg-[#161B22] space-y-5">
              <h3 className="text-lg font-bold font-space text-white">Project Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'SLUG', value: project.slug, mono: true },
                  { label: 'RUNTIME', value: project.runtime || 'Container Node' },
                  { label: 'SOURCE TYPE', value: project.sourceType === 'github' ? 'GitHub' : 'Folder Upload' },
                  { label: 'DEFAULT BRANCH', value: project.defaultBranch || 'main', mono: true },
                ].map(item => (
                  <div key={item.label} className="bg-[#0D1117] rounded-2xl p-4 border border-white/[0.04]">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-white/30 font-space">{item.label}</div>
                    <div className={`mt-1.5 font-bold text-white/80 text-sm ${item.mono ? 'font-mono' : ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Custom Domain Settings */}
            <GlassCard className="border border-white/[0.06] bg-[#161B22] space-y-5">
              <h3 className="text-lg font-bold font-space text-white">Custom Domain Routing</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                Connect your own domain (e.g. <code className="text-white/60 bg-white/[0.04] px-1.5 py-0.5 rounded text-[11px]">shop.mycompany.com</code>) by adding a <code className="text-white/60 bg-white/[0.04] px-1.5 py-0.5 rounded text-[11px]">CNAME</code> DNS record pointing to <code className="text-cyan-400/70 bg-cyan-400/[0.06] px-1.5 py-0.5 rounded text-[11px]">cname.cloploy.app</code>.
              </p>

              <form onSubmit={handleSaveDomain} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-white/30 font-space">Custom Domain</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. shop.mycompany.com"
                      className="flex-1 rounded-xl border border-white/[0.06] bg-[#0D1117] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all duration-200 font-mono"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={domainStatus === 'loading'}
                      className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-5 font-bold text-xs text-white shadow-[0_0_14px_rgba(168,85,247,0.15)] transition-all duration-300 disabled:opacity-50"
                    >
                      {domainStatus === 'loading' ? 'Verifying…' : 'Save & Verify'}
                    </button>
                  </div>
                </div>

                {domainStatus !== 'idle' && (
                  <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 text-xs border ${
                    domainStatus === 'loading'
                      ? 'bg-purple-500/[0.06] border-purple-500/15 text-purple-300'
                      : domainStatus === 'success'
                        ? 'bg-emerald-500/[0.06] border-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/[0.06] border-red-500/15 text-red-400'
                  }`}>
                    {domainStatus === 'loading' && <RefreshCw size={14} className="animate-spin flex-shrink-0 mt-0.5" />}
                    {domainStatus === 'success' && <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />}
                    {domainStatus === 'error' && <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />}
                    <span className="leading-relaxed">{domainMessage}</span>
                  </div>
                )}
              </form>
            </GlassCard>
          </div>

          {/* Access URLs */}
          <div className="space-y-6">
            <GlassCard className="border border-white/[0.06] bg-[#161B22] space-y-5">
              <h3 className="text-lg font-bold font-space text-white">Project Access URLs</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-white/30 font-space mb-2">Generated Subdomain</div>
                  <div className="flex items-center justify-between rounded-xl bg-[#0D1117] border border-white/[0.04] p-3.5 font-mono text-sm text-cyan-400">
                    <a href={liveUrl} target="_blank" rel="noreferrer" className="hover:underline truncate">{deployUrl}</a>
                    <ExternalLink size={12} className="flex-shrink-0 ml-2 text-white/25" />
                  </div>
                </div>
                {project.customDomain && (
                  <div>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-white/30 font-space mb-2">Active Custom Domain</div>
                    <div className="flex items-center justify-between rounded-xl bg-[#0D1117] border border-white/[0.04] p-3.5 font-mono text-sm text-cyan-400">
                      <a href={`http://${project.customDomain}`} target="_blank" rel="noreferrer" className="hover:underline truncate">{project.customDomain}</a>
                      <ExternalLink size={12} className="flex-shrink-0 ml-2 text-white/25" />
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: History & Logs
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'logs' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-5 md:grid-cols-[1fr_2.5fr]"
        >
          {/* Deployment History */}
          <GlassCard className="border border-white/[0.06] bg-[#161B22] h-[500px] overflow-y-auto space-y-4">
            <h3 className="text-sm font-bold font-space text-white/80 uppercase tracking-wider">Deployment History</h3>
            <div className="space-y-2">
              {deployments.map(dep => (
                <button
                  key={dep._id}
                  onClick={() => setSelectedDeployment(dep)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 text-xs font-space group ${
                    selectedDeployment?._id === dep._id
                      ? 'bg-purple-500/[0.08] border-purple-500/25 text-white'
                      : 'bg-[#0D1117] border-white/[0.04] text-white/45 hover:bg-white/[0.04] hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold truncate">{dep.version}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                      dep.status === 'healthy'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : dep.status === 'failed'
                          ? 'bg-red-500/10 border-red-500/25 text-red-400'
                          : 'bg-white/[0.04] border-white/[0.06] text-white/40'
                    }`}>
                      {dep.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-white/25 flex items-center gap-1.5">
                    <Clock size={10} /> {new Date(dep.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
              {deployments.length === 0 && (
                <div className="text-center py-8 text-xs text-white/30 italic">No deployments found.</div>
              )}
            </div>
          </GlassCard>

          {/* Logs Terminal View */}
          <GlassCard className="border border-white/[0.06] bg-[#06080F] flex flex-col h-[500px]">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 px-1">
              <div>
                <h3 className="text-sm font-bold font-space text-white/80 uppercase tracking-wider">Pipeline Build Logs</h3>
                <p className="text-[10px] text-white/25 font-mono mt-1">
                  Deployment: {selectedDeployment?.version || 'None selected'}
                </p>
              </div>
              {selectedDeployment?.status === 'healthy' && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider font-space">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs text-white/65 bg-[#06080F] rounded-xl p-4 mt-3 leading-relaxed space-y-1 scrollbar-thin select-text">
              {selectedDeployment?.buildLogs?.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap truncate hover:text-white/90 transition-colors duration-150">
                  <span className="text-white/15 select-none mr-4 inline-block w-6 text-right">{i + 1}</span>{log}
                </div>
              ))}
              {(!selectedDeployment || !selectedDeployment.buildLogs || selectedDeployment.buildLogs.length === 0) && (
                <div className="text-white/20 italic text-center pt-24 text-xs">Select a deployment entry to view its build logs.</div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: Environment Variables
         ══════════════════════════════════════════════════════ */}
      {activeTab === 'envs' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-6 md:grid-cols-[1.5fr_1fr]"
        >
          {/* Existing Env Vars */}
          <GlassCard className="border border-white/[0.06] bg-[#161B22] space-y-5">
            <div>
              <h3 className="text-lg font-bold font-space text-white">Environment Variables</h3>
              <p className="text-xs text-white/35 mt-1 leading-relaxed">
                Key-value pairs securely injected as Kubernetes secrets into your containers at startup.
              </p>
            </div>

            <div className="space-y-2.5">
              {(project.environmentVariables || []).map(env => (
                <div key={env.key} className="flex justify-between items-center rounded-xl bg-[#0D1117] border border-white/[0.04] p-4 text-xs group">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Lock size={11} className="text-purple-400/50" />
                      <span className="font-bold text-white font-mono">{env.key}</span>
                    </div>
                    <span className="text-white/30 block truncate max-w-sm font-mono text-[11px]">
                      {env.masked ? '••••••••••••' : env.value}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveEnv(env.key)}
                    className="p-2 hover:bg-red-500/10 text-white/25 hover:text-red-400 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(project.environmentVariables || []).length === 0 && (
                <div className="flex flex-col items-center py-10 text-xs text-white/25">
                  <Key size={24} className="mb-3 text-white/15" />
                  <span className="italic">No variables configured yet.</span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Add New Env Var */}
          <GlassCard className="border border-white/[0.06] bg-[#161B22] space-y-5">
            <h3 className="text-lg font-bold font-space text-white flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Plus size={14} />
              </span>
              Add Variable
            </h3>
            <form onSubmit={handleAddEnv} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/30 font-space">Key</label>
                <input
                  type="text"
                  placeholder="e.g. MONGO_URI"
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0D1117] px-4 py-3 text-xs text-white placeholder-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all duration-200 font-mono"
                  value={envKey}
                  onChange={(e) => setEnvKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/30 font-space">Value</label>
                <input
                  type="text"
                  placeholder="e.g. connection-secret"
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0D1117] px-4 py-3 text-xs text-white placeholder-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 outline-none transition-all duration-200 font-mono"
                  value={envValue}
                  onChange={(e) => setEnvValue(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 py-3 font-bold text-xs text-white shadow-[0_0_16px_rgba(168,85,247,0.15)] hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] transition-all duration-300"
              >
                Add Environment Variable
              </button>
            </form>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}
export default ProjectDetailsPage;
