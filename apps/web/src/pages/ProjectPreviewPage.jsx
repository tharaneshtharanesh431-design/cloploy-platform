import { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Globe, Shield, ShoppingCart, Tag, Star, User, Mail, Send, Award, BookOpen, Terminal, Code, Cpu, HardDrive, RefreshCw, CheckCircle2
} from 'lucide-react';

export function ProjectPreviewPage() {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [portfolioContactName, setPortfolioContactName] = useState('');
  const [portfolioContactMsg, setPortfolioContactMsg] = useState('');
  const [portfolioSubmitted, setPortfolioSubmitted] = useState(false);

  useEffect(() => {
    const resolveProject = async () => {
      try {
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];
        
        // Fetch project either by custom domain or subdomain slug
        const { data } = await api.get(`/projects/by-domain/resolve?host=${hostname}&slug=${subdomain}`);
        setProject(data.project);
      } catch (err) {
        console.error('Failed to resolve project preview', err);
      } finally {
        setLoading(false);
      }
    };
    resolveProject();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080F] flex flex-col items-center justify-center text-white/40 font-space">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#A855F7]/20 blur-xl animate-pulse" />
          <RefreshCw size={36} className="relative animate-spin text-[#A855F7] mb-4" />
        </div>
        <div className="text-sm mt-2">Resolving deployment configurations…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#06080F] flex flex-col items-center justify-center text-center p-6 font-space">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield size={36} className="text-red-400" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-space tracking-tight">
          404: Deployment Not Found
        </h1>
        <p className="text-white/40 max-w-md mt-3 leading-relaxed text-sm">
          The requested URL does not point to an active deployment on Cloploy. Please make sure the slug or custom domain is correct.
        </p>
        <a
          href="http://localhost:3120/projects"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-7 py-3 font-bold text-white text-sm shadow-lg shadow-[#A855F7]/20 hover:shadow-[#A855F7]/30 transition-all duration-300"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  // Determine what type of mock interface to display
  const isEcommerce = project.name.toLowerCase().includes('shop') || 
                      project.name.toLowerCase().includes('ecommerce') || 
                      project.name.toLowerCase().includes('store') ||
                      project.framework === 'React' || 
                      project.framework === 'Next.js';
                      
  const isPortfolio = project.name.toLowerCase().includes('portfolio') || 
                      project.name.toLowerCase().includes('resume') || 
                      project.name.toLowerCase().includes('profile');

  return (
    <div className="min-h-screen bg-[#06080F] flex flex-col text-white select-text">

      {/* ── Browser Address Bar Emulator ── */}
      <header className="bg-[#0D1117] border-b border-white/[0.06] px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#EF4444] shadow-sm shadow-[#EF4444]/30" />
          <span className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-sm shadow-[#F59E0B]/30" />
          <span className="w-3 h-3 rounded-full bg-[#10B981] shadow-sm shadow-[#10B981]/30" />
        </div>
        
        <div className="flex-1 max-w-2xl mx-auto flex items-center gap-2.5 rounded-xl bg-[#161B22]/80 border border-white/[0.06] px-4 py-2 text-xs font-mono text-white/40">
          <Shield size={12} className="text-[#10B981] flex-shrink-0" />
          <span className="text-[#10B981] font-semibold">Secure</span>
          <span className="text-white/20">|</span>
          <span className="text-white/70 select-all truncate">
            {project.customDomain || `https://${project.slug}.cloploy.app`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#10B981]/10 border border-[#10B981]/20 px-3 py-1 text-[10px] font-bold text-[#10B981] tracking-widest uppercase font-space shadow-sm shadow-[#10B981]/5">
            Deployed
          </span>
          <a href="http://localhost:3120/projects" className="text-xs text-white/30 hover:text-white/60 transition-colors font-space">
            Dashboard
          </a>
        </div>
      </header>

      {/* ── Main Sandbox Frame Rendering ── */}
      <main className="flex-1 flex flex-col">
        {isEcommerce ? (
          /* ==========================================================
             MOCK ONLINE STOREFRONT PREVIEW
             ========================================================== */
          <div className="flex-1 flex flex-col bg-[#06080F] text-white font-sans">
            {/* Store header */}
            <nav className="bg-[#0D1117] border-b border-white/[0.06] text-white px-6 py-4 flex items-center justify-between">
              <span className="font-extrabold tracking-tight text-lg flex items-center gap-2.5 font-space">
                <ShoppingCart className="text-[#10B981]" size={20} /> {project.name}
              </span>
              <div className="flex items-center gap-6 text-sm font-semibold text-white/60">
                <span className="hover:text-[#10B981] cursor-pointer transition-colors">Catalog</span>
                <span className="hover:text-[#10B981] cursor-pointer transition-colors">Deals</span>
                <span className="hover:text-[#10B981] cursor-pointer transition-colors">Account</span>
                <button className="relative p-2.5 bg-[#161B22] border border-white/[0.06] rounded-xl hover:border-[#10B981]/20 transition-all">
                  <ShoppingCart size={15} className="text-white/70" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#10B981] text-white text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce shadow-md shadow-[#10B981]/30">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </nav>

            {/* Hero Section */}
            <section className="relative bg-[#0D1117] py-16 px-8 text-center space-y-5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#A855F7]/5 via-transparent to-transparent pointer-events-none" />
              <h1 className="relative text-4xl sm:text-5xl font-black tracking-tight text-white font-space">
                Welcome to {project.name}!
              </h1>
              <p className="relative text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
                Discover our handpicked premium collections. Experience automated delivery and secure checkouts.
              </p>
              <button className="relative bg-gradient-to-r from-[#A855F7] to-[#22D3EE] hover:shadow-lg hover:shadow-[#A855F7]/20 text-white font-bold rounded-xl px-8 py-3.5 text-sm shadow-md transition-all duration-300">
                Shop the Catalog
              </button>
            </section>

            {/* Product Grid */}
            <section className="flex-1 max-w-6xl mx-auto py-12 px-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {[
                { id: 1, title: 'Cloud Runner Sneakers', price: '₹3,400', rating: 4.8 },
                { id: 2, title: 'Quantum Tech Backpack', price: '₹4,800', rating: 4.9 },
                { id: 3, title: 'Acoustic SoundPods Pro', price: '₹8,900', rating: 4.7 }
              ].map((prod) => (
                <div key={prod.id} className="group border border-white/[0.06] rounded-2xl bg-[#161B22]/80 backdrop-blur-sm p-5 hover:border-[#A855F7]/20 hover:shadow-lg hover:shadow-[#A855F7]/5 transition-all duration-300 flex flex-col justify-between">
                  <div className="h-40 bg-[#0D1117] rounded-xl flex items-center justify-center text-white/20 font-extrabold text-sm mb-4 border border-white/[0.04] group-hover:border-[#A855F7]/10 transition-colors">
                    Product Image
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{prod.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#F59E0B] mt-1.5">
                      <Star size={12} fill="currentColor" /> <span className="font-semibold">{prod.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
                    <span className="font-extrabold text-white text-lg font-space">{prod.price}</span>
                    <button 
                      onClick={() => setCartCount(c => c + 1)}
                      className="bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold rounded-xl px-4 py-2 text-xs shadow-md shadow-[#10B981]/10 transition-all duration-200"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {/* Footer */}
            <footer className="bg-[#0D1117] border-t border-white/[0.06] text-white/30 text-center py-6 text-xs">
              © 2026 {project.name}. All mock checkouts and transactions simulated. Powered by <span className="text-[#A855F7] font-semibold">Cloploy</span>.
            </footer>
          </div>
        ) : isPortfolio ? (
          /* ==========================================================
             MOCK PORTFOLIO PREVIEW
             ========================================================== */
          <div className="flex-1 flex flex-col bg-[#06080F] text-white font-mono">
            {/* Portfolio Main Wrapper */}
            <div className="max-w-4xl mx-auto w-full py-16 px-6 space-y-14 flex-1">
              
              {/* Introduction */}
              <section className="space-y-4">
                <div className="text-[#22D3EE] font-bold text-xs tracking-[0.2em] uppercase font-space">
                  &lt;Developer Profile&gt;
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-space tracking-tight">
                  Hi, I'm Tharaneesh
                </h1>
                <p className="text-white/50 max-w-xl leading-relaxed text-sm">
                  Full Stack Engineer & Platform Specialist. Passionate about automated application delivery, container virtualization, and cloud infrastructure scale.
                </p>
              </section>

              {/* Specs */}
              <section className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="group border border-white/[0.06] bg-[#161B22]/60 backdrop-blur-sm rounded-2xl p-5 hover:border-[#22D3EE]/20 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center mb-3">
                    <Code className="text-[#22D3EE]" size={16} />
                  </div>
                  <div className="font-bold text-white font-space">Languages</div>
                  <div className="text-white/40 mt-1.5 leading-relaxed">JavaScript, Python, Go, Rust</div>
                </div>
                <div className="group border border-white/[0.06] bg-[#161B22]/60 backdrop-blur-sm rounded-2xl p-5 hover:border-[#A855F7]/20 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center mb-3">
                    <Cpu className="text-[#A855F7]" size={16} />
                  </div>
                  <div className="font-bold text-white font-space">Frameworks</div>
                  <div className="text-white/40 mt-1.5 leading-relaxed">React, Next.js, Express, FastAPI</div>
                </div>
                <div className="group border border-white/[0.06] bg-[#161B22]/60 backdrop-blur-sm rounded-2xl p-5 hover:border-[#F59E0B]/20 transition-all duration-300">
                  <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mb-3">
                    <HardDrive className="text-[#F59E0B]" size={16} />
                  </div>
                  <div className="font-bold text-white font-space">DevOps</div>
                  <div className="text-white/40 mt-1.5 leading-relaxed">Docker, K8s, Terraform, AWS</div>
                </div>
              </section>

              {/* Contact form mockup */}
              <section className="border border-white/[0.06] bg-[#161B22]/60 backdrop-blur-sm rounded-2xl p-6 max-w-lg space-y-4">
                <h3 className="font-bold text-white text-sm font-space">Send a message</h3>
                {portfolioSubmitted ? (
                  <div className="text-[#10B981] text-xs py-4 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
                      <CheckCircle2 size={13} />
                    </div>
                    Thank you! Message simulated and logged.
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setPortfolioSubmitted(true); }} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Your name" 
                      required
                      className="w-full bg-[#0D1117] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#22D3EE]/40 focus:ring-1 focus:ring-[#22D3EE]/10 transition-all duration-200"
                      value={portfolioContactName}
                      onChange={(e) => setPortfolioContactName(e.target.value)}
                    />
                    <textarea 
                      placeholder="Your message" 
                      required
                      rows={3}
                      className="w-full bg-[#0D1117] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/25 outline-none focus:border-[#22D3EE]/40 focus:ring-1 focus:ring-[#22D3EE]/10 transition-all duration-200 resize-none"
                      value={portfolioContactMsg}
                      onChange={(e) => setPortfolioContactMsg(e.target.value)}
                    />
                    <button type="submit" className="bg-gradient-to-r from-[#22D3EE] to-[#A855F7] text-white font-bold rounded-xl px-5 py-2.5 text-xs flex items-center gap-1.5 shadow-md shadow-[#22D3EE]/10 hover:shadow-[#22D3EE]/20 transition-all duration-200">
                      <Send size={12} /> Send Message
                    </button>
                  </form>
                )}
              </section>

            </div>
          </div>
        ) : (
          /* ==========================================================
             MOCK APP PREVIEW / TERMINAL Operational View
             ========================================================== */
          <div className="flex-1 flex bg-[#06080F] font-mono p-6">
            <div className="max-w-4xl mx-auto w-full flex flex-col justify-between h-[450px]">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-xs text-white/40">
                  <div className="w-6 h-6 rounded-lg bg-[#22D3EE]/10 border border-[#22D3EE]/20 flex items-center justify-center">
                    <Terminal size={12} className="text-[#22D3EE]" />
                  </div>
                  <span className="font-space font-semibold">Deployment Console — Live Operational View</span>
                </div>

                <div className="bg-[#0D1117]/80 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 text-xs text-[#10B981] space-y-2.5 leading-relaxed h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/5">
                  <div className="text-white/30">[cloploy-engine] Fetching runtime dependencies...</div>
                  <div className="text-white/30">[cloploy-engine] Connecting to MongoDB on URI: fallback port...</div>
                  <div className="text-[#22D3EE] font-semibold">[cloploy-engine] Server is active and listening on port 80</div>
                  <div className="text-[#10B981]">[HTTP-listener] GET /health - <span className="text-[#10B981] font-bold">200 OK</span> | Response: {"{ status: 'ok' }"}</div>
                  <div className="text-white/50">[HTTP-listener] GET /api/data - 304 Not Modified</div>
                  <div className="text-[#F59E0B]">[watcher] Socket.io namespace connected. Waiting for requests...</div>
                  <div className="text-[#A855F7] animate-pulse font-bold">_</div>
                </div>
              </div>

              <footer className="text-[11px] text-white/20 text-center font-space">
                Mock console log stream. Deployed with <span className="text-[#A855F7]">Cloploy</span>.
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default ProjectPreviewPage;
