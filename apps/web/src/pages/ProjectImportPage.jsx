import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { GlassCard } from '../components/common/GlassCard';
import { fetchProjects } from '../app/slices/projectsSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderUp, Loader2, Sparkles, FileText, CheckCircle2, ChevronRight, AlertTriangle, Terminal } from 'lucide-react';

export function ProjectImportPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.projects);
  const user = useSelector((state) => state.auth.user);

  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [importError, setImportError] = useState(null);
  const [skippedFilesCount, setSkippedFilesCount] = useState(0);
  const [totalFilteredCount, setTotalFilteredCount] = useState(0);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const activeSub = user?.subscription?.status === 'active';
  const limitExceeded = projects.length >= 3 && !activeSub;
  const githubConnected = !!(user?.githubCredentials?.username || user?.githubUsername);

  const uploadWithRetry = async (url, formData, options = {}, retries = 3, delay = 1000) => {
    try {
      return await api.post(url, formData, {
        ...options,
        timeout: 30000 // 30s timeout
      });
    } catch (err) {
      const isNetworkOrTimeout = !err.response || (err.response.status >= 500 && err.response.status <= 599);
      if (retries > 0 && isNetworkOrTimeout) {
        console.warn(`Upload failed. Retrying in ${delay}ms... (${retries} attempts left). Error:`, err.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadWithRetry(url, formData, options, retries - 1, delay * 2);
      }
      throw err;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (limitExceeded) return;
    if (!files.length) return;

    setLoading(true);
    setImportError(null);
    setProgress(5);
    setUploadStatus('Filtering files and scanning folder structure...');

    // Excluded folder list
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'cache', '.cache', 'bower_components', 'tmp', '.vscode', '.idea'];
    
    // Filter files
    const filteredFiles = [];
    let skipped = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      const parts = relativePath.split('/');
      
      const isExcluded = parts.some(part => excludeDirs.includes(part));
      const lower = file.name.toLowerCase();
      const isBlocked = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.mp4', '.mp3', '.wav', '.avi', '.mov'].some(ext => lower.endsWith(ext));
      
      if (isExcluded || isBlocked) {
        skipped++;
      } else if (file.size > 10 * 1024 * 1024) { // file > 10MB
        skipped++;
        console.warn(`File ${relativePath} exceeds 10MB limit and will be skipped.`);
      } else {
        filteredFiles.push(file);
      }
    }
    
    setSkippedFilesCount(skipped);
    setTotalFilteredCount(filteredFiles.length);
    
    if (filteredFiles.length === 0) {
      setLoading(false);
      setImportError({
        message: 'No valid source files found to import. Make sure your directory is not empty or containing only ignored paths (like node_modules).'
      });
      return;
    }

    let uploadId;
    try {
      setUploadStatus('Initializing upload session...');
      const { data } = await api.post('/projects/import/upload/init');
      uploadId = data.uploadId;
      setProgress(10);
    } catch (err) {
      setLoading(false);
      setImportError({
        message: 'Failed to initialize project import session.',
        details: err.response?.data?.message || err.message
      });
      return;
    }

    // Group files into batches
    const batches = [];
    let currentBatch = [];
    let currentBatchSize = 0;
    
    for (const file of filteredFiles) {
      if (currentBatch.length >= 50 || currentBatchSize + file.size > 2 * 1024 * 1024) {
        batches.push(currentBatch);
        currentBatch = [];
        currentBatchSize = 0;
      }
      currentBatch.push(file);
      currentBatchSize += file.size;
    }
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }
    
    // Upload each batch
    try {
      for (let index = 0; index < batches.length; index++) {
        const batch = batches[index];
        setUploadStatus(`Uploading files: Batch ${index + 1}/${batches.length} (${batch.length} files)...`);
        
        const form = new FormData();
        form.append('uploadId', uploadId);
        
        const pathsArray = [];
        batch.forEach((file) => {
          form.append('files', file);
          pathsArray.push(file.webkitRelativePath || file.name);
        });
        form.append('paths', JSON.stringify(pathsArray));
        
        await uploadWithRetry('/projects/import/upload/chunk', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const currentProgress = Math.round(((index + 1) / batches.length) * 80) + 10;
        setProgress(currentProgress);
      }
    } catch (err) {
      setLoading(false);
      setImportError({
        message: 'Upload failed during chunked transfer.',
        details: err.response?.data?.message || err.message,
        tip: 'Check your internet connection or try uploading a smaller directory. Binary files and dependency directories are automatically excluded.'
      });
      return;
    }

    // Complete Session
    try {
      setUploadStatus('Finalizing upload and running project framework analysis...');
      setProgress(95);
      const { data } = await api.post('/projects/import/upload/complete', {
        uploadId,
        name: name || 'Imported App'
      });
      
      setProgress(100);
      setTimeout(() => {
        setResponse(data);
        setLoading(false);
        setUploadStatus('');
        dispatch(fetchProjects());
      }, 500);
    } catch (err) {
      setLoading(false);
      setImportError({
        message: 'Failed to run analysis or create project.',
        details: err.response?.data?.message || err.message,
        tip: 'Ensure your project directory contains valid config files (e.g. package.json, requirements.txt, go.mod) and structure.'
      });
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl relative">
      {/* Ambient background glow */}
      <div className="absolute -top-20 right-0 w-72 h-72 bg-purple-500/[0.04] rounded-full blur-[140px] pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-purple-400 font-space mb-3">
          <FolderUp size={12} /> Import
        </span>
        <h1 className="text-4xl font-extrabold font-space text-white leading-tight">
          Project Import Workspace
        </h1>
        <p className="mt-1.5 text-sm text-white/40 max-w-lg">
          Upload a local project folder for AI-powered framework detection and automated container deployment.
        </p>
      </div>

      {!githubConnected ? (
        /* ── GitHub Connection Required ───────────────────── */
        <GlassCard className="relative overflow-hidden border border-red-500/20 bg-[#161B22] text-center p-14">
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.03] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold font-space text-white">GitHub Connection Required</h2>
            <p className="mt-3 text-sm text-white/50 max-w-md mx-auto leading-relaxed">
              GitHub account connection is required to deploy applications. Please connect your GitHub account to continue.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                to="/dashboard?connect=github"
                className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-7 py-3 font-bold text-white text-sm shadow-[0_0_24px_rgba(168,85,247,0.2)] hover:shadow-[0_0_32px_rgba(168,85,247,0.35)] transition-all duration-300"
              >
                Connect GitHub Account
              </Link>
            </div>
          </div>
        </GlassCard>
      ) : limitExceeded ? (
        /* ── Limit Exceeded ───────────────────────────────── */
        <GlassCard className="relative overflow-hidden border border-amber-500/20 bg-[#161B22] text-center p-14">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mx-auto mb-5">
              <AlertTriangle size={28} className="text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold font-space text-white">Upload Limit Blocked</h2>
            <p className="mt-3 text-sm text-white/50 max-w-md mx-auto leading-relaxed">
              You currently have {projects.length} projects configured. On the free plan, you can only deploy up to 3 projects. Please subscribe to deploy unlimited apps.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                to="/billing"
                className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-7 py-3 font-bold text-white text-sm shadow-[0_0_24px_rgba(168,85,247,0.2)] hover:shadow-[0_0_32px_rgba(168,85,247,0.35)] transition-all duration-300"
              >
                Upgrade Subscription
              </Link>
              <Link
                to="/projects"
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] px-6 py-3 font-semibold text-white/60 text-sm transition-all duration-200"
              >
                View Projects
              </Link>
            </div>
          </div>
        </GlassCard>
      ) : (
        /* ── Upload Form + Guidelines ─────────────────────── */
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-start">

          {/* Upload Card */}
          <GlassCard className="border border-white/[0.06] bg-[#161B22]">
            <h2 className="text-lg font-bold font-space text-white mb-6 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400">
                <FolderUp size={16} />
              </span>
              Folder Upload
            </h2>

            <form onSubmit={submit} className="space-y-5">
              {/* Project Name */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/30 font-space">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. static-react-site"
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0D1117] px-4 py-3 text-sm text-white placeholder-white/20 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200 outline-none font-sans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Drag-Drop Area */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-white/30 font-space">
                  Folder Content
                </label>
                <label className="block rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-purple-500/30 bg-[#0D1117] hover:bg-purple-500/[0.03] p-10 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden">
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="space-y-3 relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] mx-auto group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all duration-300">
                      <FolderUp size={24} className="text-white/25 group-hover:text-purple-400 transition-colors duration-300" />
                    </div>
                    <div className="text-sm font-semibold font-space text-white/60 group-hover:text-white transition-colors">
                      {files.length ? `${files.length} files selected` : 'Select a local directory folder'}
                    </div>
                    <p className="text-[11px] text-white/30 max-w-xs mx-auto leading-relaxed">
                      All files will be scanned for config, source code, and project framework structures.
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    webkitdirectory="true"
                    className="hidden"
                    onChange={(e) => {
                      setFiles(e.target.files);
                      setImportError(null);
                    }}
                  />
                </label>
              </div>

              {/* Upload Progress / Submit Button */}
              {loading ? (
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center text-xs font-bold font-space">
                    <span className="flex items-center gap-2 text-purple-400">
                      <Loader2 className="animate-spin" size={14} />
                      {uploadStatus}
                    </span>
                    <span className="text-white/50">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.04]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {totalFilteredCount > 0 && (
                    <div className="text-[11px] text-white/30 flex justify-between font-space">
                      <span>Uploading {totalFilteredCount} files</span>
                      <span>Skipped {skippedFilesCount} ignored/binary files</span>
                    </div>
                  )}
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={!files.length}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 py-3.5 font-bold text-white text-sm shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_28px_rgba(168,85,247,0.35)] transition-all duration-300 disabled:opacity-40 disabled:shadow-none"
                >
                  Analyze & Import
                </motion.button>
              )}
            </form>

            {/* Error Panel */}
            {importError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 flex-shrink-0">
                    <AlertTriangle className="text-red-400" size={16} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-bold font-space text-white">Import Failed</h4>
                    <p className="text-xs text-white/60 leading-relaxed">{importError.message}</p>
                    {importError.details && (
                      <pre className="mt-2 text-[11px] font-mono bg-[#06080F] p-3 rounded-xl text-red-300/70 border border-white/[0.04] max-h-[120px] overflow-auto whitespace-pre-wrap">
                        {importError.details}
                      </pre>
                    )}
                    {importError.tip && (
                      <p className="text-[11px] text-cyan-400/70 font-space mt-1.5">
                        💡 Tip: {importError.tip}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImportError(null);
                    setFiles([]);
                  }}
                  className="text-xs font-bold font-space text-white/40 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Clear and try again
                </button>
              </motion.div>
            )}
          </GlassCard>

          {/* ── Guidelines Sidebar ─────────────────────────── */}
          <GlassCard className="border border-white/[0.06] bg-[#161B22] space-y-5">
            <h3 className="text-base font-bold font-space text-white flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sparkles size={14} />
              </span>
              Import Guidelines
            </h3>
            <ul className="text-xs text-white/45 space-y-4 leading-relaxed">
              <li className="flex items-start gap-3">
                <ChevronRight size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Supports React, Node.js, Next.js, HTML/CSS, Python, and Go project structures.</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <span>AI scans package configurations and automatically generates optimized Dockerfiles.</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Build pipelines run SonarQube quality gates before deploying.</span>
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <span>Binary assets, <code className="text-white/60 bg-white/[0.04] px-1 rounded">node_modules</code>, and build caches are excluded automatically.</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      )}

      {/* ── AI Analysis Results ─────────────────────────── */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="relative overflow-hidden border border-emerald-500/20 bg-[#161B22] p-8">
              {/* Top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-5 mb-7">
                  <div className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 size={20} />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold font-space text-white">AI Analysis Complete</h2>
                      <p className="text-[11px] text-white/35 uppercase tracking-widest mt-0.5 font-space">
                        Framework: {response.detection?.framework || 'Static'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/projects')}
                    className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(168,85,247,0.2)] hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] transition-all duration-300"
                  >
                    View in Projects
                  </button>
                </div>

                {/* Two-column results */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/35 font-space">
                      <FileText size={13} />
                      <span>AI Deployment Plan Summary</span>
                    </div>
                    <div className="bg-[#06080F] rounded-2xl border border-white/[0.04] p-5 text-sm text-white/60 leading-relaxed max-h-[300px] overflow-y-auto">
                      {response.aiPlan}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/35 font-space">
                      <Terminal size={13} />
                      <span>Auto-Generated Dockerfile</span>
                    </div>
                    <pre className="bg-[#06080F] rounded-2xl border border-white/[0.04] p-5 text-xs text-cyan-400/70 font-mono overflow-auto max-h-[300px] leading-relaxed">
                      {response.dockerArtifacts?.dockerfile || '# Dockerfile definition'}
                    </pre>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default ProjectImportPage;
