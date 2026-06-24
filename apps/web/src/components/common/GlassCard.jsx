export function GlassCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-card/90 backdrop-blur-xl border border-white/[0.06] p-6 shadow-card-glow ${className}`}>
      {children}
    </div>
  );
}
